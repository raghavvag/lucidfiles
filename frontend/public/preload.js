const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFiles: () => ipcRenderer.invoke('select-files'),
  
  // You can add more IPC methods here as needed
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  
  // Platform info
  platform: process.platform,
  
  // App version info  
  getVersion: () => ipcRenderer.invoke('get-version')
});

// Expose a simple API for React to use
contextBridge.exposeInMainWorld('api', {
  // Backend communication methods will go here
  search: (query) => {
    // This will communicate with your Node.js backend
    return fetch('http://localhost:3001/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    }).then(res => res.json());
  },
  
  addFolder: (folderPath) => {
    return fetch('http://localhost:3001/add-folder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ folderPath })
    }).then(res => res.json());
  }
});
