const { contextBridge, ipcRenderer } = require('electron');

// Expõe APIs seguras para o renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Menu actions
  onSyncCustomers: (callback) => ipcRenderer.on('sync-customers', callback),
  onNewSale: (callback) => ipcRenderer.on('new-sale', callback),
  onSearchSales: (callback) => ipcRenderer.on('search-sales', callback),
  onManageInventory: (callback) => ipcRenderer.on('manage-inventory', callback),
  onShowDashboard: (callback) => ipcRenderer.on('show-dashboard', callback),
  
  // Dialog actions
  showDialog: (options) => ipcRenderer.invoke('show-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // App info
  getVersion: () => process.env.npm_package_version,
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Expõe informações de ambiente de desenvolvimento
contextBridge.exposeInMainWorld('isDev', process.argv.includes('--dev'));