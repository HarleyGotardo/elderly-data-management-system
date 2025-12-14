const fs = require('fs');
const path = require('path');
const CryptoUtils = require('../utils/CryptoUtils');
const SyncQueue = require('./SyncQueue');

class USBImportService {
  constructor(db, lguId) {
    this.db = db;
    this.lguId = lguId;
    this.crypto = new CryptoUtils();
    this.syncQueue = new SyncQueue(db);
    this.importDir = path.join(process.cwd(), 'imports');
    
    // Ensure import directory exists
    if (!fs.existsSync(this.importDir)) {
      fs.mkdirSync(this.importDir, { recursive: true });
    }
  }

  /**
   * Import status updates from USB file
   * @param {string} filepath - Path to import file
   * @param {string} password - Optional password for decryption
   */
  async importFromUSB(filepath, password = null) {
    try {
      // Verify file exists
      if (!fs.existsSync(filepath)) {
        throw new Error('Import file not found');
      }

      // Decrypt and parse file
      const importData = this.crypto.decryptFromFile(filepath, password);
      
      // Validate import data
      this.validateImportData(importData);
      
      // Check if this import is for this LGU
      if (importData.lgu_id && importData.lgu_id !== this.lguId) {
        throw new Error(`Import file is for LGU ${importData.lgu_id}, not ${this.lguId}`);
      }

      // Process the import based on type
      let result;
      if (importData.type === 'STATUS_UPDATE') {
        result = await this.processStatusUpdates(importData);
      } else if (importData.type === 'DATA_SYNC') {
        result = await this.processDataSync(importData);
      } else {
        throw new Error(`Unsupported import type: ${importData.type}`);
      }

      // Log import
      await this.logImport(importData.batch_id, result.processed, importData.type);

      return {
        success: true,
        batch_id: importData.batch_id,
        type: importData.type,
        processed: result.processed,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors || []
      };

    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  }

  /**
   * Validate import data structure
   * @param {Object} data - Import data
   */
  validateImportData(data) {
    const required = ['type', 'version', 'batch_id', 'lgu_id'];
    
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Verify signature if present
    if (data.signature) {
      const signature = data.signature;
      delete data.signature;
      
      if (!this.crypto.verifySignature(data, signature)) {
        throw new Error('Invalid file signature - data may be corrupted');
      }
      data.signature = signature; // Put it back for logging
    }
  }

  /**
   * Process status updates from admin
   * @param {Object} importData - Import data containing status updates
   */
  async processStatusUpdates(importData) {
    const updates = importData.updates || [];
    const results = {
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    // Begin transaction
    const transaction = this.db.transaction(() => {
      for (const update of updates) {
        try {
          results.processed++;

          // Check if record exists
          const existing = this.db.prepare(`
            SELECT id, sync_status, is_readonly FROM senior_citizens
            WHERE id = ? AND lgu_id = ?
          `).get(update.id, this.lguId);

          if (!existing) {
            results.skipped++;
            console.warn(`Record not found: ${update.id}`);
            continue;
          }

          // Check if record is readonly (already approved)
          if (existing.is_readonly && update.status !== 'DENIED') {
            results.skipped++;
            console.warn(`Record ${update.id} is readonly and cannot be updated`);
            continue;
          }

          // Update the record
          const stmt = this.db.prepare(`
            UPDATE senior_citizens 
            SET sync_status = ?,
                admin_notes = ?,
                admin_decision_at = ?,
                payment_status = ?,
                payment_date = ?,
                last_synced_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP,
                import_batch_id = ?,
                is_readonly = CASE WHEN ? = 'APPROVED' THEN 1 ELSE is_readonly END
            WHERE id = ?
          `);

          stmt.run(
            update.status,
            update.admin_notes || null,
            update.decision_at || new Date().toISOString(),
            update.payment_status || null,
            update.payment_date || null,
            importData.batch_id,
            update.status,
            update.id
          );

          results.updated++;

          // Add to sync queue for tracking
          this.syncQueue.addToQueue({
            record_id: update.id,
            record_type: 'senior_citizen',
            operation: 'UPDATE',
            direction: 'DOWNLOAD'
          });

          console.log(`Updated record ${update.id} to status ${update.status}`);

        } catch (error) {
          results.errors.push({
            record_id: update.id,
            error: error.message
          });
          console.error(`Error updating record ${update.id}:`, error);
        }
      }
    });

    transaction();

    return results;
  }

  /**
   * Process data sync (for full data restoration)
   * @param {Object} importData - Import data containing full records
   */
  async processDataSync(importData) {
    const records = importData.records || [];
    const results = {
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    // Begin transaction
    const transaction = this.db.transaction(() => {
      for (const record of records) {
        try {
          results.processed++;

          // Check if record exists
          const existing = this.db.prepare(`
            SELECT id FROM senior_citizens WHERE id = ?
          `).get(record.id);

          if (existing) {
            // Update existing record
            const stmt = this.db.prepare(`
              UPDATE senior_citizens 
              SET sync_status = ?,
                  admin_notes = ?,
                  admin_decision_at = ?,
                  payment_status = ?,
                  payment_date = ?,
                  last_synced_at = CURRENT_TIMESTAMP,
                  updated_at = CURRENT_TIMESTAMP,
                  import_batch_id = ?,
                  is_readonly = CASE WHEN ? = 'APPROVED' THEN 1 ELSE is_readonly END
              WHERE id = ?
            `);

            stmt.run(
              record.sync_status,
              record.admin_notes || null,
              record.admin_decision_at || null,
              record.payment_status || null,
              record.payment_date || null,
              importData.batch_id,
              record.sync_status,
              record.id
            );

            results.updated++;
          } else {
            // Insert new record
            const stmt = this.db.prepare(`
              INSERT INTO senior_citizens (
                id, lgu_id, sync_status, admin_notes, admin_decision_at,
                payment_status, payment_date, last_synced_at,
                created_at, updated_at, import_batch_id,
                osca_id, ncsc_rrn, last_name, first_name, middle_name,
                ext_name, date_of_birth, sex, civil_status, citizenship,
                is_ip, ip_group, is_pwd, pwd_type, house_no_street,
                subdivision_village, barangay, city_municipality,
                province, region, postal_code, contact_no,
                email, philhealth_id, pension_type, monthly_pension,
                representative_name, representative_relationship,
                representative_contact, bank_name, account_name,
                account_number, is_readonly
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
              record.id,
              this.lguId,
              record.sync_status || 'DRAFT',
              record.admin_notes || null,
              record.admin_decision_at || null,
              record.payment_status || null,
              record.payment_date || null,
              new Date().toISOString(),
              record.created_at || new Date().toISOString(),
              new Date().toISOString(),
              importData.batch_id,
              record.osca_id,
              record.ncsc_rrn,
              record.last_name,
              record.first_name,
              record.middle_name,
              record.ext_name,
              record.date_of_birth,
              record.sex,
              record.civil_status,
              record.citizenship,
              record.is_ip,
              record.ip_group,
              record.is_pwd,
              record.pwd_type,
              record.house_no_street,
              record.subdivision_village,
              record.barangay,
              record.city_municipality,
              record.province,
              record.region,
              record.postal_code,
              record.contact_no,
              record.email,
              record.philhealth_id,
              record.pension_type,
              record.monthly_pension,
              record.representative_name,
              record.representative_relationship,
              record.representative_contact,
              record.bank_name,
              record.account_name,
              record.account_number,
              record.sync_status === 'APPROVED' ? 1 : 0
            );

            results.updated++;
          }

        } catch (error) {
          results.errors.push({
            record_id: record.id,
            error: error.message
          });
          console.error(`Error syncing record ${record.id}:`, error);
        }
      }
    });

    transaction();

    return results;
  }

  /**
   * Log import operation
   * @param {string} batchId - Batch ID
   * @param {number} recordCount - Number of records processed
   * @param {string} importType - Type of import
   */
  async logImport(batchId, recordCount, importType) {
    const stmt = this.db.prepare(`
      INSERT INTO sync_log (batch_id, lgu_id, sync_type, direction, record_count, status)
      VALUES (?, ?, 'IMPORT', 'INBOUND', ?, 'COMPLETED')
    `);
    
    stmt.run(batchId, this.lguId, recordCount);
  }

  /**
   * Get import history
   * @param {number} limit - Limit number of results
   */
  getImportHistory(limit = 10) {
    const stmt = this.db.prepare(`
      SELECT * FROM sync_log
      WHERE lgu_id = ? AND direction = 'INBOUND'
      ORDER BY created_at DESC
      LIMIT ?
    `);
    
    return stmt.all(this.lguId, limit);
  }

  /**
   * Check for pending status updates
   */
  getPendingStatusUpdates() {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM senior_citizens
      WHERE lgu_id = ?
      AND sync_status IN ('PENDING_REVIEW', 'CLEAN', 'APPROVED', 'DENIED')
      AND import_batch_id IS NULL
    `);
    
    return stmt.get(this.lguId);
  }

  /**
   * Generate import summary report
   * @param {string} batchId - Batch ID
   */
  async generateImportSummary(batchId) {
    const stmt = this.db.prepare(`
      SELECT 
        sync_status,
        COUNT(*) as count
      FROM senior_citizens
      WHERE import_batch_id = ?
      GROUP BY sync_status
    `);
    
    const statusCounts = stmt.all(batchId);
    
    return {
      batch_id: batchId,
      lgu_id: this.lguId,
      generated_at: new Date().toISOString(),
      summary: statusCounts,
      total: statusCounts.reduce((sum, item) => sum + item.count, 0)
    };
  }

  /**
   * Verify imported file before processing
   * @param {string} filepath - Path to import file
   * @param {string} password - Optional password
   */
  async verifyImportFile(filepath, password = null) {
    try {
      const data = this.crypto.decryptFromFile(filepath, password);
      
      return {
        valid: true,
        type: data.type,
        batch_id: data.batch_id,
        lgu_id: data.lgu_id,
        record_count: data.record_count || (data.updates ? data.updates.length : 0),
        generated_at: data.generated_at || data.exported_at,
        version: data.version
      };
      
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

export default USBImportService;
