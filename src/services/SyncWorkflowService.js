import DuplicateDetectionService from './DuplicateDetectionService.js';
import USBExportService from './USBExportService.js';
import USBImportService from './USBImportService.js';
import StatusUpdateService from './StatusUpdateService.js';
import AutoSyncService from './AutoSyncService.js';
import CryptoUtils from '../utils/CryptoUtils.js';

class SyncWorkflowService {
  constructor(localDb, lguId) {
    this.db = localDb;
    this.lguId = lguId;
    this.duplicateService = new DuplicateDetectionService(localDb);
    this.exportService = new USBExportService(localDb);
    this.importService = new USBImportService(localDb);
    this.statusService = new StatusUpdateService(localDb);
    this.autoSyncService = new AutoSyncService(localDb, lguId, null);
    this.cryptoUtils = new CryptoUtils();
  }

  /**
   * STEP 1: Client Data Entry (The Local Gate)
   * Validates and saves applicant with local duplicate check
   */
  async addApplicant(applicantData) {
    try {
      // Validation Rule 1: Age must be 60+
      const age = this.calculateAge(applicantData.date_of_birth);
      if (age < 60) {
        throw new Error('Applicant must be 60 years or older');
      }

      // Validation Rule 2: Maximum 3 representatives
      const reps = [
        applicantData.rep_1_name,
        applicantData.rep_2_name,
        applicantData.rep_3_name
      ].filter(r => r && r.trim());
      
      if (reps.length > 3) {
        throw new Error('Maximum of 3 representatives allowed');
      }

      // Local Duplicate Check: Name + DOB within LGU
      const localDuplicate = this.duplicateService.checkLocalDuplicates(
        applicantData,
        this.lguId
      );

      if (localDuplicate.length > 0) {
        throw new Error('Applicant already exists in your list');
      }

      // Save to local database
      const stmt = this.db.prepare(`
        INSERT INTO senior_citizens (
          lgu_id, osca_id, ncsc_rrn, first_name, last_name, middle_name, ext_name,
          date_of_birth, sex, civil_status, citizenship,
          is_ip, ip_group, is_pwd, pwd_type,
          region, province, municipality, barangay,
          house_number, street,
          spouse_name,
          rep_1_name, rep_1_relationship,
          rep_2_name, rep_2_relationship,
          rep_3_name, rep_3_relationship,
          beneficiary_primary, beneficiary_contingent,
          sync_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);

      const result = stmt.run(
        this.lguId,
        applicantData.osca_id,
        applicantData.ncsc_rrn || null,
        applicantData.first_name,
        applicantData.last_name,
        applicantData.middle_name || null,
        applicantData.ext_name || null,
        applicantData.date_of_birth,
        applicantData.sex,
        applicantData.civil_status,
        applicantData.citizenship || 'Filipino',
        applicantData.is_ip ? 1 : 0,
        applicantData.ip_group || null,
        applicantData.is_pwd ? 1 : 0,
        applicantData.pwd_type || null,
        applicantData.region,
        applicantData.province,
        applicantData.municipality,
        applicantData.barangay,
        applicantData.house_number || null,
        applicantData.street || null,
        applicantData.spouse_name || null,
        applicantData.rep_1_name || null,
        applicantData.rep_1_relationship || null,
        applicantData.rep_2_name || null,
        applicantData.rep_2_relationship || null,
        applicantData.rep_3_name || null,
        applicantData.rep_3_relationship || null,
        applicantData.beneficiary_primary || null,
        applicantData.beneficiary_contingent || null,
        'DRAFT'
      );

      return {
        success: true,
        recordId: result.lastInsertRowid,
        message: 'Applicant saved successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Submit applicant to Admin (Step 1 continuation)
   * Locks record and changes status to PENDING_ADMIN_REVIEW
   */
  async submitToAdmin(recordId) {
    try {
      // Check if record exists and belongs to this LGU
      const record = this.db.prepare(`
        SELECT id, status FROM senior_citizens 
        WHERE id = ? AND lgu_id = ?
      `).get(recordId, this.lguId);

      if (!record) {
        throw new Error('Record not found');
      }

      if (record.status !== 'DRAFT') {
        throw new Error('Only draft records can be submitted');
      }

      // Lock record and update status
      this.db.prepare(`
        UPDATE senior_citizens 
        SET status = 'PENDING_ADMIN_REVIEW',
            locked = 1,
            submitted_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(recordId);

      // Add to sync queue
      this.db.prepare(`
        INSERT INTO sync_queue (
          record_id, record_type, operation, direction, status
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        recordId,
        'senior_citizen',
        'UPLOAD',
        'OUTBOUND',
        'PENDING'
      );

      return {
        success: true,
        message: 'Record submitted to admin for review'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * STEP 2: Admin Cross-Matching (Global Gate)
   * Checks for duplicates across ALL LGUs
   */
  async performGlobalDuplicateCheck(recordData) {
    try {
      // Check for cross-LGU duplicates
      const globalDuplicates = await this.duplicateService.checkGlobalDuplicates(
        recordData.first_name,
        recordData.last_name,
        recordData.date_of_birth,
        recordData.lgu_id
      );

      if (globalDuplicates.length > 0) {
        // Flag as Cross-LGU Duplicate
        return {
          isDuplicate: true,
          duplicateType: 'CROSS_LGU_DUPLICATE',
          duplicates: globalDuplicates,
          recommendation: 'MANUAL_REVIEW'
        };
      }

      // No duplicates found
      return {
        isDuplicate: false,
        duplicateType: 'CLEAN',
        duplicates: [],
        recommendation: 'APPROVE'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Admin decision on duplicate
   */
  async makeAdminDecision(recordId, decision, remarks = null) {
    try {
      let newStatus;
      
      switch (decision) {
        case 'APPROVE':
        case 'CLEAN':
          newStatus = 'APPROVED';
          break;
        case 'DENY':
        case 'FRAUD':
          newStatus = 'DENIED';
          break;
        case 'HOLD':
          newStatus = 'PENDING_REVIEW';
          break;
        default:
          throw new Error('Invalid decision');
      }

      // Update record with admin decision
      this.db.prepare(`
        UPDATE senior_citizens 
        SET sync_status = ?,
            admin_notes = ?,
            admin_decision_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newStatus, remarks, recordId);

      // Lock if approved
      if (newStatus === 'APPROVED') {
        this.db.prepare(`
          UPDATE senior_citizens 
          SET locked = 1, is_readonly = 1
          WHERE id = ?
        `).run(recordId);
      }

      // Log the decision
      this.db.prepare(`
        INSERT INTO sync_log (
          batch_id, lgu_id, sync_type, direction, 
          record_count, status, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        this.cryptoUtils.generateUUID(),
        this.lguId,
        'ADMIN_DECISION',
        'INTERNAL',
        1,
        'COMPLETED',
        null
      );

      return {
        success: true,
        status: newStatus,
        message: `Record marked as ${newStatus}`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * STEP 3: Cleanlisting & Payment Generation
   */
  async generatePayroll(filters = {}) {
    try {
      let query = `
        SELECT * FROM senior_citizens 
        WHERE sync_status = 'APPROVED'
        AND payment_status = 'UNPAID'
      `;
      
      const params = [];

      // Apply filters
      if (filters.region) {
        query += ' AND region = ?';
        params.push(filters.region);
      }
      
      if (filters.province) {
        query += ' AND province = ?';
        params.push(filters.province);
      }

      const approvedSeniors = this.db.prepare(query).all(...params);

      // Run death audit if death registry is available
      const deceasedIds = await this.runDeathAudit(approvedSeniors);
      
      // Filter out deceased
      const eligibleSeniors = approvedSeniors.filter(
        senior => !deceasedIds.includes(senior.id)
      );

      // Generate payroll data
      const payrollData = eligibleSeniors.map(senior => ({
        id: senior.id,
        name: `${senior.last_name}, ${senior.first_name} ${senior.middle_name || ''}`.trim(),
        osca_id: senior.osca_id,
        ncsc_rrn: senior.ncsc_rrn,
        barangay: senior.barangay,
        municipality: senior.municipality,
        province: senior.province,
        region: senior.region,
        is_ip: senior.is_ip === 1,
        is_pwd: senior.is_pwd === 1,
        amount: 10000 // Standard amount
      }));

      // Update payment status to FOR_PAYMENT
      const ids = eligibleSeniors.map(s => s.id);
      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        this.db.prepare(`
          UPDATE senior_citizens 
          SET payment_status = 'FOR_PAYMENT',
              updated_at = CURRENT_TIMESTAMP
          WHERE id IN (${placeholders})
        `).run(...ids);
      }

      return {
        success: true,
        payroll: payrollData,
        total: payrollData.length,
        summary: {
          totalAmount: payrollData.length * 10000,
          ipCount: payrollData.filter(s => s.is_ip).length,
          pwdCount: payrollData.filter(s => s.is_pwd).length
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * STEP 4A: Auto-Sync Feedback Loop
   */
  async performAutoSync() {
    try {
      // Start auto-sync service
      await this.autoSyncService.start();
      
      // Perform sync
      const result = await this.autoSyncService.performSync();
      
      return {
        success: true,
        ...result
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * STEP 4B: Manual USB Export/Import
   */
  async exportForUSB(options = {}) {
    try {
      const exportData = await this.exportService.exportData(this.lguId, {
        includeDrafts: options.includeDrafts || false,
        includeRequirements: options.includeRequirements || true,
        batchId: this.cryptoUtils.generateUUID()
      });

      return {
        success: true,
        ...exportData
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async importFromUSB(filePath, password) {
    try {
      const importResult = await this.importService.importData(
        filePath, 
        password, 
        this.lguId
      );

      return {
        success: true,
        ...importResult
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate LGU Masterlist Report
   */
  async generateLGUMasterlist() {
    try {
      const records = this.db.prepare(`
        SELECT 
          id, osca_id, ncsc_rrn,
          last_name, first_name, middle_name,
          date_of_birth,
          sex,
          barangay, municipality, province,
          sync_status,
          payment_status,
          payment_date,
          submitted_at,
          admin_decision_at
        FROM senior_citizens 
        WHERE lgu_id = ?
        ORDER BY last_name, first_name
      `).all(this.lguId);

      // Group by status
      const grouped = records.reduce((acc, record) => {
        const status = record.sync_status;
        if (!acc[status]) acc[status] = [];
        acc[status].push(record);
        return acc;
      }, {});

      return {
        success: true,
        summary: {
          total: records.length,
          draft: (grouped.DRAFT || []).length,
          pending: (grouped.PENDING_ADMIN_REVIEW || []).length,
          approved: (grouped.APPROVED || []).length,
          denied: (grouped.DENIED || []).length,
          paid: records.filter(r => r.payment_status === 'PAID').length
        },
        records: records
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate Deficiency Report
   */
  async generateDeficiencyReport() {
    try {
      const records = this.db.prepare(`
        SELECT 
          id, osca_id,
          last_name, first_name,
          admin_notes,
          sync_status,
          submitted_at
        FROM senior_citizens 
        WHERE lgu_id = ?
        AND (sync_status = 'DENIED' OR sync_status = 'PENDING_REVIEW')
        ORDER BY submitted_at DESC
      `).all(this.lguId);

      return {
        success: true,
        records: records,
        total: records.length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper methods
  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  async runDeathAudit(seniors) {
    // Placeholder for death audit integration
    // In production, this would connect to a death registry API
    const deceasedIds = [];
    
    // For now, check if date_of_death is set
    for (const senior of seniors) {
      if (senior.date_of_death) {
        deceasedIds.push(senior.id);
      }
    }
    
    return deceasedIds;
  }
}

export default SyncWorkflowService;
