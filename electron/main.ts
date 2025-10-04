import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
    icon: path.join(__dirname, '../build/icon.png'),
    title: 'MedExtract - Clinical Data Extraction',
    backgroundColor: '#0F172A',
    show: false, // Show after ready-to-show event
  });

  // Graceful window display
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
}

// App ready
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for secure file operations

// Open PDF file dialog
ipcMain.handle('dialog:openPDF', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    title: 'Select PDF File'
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const fileName = path.basename(filePath);
    
    return {
      name: fileName,
      path: filePath,
      data: base64Data,
      size: fileBuffer.length
    };
  } catch (error) {
    console.error('Error reading PDF file:', error);
    return null;
  }
});

// Save data export
ipcMain.handle('dialog:saveFile', async (_event, data: { content: string; defaultName: string; filterName: string; extensions: string[] }) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: 'Save File',
    defaultPath: data.defaultName,
    filters: [
      { name: data.filterName, extensions: data.extensions },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled || !result.filePath) {
    return { success: false };
  }

  try {
    // Convert base64 if needed (for Excel files)
    if (data.content.startsWith('data:')) {
      const base64Data = data.content.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(result.filePath, buffer);
    } else {
      fs.writeFileSync(result.filePath, data.content, 'utf8');
    }
    
    return { success: true, path: result.filePath };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: String(error) };
  }
});

// Read local file
ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  try {
    const data = fs.readFileSync(filePath);
    return { success: true, data: data.toString('base64') };
  } catch (error) {
    console.error('Error reading file:', error);
    return { success: false, error: String(error) };
  }
});

// Get app version
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

// Security: CSP for production
if (!isDev) {
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      // Only allow navigation within the app
      if (parsedUrl.origin !== 'file://') {
        event.preventDefault();
      }
    });
  });
}
