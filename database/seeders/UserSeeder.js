const dbPromise = require('../config.js');
const bcrypt = require('bcryptjs');

class UserSeeder {
  /**
   * Run the database seeder
   */
  async run() {
    console.log('Seeding users...');
    
    try {
      const db = await dbPromise;
      // Clear existing users (optional - comment out if you want to keep existing)
      db.exec('DELETE FROM users');
      console.log('Cleared existing users');
      
      // Seed users
      const users = [
        {
          username: 'superadmin',
          password: 'password123',
          role: 'Super Admin'
        },
        {
          username: 'admin',
          password: 'password123',
          role: 'Admin'
        },
        {
          username: 'client',
          password: 'password123',
          role: 'Client'
        }
      ];
      
      const stmt = db.prepare(`
        INSERT INTO users (username, password_hash, role) 
        VALUES (?, ?, ?)
      `);
      
      users.forEach(user => {
        const hashedPassword = bcrypt.hashSync(user.password, 10);
        stmt.run(user.username, hashedPassword, user.role);
        console.log(`✓ Created user: ${user.username} (${user.role})`);
      });
      
      console.log('\n✅ User seeding completed!');
      console.log('\n📋 Login Credentials:');
      console.log('  Super Admin: superadmin / password123');
      console.log('  Admin: admin / password123');
      console.log('  Client: client / password123');
      
    } catch (error) {
      console.error('❌ User seeding failed:', error);
      throw error;
    }
  }
  
  /**
   * Clear all users
   */
  async clear() {
    console.log('Clearing users...');
    const db = await dbPromise;
    db.exec('DELETE FROM users');
    console.log('✓ All users cleared');
  }
}

// Run if called directly
if (require.main === module) {
  const seeder = new UserSeeder();
  seeder.run()
    .then(() => {
      console.log('\n✨ Users seeded successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = UserSeeder;
