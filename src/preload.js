// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

// Expose API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  request: (options) => ipcRenderer.invoke('api-request', options),
  
  // Database operations
  database: {
    migrate: () => ipcRenderer.invoke('db-migrate'),
    seed: () => ipcRenderer.invoke('db-seed'),
    fresh: () => ipcRenderer.invoke('db-fresh'),
    rollback: () => ipcRenderer.invoke('db-rollback'),
    reset: () => ipcRenderer.invoke('db-reset')
  }
});
