const { app, BrowserWindow, Menu, ipcMain, dialog, session } = require('electron');
const path = require('path');
const isDev = process.argv.includes('--dev');

let mainWindow;

function createWindow() {
  // Configuração de sessão para permitir conexões Firebase
  const ses = session.defaultSession;

  // Permite recursos externos (Firebase)
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['notifications'];
    callback(allowedPermissions.includes(permission));
  });

  // Configurações de segurança para Firebase
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = 'Chrome';
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  ses.webRequest.onHeadersReceived((details, callback) => {
    callback({
      cancel: false,
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseio.com https://*.googleapis.com https://*.gstatic.com https://www.gstatic.com https://*.google.com https://fonts.googleapis.com https://fonts.gstatic.com; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseio.com https://*.googleapis.com https://www.gstatic.com; " +
          "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.google.com wss://*.firebaseio.com; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "font-src 'self' https://fonts.gstatic.com; " +
          "img-src 'self' data: https:;"
        ]
      }
    });
  });

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    title: 'Sales Manager - Garagem 67',
    show: false
  });

  // Carregar a aplicação
  mainWindow.loadFile(path.join(__dirname, '../public/index.html'));

  // Mostrar janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Criar menu personalizado
  createApplicationMenu();
}

function createApplicationMenu() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Sincronizar Clientes',
          accelerator: 'Ctrl+S',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('sync-customers');
            }
          }
        },
        {
          label: 'Exportar Relatório',
          accelerator: 'Ctrl+E',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('export-report');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Recarregar',
          accelerator: 'Ctrl+R',
          click: () => {
            if (mainWindow) {
              mainWindow.reload();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Vendas',
      submenu: [
        {
          label: 'Nova Venda',
          accelerator: 'Ctrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('new-sale');
            }
          }
        }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Sobre',
              message: 'Sales Manager - Garagem 67',
              detail: `Sistema de gerenciamento de vendas e estoque\nVersão ${app.getVersion()}\n\nIntegrado com:\n• Garagem67 Website\n• Entregador67 System`
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Eventos do IPC
ipcMain.handle('show-dialog', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

// Eventos do aplicativo
app.whenReady().then(() => {
  console.log('🚀 Iniciando Sales Manager - Garagem 67...');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Prevenir múltiplas instâncias
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}