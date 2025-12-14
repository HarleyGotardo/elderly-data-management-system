const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
import router from '../app/Routes/web.js';

const fs = require('fs');
const initSqlJs = require('sql.js');

let dbPath;
let SQL;
let db;

// Initialize sql.js
async function initDatabase() {
  try {
    // Load sql.js
    SQL = await initSqlJs({
      locateFile: file => path.join(__dirname, '../node_modules/sql.js/dist', file)
    });
    console.log('sql.js loaded successfully');
  } catch (error) {
    console.error('Failed to load sql.js:', error);
    throw error;
  }
}

async function initializeDatabase() {
  try {
    // Initialize sql.js first
    await initDatabase();
    
    // Set database path based on environment
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // Use process.cwd() for development to get project root
      dbPath = path.join(process.cwd(), 'database', 'database.sqlite');
    } else {
      const userDataPath = app.getPath('userData');
      dbPath = path.join(userDataPath, 'database.sqlite');
      
      // Ensure directory exists
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }
    }
    
    // Load or create database
    if (fs.existsSync(dbPath)) {
      console.log('Loading existing database from:', dbPath);
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      console.log('Creating new database at:', dbPath);
      db = new SQL.Database();
      
      // Create tables
      db.run(`
        CREATE TABLE IF NOT EXISTS senior_citizens (
          id INTEGER PRIMARY KEY AUTOINCREMENT
        )
      `);
      
      // Save database to file
      const data = db.export();
      fs.writeFileSync(dbPath, data);
      console.log('Database created successfully');
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    console.error('Stack:', error.stack);
    // Don't throw - allow app to continue without database
  }
}

// Save database periodically
function saveDatabase() {
  if (db && dbPath) {
    try {
      const data = db.export();
      fs.writeFileSync(dbPath, data);
      console.log('Database saved');
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }
}

// Save database every 5 seconds
setInterval(saveDatabase, 5000);

const createWindow = async () => {
  // Initialize database before creating window
  await initializeDatabase();

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.cwd(), 'resources/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Pass database path to renderer
  ipcMain.handle('get-database-path', () => {
    return dbPath;
  });
};

// Create window when app is ready
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// IPC handler for API requests
ipcMain.handle('api-request', async (event, { method, path, body, query }) => {
  try {
    const request = {
      method,
      path,
      body,
      query: query || {}
    };

    const response = await router.handle(request);
    return response;
  } catch (error) {
    console.error('IPC API Error:', error);
    return {
      status: 500,
      data: { success: false, message: 'Internal server error' }
    };
  }
});

// IPC handlers for Supabase operations (delegate to renderer)
ipcMain.handle('supabase-check-connectivity', async (event, lguId) => {
  // Forward to renderer process
  event.sender.send('execute-supabase-operation', {
    operation: 'checkConnectivity',
    args: [lguId]
  });
  
  // Return a placeholder - actual result comes via IPC
  return { pending: true };
});

ipcMain.handle('supabase-upload', async (event, lguId, records) => {
  event.sender.send('execute-supabase-operation', {
    operation: 'uploadRecords',
    args: [lguId, records]
  });
  
  return { pending: true };
});

ipcMain.handle('supabase-download', async (event, lguId, lastSyncTime) => {
  event.sender.send('execute-supabase-operation', {
    operation: 'downloadUpdates',
    args: [lguId, lastSyncTime]
  });
  
  return { pending: true };
});

ipcMain.handle('supabase-stats', async (event, lguId) => {
  event.sender.send('execute-supabase-operation', {
    operation: 'getSyncStats',
    args: [lguId]
  });
  
  return { pending: true };
});
