import dbPromise from '../config.js';

/**
 * Migration: Add sync fields and sync_queue table
 */
export default {
  async up() {
    const db = await dbPromise;

    // Add sync fields to senior_citizens table (only missing ones)
    try {
      db.exec(`ALTER TABLE senior_citizens ADD COLUMN sync_version INTEGER DEFAULT 1`);
    } catch(e) { console.log('Column sync_version already exists'); }
    
    try {
      db.exec(`ALTER TABLE senior_citizens ADD COLUMN sync_status TEXT DEFAULT 'DRAFT'`);
    } catch(e) { console.log('Column sync_status already exists'); }
    
    try {
      db.exec(`ALTER TABLE senior_citizens ADD COLUMN last_synced_at DATETIME NULL`);
    } catch(e) { console.log('Column last_synced_at already exists'); }
    
    try {
      db.exec(`ALTER TABLE senior_citizens ADD COLUMN sync_error TEXT NULL`);
    } catch(e) { console.log('Column sync_error already exists'); }
    
    try {
      db.exec(`ALTER TABLE senior_citizens ADD COLUMN admin_notes TEXT NULL`);
    } catch(e) { console.log('Column admin_notes already exists'); }
    
    try {
      db.exec(`ALTER TABLE senior_citizens ADD COLUMN admin_decision_at DATETIME NULL`);
    } catch(e) { console.log('Column admin_decision_at already exists'); }
    
    try {
      db.exec(`ALTER TABLE senior_citizens ADD COLUMN export_batch_id TEXT NULL`);
    } catch(e) { console.log('Column export_batch_id already exists'); }
    
    try {
      db.exec(`ALTER TABLE senior_citizens ADD COLUMN import_batch_id TEXT NULL`);
    } catch(e) { console.log('Column import_batch_id already exists'); }
    
    try {
      db.exec(`ALTER TABLE senior_citizens ADD COLUMN is_readonly INTEGER DEFAULT 0`);
    } catch(e) { console.log('Column is_readonly already exists'); }
    
    try {
      db.exec(`ALTER TABLE senior_citizens ADD COLUMN duplicate_of TEXT NULL`);
    } catch(e) { console.log('Column duplicate_of already exists'); }

    // Create sync_queue table (only if it doesn't exist)
    try {
      db.exec(`
        CREATE TABLE sync_queue (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
          record_id TEXT NOT NULL,
          record_type TEXT NOT NULL,
          operation TEXT NOT NULL,
          direction TEXT NOT NULL,
          status TEXT DEFAULT 'PENDING',
          retry_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          processed_at DATETIME NULL,
          error_message TEXT NULL,
          FOREIGN KEY (record_id) REFERENCES senior_citizens(id)
        )
      `);
    } catch(e) { console.log('Table sync_queue already exists'); }

    // Create indexes for performance (only if they don't exist)
    try {
      db.exec(`CREATE INDEX IF NOT EXISTS idx_senior_citizens_lgu_id ON senior_citizens(lgu_id)`);
    } catch(e) { console.log('Index idx_senior_citizens_lgu_id already exists'); }
    
    try {
      db.exec(`CREATE INDEX IF NOT EXISTS idx_senior_citizens_sync_status ON senior_citizens(sync_status)`);
    } catch(e) { console.log('Index idx_senior_citizens_sync_status already exists'); }
    
    try {
      db.exec(`CREATE INDEX IF NOT EXISTS idx_senior_citizens_export_batch ON senior_citizens(export_batch_id)`);
    } catch(e) { console.log('Index idx_senior_citizens_export_batch already exists'); }
    
    try {
      db.exec(`CREATE INDEX IF NOT EXISTS idx_senior_citizens_import_batch ON senior_citizens(import_batch_id)`);
    } catch(e) { console.log('Index idx_senior_citizens_import_batch already exists'); }
    
    try {
      db.exec(`CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status)`);
    } catch(e) { console.log('Index idx_sync_queue_status already exists'); }
    
    try {
      db.exec(`CREATE INDEX IF NOT EXISTS idx_sync_queue_direction ON sync_queue(direction)`);
    } catch(e) { console.log('Index idx_sync_queue_direction already exists'); }
    
    try {
      db.exec(`CREATE INDEX IF NOT EXISTS idx_sync_queue_record_id ON sync_queue(record_id)`);
    } catch(e) { console.log('Index idx_sync_queue_record_id already exists'); }

    // Create sync_log table for audit trail (only if it doesn't exist)
    try {
      db.exec(`
        CREATE TABLE sync_log (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
          batch_id TEXT NOT NULL,
          lgu_id TEXT NOT NULL,
          sync_type TEXT NOT NULL,
          direction TEXT NOT NULL,
          record_count INTEGER DEFAULT 0,
          status TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME NULL,
          error_message TEXT NULL
        )
      `);
    } catch(e) { console.log('Table sync_log already exists'); }

    console.log('Migration completed: Added sync fields and sync_queue table');
  },

  async down() {
    const db = await dbPromise;
    db.exec(`ALTER TABLE senior_citizens DROP COLUMN payment_date`);
    db.exec(`ALTER TABLE senior_citizens DROP COLUMN duplicate_of`);

    console.log('Migration rolled back: Removed sync fields and sync_queue table');
  }
};
