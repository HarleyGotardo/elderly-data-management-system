const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use process.cwd() for consistent database path in both CLI and Electron
const dbPath = path.join(process.cwd(), 'database', 'database.sqlite');

// Ensure database directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

module.exports = db;
