const db = require('../../database/config');

class Model {
  constructor(attributes = {}) {
    this.attributes = attributes;
    this.original = { ...attributes };
    this.exists = false;
  }

  /**
   * Get the table name for the model
   * Override this in child classes
   */
  static get tableName() {
    return this.name.toLowerCase() + 's';
  }

  /**
   * Get the primary key for the model
   * Override this in child classes if needed
   */
  static get primaryKey() {
    return 'id';
  }

  /**
   * Find a record by ID
   */
  static find(id) {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`);
    const row = stmt.get(id);
    
    if (!row) return null;
    
    const model = new this(row);
    model.exists = true;
    return model;
  }

  /**
   * Find all records
   */
  static all() {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName}`);
    const rows = stmt.all();
    
    return rows.map(row => {
      const model = new this(row);
      model.exists = true;
      return model;
    });
  }

  /**
   * Find records by conditions
   */
  static where(column, operator = '=', value) {
    let query = `SELECT * FROM ${this.tableName} WHERE ${column} ${operator} ?`;
    const stmt = db.prepare(query);
    const rows = stmt.all(value);
    
    return rows.map(row => {
      const model = new this(row);
      model.exists = true;
      return model;
    });
  }

  /**
   * Create a new record
   */
  static create(attributes) {
    const columns = Object.keys(attributes).join(', ');
    const placeholders = Object.keys(attributes).map(() => '?').join(', ');
    const values = Object.values(attributes);
    
    const query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    const stmt = db.prepare(query);
    
    const result = stmt.run(...values);
    
    if (result.lastInsertRowid) {
      return this.find(result.lastInsertRowid);
    }
    
    return null;
  }

  /**
   * Update the current record
   */
  update(attributes) {
    if (!this.exists) {
      throw new Error('Cannot update a record that does not exist');
    }

    const columns = Object.keys(attributes);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const values = [...Object.values(attributes), this.attributes[this.constructor.primaryKey]];
    
    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.constructor.primaryKey} = ?`;
    const stmt = db.prepare(query);
    
    const result = stmt.run(...values);
    
    if (result.changes > 0) {
      Object.assign(this.attributes, attributes);
      return true;
    }
    
    return false;
  }

  /**
   * Save the current record (create or update)
   */
  save() {
    if (this.exists) {
      const changes = {};
      for (const key in this.attributes) {
        if (this.attributes[key] !== this.original[key]) {
          changes[key] = this.attributes[key];
        }
      }
      
      if (Object.keys(changes).length === 0) {
        return this; // No changes to save
      }
      
      return this.update(changes);
    } else {
      const created = this.constructor.create(this.attributes);
      if (created) {
        this.attributes = created.attributes;
        this.original = { ...created.attributes };
        this.exists = true;
        return created;
      }
      return null;
    }
  }

  /**
   * Delete the current record
   */
  delete() {
    if (!this.exists) {
      throw new Error('Cannot delete a record that does not exist');
    }

    const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE ${this.constructor.primaryKey} = ?`);
    const result = stmt.run(this.attributes[this.constructor.primaryKey]);
    
    if (result.changes > 0) {
      this.exists = false;
      return true;
    }
    
    return false;
  }

  /**
   * Delete records by conditions
   */
  static whereDelete(column, operator = '=', value) {
    const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE ${column} ${operator} ?`);
    const result = stmt.run(value);
    return result.changes > 0;
  }

  /**
   * Get attribute value
   */
  get(key) {
    return this.attributes[key];
  }

  /**
   * Set attribute value
   */
  set(key, value) {
    this.attributes[key] = value;
  }

  /**
   * Convert model to JSON
   */
  toJSON() {
    return { ...this.attributes };
  }

  /**
   * Raw database query for complex operations
   */
  static query(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  }

  /**
   * Get count of records
   */
  static count(column = '*') {
    const stmt = db.prepare(`SELECT COUNT(${column}) as count FROM ${this.tableName}`);
    const result = stmt.get();
    return result.count;
  }

  /**
   * Order by
   */
  static orderBy(column, direction = 'ASC') {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} ORDER BY ${column} ${direction}`);
    const rows = stmt.all();
    
    return rows.map(row => {
      const model = new this(row);
      model.exists = true;
      return model;
    });
  }

  /**
   * Limit results
   */
  static limit(limit, offset = 0) {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} LIMIT ? OFFSET ?`);
    const rows = stmt.all(limit, offset);
    
    return rows.map(row => {
      const model = new this(row);
      model.exists = true;
      return model;
    });
  }
}

export default Model;
