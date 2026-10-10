// ============================================================
// CHEATZ DABBER PRO — Electron Preload (context bridge)
// ============================================================
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dabber', {
  openVideo:    ()                  => ipcRenderer.invoke('dialog:openVideo'),
  openFolder:   ()                  => ipcRenderer.invoke('dialog:openFolder'),
  saveDialog:   (name, filters)     => ipcRenderer.invoke('dialog:save', name, filters),
  getAppVersion: ()                 => ipcRenderer.invoke('app:version'),
  readFile:     (path)              => ipcRenderer.invoke('fs:readFile', path),
  platform:     process.platform,
});
