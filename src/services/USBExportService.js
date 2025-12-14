import fs from 'fs';
import path from 'path';
import CryptoUtils from '../utils/CryptoUtils.js';
import SyncQueue from './SyncQueue.js';

class USBExportService {
  constructor(db, lguId) {
    this.db = db;
    this.lguId = lguId;
    this.crypto = new CryptoUtils();
    this.syncQueue = new SyncQueue(db);
    this.exportDir = path.join(process.cwd(), 'exports');
    
    // Ensure export directory exists
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  /**
   * Export pending records to USB-compatible file
   * @param {Object} options - Export options
   */
  async exportToUSB(options = {}) {
    try {
      const {
        includeDrafts = false,
        includeRequirements = true,
        customPassword = null
      } = options;

      // Get last export batch ID
      const lastExportBatchId = await this.getLastExportBatchId();

      // Get records to export
      const records = await this.getRecordsForExport(lastExportBatchId, includeDrafts);
      
      if (records.length === 0) {
        throw new Error('No records to export');
      }

      // Generate batch ID
      const batchId = this.crypto.generateBatchId();

      // Prepare export data
      const exportData = {
        type: 'DATA_EXPORT',
        version: '1.0',
        batch_id: batchId,
        lgu_id: this.lguId,
        exported_at: new Date().toISOString(),
        record_count: records.length,
        records: records.map(record => this.sanitizeRecord(record)),
        requirements: includeRequirements ? await this.getRequirementsForRecords(records) : [],
        metadata: {
          export_type: 'USB_TRANSFER',
          includes_requirements: includeRequirements,
          includes_drafts: includeDrafts,
          app_version: '1.0.0'
        }
      };

      // Add signature for integrity verification
      exportData.signature = this.crypto.signData(exportData);

      // Generate filename
      const filename = `EDMS_Export_${this.lguId}_${batchId}.enc`;
      const filepath = path.join(this.exportDir, filename);

      // Encrypt and save
      this.crypto.encryptToFile(exportData, filepath, customPassword);

      // Mark records as exported
      await this.markRecordsAsExported(records, batchId);

      // Log export
      await this.logExport(batchId, records.length, 'USB');

      console.log(`Exported ${records.length} records to ${filename}`);

      return {
        success: true,
        batch_id: batchId,
        filename: filename,
        filepath: filepath,
        record_count: records.length,
        size_bytes: fs.statSync(filepath).size
      };

    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  /**
   * Get records ready for export
   * @param {string} lastBatchId - Last exported batch ID
   * @param {boolean} includeDrafts - Include draft records
   */
  async getRecordsForExport(lastBatchId, includeDrafts = false) {
    let query = `
      SELECT * FROM senior_citizens
      WHERE lgu_id = ?
      AND sync_status IN ('PENDING_UPLOAD', 'UPLOADED', 'PENDING_REVIEW', 'CLEAN')
    `;
    
    const params = [this.lguId];

    if (!includeDrafts) {
      query += ' AND sync_status != ?';
      params.push('DRAFT');
    }

    if (lastBatchId) {
      query += ' AND (export_batch_id IS NULL OR export_batch_id != ?)';
      params.push(lastBatchId);
    }

    query += ' ORDER BY updated_at ASC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Get requirements for exported records
   * @param {Array} records - Array of senior citizen records
   */
  async getRequirementsForRecords(records) {
    // This would fetch uploaded documents/requirements
    // For now, return empty array as requirements handling is separate
    return [];
  }

  /**
   * Sanitize record for export (remove sensitive/internal fields)
   * @param {Object} record - Database record
   */
  sanitizeRecord(record) {
    const sanitized = { ...record };
    
    // Remove internal fields that shouldn't be exported
    delete sanitized.internal_notes;
    delete sanitized.temp_fields;
    
    // Ensure dates are properly formatted
    ['created_at', 'updated_at', 'date_of_birth', 'admin_decision_at'].forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = new Date(sanitized[field]).toISOString();
      }
    });

    return sanitized;
  }

  /**
   * Mark records as exported with batch ID
   * @param {Array} records - Array of records
   * @param {string} batchId - Batch ID
   */
  async markRecordsAsExported(records, batchId) {
    const recordIds = records.map(r => r.id);
    await this.syncQueue.markAsExported(recordIds, batchId);
  }

  /**
   * Get the last export batch ID
   */
  async getLastExportBatchId() {
    const stmt = this.db.prepare(`
      SELECT export_batch_id FROM senior_citizens
      WHERE lgu_id = ? AND export_batch_id IS NOT NULL
      ORDER BY updated_at DESC LIMIT 1
    `);
    
    const result = stmt.get(this.lguId);
    return result ? result.export_batch_id : null;
  }

  /**
   * Log export operation
   * @param {string} batchId - Batch ID
   * @param {number} recordCount - Number of records
   * @param {string} exportType - Type of export
   */
  async logExport(batchId, recordCount, exportType) {
    const stmt = this.db.prepare(`
      INSERT INTO sync_log (batch_id, lgu_id, sync_type, direction, record_count, status)
      VALUES (?, ?, 'EXPORT', 'OUTBOUND', ?, 'COMPLETED')
    `);
    
    stmt.run(batchId, this.lguId, recordCount);
  }

  /**
   * Create export summary report
   * @param {string} batchId - Batch ID
   */
  async createExportSummary(batchId) {
    const stmt = this.db.prepare(`
      SELECT 
        sync_status,
        COUNT(*) as count
      FROM senior_citizens
      WHERE export_batch_id = ?
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
   * Verify exported file integrity
   * @param {string} filepath - Path to exported file
   */
  async verifyExport(filepath) {
    try {
      if (!fs.existsSync(filepath)) {
        throw new Error('Export file not found');
      }

      // Read and decrypt file
      const data = this.crypto.decryptFromFile(filepath);
      
      // Verify signature
      const signature = data.signature;
      delete data.signature;
      
      if (!this.crypto.verifySignature(data, signature)) {
        throw new Error('Export file signature verification failed');
      }

      // Verify hash of records
      if (data.records) {
        const expectedHash = this.crypto.generateHash(data.records);
        // In a real implementation, you'd store and verify this hash
      }

      return {
        valid: true,
        record_count: data.record_count,
        exported_at: data.exported_at,
        batch_id: data.batch_id
      };

    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Get export history
   * @param {number} limit - Limit number of results
   */
  getExportHistory(limit = 10) {
    const stmt = this.db.prepare(`
      SELECT * FROM sync_log
      WHERE lgu_id = ? AND direction = 'OUTBOUND'
      ORDER BY created_at DESC
      LIMIT ?
    `);
    
    return stmt.all(this.lguId, limit);
  }

  /**
   * Clean up old export files
   * @param {number} daysOld - Age in days to keep
   */
  cleanupOldExports(daysOld = 30) {
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

      console.log(`Cleaned up ${deletedCount} old export files`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up exports:', error);
      throw error;
    }
  }
}

export default USBExportService;
