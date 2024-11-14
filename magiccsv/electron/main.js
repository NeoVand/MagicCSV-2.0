const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { platform } = require('os');

let mainWindow = null;
let ollamaProcess = null;

async function checkOllamaRunning() {
  try {
    const response = await fetch('http://localhost:11434/api/version');
    return response.ok;
  } catch {
    return false;
  }
}

async function startOllama() {
  const isRunning = await checkOllamaRunning();
  if (!isRunning) {
    const ollamaPath = platform() === 'darwin' ? '/usr/local/bin/ollama' : 'ollama';
    ollamaProcess = spawn(ollamaPath, ['serve'], {
      detached: false
    });

    ollamaProcess.on('error', (err) => {
      console.error('Failed to start Ollama:', err);
    });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Only during development
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  await startOllama();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (ollamaProcess) {
      ollamaProcess.kill();
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});