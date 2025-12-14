const fs = require('fs');
const path = require('path');
const db = require('./config');

class Seeder {
  constructor() {
    this.seedersPath = path.join(__dirname, 'seeders');
    this.ensureSeedersTable();
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
    const seederFiles = fs.readdirSync(this.seedersPath)
      .filter(file => file.endsWith('.js'))
      .sort();

    const executedSeeders = this.getExecutedSeeders();
    const pendingSeeders = seederFiles.filter(file => !executedSeeders.includes(file));

    if (pendingSeeders.length === 0) {
      console.log('No pending seeders.');
      return;
    }

    for (const file of pendingSeeders) {
      try {
        const seeder = require(path.join(this.seedersPath, file));
        
        console.log('Running seeder: ' + file);
        await seeder.run();

        const stmt = db.prepare('INSERT INTO seeders (seeder) VALUES (?)');
        stmt.run(file);

        console.log('Seeder completed: ' + file);
      } catch (error) {
        console.error('Error running seeder ' + file + ':', error);
        throw error;
      }
    }

    console.log('All seeders completed!');
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
