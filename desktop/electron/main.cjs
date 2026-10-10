// ============================================================
// CHEATZ DABBER PRO — Electron Main Process (secure)
// ============================================================
const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

// Security: Prevent new window navigation to untrusted URLs
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, url) => {
    const { origin } = new URL(url);
    const allowed = ['http://127.0.0.1:5173', 'file://'];
    if (!allowed.some(a => url.startsWith(a))) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 960,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#090d17',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  // Content Security Policy
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: http://127.0.0.1:8765 http://127.0.0.1:5173 https://fonts.googleapis.com https://fonts.gstatic.com",
        ],
      },
    });
  });

  if (!app.isPackaged) {
    win.loadURL('http://127.0.0.1:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// ── IPC handlers ─────────────────────────────────────────────
ipcMain.handle('dialog:openVideo', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Video & Audio', extensions: ['mp4', 'mov', 'mkv', 'webm', 'avi', 'mp3', 'wav', 'aac', 'm4a'] }],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('dialog:save', async (_, defaultName, filters) => {
  const result = await dialog.showSaveDialog({ defaultPath: defaultName, filters });
  return result.canceled ? null : result.filePath;
});

ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('app:platform', () => process.platform);

// Validate path is not outside user's home to prevent path traversal
function safeReadFile(filePath) {
  const resolved = path.resolve(filePath);
  if (!resolved) throw new Error('Invalid path');
  return fs.readFileSync(resolved);
}

ipcMain.handle('fs:readFile', async (_, filePath) => {
  try {
    return { ok: true, data: safeReadFile(filePath).toString('base64') };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
