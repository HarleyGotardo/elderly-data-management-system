import Controller from './Controller.js';
import SupabaseSyncService from '../../src/services/SupabaseSyncService.js';
import dbPromise from '../../database/config.js';

class SyncController extends Controller {
  constructor() {
    super();
  }

  /**
   * Sync approved records to Supabase
   */
  async syncToSupabase(request) {
    return this.handle(async () => {
      const db = await dbPromise;
      const { lgu_id } = request.params;
      
      // Initialize sync service
      const syncService = new SupabaseSyncService(db, lgu_id);
      
      // Check connectivity first
      const isConnected = await syncService.checkConnectivity();
      if (!isConnected) {
        return this.error('No internet connection. Cannot sync to Supabase.', 503);
      }
      
      // Perform sync
      const result = await syncService.uploadPendingRecords();
      
      if (!result.success) {
        return this.error(result.error, 500);
      }
      
      return this.success(result, `Sync completed: ${result.uploaded} uploaded, ${result.failed} failed`);
    });
  }

  /**
   * Full sync (upload and download)
   */
  async fullSync(request) {
    return this.handle(async () => {
      const db = await dbPromise;
      const { lgu_id } = request.params;
      
      // Initialize sync service
      const syncService = new SupabaseSyncService(db, lgu_id);
      
      // Check connectivity first
      const isConnected = await syncService.checkConnectivity();
      if (!isConnected) {
        return this.error('No internet connection. Cannot sync to Supabase.', 503);
      }
      
      // Perform full sync
      const result = await syncService.fullSync();
      
      if (!result.success) {
        return this.error(result.error, 500);
      }
      
      return this.success(result, `Full sync completed successfully`);
    });
  }

  /**
   * Get sync history
   */
  async getSyncHistory(request) {
    try {
      const db = await dbPromise;
      const { lgu_id } = request.params;
      const { limit = 10 } = request.query;
      
      const history = db.prepare(`
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
   * Export data to USB
   */
  async exportToUSB(request) {
    try {
      const db = await dbPromise;
      const { lgu_id } = request.params;
      const { include_drafts, include_requirements, password } = request.body;
      
      // Import USBExportService dynamically
      const { default: USBExportService } = await import('../../src/services/USBExportService.js');
      const exportService = new USBExportService(db, lgu_id);
      
      const result = await exportService.exportToUSB({
        includeDrafts: include_drafts || false,
        includeRequirements: include_requirements || true,
        customPassword: password
      });
      
      // Read the file and return as base64 for download
      const fs = await import('fs');
      const fileData = fs.readFileSync(result.filepath, 'base64');
      
      return {
        success: true,
        data: {
          filename: result.filename,
          batch_id: result.batch_id,
          record_count: result.record_count,
          file_data: fileData
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
   * Import status updates from USB
   */
  async importFromUSB(request) {
    try {
      const { lgu_id } = request.params;
      const { file_data, password } = request.body;
      
      // Import required modules dynamically
      const fs = await import('fs');
      const path = await import('path');
      const { default: USBImportService } = await import('../../src/services/USBImportService.js');
      
      // Create temporary file
      const tempDir = path.join(process.cwd(), 'temp_imports');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFile = path.join(tempDir, `import_${Date.now()}.enc`);
      fs.writeFileSync(tempFile, file_data, 'base64');
      
      // Import the file
      const db = await dbPromise;
      const importService = new USBImportService(db, lgu_id);
      const result = await importService.importFromUSB(tempFile, password);
      
      // Clean up temp file
      fs.unlinkSync(tempFile);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Force sync now
   */
  async forceSync(request) {
    try {
      const db = await dbPromise;
      const { lgu_id } = request.params;
      
      // Initialize Supabase sync service
      const syncService = new SupabaseSyncService(db, lgu_id);
      
      // Check connectivity first
      const isOnline = await syncService.checkConnectivity();
      
      if (!isOnline) {
        return {
          success: false,
          message: 'No internet connection. Please check your network and try again.'
        };
      }
      
      // Perform full sync
      const result = await syncService.fullSync();
      
      return {
        success: result.success,
        data: {
          uploaded: result.upload?.uploaded || 0,
          downloaded: result.download?.downloaded || 0,
          failed_uploads: result.upload?.failed || 0,
          failed_downloads: result.download?.failed || 0,
          message: result.success ? 'Sync completed successfully' : 'Sync completed with errors'
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
   * Submit record to admin
   */
  async submitToAdmin(request) {
    try {
      const db = await dbPromise;
      const { record_id } = request.params;
      const { lgu_id } = request.body;
      
      const syncService = new SupabaseSyncService(db, lgu_id);
      const result = await syncService.submitToAdmin(record_id);
      
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Check connectivity
   */
  async checkConnectivity(request) {
    try {
      const db = await dbPromise;
      const { lgu_id } = request.params;
      
      const syncService = new SupabaseSyncService(db, lgu_id);
      const isOnline = await syncService.checkConnectivity();
      
      return {
        success: true,
        online: isOnline,
        message: isOnline ? 'Connected to Supabase' : 'No internet connection'
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
   * Check for duplicates (Admin only)
   */
  async checkDuplicates(request) {
    try {
      const db = await dbPromise;
      const { record_id } = request.params;
      
      // Import DuplicateDetectionService dynamically
      const { default: DuplicateDetectionService } = await import('../../src/services/DuplicateDetectionService.js');
      const duplicateService = new DuplicateDetectionService(db);
      
      // Get the record to check
      const record = db.prepare(`
        SELECT * FROM senior_citizens WHERE id = ?
      `).get(record_id);
      
      if (!record) {
        return {
          success: false,
          message: 'Record not found'
        };
      }
      
      // Check local duplicates
      const localDuplicates = duplicateService.checkLocalDuplicates(record, record.lgu_id);
      
      // Check global duplicates
      const globalDuplicates = duplicateService.checkGlobalDuplicates(record, record.lgu_id);
      
      return {
        success: true,
        data: {
          record_id,
          local_duplicates: localDuplicates,
          global_duplicates: globalDuplicates
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
      const db = await dbPromise;
      const { record_ids } = request.body;
      
      // Mark records as duplicates
      const placeholders = record_ids.map(() => '?').join(',');
      const stmt = db.prepare(`
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
