import fs from 'fs';
import path from 'path';
import CryptoUtils from '../utils/CryptoUtils.js';

class StatusUpdateService {
  constructor(db) {
    this.db = db;
    this.crypto = new CryptoUtils();
    this.exportDir = path.join(process.cwd(), 'admin_exports');
    
    // Ensure export directory exists
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  /**
   * Generate status updates for a specific LGU
   * @param {string} lguId - LGU ID to generate updates for
   * @param {Object} options - Generation options
   */
  async generateStatusUpdates(lguId, options = {}) {
    const {
      includeApproved = true,
      includeDenied = true,
      includePaymentInfo = true,
      dateFrom = null,
      dateTo = null,
      customPassword = null
    } = options;

    try {
      // Get records with updates
      const records = await this.getRecordsWithUpdates(lguId, {
        includeApproved,
        includeDenied,
        includePaymentInfo,
        dateFrom,
        dateTo
      });

      if (records.length === 0) {
        throw new Error('No records with status updates found');
      }

      // Generate batch ID
      const batchId = this.crypto.generateBatchId();

      // Prepare update data
      const updateData = {
        type: 'STATUS_UPDATE',
        version: '1.0',
        batch_id: batchId,
        lgu_id: lguId,
        generated_at: new Date().toISOString(),
        generated_by: 'ADMIN_SYSTEM',
        record_count: records.length,
        updates: records.map(record => this.prepareUpdateRecord(record)),
        metadata: {
          includes_payment_info: includePaymentInfo,
          date_range: {
            from: dateFrom,
            to: dateTo
          },
          export_type: 'ADMIN_STATUS_UPDATE'
        }
      };

      // Add signature for integrity verification
      updateData.signature = this.crypto.signData(updateData);

      // Generate filename
      const filename = `EDMS_StatusUpdate_${lguId}_${batchId}.enc`;
      const filepath = path.join(this.exportDir, filename);

      // Encrypt and save
      this.crypto.encryptToFile(updateData, filepath, customPassword);

      // Mark records as sent
      await this.markRecordsAsSent(records, batchId);

      // Log generation
      await this.logStatusUpdateGeneration(batchId, lguId, records.length);

      console.log(`Generated status update for ${lguId}: ${records.length} records`);

      return {
        success: true,
        batch_id: batchId,
        filename: filename,
        filepath: filepath,
        record_count: records.length,
        size_bytes: fs.statSync(filepath).size,
        summary: this.generateUpdateSummary(records)
      };

    } catch (error) {
      console.error('Status update generation error:', error);
      throw error;
    }
  }

  /**
   * Get records with status updates for LGU
   * @param {string} lguId - LGU ID
   * @param {Object} options - Query options
   */
  async getRecordsWithUpdates(lguId, options) {
    let query = `
      SELECT id, osca_id, last_name, first_name, middle_name,
             sync_status, admin_notes, admin_decision_at,
             payment_status, payment_date, updated_at
      FROM senior_citizens
      WHERE lgu_id = ?
      AND sync_status IN ('APPROVED', 'DENIED')
      AND import_batch_id IS NULL
    `;
    
    const params = [lguId];

    // Add status filters
    const statusFilters = [];
    if (options.includeApproved) statusFilters.push('APPROVED');
    if (options.includeDenied) statusFilters.push('DENIED');
    
    if (statusFilters.length > 0) {
      query += ` AND sync_status IN (${statusFilters.map(() => '?').join(',')})`;
      params.push(...statusFilters);
    }

    // Add date range
    if (options.dateFrom) {
      query += ' AND admin_decision_at >= ?';
      params.push(options.dateFrom);
    }

    if (options.dateTo) {
      query += ' AND admin_decision_at <= ?';
      params.push(options.dateTo);
    }

    query += ' ORDER BY admin_decision_at DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Prepare record for update export
   * @param {Object} record - Database record
   */
  prepareUpdateRecord(record) {
    return {
      id: record.id,
      osca_id: record.osca_id,
      name: `${record.last_name}, ${record.first_name} ${record.middle_name || ''}`.trim(),
      status: record.sync_status,
      admin_notes: record.admin_notes,
      decision_at: record.admin_decision_at,
      payment_status: record.payment_status,
      payment_date: record.payment_date,
      updated_at: record.updated_at
    };
  }

  /**
   * Mark records as sent with batch ID
   * @param {Array} records - Array of records
   * @param {string} batchId - Batch ID
   */
  async markRecordsAsSent(records, batchId) {
    const recordIds = records.map(r => r.id);
    
    if (recordIds.length === 0) return;

    const placeholders = recordIds.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      UPDATE senior_citizens 
      SET import_batch_id = ?,
          last_synced_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
    `);
    
    stmt.run(batchId, ...recordIds);
  }

  /**
   * Log status update generation
   * @param {string} batchId - Batch ID
   * @param {string} lguId - LGU ID
   * @param {number} recordCount - Number of records
   */
  async logStatusUpdateGeneration(batchId, lguId, recordCount) {
    const stmt = this.db.prepare(`
      INSERT INTO sync_log (batch_id, lgu_id, sync_type, direction, record_count, status)
      VALUES (?, ?, 'STATUS_UPDATE', 'OUTBOUND', ?, 'COMPLETED')
    `);
    
    stmt.run(batchId, lguId, recordCount);
  }

  /**
   * Generate summary of updates
   * @param {Array} records - Array of records
   */
  generateUpdateSummary(records) {
    const summary = {
      APPROVED: 0,
      DENIED: 0,
      with_payment: 0,
      without_payment: 0
    };

    records.forEach(record => {
      summary[record.sync_status]++;
      
      if (record.payment_status) {
        summary.with_payment++;
      } else {
        summary.without_payment++;
      }
    });

    return summary;
  }

  /**
   * Generate bulk status updates for multiple LGUs
   * @param {Array} lguIds - Array of LGU IDs
   * @param {Object} options - Generation options
   */
  async generateBulkStatusUpdates(lguIds, options = {}) {
    const results = [];
    
    for (const lguId of lguIds) {
      try {
        const result = await this.generateStatusUpdates(lguId, options);
        results.push({
          lgu_id: lguId,
          ...result
        });
      } catch (error) {
        results.push({
          lgu_id: lguId,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get LGUs with pending status updates
   */
  getLGUsWithPendingUpdates() {
    const stmt = this.db.prepare(`
      SELECT DISTINCT lgu_id,
             COUNT(*) as pending_count,
             COUNT(CASE WHEN sync_status = 'APPROVED' THEN 1 END) as approved_count,
             COUNT(CASE WHEN sync_status = 'DENIED' THEN 1 END) as denied_count
      FROM senior_citizens
      WHERE sync_status IN ('APPROVED', 'DENIED')
      AND import_batch_id IS NULL
      GROUP BY lgu_id
      ORDER BY pending_count DESC
    `);
    
    return stmt.all();
  }

  /**
   * Get status update generation history
   * @param {string} lguId - Optional LGU ID filter
   * @param {number} limit - Limit results
   */
  getGenerationHistory(lguId = null, limit = 20) {
    let query = `
      SELECT sl.*, 
             COUNT(sc.id) as record_count
      FROM sync_log sl
      LEFT JOIN senior_citizens sc ON sl.batch_id = sc.import_batch_id
      WHERE sl.sync_type = 'STATUS_UPDATE'
      AND sl.direction = 'OUTBOUND'
    `;
    
    const params = [];
    
    if (lguId) {
      query += ' AND sl.lgu_id = ?';
      params.push(lguId);
    }
    
    query += ' GROUP BY sl.id ORDER BY sl.created_at DESC LIMIT ?';
    params.push(limit);
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Verify generated status update file
   * @param {string} filepath - Path to file
   * @param {string} password - Optional password
   */
  verifyStatusUpdateFile(filepath, password = null) {
    try {
      const data = this.crypto.decryptFromFile(filepath, password);
      
      // Verify signature
      const signature = data.signature;
      delete data.signature;
      
      if (!this.crypto.verifySignature(data, signature)) {
        throw new Error('Invalid file signature');
      }

      return {
        valid: true,
        batch_id: data.batch_id,
        lgu_id: data.lgu_id,
        record_count: data.record_count,
        generated_at: data.generated_at,
        type: data.type,
        summary: data.summary
      };
      
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Create comprehensive status report for admin
   * @param {Object} filters - Report filters
   */
  createStatusReport(filters = {}) {
    let query = `
      SELECT 
        lgu_id,
        sync_status,
        COUNT(*) as count,
        COUNT(CASE WHEN payment_status IS NOT NULL THEN 1 END) as with_payment,
        COUNT(CASE WHEN admin_decision_at >= datetime('now', '-30 days') THEN 1 END) as recent_decisions
      FROM senior_citizens
      WHERE sync_status IN ('APPROVED', 'DENIED')
    `;
    
    const params = [];
    
    if (filters.lgu_id) {
      query += ' AND lgu_id = ?';
      params.push(filters.lgu_id);
    }
    
    if (filters.date_from) {
      query += ' AND admin_decision_at >= ?';
      params.push(filters.date_from);
    }
    
    if (filters.date_to) {
      query += ' AND admin_decision_at <= ?';
      params.push(filters.date_to);
    }
    
    query += ' GROUP BY lgu_id, sync_status ORDER BY lgu_id, sync_status';
    
    const stmt = this.db.prepare(query);
    const results = stmt.all(...params);
    
    // Process results into report format
    const report = {
      generated_at: new Date().toISOString(),
      filters: filters,
      summary: {
        total_approved: 0,
        total_denied: 0,
        total_with_payment: 0,
        lgus_counted: new Set()
      },
      by_lgu: {}
    };
    
    results.forEach(row => {
      // Update summary
      if (row.sync_status === 'APPROVED') {
        report.summary.total_approved += row.count;
      } else if (row.sync_status === 'DENIED') {
        report.summary.total_denied += row.count;
      }
      report.summary.total_with_payment += row.with_payment;
      report.summary.lgus_counted.add(row.lgu_id);
      
      // Update by LGU
      if (!report.by_lgu[row.lgu_id]) {
        report.by_lgu[row.lgu_id] = {
          approved: 0,
          denied: 0,
          with_payment: 0,
          recent_decisions: 0
        };
      }
      
      report.by_lgu[row.lgu_id][row.sync_status.toLowerCase()] = row.count;
      report.by_lgu[row.lgu_id].with_payment = row.with_payment;
      report.by_lgu[row.lgu_id].recent_decisions = row.recent_decisions;
    });
    
    report.summary.lgus_counted = report.summary.lgus_counted.size;
    
    return report;
  }

  /**
   * Clean up old status update files
   * @param {number} daysOld - Age in days to keep
   */
  cleanupOldFiles(daysOld = 30) {
    try {
      const files = fs.readdirSync(this.exportDir);
      let deletedCount = 0;

      files.forEach(file => {
        const filepath = path.join(this.exportDir, file);
        const stats = fs.statSync(filepath);
        
        const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
        
        if (ageInDays > daysOld && file.endsWith('.enc')) {
          fs.unlinkSync(filepath);
          deletedCount++;
        }
      });

      console.log(`Cleaned up ${deletedCount} old status update files`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up files:', error);
      throw error;
    }
  }
}

export default StatusUpdateService;
