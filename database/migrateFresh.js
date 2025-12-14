const dbPromise = require('./config.js');
const bcrypt = require('bcryptjs');

/**
 * Fresh migration - drops all tables and recreates them with seed data
 */
async function migrateFresh() {
  console.log('Running fresh migration...');
  
  try {
    const db = await dbPromise;
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
        osca_id VARCHAR(50) NOT NULL UNIQUE,
        ncsc_rrn VARCHAR(50),
        last_name VARCHAR(100) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100),
        ext_name VARCHAR(20),
        full_name VARCHAR(255) GENERATED ALWAYS AS (
          last_name || ', ' || first_name || 
          CASE WHEN middle_name IS NOT NULL AND middle_name != '' THEN ' ' || middle_name ELSE '' END ||
          CASE WHEN ext_name IS NOT NULL AND ext_name != '' THEN ' ' || ext_name ELSE '' END
        ) STORED,
        date_of_birth DATE NOT NULL,
        sex VARCHAR(10) NOT NULL CHECK (sex IN ('Male', 'Female')),
        civil_status VARCHAR(20) NOT NULL CHECK (civil_status IN ('Single', 'Married', 'Widowed', 'Separated', 'Legally Separated')),
        citizenship VARCHAR(20) NOT NULL DEFAULT 'Filipino' CHECK (citizenship IN ('Filipino', 'Dual')),
        is_ip BOOLEAN DEFAULT 0,
        ip_group VARCHAR(100),
        is_pwd BOOLEAN DEFAULT 0,
        pwd_type VARCHAR(100),
        region VARCHAR(100) NOT NULL,
        province VARCHAR(100) NOT NULL,
        municipality VARCHAR(100) NOT NULL,
        barangay VARCHAR(100) NOT NULL,
        house_number VARCHAR(50),
        street VARCHAR(100),
        full_address TEXT GENERATED ALWAYS AS (
          CASE WHEN house_number IS NOT NULL AND house_number != '' THEN house_number || ' ' ELSE '' END ||
          CASE WHEN street IS NOT NULL AND street != '' THEN street || ', ' ELSE '' END ||
          barangay || ', ' || municipality || ', ' || province || ', ' || region
        ) STORED,
        spouse_name VARCHAR(255),
        rep_1_name VARCHAR(255),
        rep_1_relationship VARCHAR(100),
        rep_2_name VARCHAR(255),
        rep_2_relationship VARCHAR(100),
        rep_3_name VARCHAR(255),
        rep_3_relationship VARCHAR(100),
        beneficiary_primary VARCHAR(255),
        beneficiary_contingent VARCHAR(255),
        status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_ADMIN_REVIEW', 'CLEAN', 'DUPLICATE', 'SUSPECTED', 'APPROVED', 'HOLD', 'DENIED', 'SYNCED')),
        compliance_check VARCHAR(10) CHECK (compliance_check IN ('PASS', 'FAIL')),
        global_duplicate_status VARCHAR(20) CHECK (global_duplicate_status IN ('CLEAN', 'DUPLICATE', 'SUSPECTED')),
        admin_assessment VARCHAR(20) CHECK (admin_assessment IN ('APPROVED', 'HOLD', 'DENIED')),
        admin_remarks TEXT,
        payment_status VARCHAR(20) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID')),
        payment_date DATE,
        date_of_death DATE,
        lgu_id INTEGER NOT NULL,
        locked BOOLEAN DEFAULT 0,
        synced_to_supabase BOOLEAN DEFAULT 0,
        submitted_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_senior_citizens_osca_id ON senior_citizens(osca_id);
      CREATE INDEX idx_senior_citizens_full_name_dob ON senior_citizens(full_name, date_of_birth);
      CREATE INDEX idx_senior_citizens_lgu_id ON senior_citizens(lgu_id);
      CREATE INDEX idx_senior_citizens_status ON senior_citizens(status);
      CREATE INDEX idx_senior_citizens_global_duplicate ON senior_citizens(global_duplicate_status);
      
      CREATE TRIGGER update_senior_citizens_updated_at
      AFTER UPDATE ON senior_citizens
      FOR EACH ROW
      BEGIN
        UPDATE senior_citizens SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
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
        ncsc_rrn: 'NCSC-001',
        last_name: 'Dela Cruz',
        first_name: 'Juan',
        middle_name: 'Santos',
        ext_name: null,
        date_of_birth: '1950-01-15',
        sex: 'Male',
        civil_status: 'Married',
        citizenship: 'Filipino',
        is_ip: 0,
        ip_group: null,
        is_pwd: 0,
        pwd_type: null,
        region: 'NCR',
        province: 'Sample Province',
        municipality: 'Sample City',
        barangay: 'Barangay 1',
        house_number: '123',
        street: 'Rizal Street',
        spouse_name: 'Rosa Dela Cruz',
        rep_1_name: 'Juan Dela Cruz Jr',
        rep_1_relationship: 'Son',
        rep_2_name: null,
        rep_2_relationship: null,
        rep_3_name: null,
        rep_3_relationship: null,
        beneficiary_primary: 'Rosa Dela Cruz',
        beneficiary_contingent: 'Juan Dela Cruz Jr',
        lgu_id: 1,
        status: 'APPROVED'
      },
      {
        osca_id: 'SC-002',
        ncsc_rrn: 'NCSC-002',
        last_name: 'Reyes',
        first_name: 'Maria',
        middle_name: 'Garcia',
        ext_name: null,
        date_of_birth: '1955-03-20',
        sex: 'Female',
        civil_status: 'Widow',
        citizenship: 'Filipino',
        is_ip: 0,
        ip_group: null,
        is_pwd: 1,
        pwd_type: 'Physical Disability',
        region: 'NCR',
        province: 'Sample Province',
        municipality: 'Sample City',
        barangay: 'Barangay 2',
        house_number: '456',
        street: 'Mabini Avenue',
        spouse_name: null,
        rep_1_name: 'Elena Reyes',
        rep_1_relationship: 'Daughter',
        rep_2_name: null,
        rep_2_relationship: null,
        rep_3_name: null,
        rep_3_relationship: null,
        beneficiary_primary: 'Elena Reyes',
        beneficiary_contingent: 'Carlos Reyes',
        lgu_id: 1,
        status: 'PENDING_ADMIN_REVIEW'
      },
      {
        osca_id: 'SC-003',
        ncsc_rrn: 'NCSC-003',
        last_name: 'Santos',
        first_name: 'Pedro',
        middle_name: 'Lopez',
        ext_name: null,
        date_of_birth: '1948-07-10',
        sex: 'Male',
        civil_status: 'Married',
        citizenship: 'Filipino',
        is_ip: 1,
        ip_group: 'Igorot',
        is_pwd: 0,
        pwd_type: null,
        region: 'NCR',
        province: 'Sample Province',
        municipality: 'Sample City',
        barangay: 'Barangay 3',
        house_number: '789',
        street: 'Bonifacio Street',
        spouse_name: 'Linda Santos',
        rep_1_name: 'Pedro Santos Jr',
        rep_1_relationship: 'Son',
        rep_2_name: null,
        rep_2_relationship: null,
        rep_3_name: null,
        rep_3_relationship: null,
        beneficiary_primary: 'Linda Santos',
        beneficiary_contingent: 'Pedro Santos Jr',
        lgu_id: 1,
        status: 'DRAFT'
      }
    ];
    
    const seniorStmt = db.prepare(`
      INSERT INTO senior_citizens (
        osca_id, ncsc_rrn, last_name, first_name, middle_name, ext_name,
        date_of_birth, sex, civil_status, citizenship,
        is_ip, ip_group, is_pwd, pwd_type,
        region, province, municipality, barangay,
        house_number, street,
        spouse_name,
        rep_1_name, rep_1_relationship,
        rep_2_name, rep_2_relationship,
        rep_3_name, rep_3_relationship,
        beneficiary_primary, beneficiary_contingent,
        lgu_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    seniorCitizens.forEach(senior => {
      seniorStmt.run(
        senior.osca_id, senior.ncsc_rrn, senior.last_name, senior.first_name, senior.middle_name, senior.ext_name,
        senior.date_of_birth, senior.sex, senior.civil_status, senior.citizenship,
        senior.is_ip, senior.ip_group, senior.is_pwd, senior.pwd_type,
        senior.region, senior.province, senior.municipality, senior.barangay,
        senior.house_number, senior.street,
        senior.spouse_name,
        senior.rep_1_name, senior.rep_1_relationship,
        senior.rep_2_name, senior.rep_2_relationship,
        senior.rep_3_name, senior.rep_3_relationship,
        senior.beneficiary_primary, senior.beneficiary_contingent,
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
