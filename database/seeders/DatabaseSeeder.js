const db = require('../config.js');
const bcrypt = require('bcryptjs');
const UserSeeder = require('./UserSeeder.js');
const SeniorCitizenSeeder = require('./SeniorCitizenSeeder.js');

class DatabaseSeeder {
  constructor() {
    this.seeders = [
      new UserSeeder(),
      new SeniorCitizenSeeder()
    ];
  }

  /**
   * Run all database seeders
   */
  async run() {
    console.log('\n🌱 Running Database Seeders...\n');
    
    try {
      for (const seeder of this.seeders) {
        await seeder.run();
        console.log(''); // Add spacing between seeders
      }
      
      console.log('✅ All seeders completed successfully!');
      console.log('\n📋 Login Credentials:');
      console.log('  Super Admin: superadmin / password123');
      console.log('  Admin: admin / password123');
      console.log('  Client: client / password123');
      
    } catch (error) {
      console.error('\n❌ Database seeding failed:', error);
      throw error;
    }
  }

  /**
   * Clear all seeded data
   */
  async clear() {
    console.log('\n🧹 Clearing Seeded Data...\n');
    
    try {
      // Clear in reverse order to respect foreign key constraints
      for (let i = this.seeders.length - 1; i >= 0; i--) {
        await this.seeders[i].clear();
      }
      
      console.log('✅ All seeded data cleared!');
    } catch (error) {
      console.error('\n❌ Failed to clear seeded data:', error);
      throw error;
    }
  }
}

module.exports = DatabaseSeeder;
