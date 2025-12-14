import dbPromise from '../config.js';

export default {
  async up() {
    const db = await dbPromise;
    const createTable = `
      CREATE TABLE IF NOT EXISTS senior_citizens (
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
      )
    `;
    
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_senior_citizens_osca_id ON senior_citizens(osca_id);
      CREATE INDEX IF NOT EXISTS idx_senior_citizens_full_name_dob ON senior_citizens(full_name, date_of_birth);
      CREATE INDEX IF NOT EXISTS idx_senior_citizens_lgu_id ON senior_citizens(lgu_id);
      CREATE INDEX IF NOT EXISTS idx_senior_citizens_status ON senior_citizens(status);
      CREATE INDEX IF NOT EXISTS idx_senior_citizens_global_duplicate ON senior_citizens(global_duplicate_status);
    `;
    
    const createTrigger = `
      CREATE TRIGGER IF NOT EXISTS update_senior_citizens_updated_at
      AFTER UPDATE ON senior_citizens
      FOR EACH ROW
      BEGIN
        UPDATE senior_citizens SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `;
    
    db.exec(createTable);
    db.exec(createIndexes);
    db.exec(createTrigger);
  },

  async down() {
    const db = await dbPromise;
    db.exec('DROP TABLE IF EXISTS senior_citizens');
    console.log('senior_citizens table dropped');
  }
};
