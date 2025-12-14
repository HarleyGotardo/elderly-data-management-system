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
      console.log('🔐 Supabase initialized');
      console.log('🔑 LGU ID:', this.lguId);
      
      // Check if Supabase client is properly initialized
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      // Test connection
      console.log('🌐 Testing Supabase connection...');
      const { data: testData, error: testError } = await this.supabase
        .from('senior_citizens')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('❌ Connection test failed:', testError);
        throw new Error(`Supabase connection failed: ${testError.message}`);
      }
      console.log('✅ Supabase connection successful');
      
      // Get records pending upload (approved records not yet synced)
      const pendingRecords = this.localDb.prepare(`
        SELECT * FROM senior_citizens 
        WHERE status = 'APPROVED' 
        AND lgu_id = ?
      `).all(this.lguId);

      console.log(`Found ${pendingRecords.length} records to upload`);

      for (const record of pendingRecords) {
        try {
          console.log('🔄 Processing record:', record.id);
          console.log('📊 Record data:', {
            id: record.id,
            osca_id: record.osca_id,
            name: `${record.first_name} ${record.last_name}`,
            status: record.status,
            synced_to_supabase: record.synced_to_supabase
          });
          
          // Convert local record to Supabase format
          const supabaseRecord = this.convertToSupabaseFormat(record);
          console.log('🔧 Converted to Supabase format:', supabaseRecord);
          
          // Upload to Supabase
          console.log('⬆️ Uploading to Supabase...');
          const { data, error } = await this.supabase
            .from('senior_citizens')
            .insert(supabaseRecord)
            .select()
            .single();

          if (error) {
            console.error('❌ Supabase upload error:', error);
            console.error('❌ Error details:', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            });
            uploadResults.push({
              localId: record.id,
              success: false,
              error: error.message
            });
            continue;
          }

          console.log('✅ Upload successful:', data);

          // Update local record with Supabase ID and status
          this.localDb.prepare(`
            UPDATE senior_citizens 
            SET status = 'SYNCED',
                synced_to_supabase = 1,
                updated_at = CURRENT_TIMESTAMP
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
        .in('status', ['APPROVED', 'DENIED', 'CLEAN'])
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
            status: record.status
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
        status,
        COUNT(*) as count
      FROM senior_citizens 
      WHERE lgu_id = ?
      GROUP BY status
    `).all(this.lguId);

    return stats.reduce((acc, stat) => {
      acc[stat.status] = stat.count;
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
      SET status = 'PENDING_UPLOAD',
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
        SET status = 'PENDING_UPLOAD',
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

  /**
   * Convert local record to Supabase format
   */
  convertToSupabaseFormat(record) {
    console.log('🔄 Converting record to Supabase format...');
    
    // Only include fields that exist in Supabase table
    // Remove fields that are local-only or cause schema errors
    const supabaseRecord = {
      // Basic info
      osca_id: record.osca_id,
      ncsc_rrn: record.ncsc_rrn,
      last_name: record.last_name,
      first_name: record.first_name,
      middle_name: record.middle_name,
      ext_name: record.ext_name,
      
      // Personal info
      date_of_birth: record.date_of_birth,
      sex: record.sex,
      civil_status: record.civil_status,
      citizenship: record.citizenship || 'Filipino',
      
      // Vulnerable sectors
      is_ip: Boolean(record.is_ip),
      ip_group: record.ip_group || null,
      is_pwd: Boolean(record.is_pwd),
      pwd_type: record.pwd_type || null,
      
      // Address
      region: record.region,
      province: record.province,
      municipality: record.municipality,
      barangay: record.barangay,
      house_number: record.house_number || null,
      street: record.street || null,
      
      // Family
      spouse_name: record.spouse_name || null,
      rep_1_name: record.rep_1_name || null,
      rep_1_relationship: record.rep_1_relationship || null,
      rep_2_name: record.rep_2_name || null,
      rep_2_relationship: record.rep_2_relationship || null,
      rep_3_name: record.rep_3_name || null,
      rep_3_relationship: record.rep_3_relationship || null,
      
      // Beneficiaries
      beneficiary_primary: record.beneficiary_primary || null,
      beneficiary_contingent: record.beneficiary_contingent || null,
      
      // Status and tracking
      status: record.status,
      lgu_id: record.lgu_id,
      
      // Include synced_to_supabase for tracking
      synced_to_supabase: true,
      
      // Timestamps
      created_at: record.created_at,
      updated_at: record.updated_at,
      submitted_at: record.submitted_at || null
    };
    
    // Remove undefined and null values to avoid schema errors
    Object.keys(supabaseRecord).forEach(key => {
      if (supabaseRecord[key] === undefined || supabaseRecord[key] === null) {
        delete supabaseRecord[key];
      }
    });
    
    console.log('✅ Conversion complete');
    console.log('📋 Final record to upload:', Object.keys(supabaseRecord));
    return supabaseRecord;
  }
}

export default SupabaseSyncService;
