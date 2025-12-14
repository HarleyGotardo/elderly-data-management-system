const fs = require('fs');
const path = require('path');
const db = require('./config');
const DatabaseSeeder = require('./seeders/DatabaseSeeder');

class Seeder {
  constructor() {
    this.seedersPath = path.join(__dirname, 'seeders');
    this.ensureSeedersTable();
    this.databaseSeeder = new DatabaseSeeder();
  }

  ensureSeedersTable() {
    const createTable = `
      CREATE TABLE IF NOT EXISTS seeders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seeder VARCHAR(255) NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    db.exec(createTable);
  }

  async createSeeder(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = timestamp + '_' + name + '.js';
    const filepath = path.join(this.seedersPath, filename);
    
    const template = 'const db = require(\'../config\');\n\nmodule.exports = {\n  async run() {\n    console.log(\'Seeder executed\');\n  }\n};\n';

    fs.writeFileSync(filepath, template);
    console.log('Seeder created: ' + filename);
    return filename;
  }

  async runSeeders() {
    // Check if DatabaseSeeder has been run
    const executedSeeders = this.getExecutedSeeders();
    if (executedSeeders.includes('DatabaseSeeder')) {
      console.log('DatabaseSeeder already executed. Use seeder:reset to run again.');
      return;
    }

    try {
      console.log('Running DatabaseSeeder...');
      await this.databaseSeeder.run();
      
      // Mark as executed
      const stmt = db.prepare('INSERT INTO seeders (seeder) VALUES (?)');
      stmt.run('DatabaseSeeder');
      
      console.log('DatabaseSeeder completed successfully!');
    } catch (error) {
      console.error('Error running DatabaseSeeder:', error);
      throw error;
    }
  }

  getExecutedSeeders() {
    const rows = db.prepare('SELECT seeder FROM seeders').all();
    return rows.map(row => row.seeder);
  }

  async reset() {
    db.exec('DELETE FROM seeders');
    console.log('Seeders reset completed.');
  }
}

module.exports = Seeder;
