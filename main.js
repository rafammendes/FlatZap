const { app, BrowserWindow, session, shell } = require('electron');
const path = require('path');

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      const url = commandLine.find(arg => arg.startsWith('whatsapp://'));
      if (url) {
        handleUrl(mainWindow, url);
      }
    }
  });

  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('whatsapp', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('whatsapp');
  }

  app.whenReady().then(async () => {
    await createWindow();

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.setAppUserModelId('com.flatzap.app');

function handleUrl(win, url) {
  if (url && url.startsWith('whatsapp://')) {
    const newUrl = url.replace('whatsapp://', 'https://web.whatsapp.com/');
    win.loadURL(newUrl);
  }
}

async function createWindow() {
  const customSession = session.fromPartition('persist:whatsapp');

  customSession.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  customSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'notifications') {
      callback(true);
    } else {
      callback(false);
    }
  });

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      session: customSession,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith('https://web.whatsapp.com/')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  try {
    const startUrl = process.argv.find(arg => arg.startsWith('whatsapp://'));
    if (startUrl) {
      handleUrl(mainWindow, startUrl);
    } else {
      await mainWindow.loadURL('https://web.whatsapp.com/');
    }
  } catch (error) {
    console.error('Falha ao carregar a URL do WhatsApp:', error);
  }
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});