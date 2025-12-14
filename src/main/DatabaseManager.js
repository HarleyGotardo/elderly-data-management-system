const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

class DatabaseManager {
  constructor() {
    // Handle both development and production environments
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // Development: use project database
      this.dbPath = path.join(__dirname, '../../database/database.sqlite');
    } else {
      // Production: use user data directory
      // We'll set this in initialize() after app is available
      this.dbPath = null;
    }
    
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Set path if not set (for production)
      if (!this.dbPath) {
        const { app } = require('electron');
        this.dbPath = path.join(app.getPath('userData'), 'database.sqlite');
      }

      // Ensure directory exists
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Check if database exists
      if (!fs.existsSync(this.dbPath)) {
        console.log('Database not found, creating new database...');
        
        // Create database with schema
        const db = new Database(this.dbPath);
        
        // Run migrations
        await this.runMigrations(db);
        
        // Run seeders
        await this.runSeeders(db);
        
        db.close();
        console.log('Database initialized successfully');
      } else {
        console.log('Database exists, using existing database');
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async runMigrations(db) {
    console.log('Running migrations...');
    
    // Create migrations table
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        migration VARCHAR(255) NOT NULL,
        batch INTEGER NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get migration files
    const migrationsPath = path.join(__dirname, '../../database/migrations');
    if (!fs.existsSync(migrationsPath)) {
      console.log('Migrations directory not found, skipping migrations');
      return;
    }

    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort();

    // Run each migration
    for (const file of migrationFiles) {
      const migrationName = file.replace('.js', '');
      
      // Check if migration already ran
      const existing = db.prepare('SELECT * FROM migrations WHERE migration = ?').get(migrationName);
      
      if (!existing) {
        console.log(`Running migration: ${migrationName}`);
        try {
          const migration = require(path.join(migrationsPath, file));
          
          if (migration.up) {
            migration.up(db);
          }
          
          // Record migration
          db.prepare('INSERT INTO migrations (migration, batch) VALUES (?, ?)').run(migrationName, 1);
        } catch (err) {
          console.error(`Failed to run migration ${migrationName}:`, err);
        }
      }
    }
  }

  async runSeeders(db) {
    console.log('Running seeders...');
    
    // Get seeder files
    const seedersPath = path.join(__dirname, '../../database/seeders');
    if (!fs.existsSync(seedersPath)) {
      console.log('Seeders directory not found, skipping seeders');
      return;
    }

    const seederFiles = fs.readdirSync(seedersPath)
      .filter(file => file.endsWith('.js'))
      .sort();

    // Run each seeder
    for (const file of seederFiles) {
      if (file === 'DatabaseSeeder.js') {
        console.log(`Running seeder: ${file}`);
        try {
          const seeder = require(path.join(seedersPath, file));
          
          if (seeder.run) {
            seeder.run(db);
          }
        } catch (err) {
          console.error(`Failed to run seeder ${file}:`, err);
        }
      }
    }
  }

  getConnection() {
    if (!this.initialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return new Database(this.dbPath);
  }

  getDatabasePath() {
    return this.dbPath;
  }
}

module.exports = DatabaseManager;
