// Supabase operations in renderer process
import { getLGUClient, getSupabaseAdmin } from '../config/supabase.js';

class SupabaseRendererService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Check connectivity to Supabase
   */
  async checkConnectivity(lguId) {
    try {
      const supabase = await getLGUClient(lguId);
      const { data, error } = await supabase
        .from('lgu')
        .select('id')
        .limit(1);
      
      return {
        success: true,
        online: !error,
        message: error ? 'Connection failed' : 'Connected to Supabase',
        error: error?.message
      };
    } catch (err) {
      return {
        success: false,
        online: false,
        message: 'No internet connection',
        error: err.message
      };
    }
  }

  /**
   * Upload records to Supabase
   */
  async uploadRecords(lguId, records) {
    const results = [];
    
    try {
      const supabase = await getLGUClient(lguId);
      
      for (const record of records) {
        try {
          const { data, error } = await supabase
            .from('senior_citizens')
            .insert(record)
            .select()
            .single();
          
          results.push({
            localId: record.local_id,
            success: !error,
            supabaseId: data?.id,
            error: error?.message
          });
        } catch (err) {
          results.push({
            localId: record.local_id,
            success: false,
            error: err.message
          });
        }
      }
      
      return {
        success: true,
        uploaded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Download updates from Supabase
   */
  async downloadUpdates(lguId, lastSyncTime) {
    try {
      const supabase = await getLGUClient(lguId);
      
      const { data, error } = await supabase
        .from('senior_citizens')
        .select('*')
        .eq('lgu_id', lguId)
        .in('sync_status', ['APPROVED', 'DENIED', 'CLEAN'])
        .gt('updated_at', lastSyncTime);
      
      if (error) {
        throw error;
      }
      
      return {
        success: true,
        downloaded: data.length,
        records: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get sync statistics from Supabase
   */
  async getSyncStats(lguId) {
    try {
      const supabase = await getLGUClient(lguId);
      
      const { data, error } = await supabase
        .from('senior_citizens')
        .select('sync_status')
        .eq('lgu_id', lguId);
      
      if (error) {
        throw error;
      }
      
      const stats = data.reduce((acc, record) => {
        acc[record.sync_status] = (acc[record.sync_status] || 0) + 1;
        return acc;
      }, {});
      
      return {
        success: true,
        stats
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const supabaseRendererService = new SupabaseRendererService();

// Expose to window for IPC communication
window.supabaseRendererService = supabaseRendererService;

export default supabaseRendererService;
