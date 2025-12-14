const fs = require('fs');
const path = require('path');
const db = require('./config');

class Migration {
  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
    this.ensureMigrationsTable();
  }

  ensureMigrationsTable() {
    const createTable = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        migration VARCHAR(255) NOT NULL,
        batch INTEGER NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    db.exec(createTable);
  }

  async createMigration(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = timestamp + '_' + name + '.js';
    const filepath = path.join(this.migrationsPath, filename);
    
    const template = 'const db = require(\'../config\');\n\nmodule.exports = {\n  async up() {\n    db.exec(\'CREATE TABLE IF NOT EXISTS example_table (id INTEGER PRIMARY KEY)\');\n  },\n  async down() {\n    db.exec(\'DROP TABLE IF EXISTS example_table\');\n  }\n};\n';

    fs.writeFileSync(filepath, template);
    console.log('Migration created: ' + filename);
    return filename;
  }

  async runMigrations() {
    const migrationFiles = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort();

    const executedMigrations = this.getExecutedMigrations();
    const pendingMigrations = migrationFiles.filter(file => !executedMigrations.includes(file));

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations.');
      return;
    }

    const batch = this.getNextBatchNumber();

    for (const file of pendingMigrations) {
      try {
        const migration = require(path.join(this.migrationsPath, file));
        
        console.log('Running migration: ' + file);
        await migration.up();

        const stmt = db.prepare('INSERT INTO migrations (migration, batch) VALUES (?, ?)');
        stmt.run(file, batch);

        console.log('Migration completed: ' + file);
      } catch (error) {
        console.error('Error running migration ' + file + ':', error);
        throw error;
      }
    }

    console.log('All migrations completed! Batch: ' + batch);
  }

  async rollbackLastBatch() {
    const lastBatch = this.getLastBatchNumber();
    
    if (!lastBatch) {
      console.log('No migrations to rollback.');
      return;
    }

    const migrationsToRollback = db.prepare('SELECT migration FROM migrations WHERE batch = ? ORDER BY migration DESC')
      .all(lastBatch);

    for (const row of migrationsToRollback) {
      const migrationName = row.migration;
      try {
        const migrationFile = path.join(this.migrationsPath, migrationName);
        if (fs.existsSync(migrationFile)) {
          const migration = require(migrationFile);
          
          console.log('Rolling back migration: ' + migrationName);
          await migration.down();

          const stmt = db.prepare('DELETE FROM migrations WHERE migration = ? AND batch = ?');
          stmt.run(migrationName, lastBatch);

          console.log('Migration rolled back: ' + migrationName);
        }
      } catch (error) {
        console.error('Error rolling back migration ' + migrationName + ':', error);
        throw error;
      }
    }

    console.log('Rollback completed for batch: ' + lastBatch);
  }

  getExecutedMigrations() {
    const rows = db.prepare('SELECT migration FROM migrations').all();
    return rows.map(row => row.migration);
  }

  getNextBatchNumber() {
    const result = db.prepare('SELECT MAX(batch) as max_batch FROM migrations').get();
    return result.max_batch ? result.max_batch + 1 : 1;
  }

  getLastBatchNumber() {
    const result = db.prepare('SELECT MAX(batch) as max_batch FROM migrations').get();
    return result.max_batch;
  }

  async reset() {
    const migrations = this.getExecutedMigrations();
    
    for (const migrationName of migrations.reverse()) {
      try {
        const migrationFile = path.join(this.migrationsPath, migrationName);
        if (fs.existsSync(migrationFile)) {
          const migration = require(migrationFile);
          
          console.log('Rolling back migration: ' + migrationName);
          await migration.down();
        }
      } catch (error) {
        console.error('Error rolling back migration ' + migrationName + ':', error);
      }
    }

    db.exec('DELETE FROM migrations');
    console.log('Database reset completed.');
  }
}

module.exports = Migration;
