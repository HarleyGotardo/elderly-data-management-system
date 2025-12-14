const db = require('./config.js');
const bcrypt = require('bcryptjs');
const DatabaseSeeder = require('./seeders/DatabaseSeeder');

/**
 * Auto-migration script that runs in Electron context
 * Behaves like Laravel's migrate:fresh --seed on first run
 */
async function runMigrations() {
  console.log('Running auto-migrations (fresh migrate + seed)...');
  
  try {
    let databaseWasCreated = false;
    
    // Check if users table exists
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    
    if (!tableInfo) {
      console.log('Database not found. Creating fresh database...');
      databaseWasCreated = true;
    } else {
      console.log('Existing database found. Fresh migration will be performed on first run only.');
      console.log('To reset database, run: npm run migrate:fresh');
      return;
    }
    
    // Drop all tables if we're doing a fresh migration
    if (databaseWasCreated) {
      console.log('Dropping existing tables...');
      db.exec('DROP TABLE IF EXISTS senior_citizens');
      db.exec('DROP TABLE IF EXISTS users');
      db.exec('DROP TABLE IF EXISTS seeders');
      db.exec('DROP TABLE IF EXISTS migrations');
    }
    
    // Create users table
    console.log('Creating users table...');
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('Client', 'Admin', 'Super Admin')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);
    
    // Create senior_citizens table using migration
    console.log('Creating senior_citizens table...');
    const migration = require('./migrations/2025-12-14T08-06-04_create_senior_citizens_table.js');
    await migration.up();
    
    // Run seeders
    console.log('\n🌱 Running seeders...');
    const seeder = new DatabaseSeeder();
    await seeder.run();
    
    console.log('\n✅ Fresh migration and seeding completed successfully!');
    console.log('\n📋 Default Login Credentials:');
    console.log('  Super Admin: superadmin / password123');
    console.log('  Admin: admin / password123');
    console.log('  Client: client / password123');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

module.exports = { runMigrations };
