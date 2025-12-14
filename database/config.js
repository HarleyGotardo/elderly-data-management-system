const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const DatabaseWrapper = require('./wrapper');

// Use process.cwd() for consistent database path in both CLI and Electron
const dbPath = path.join(process.cwd(), 'database', 'database.sqlite');

// Ensure database directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

let wrappedDb = null;
let dbPromise = null;

// Initialize database asynchronously
async function initDb() {
  if (wrappedDb) return wrappedDb;
  
  const SQL = await initSqlJs();
  
  let sqlDb;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(buffer);
  } else {
    sqlDb = new SQL.Database();
  }
  
  // Wrap sql.js database with better-sqlite3 compatible API
  wrappedDb = new DatabaseWrapper(sqlDb, dbPath);
  
  // Enable foreign keys
  wrappedDb.pragma('foreign_keys = ON');
  
  return wrappedDb;
}

// Start initialization immediately
dbPromise = initDb();

// Export the promise for both CommonJS and ES6
module.exports = dbPromise;
module.exports.default = dbPromise;
