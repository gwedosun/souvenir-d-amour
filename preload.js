const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
    loadDates: () => ipcRenderer.invoke('read-dates'),
    saveDates: (data) => ipcRenderer.invoke('write-dates', data)
});