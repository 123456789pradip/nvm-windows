const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow = null;
let projWindow = null;
let projFull = false;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1360, height: 820,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));
}

function createProjectorWindow() {
  if (projWindow && !projWindow.isDestroyed()) {
    projWindow.focus();
    return;
  }

  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  let target = displays.find(d => d.id !== primary.id) || primary;
  const { x, y, width, height } = target.bounds;

  projWindow = new BrowserWindow({
    x, y, width, height,
    fullscreen: false,
    frame: false,
    backgroundColor: '#07163b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  projWindow.loadFile(path.join(__dirname, 'app', 'projector.html'));

  projWindow.on('closed', () => { projWindow = null; projFull = false; });
}

app.whenReady().then(() => {
  createMainWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers
ipcMain.handle('open-projector', () => {
  createProjectorWindow();
  return true;
});

ipcMain.handle('close-projector', () => {
  if (projWindow && !projWindow.isDestroyed()) projWindow.close();
  return true;
});

ipcMain.handle('projector-toggle-fullscreen', () => {
  if (!projWindow || projWindow.isDestroyed()) return { ok: false, msg: 'Projector not opened' };
  projFull = !projFull;
  projWindow.setFullScreen(projFull);
  return { ok: true, full: projFull };
});

ipcMain.on('projector-send-data', (ev, data) => {
  if (projWindow && !projWindow.isDestroyed()) {
    projWindow.webContents.send('projector-data', data);
  }
});

ipcMain.on('projector-action', (ev, action) => {
  if (projWindow && !projWindow.isDestroyed()) {
    projWindow.webContents.send('projector-action', action);
  }
});
