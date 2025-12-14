import { v4 as uuidv4 } from 'uuid';

class SyncQueue {
  constructor(db) {
    this.db = db;
  }

  /**
   * Add a record to the sync queue
   * @param {Object} options - Queue options
   * @param {string} options.record_id - ID of the record to sync
   * @param {string} options.record_type - Type of record (senior_citizen, requirement)
   * @param {string} options.operation - Operation type (CREATE, UPDATE, DELETE)
   * @param {string} options.direction - Direction (UPLOAD, DOWNLOAD)
   */
  async addToQueue({ record_id, record_type = 'senior_citizen', operation = 'UPDATE', direction = 'UPLOAD' }) {
    const id = uuidv4();
    
    try {
      const stmt = this.db.prepare(`
        INSERT INTO sync_queue (id, record_id, record_type, operation, direction, status)
        VALUES (?, ?, ?, ?, ?, 'PENDING')
      `);
      
      stmt.run(id, record_id, record_type, operation, direction);
      console.log(`Added to sync queue: ${record_type} ${record_id} for ${direction}`);
      
      return id;
    } catch (error) {
      console.error('Error adding to sync queue:', error);
      throw error;
    }
  }

  /**
   * Get pending items in the sync queue
   * @param {string} direction - Filter by direction (optional)
   * @param {number} limit - Limit number of results (optional)
   */
  getPendingItems(direction = null, limit = 100) {
    try {
      let query = `
        SELECT sq.*, sc.name, sc.osca_id 
        FROM sync_queue sq
        LEFT JOIN senior_citizens sc ON sq.record_id = sc.id
        WHERE sq.status = 'PENDING'
      `;
      
      const params = [];
      
      if (direction) {
        query += ' AND sq.direction = ?';
        params.push(direction);
      }
      
      query += ' ORDER BY sq.created_at ASC LIMIT ?';
      params.push(limit);
      
      const stmt = this.db.prepare(query);
      return stmt.all(...params);
    } catch (error) {
      console.error('Error getting pending items:', error);
      return [];
    }
  }

  /**
   * Mark sync queue item as completed
   * @param {string} queueId - ID of the queue item
   */
  async markAsCompleted(queueId) {
    try {
      const stmt = this.db.prepare(`
        UPDATE sync_queue 
        SET status = 'COMPLETED', processed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      stmt.run(queueId);
      console.log(`Marked sync item ${queueId} as completed`);
    } catch (error) {
      console.error('Error marking as completed:', error);
      throw error;
    }
  }

  /**
   * Mark sync queue item as failed
   * @param {string} queueId - ID of the queue item
   * @param {string} errorMessage - Error message
   */
  async markAsFailed(queueId, errorMessage) {
    try {
      const stmt = this.db.prepare(`
        UPDATE sync_queue 
        SET status = 'FAILED', error_message = ?, retry_count = retry_count + 1
        WHERE id = ?
      `);
      
      stmt.run(errorMessage, queueId);
      console.log(`Marked sync item ${queueId} as failed: ${errorMessage}`);
    } catch (error) {
      console.error('Error marking as failed:', error);
      throw error;
    }
  }

  /**
   * Get records ready for export (USB or online)
   * @param {string} lguId - LGU ID to filter by
   * @param {string} lastExportBatchId - Last exported batch ID
   */
  getRecordsForExport(lguId, lastExportBatchId = null) {
    try {
      let query = `
        SELECT * FROM senior_citizens
        WHERE lgu_id = ?
        AND sync_status IN ('PENDING_UPLOAD', 'UPLOADED', 'PENDING_REVIEW', 'CLEAN')
      `;
      
      const params = [lguId];
      
      if (lastExportBatchId) {
        query += ' AND (export_batch_id IS NULL OR export_batch_id != ?)';
        params.push(lastExportBatchId);
      }
      
      query += ' ORDER BY updated_at ASC';
      
      const stmt = this.db.prepare(query);
      return stmt.all(...params);
    } catch (error) {
      console.error('Error getting records for export:', error);
      return [];
    }
  }

  /**
   * Mark records as exported with batch ID
   * @param {Array} recordIds - Array of record IDs
   * @param {string} batchId - Batch ID
   */
  async markAsExported(recordIds, batchId) {
    if (!recordIds || recordIds.length === 0) return;
    
    try {
      const placeholders = recordIds.map(() => '?').join(',');
      const stmt = this.db.prepare(`
        UPDATE senior_citizens 
        SET export_batch_id = ?, sync_status = 'UPLOADED'
        WHERE id IN (${placeholders})
      `);
      
      stmt.run(batchId, ...recordIds);
      console.log(`Marked ${recordIds.length} records as exported with batch ${batchId}`);
    } catch (error) {
      console.error('Error marking as exported:', error);
      throw error;
    }
  }

  /**
   * Get sync statistics
   * @param {string} lguId - LGU ID (optional)
   */
  getSyncStats(lguId = null) {
    try {
      let whereClause = '';
      const params = [];
      
      if (lguId) {
        whereClause = 'WHERE lgu_id = ?';
        params.push(lguId);
      }
      
      const stmt = this.db.prepare(`
        SELECT 
          sync_status,
          COUNT(*) as count
        FROM senior_citizens
        ${whereClause}
        GROUP BY sync_status
      `);
      
      const statusCounts = stmt.all(...params);
      
      // Convert to object for easier use
      const stats = {
        DRAFT: 0,
        PENDING_UPLOAD: 0,
        UPLOADED: 0,
        PENDING_REVIEW: 0,
        CLEAN: 0,
        APPROVED: 0,
        DENIED: 0,
        CROSS_LGU_DUPLICATE: 0,
        total: 0
      };
      
      statusCounts.forEach(row => {
        stats[row.sync_status] = row.count;
        stats.total += row.count;
      });
      
      // Get queue stats
      const queueStmt = this.db.prepare(`
        SELECT 
          direction,
          status,
          COUNT(*) as count
        FROM sync_queue
        GROUP BY direction, status
      `);
      
      const queueStats = queueStmt.all();
      stats.queue = queueStats;
      
      return stats;
    } catch (error) {
      console.error('Error getting sync stats:', error);
      return {};
    }
  }

  /**
   * Retry failed sync items
   * @param {number} maxRetries - Maximum retry count
   */
  async retryFailedItems(maxRetries = 3) {
    try {
      const stmt = this.db.prepare(`
        UPDATE sync_queue 
        SET status = 'PENDING', error_message = NULL
        WHERE status = 'FAILED' AND retry_count < ?
      `);
      
      const result = stmt.run(maxRetries);
      console.log(`Retrying ${result.changes} failed sync items`);
      
      return result.changes;
    } catch (error) {
      console.error('Error retrying failed items:', error);
      throw error;
    }
  }

  /**
   * Clear old completed items from queue
   * @param {number} daysOld - Age in days to keep
   */
  clearOldCompletedItems(daysOld = 7) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM sync_queue 
        WHERE status = 'COMPLETED' 
        AND processed_at < datetime('now', '-${daysOld} days')
      `);
      
      const result = stmt.run();
      console.log(`Cleared ${result.changes} old completed sync items`);
      
      return result.changes;
    } catch (error) {
      console.error('Error clearing old items:', error);
      throw error;
    }
  }
}

export default SyncQueue;
