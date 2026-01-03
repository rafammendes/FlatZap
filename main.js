const { app, BrowserWindow, session } = require('electron');

async function createWindow() {
  const customSession = session.fromPartition('persist:whatsapp');

  customSession.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      session: customSession
    }
  });

  try {
    await mainWindow.loadURL('https://web.whatsapp.com/');
  } catch (error) {
    console.error('Falha ao carregar a URL do WhatsApp:', error);
  }
}

app.whenReady().then(async () => {
  await createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
