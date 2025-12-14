const fs = require('fs');
const path = require('path');
const dbPromise = require('./config');
const DatabaseSeeder = require('./seeders/DatabaseSeeder');

class Seeder {
  constructor() {
    this.seedersPath = path.join(__dirname, 'seeders');
    this.databaseSeeder = new DatabaseSeeder();
  }

  async ensureSeedersTable() {
    const db = await dbPromise;
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
    
    const template = 'import dbPromise from \'../config.js\';\n\nexport default {\n  async run() {\n    const db = await dbPromise;\n    console.log(\'Seeder executed\');\n  }\n};\n';

    fs.writeFileSync(filepath, template);
    console.log('Seeder created: ' + filename);
    return filename;
  }

  async runSeeders() {
    await this.ensureSeedersTable();
    // Check if DatabaseSeeder has been run
    const executedSeeders = await this.getExecutedSeeders();
    if (executedSeeders.includes('DatabaseSeeder')) {
      console.log('DatabaseSeeder already executed. Use seeder:reset to run again.');
      return;
    }

    try {
      console.log('Running DatabaseSeeder...');
      await this.databaseSeeder.run();
      
      // Mark as executed
      const db = await dbPromise;
      const stmt = db.prepare('INSERT INTO seeders (seeder) VALUES (?)');
      stmt.run('DatabaseSeeder');
      
      console.log('DatabaseSeeder completed successfully!');
    } catch (error) {
      console.error('Error running DatabaseSeeder:', error);
      throw error;
    }
  }

  async getExecutedSeeders() {
    const db = await dbPromise;
    const rows = db.prepare('SELECT seeder FROM seeders').all();
    return rows.map(row => row.seeder);
  }

  async reset() {
    const db = await dbPromise;
    db.exec('DELETE FROM seeders');
    console.log('Seeders reset completed.');
  }
}

module.exports = Seeder;
