const db = require('../config');
const bcrypt = require('bcryptjs');

/**
 * Migration: Create users table with authentication fields
 */
exports.up = function() {
  // Drop existing users table if it exists with different schema
  db.exec('DROP TABLE IF EXISTS users');
  
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('Client', 'Admin', 'Super Admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create index on username for faster lookups
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    
    -- Create index on role for filtering
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  `);

  // Create a default Super Admin user
  const defaultPassword = 'admin123';
  const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
  
  const stmt = db.prepare(`
    INSERT INTO users (username, password_hash, role) 
    VALUES (?, ?, ?)
  `);
  
  stmt.run('admin', hashedPassword, 'Super Admin');
  
  console.log('Users table created with default Super Admin user:');
  console.log('Username: admin');
  console.log('Password: admin123');
};

exports.down = function() {
  db.exec('DROP TABLE IF EXISTS users');
};
