import { getSupabaseAdmin, getLGUClient } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

class SupabaseSyncService {
  constructor(localDb, lguId) {
    this.localDb = localDb;
    this.lguId = lguId;
    this.supabase = null;
    this.supabaseAdmin = null;
  }

  // Initialize Supabase clients
  async initialize() {
    if (!this.supabase) {
      this.supabase = await getLGUClient(this.lguId);
      this.supabaseAdmin = await getSupabaseAdmin();
    }
  }

  /**
   * Upload pending records to Supabase
   */
  async uploadPendingRecords() {
    const uploadResults = [];
    
    try {
      // Initialize Supabase clients
      await this.initialize();
      
      // Get records pending upload
      const pendingRecords = this.localDb.prepare(`
        SELECT * FROM senior_citizens 
        WHERE sync_status = 'PENDING_UPLOAD' 
        AND lgu_id = ?
      `).all(this.lguId);

      console.log(`Found ${pendingRecords.length} records to upload`);

      for (const record of pendingRecords) {
        try {
          // Convert local record to Supabase format
          const supabaseRecord = this.convertToSupabaseFormat(record);
          
          // Upload to Supabase
          const { data, error } = await this.supabase
            .from('senior_citizens')
            .insert(supabaseRecord)
            .select()
            .single();

          if (error) {
            console.error('Upload error for record', record.id, ':', error);
            uploadResults.push({
              localId: record.id,
              success: false,
              error: error.message
            });
            continue;
          }

          // Update local record with Supabase ID and status
          this.localDb.prepare(`
            UPDATE senior_citizens 
            SET sync_status = 'UPLOADED',
                last_synced_at = CURRENT_TIMESTAMP,
                sync_version = sync_version + 1
            WHERE id = ?
          `).run(record.id);

          uploadResults.push({
            localId: record.id,
            success: true,
            supabaseId: data.id
          });

        } catch (err) {
          console.error('Failed to upload record', record.id, ':', err);
          uploadResults.push({
            localId: record.id,
            success: false,
            error: err.message
          });
        }
      }

      return {
        success: true,
        uploaded: uploadResults.filter(r => r.success).length,
        failed: uploadResults.filter(r => !r.success).length,
        results: uploadResults
      };

    } catch (error) {
      console.error('Upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Download updates from Supabase
   */
  async downloadUpdates() {
    const downloadResults = [];

    try {
      // Initialize Supabase clients
      await this.initialize();
      
      // Get records that have been updated by admin
      const { data: updatedRecords, error } = await this.supabase
        .from('senior_citizens')
        .select('*')
        .eq('lgu_id', this.lguId)
        .in('sync_status', ['APPROVED', 'DENIED', 'CLEAN'])
        .gt('updated_at', this.getLastSyncTime());

      if (error) {
        throw error;
      }

      console.log(`Found ${updatedRecords.length} records to download`);

      for (const record of updatedRecords) {
        try {
          // Update local record
          this.updateLocalRecord(record);
          
          downloadResults.push({
            supabaseId: record.id,
            success: true,
            status: record.sync_status
          });

        } catch (err) {
          console.error('Failed to update local record', record.id, ':', err);
          downloadResults.push({
            supabaseId: record.id,
            success: false,
            error: err.message
          });
        }
      }

      // Update last sync time
      this.updateLastSyncTime();

      return {
        success: true,
        downloaded: downloadResults.filter(r => r.success).length,
        failed: downloadResults.filter(r => !r.success).length,
        results: downloadResults
      };

    } catch (error) {
      console.error('Download failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Full sync (upload and download)
   */
  async fullSync() {
    console.log('Starting full sync for LGU:', this.lguId);
    
    const results = {
      upload: null,
      download: null,
      success: true
    };

    try {
      // First upload pending records
      results.upload = await this.uploadPendingRecords();
      
      // Then download updates
      results.download = await this.downloadUpdates();

      // Log sync operation
      this.logSyncOperation(results);

      return results;

    } catch (error) {
      console.error('Full sync failed:', error);
      results.success = false;
      results.error = error.message;
      return results;
    }
  }

  /**
   * Check network connectivity
   */
  async checkConnectivity() {
    try {
      await this.initialize();
      const { data, error } = await this.supabase
        .from('lgu')
        .select('id')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Get sync statistics
   */
  getSyncStats() {
    const stats = this.localDb.prepare(`
      SELECT 
        sync_status,
        COUNT(*) as count
      FROM senior_citizens 
      WHERE lgu_id = ?
      GROUP BY sync_status
    `).all(this.lguId);

    return stats.reduce((acc, stat) => {
      acc[stat.sync_status] = stat.count;
      return acc;
    }, {});
  }

  /**
   * Mark records for upload
   */
  markForUpload(recordIds) {
    const placeholders = recordIds.map(() => '?').join(',');
    
    this.localDb.prepare(`
      UPDATE senior_citizens 
      SET sync_status = 'PENDING_UPLOAD',
          updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
      AND lgu_id = ?
    `).run(...recordIds, this.lguId);

    console.log(`Marked ${recordIds.length} records for upload`);
  }

  /**
   * Submit record to admin (changes status to PENDING_UPLOAD)
   */
  async submitToAdmin(recordId) {
    try {
      // Update local status
      this.localDb.prepare(`
        UPDATE senior_citizens 
        SET sync_status = 'PENDING_UPLOAD',
            submitted_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND lgu_id = ?
      `).run(recordId, this.lguId);

      // Add to sync queue
      const queueStmt = this.localDb.prepare(`
        INSERT INTO sync_queue (
          record_id, record_type, operation, direction, status
        ) VALUES (?, ?, ?, ?, ?)
      `);

      queueStmt.run(
        recordId,
        'senior_citizen',
        'UPLOAD',
        'OUTBOUND',
        'PENDING'
      );

      return {
        success: true,
        message: 'Record submitted to admin'
      };

    } catch (error) {
      console.error('Submit failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default SupabaseSyncService;
