const db = require('./config.js');
const bcrypt = require('bcryptjs');

/**
 * Fresh migration - drops all tables and recreates them with seed data
 */
async function migrateFresh() {
  console.log('Running fresh migration...');
  
  try {
    // Drop all tables
    console.log('Dropping existing tables...');
    db.exec(`
      DROP TABLE IF EXISTS senior_citizens;
      DROP TABLE IF EXISTS users;
    `);
    
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
      
      CREATE INDEX idx_users_username ON users(username);
      CREATE INDEX idx_users_role ON users(role);
    `);
    
    // Create senior_citizens table
    console.log('Creating senior_citizens table...');
    db.exec(`
      CREATE TABLE senior_citizens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        osca_id TEXT UNIQUE,
        philhealth_id TEXT,
        last_name TEXT NOT NULL,
        first_name TEXT NOT NULL,
        middle_name TEXT,
        name_extension TEXT,
        birth_date DATE,
        age INTEGER,
        sex TEXT CHECK(sex IN ('Male', 'Female')),
        civil_status TEXT,
        house_no_street TEXT,
        barangay TEXT,
        city_municipality TEXT,
        province TEXT,
        region TEXT,
        contact_no TEXT,
        email TEXT,
        pension_type TEXT,
        pension_amount REAL,
        is_ip BOOLEAN DEFAULT 0,
        ip_group TEXT,
        is_pwd BOOLEAN DEFAULT 0,
        pwd_id TEXT,
        lgu_id INTEGER,
        status TEXT DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'PENDING_ADMIN_REVIEW', 'CLEAN', 'DUPLICATE', 'SUSPECTED', 'APPROVED', 'HOLD', 'DENIED')),
        submitted_at DATETIME,
        submitted_by INTEGER,
        approved_at DATETIME,
        approved_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (submitted_by) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      );
      
      CREATE INDEX idx_senior_citizens_status ON senior_citizens(status);
      CREATE INDEX idx_senior_citizens_lgu ON senior_citizens(lgu_id);
      CREATE INDEX idx_senior_citizens_osca ON senior_citizens(osca_id);
    `);
    
    // Seed users
    console.log('Seeding users...');
    const users = [
      { username: 'admin', password: 'admin123', role: 'Super Admin' },
      { username: 'admin2', password: 'admin123', role: 'Admin' },
      { username: 'client1', password: 'client123', role: 'Client' },
      { username: 'client2', password: 'client123', role: 'Client' }
    ];
    
    const userStmt = db.prepare(`
      INSERT INTO users (username, password_hash, role) 
      VALUES (?, ?, ?)
    `);
    
    users.forEach(user => {
      const hashedPassword = bcrypt.hashSync(user.password, 10);
      userStmt.run(user.username, hashedPassword, user.role);
      console.log(`  Created user: ${user.username} (${user.role})`);
    });
    
    // Seed sample senior citizens
    console.log('Seeding sample senior citizens...');
    const seniorCitizens = [
      {
        osca_id: 'SC-001',
        philhealth_id: 'PH-001',
        last_name: 'Dela Cruz',
        first_name: 'Juan',
        middle_name: 'Santos',
        birth_date: '1950-01-15',
        age: 74,
        sex: 'Male',
        civil_status: 'Married',
        house_no_street: '123 Rizal Street',
        barangay: 'Barangay 1',
        city_municipality: 'Sample City',
        province: 'Sample Province',
        region: 'NCR',
        contact_no: '09123456789',
        email: 'juan.delacruz@email.com',
        pension_type: 'Government',
        pension_amount: 5000,
        is_ip: 0,
        is_pwd: 0,
        lgu_id: 1,
        status: 'APPROVED'
      },
      {
        osca_id: 'SC-002',
        philhealth_id: 'PH-002',
        last_name: 'Reyes',
        first_name: 'Maria',
        middle_name: 'Garcia',
        birth_date: '1955-03-20',
        age: 69,
        sex: 'Female',
        civil_status: 'Widow',
        house_no_street: '456 Mabini Avenue',
        barangay: 'Barangay 2',
        city_municipality: 'Sample City',
        province: 'Sample Province',
        region: 'NCR',
        contact_no: '09876543210',
        email: 'maria.reyes@email.com',
        pension_type: 'Private',
        pension_amount: 3000,
        is_ip: 0,
        is_pwd: 1,
        pwd_id: 'PWD-001',
        lgu_id: 1,
        status: 'PENDING_ADMIN_REVIEW'
      },
      {
        osca_id: 'SC-003',
        philhealth_id: 'PH-003',
        last_name: 'Santos',
        first_name: 'Pedro',
        middle_name: 'Lopez',
        birth_date: '1948-07-10',
        age: 76,
        sex: 'Male',
        civil_status: 'Married',
        house_no_street: '789 Bonifacio Street',
        barangay: 'Barangay 3',
        city_municipality: 'Sample City',
        province: 'Sample Province',
        region: 'NCR',
        contact_no: '09234567891',
        email: 'pedro.santos@email.com',
        pension_type: 'Government',
        pension_amount: 6000,
        is_ip: 1,
        ip_group: 'Igorot',
        is_pwd: 0,
        lgu_id: 1,
        status: 'DRAFT'
      }
    ];
    
    const seniorStmt = db.prepare(`
      INSERT INTO senior_citizens (
        osca_id, philhealth_id, last_name, first_name, middle_name,
        birth_date, age, sex, civil_status, house_no_street, barangay,
        city_municipality, province, region, contact_no, email,
        pension_type, pension_amount, is_ip, ip_group, is_pwd, pwd_id,
        lgu_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    seniorCitizens.forEach(senior => {
      seniorStmt.run(
        senior.osca_id, senior.philhealth_id, senior.last_name, senior.first_name, senior.middle_name,
        senior.birth_date, senior.age, senior.sex, senior.civil_status, senior.house_no_street, senior.barangay,
        senior.city_municipality, senior.province, senior.region, senior.contact_no, senior.email,
        senior.pension_type, senior.pension_amount, senior.is_ip, senior.ip_group, senior.is_pwd, senior.pwd_id,
        senior.lgu_id, senior.status
      );
      console.log(`  Created senior citizen: ${senior.first_name} ${senior.last_name} (${senior.osca_id})`);
    });
    
    console.log('\n✅ Fresh migration completed successfully!');
    console.log('\n📋 Default Login Accounts:');
    console.log('  Super Admin: admin / admin123');
    console.log('  Admin: admin2 / admin123');
    console.log('  Client: client1 / client123');
    console.log('  Client: client2 / client123');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  migrateFresh()
    .then(() => {
      console.log('\n✨ Database is now fresh and seeded!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateFresh };
