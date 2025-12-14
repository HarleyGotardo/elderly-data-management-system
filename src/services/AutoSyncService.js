const EventEmitter = require('events');
const SyncQueue = require('./SyncQueue');
const USBExportService = require('./USBExportService');
const USBImportService = require('./USBImportService');

class AutoSyncService extends EventEmitter {
  constructor(db, lguId, apiClient) {
    super();
    this.db = db;
    this.lguId = lguId;
    this.apiClient = apiClient; // HTTP client for online sync
    this.syncQueue = new SyncQueue(db);
    this.exportService = new USBExportService(db, lguId);
    this.importService = new USBImportService(db, lguId);
    
    // Configuration
    this.config = {
      autoSyncInterval: 5 * 60 * 1000, // 5 minutes
      retryInterval: 30 * 1000, // 30 seconds
      maxRetries: 3,
      batchSize: 50,
      enableAutoSync: true,
      enableBackgroundSync: true
    };
    
    // State
    this.isRunning = false;
    this.syncTimer = null;
    this.retryTimer = null;
    this.lastSyncTime = null;
    this.syncStats = {
      totalUploads: 0,
      totalDownloads: 0,
      lastUploadCount: 0,
      lastDownloadCount: 0,
      errors: []
    };
    
    // Bind methods
    this.startAutoSync = this.startAutoSync.bind(this);
    this.stopAutoSync = this.stopAutoSync.bind(this);
    this.performSync = this.performSync.bind(this);
  }

  /**
   * Start the auto-sync service
   */
  start() {
    if (this.isRunning) {
      console.log('AutoSync service is already running');
      return;
    }

    console.log('Starting AutoSync service...');
    this.isRunning = true;
    
    // Start periodic sync
    if (this.config.enableAutoSync) {
      this.syncTimer = setInterval(this.performSync, this.config.autoSyncInterval);
      
      // Perform initial sync after a short delay
      setTimeout(this.performSync, 5000);
    }
    
    // Monitor online/offline status
    this.setupNetworkMonitoring();
    
    this.emit('started');
  }

  /**
   * Stop the auto-sync service
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping AutoSync service...');
    this.isRunning = false;
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    
    this.removeNetworkMonitoring();
    this.emit('stopped');
  }

  /**
   * Perform sync operation
   */
  async performSync() {
    if (!this.isRunning || !navigator.onLine) {
      return;
    }

    try {
      console.log('Performing sync operation...');
      this.emit('syncStarted');
      
      // Upload pending records
      const uploadResult = await this.uploadPendingRecords();
      
      // Download status updates
      const downloadResult = await this.downloadUpdates();
      
      // Update stats
      this.updateSyncStats(uploadResult, downloadResult);
      
      this.lastSyncTime = new Date();
      
      this.emit('syncCompleted', {
        uploads: uploadResult,
        downloads: downloadResult,
        timestamp: this.lastSyncTime
      });
      
    } catch (error) {
      console.error('Sync error:', error);
      this.syncStats.errors.push({
        timestamp: new Date(),
        error: error.message
      });
      
      this.emit('syncError', error);
      
      // Schedule retry
      this.scheduleRetry();
    }
  }

  /**
   * Upload pending records to server
   */
  async uploadPendingRecords() {
    const pendingItems = this.syncQueue.getPendingItems('UPLOAD', this.config.batchSize);
    
    if (pendingItems.length === 0) {
      return { uploaded: 0, errors: [] };
    }

    console.log(`Uploading ${pendingItems.length} pending records...`);
    
    const results = {
      uploaded: 0,
      errors: []
    };

    // Group records by type for batch upload
    const recordIds = pendingItems.map(item => item.record_id);
    
    try {
      // Get full records
      const placeholders = recordIds.map(() => '?').join(',');
      const stmt = this.db.prepare(`
        SELECT * FROM senior_citizens
        WHERE id IN (${placeholders})
        AND lgu_id = ?
      `);
      
      const records = stmt.all(...recordIds, this.lguId);
      
      // Upload to server
      const response = await this.apiClient.post('/api/sync/upload', {
        lgu_id: this.lguId,
        records: records
      });
      
      if (response.data.success) {
        // Mark items as completed
        for (const item of pendingItems) {
          await this.syncQueue.markAsCompleted(item.id);
          results.uploaded++;
        }
        
        // Update local records status
        await this.updateLocalRecordsStatus(recordIds, 'UPLOADED');
        
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
      
    } catch (error) {
      // Mark items as failed
      for (const item of pendingItems) {
        await this.syncQueue.markAsFailed(item.id, error.message);
        results.errors.push({
          record_id: item.record_id,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Download updates from server
   */
  async downloadUpdates() {
    try {
      // Get last sync timestamp
      const lastSync = this.getLastSyncTimestamp();
      
      const response = await this.apiClient.get('/api/sync/updates', {
        params: {
          lgu_id: this.lguId,
          since: lastSync
        }
      });
      
      if (!response.data.success || !response.data.updates) {
        return { downloaded: 0, errors: [] };
      }
      
      const updates = response.data.updates;
      console.log(`Downloading ${updates.length} updates...`);
      
      // Process updates
      const importService = new USBImportService(this.db, this.lguId);
      
      // Convert to import format
      const importData = {
        type: 'STATUS_UPDATE',
        version: '1.0',
        batch_id: `AUTO-${Date.now()}`,
        lgu_id: this.lguId,
        updates: updates,
        generated_at: new Date().toISOString()
      };
      
      const result = await importService.processStatusUpdates(importData);
      
      // Update last sync timestamp
      this.updateLastSyncTimestamp(response.data.timestamp);
      
      return {
        downloaded: result.updated,
        errors: result.errors
      };
      
    } catch (error) {
      console.error('Download error:', error);
      return { downloaded: 0, errors: [{ error: error.message }] };
    }
  }

  /**
   * Update local records status
   * @param {Array} recordIds - Record IDs to update
   * @param {string} status - New status
   */
  async updateLocalRecordsStatus(recordIds, status) {
    if (recordIds.length === 0) return;
    
    const placeholders = recordIds.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      UPDATE senior_citizens
      SET sync_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
    `);
    
    stmt.run(status, ...recordIds);
  }

  /**
   * Get last sync timestamp
   */
  getLastSyncTimestamp() {
    const stmt = this.db.prepare(`
      SELECT MAX(created_at) as last_sync FROM sync_log
      WHERE lgu_id = ? AND direction = 'OUTBOUND'
    `);
    
    const result = stmt.get(this.lguId);
    return result ? result.last_sync : null;
  }

  /**
   * Update last sync timestamp
   * @param {string} timestamp - Server timestamp
   */
  updateLastSyncTimestamp(timestamp) {
    // Store in app settings or a sync config table
    // For now, we'll use the sync_log table
  }

  /**
   * Schedule retry for failed sync
   */
  scheduleRetry() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    
    this.retryTimer = setTimeout(async () => {
      console.log('Retrying failed sync operations...');
      
      // Retry failed items
      const retried = await this.syncQueue.retryFailedItems(this.config.maxRetries);
      
      if (retried > 0) {
        await this.performSync();
      }
    }, this.config.retryInterval);
  }

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring() {
    this.onlineHandler = () => {
      console.log('Network connection restored');
      this.emit('online');
      // Trigger sync immediately when coming online
      setTimeout(this.performSync, 1000);
    };
    
    this.offlineHandler = () => {
      console.log('Network connection lost');
      this.emit('offline');
    };
    
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
  }

  /**
   * Remove network monitoring
   */
  removeNetworkMonitoring() {
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
    }
    if (this.offlineHandler) {
      window.removeEventListener('offline', this.offlineHandler);
    }
  }

  /**
   * Update sync statistics
   * @param {Object} uploadResult - Upload result
   * @param {Object} downloadResult - Download result
   */
  updateSyncStats(uploadResult, downloadResult) {
    this.syncStats.totalUploads += uploadResult.uploaded;
    this.syncStats.totalDownloads += downloadResult.downloaded;
    this.syncStats.lastUploadCount = uploadResult.uploaded;
    this.syncStats.lastDownloadCount = downloadResult.downloaded;
    
    // Keep only last 10 errors
    if (this.syncStats.errors.length > 10) {
      this.syncStats.errors = this.syncStats.errors.slice(-10);
    }
  }

  /**
   * Get current sync status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isOnline: navigator.onLine,
      lastSyncTime: this.lastSyncTime,
      nextSyncTime: this.syncTimer ? new Date(Date.now() + this.config.autoSyncInterval) : null,
      stats: this.syncStats,
      queueStats: this.syncQueue.getSyncStats(this.lguId)
    };
  }

  /**
   * Force sync now
   */
  async forceSync() {
    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline');
    }
    
    await this.performSync();
  }

  /**
   * Export to USB (manual trigger)
   * @param {Object} options - Export options
   */
  async exportToUSB(options = {}) {
    return await this.exportService.exportToUSB(options);
  }

  /**
   * Import from USB (manual trigger)
   * @param {string} filepath - Path to import file
   * @param {string} password - Optional password
   */
  async importFromUSB(filepath, password = null) {
    const result = await this.importService.importFromUSB(filepath, password);
    
    // Trigger sync after import to update server
    if (navigator.onLine && this.isRunning) {
      setTimeout(this.performSync, 2000);
    }
    
    return result;
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Restart sync service if interval changed
    if (newConfig.autoSyncInterval && this.isRunning) {
      if (this.syncTimer) {
        clearInterval(this.syncTimer);
      }
      this.syncTimer = setInterval(this.performSync, this.config.autoSyncInterval);
    }
  }
}

export default AutoSyncService;

module.exports = AutoSyncService;
