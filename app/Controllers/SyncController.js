import Controller from './Controller.js';
import db from '../../database/config.js';

class SyncController extends Controller {
  constructor() {
    super();
    this.db = db;
  }

  /**
   * Get sync status for LGU
   */
  async getSyncStatus(request) {
    try {
      const { lgu_id } = request.params;
      
      // Simple sync stats
      const stats = this.db.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN sync_status = 'DRAFT' THEN 1 END) as draft,
          COUNT(CASE WHEN sync_status = 'PENDING_ADMIN_REVIEW' THEN 1 END) as pending,
          COUNT(CASE WHEN sync_status = 'APPROVED' THEN 1 END) as approved,
          COUNT(CASE WHEN sync_status = 'DENIED' THEN 1 END) as denied
        FROM senior_citizens 
        WHERE lgu_id = ?
      `).get(lgu_id);
      
      return {
        success: true,
        data: { stats }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get sync history
   */
  async getSyncHistory(request) {
    try {
      const { lgu_id } = request.params;
      const { limit = 10 } = request.query;
      
      const history = this.db.prepare(`
        SELECT * FROM sync_log 
        WHERE lgu_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `).all(lgu_id, limit);
      
      return {
        success: true,
        data: { history }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Export data to USB (simplified version)
   */
  async exportToUSB(request) {
    try {
      const { lgu_id } = request.params;
      const { include_drafts = false } = request.body;
      
      // Get records to export
      const records = this.db.prepare(`
        SELECT * FROM senior_citizens 
        WHERE lgu_id = ? 
        AND (sync_status != 'DRAFT' OR ? = true)
      `).all(lgu_id, include_drafts);
      
      // Simple export data
      const exportData = {
        metadata: {
          lgu_id,
          export_date: new Date().toISOString(),
          record_count: records.length
        },
        records: records
      };
      
      return {
        success: true,
        data: exportData
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Import status updates (simplified version)
   */
  async importFromUSB(request) {
    try {
      const { lgu_id } = request.params;
      const { updates } = request.body;
      
      let updatedCount = 0;
      
      // Process updates
      for (const update of updates) {
        const stmt = this.db.prepare(`
          UPDATE senior_citizens 
          SET sync_status = ?, 
              admin_notes = ?,
              payment_status = ?,
              payment_date = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND lgu_id = ?
        `);
        
        const result = stmt.run(
          update.status,
          update.remarks || null,
          update.payment_status || null,
          update.payment_date || null,
          update.id,
          lgu_id
        );
        
        if (result.changes > 0) {
          updatedCount++;
        }
      }
      
      return {
        success: true,
        data: { updated_count: updatedCount }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Force sync (placeholder - would need Supabase integration)
   */
  async forceSync(request) {
    try {
      const { lgu_id } = request.params;
      
      // Placeholder for sync implementation
      return {
        success: true,
        data: {
          uploaded: 0,
          downloaded: 0,
          message: 'Sync functionality requires Supabase configuration'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Submit record to admin (simplified)
   */
  async submitToAdmin(request) {
    try {
      const { record_id } = request.params;
      const { lgu_id } = request.body;
      
      // Update record status
      const stmt = this.db.prepare(`
        UPDATE senior_citizens 
        SET sync_status = 'PENDING_ADMIN_REVIEW',
            submitted_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND lgu_id = ?
      `);
      
      const result = stmt.run(record_id, lgu_id);
      
      if (result.changes === 0) {
        return {
          success: false,
          message: 'Record not found'
        };
      }
      
      return {
        success: true,
        message: 'Record submitted for admin review'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Check connectivity (placeholder)
   */
  async checkConnectivity(request) {
    try {
      // Placeholder for connectivity check
      return {
        success: true,
        online: false,
        message: 'Connectivity check requires Supabase configuration'
      };
    } catch (error) {
      return {
        success: false,
        online: false,
        message: error.message
      };
    }
  }

  /**
   * Check duplicates (simplified version)
   */
  async checkDuplicates(request) {
    try {
      const { record_id } = request.params;
      
      // Get the record
      const record = this.db.prepare(`
        SELECT * FROM senior_citizens WHERE id = ?
      `).get(record_id);
      
      if (!record) {
        return {
          success: false,
          message: 'Record not found'
        };
      }
      
      // Check for duplicates based on name and birthdate
      const duplicates = this.db.prepare(`
        SELECT id, first_name, last_name, date_of_birth, lgu_id
        FROM senior_citizens 
        WHERE id != ? 
        AND LOWER(first_name) = LOWER(?) 
        AND LOWER(last_name) = LOWER(?) 
        AND date_of_birth = ?
      `).all(
        record_id,
        record.first_name,
        record.last_name,
        record.date_of_birth
      );
      
      return {
        success: true,
        data: {
          duplicates,
          duplicate_count: duplicates.length
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Mark records as duplicates
   */
  async markAsDuplicates(request) {
    try {
      const { record_ids } = request.body;
      
      // Mark records as duplicates
      const placeholders = record_ids.map(() => '?').join(',');
      const stmt = this.db.prepare(`
        UPDATE senior_citizens 
        SET sync_status = 'DUPLICATE',
            updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders})
      `);
      
      const result = stmt.run(...record_ids);
      
      return {
        success: true,
        data: { marked_count: result.changes }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

export default SyncController;
