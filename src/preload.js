// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

// Expose API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  request: (options) => {
    // Convert fetch-style options to IPC format
    const url = new URL(options.url, 'http://localhost');
    return ipcRenderer.invoke('api-request', {
      method: options.method || 'GET',
      path: url.pathname + url.search,
      body: options.body,
      query: Object.fromEntries(url.searchParams)
    });
  },
  
  // Supabase operations (renderer-side)
  supabase: {
    checkConnectivity: (lguId) => ipcRenderer.invoke('supabase-check-connectivity', lguId),
    uploadRecords: (lguId, records) => ipcRenderer.invoke('supabase-upload', lguId, records),
    downloadUpdates: (lguId, lastSyncTime) => ipcRenderer.invoke('supabase-download', lguId, lastSyncTime),
    getSyncStats: (lguId) => ipcRenderer.invoke('supabase-stats', lguId)
  },
  
  // Database operations
  database: {
    migrate: () => ipcRenderer.invoke('db-migrate'),
    seed: () => ipcRenderer.invoke('db-seed'),
    fresh: () => ipcRenderer.invoke('db-fresh'),
    rollback: () => ipcRenderer.invoke('db-rollback'),
    reset: () => ipcRenderer.invoke('db-reset')
  }
});
