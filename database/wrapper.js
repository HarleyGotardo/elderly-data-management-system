/**
 * DatabaseWrapper - Bridges sql.js API to better-sqlite3 API
 * This allows existing code using better-sqlite3 to work with sql.js
 */
class DatabaseWrapper {
  constructor(sqlDb, dbPath) {
    this.db = sqlDb;
    this.dbPath = dbPath;
  }

  /**
   * Prepare a SQL statement (mimics better-sqlite3 prepare)
   * @param {string} sql - SQL query with ? placeholders
   * @returns {object} Statement object with get, all, run methods
   */
  prepare(sql) {
    const self = this;
    
    return {
      /**
       * Get a single row
       * @param {...any} params - Parameters for the query
       * @returns {object|undefined} First row or undefined
       */
      get(...params) {
        try {
          const result = self.db.exec(sql, params);
          if (result.length === 0) return undefined;
          
          const columns = result[0].columns;
          const values = result[0].values[0];
          
          if (!values) return undefined;
          
          // Convert array to object
          const row = {};
          columns.forEach((col, idx) => {
            row[col] = values[idx];
          });
          
          return row;
        } catch (error) {
          console.error('SQL Error in get():', error, 'SQL:', sql, 'Params:', params);
          throw error;
        }
      },

      /**
       * Get all rows
       * @param {...any} params - Parameters for the query
       * @returns {Array} Array of row objects
       */
      all(...params) {
        try {
          const result = self.db.exec(sql, params);
          if (result.length === 0) return [];
          
          const columns = result[0].columns;
          const values = result[0].values;
          
          // Convert arrays to objects
          return values.map(row => {
            const obj = {};
            columns.forEach((col, idx) => {
              obj[col] = row[idx];
            });
            return obj;
          });
        } catch (error) {
          console.error('SQL Error in all():', error, 'SQL:', sql, 'Params:', params);
          throw error;
        }
      },

      /**
       * Run a statement (INSERT, UPDATE, DELETE)
       * @param {...any} params - Parameters for the query
       * @returns {object} Object with changes and lastInsertRowid
       */
      run(...params) {
        try {
          self.db.run(sql, params);
          
          return {
            changes: self.db.getRowsModified(),
            lastInsertRowid: self.getLastInsertRowId()
          };
        } catch (error) {
          console.error('SQL Error in run():', error, 'SQL:', sql, 'Params:', params);
          throw error;
        }
      }
    };
  }

  /**
   * Execute raw SQL (for migrations, etc.)
   * @param {string} sql - SQL to execute
   */
  exec(sql) {
    try {
      this.db.exec(sql);
    } catch (error) {
      console.error('SQL Error in exec():', error, 'SQL:', sql);
      throw error;
    }
  }

  /**
   * Run a SQL statement directly
   * @param {string} sql - SQL to execute
   * @param {Array} params - Parameters
   */
  run(sql, params = []) {
    try {
      this.db.run(sql, params);
      return {
        changes: this.db.getRowsModified(),
        lastInsertRowid: this.getLastInsertRowId()
      };
    } catch (error) {
      console.error('SQL Error in run():', error, 'SQL:', sql, 'Params:', params);
      throw error;
    }
  }

  /**
   * Get last insert row ID
   * @returns {number} Last inserted row ID
   */
  getLastInsertRowId() {
    try {
      const result = this.db.exec('SELECT last_insert_rowid() as id');
      return result[0]?.values[0]?.[0] || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Execute PRAGMA statement
   * @param {string} pragma - PRAGMA statement
   */
  pragma(pragma) {
    try {
      this.db.run(`PRAGMA ${pragma}`);
    } catch (error) {
      console.error('PRAGMA Error:', error, 'PRAGMA:', pragma);
    }
  }

  /**
   * Close database (no-op for sql.js, handled by save)
   */
  close() {
    // sql.js doesn't need explicit close
    // Database is saved periodically in main.js
  }

  /**
   * Export database as binary data
   * @returns {Uint8Array} Database binary data
   */
  export() {
    return this.db.export();
  }
}

module.exports = DatabaseWrapper;
