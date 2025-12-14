import db from '../../database/config.js';

class Model {
  constructor(attributes = {}) {
    this.attributes = attributes;
    this.original = { ...attributes };
    this.exists = false;
  }

  static get tableName() {
    return this.name.toLowerCase() + 's';
  }

  static get primaryKey() {
    return 'id';
  }

  static find(id) {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`);
    const row = stmt.get(id);
    if (!row) return null;
    const model = new this(row);
    model.exists = true;
    return model;
  }

  static all() {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName}`);
    const rows = stmt.all();
    return rows.map(row => {
      const model = new this(row);
      model.exists = true;
      return model.toJSON();
    });
  }

  static where(column, operator, value) {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE ${column} ${operator} ?`);
    const rows = stmt.all(value);
    return rows.map(row => {
      const model = new this(row);
      model.exists = true;
      return model.toJSON();
    });
  }

  static create(attributes) {
    const columns = Object.keys(attributes);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    const stmt = db.prepare(sql);
    const result = stmt.run(...Object.values(attributes));
    return this.find(result.lastInsertRowid);
  }

  static update(id, attributes) {
    const columns = Object.keys(attributes);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = ?`;
    const stmt = db.prepare(sql);
    stmt.run(...Object.values(attributes), id);
    return this.find(id);
  }

  static delete(id) {
    const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  save() {
    if (this.exists) {
      // Exclude generated columns and admin-only columns for updates
      const excludedColumns = [
        'full_name', 'full_address', 'age', 'id',
        'compliance_check', 'global_duplicate_status', 'admin_assessment',
        'payment_status', 'payment_date', 'date_of_death',
        'created_at', 'updated_at', 'submitted_at'
      ];
      const attrs = { ...this.attributes };
      delete attrs[this.constructor.primaryKey];
      // Remove excluded columns
      excludedColumns.forEach(col => delete attrs[col]);
      // Remove any empty string values for columns that might have CHECK constraints
      Object.keys(attrs).forEach(key => {
        if (attrs[key] === '') {
          delete attrs[key];
        }
      });
      
      const columns = Object.keys(attrs);
      if (columns.length === 0) return this;
      const setClause = columns.map(col => `${col} = ?`).join(', ');
      const sql = `UPDATE ${this.constructor.tableName} SET ${setClause} WHERE ${this.constructor.primaryKey} = ?`;
      const stmt = db.prepare(sql);
      stmt.run(...Object.values(attrs), this.attributes[this.constructor.primaryKey]);
    } else {
      const columns = Object.keys(this.attributes);
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT INTO ${this.constructor.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
      const stmt = db.prepare(sql);
      const result = stmt.run(...Object.values(this.attributes));
      this.attributes[this.constructor.primaryKey] = result.lastInsertRowid;
      this.exists = true;
    }
    this.original = { ...this.attributes };
    return this;
  }

  destroy() {
    if (!this.exists) return false;
    const stmt = db.prepare(`DELETE FROM ${this.constructor.tableName} WHERE ${this.constructor.primaryKey} = ?`);
    const result = stmt.run(this.attributes[this.constructor.primaryKey]);
    if (result.changes > 0) {
      this.exists = false;
      return true;
    }
    return false;
  }

  update(attributes) {
    if (!this.exists) return false;
    // Merge new attributes with existing ones
    Object.assign(this.attributes, attributes);
    // Save to database - exclude generated columns and admin-only columns
    const excludedColumns = [
      'full_name', 'full_address', 'age', 'id',
      'compliance_check', 'global_duplicate_status', 'admin_assessment',
      'payment_status', 'payment_date', 'date_of_death',
      'created_at', 'updated_at', 'submitted_at'
    ];
    const attrs = { ...this.attributes };
    delete attrs[this.constructor.primaryKey];
    // Remove excluded columns
    excludedColumns.forEach(col => delete attrs[col]);
    // Remove any empty string values for columns that might have CHECK constraints
    Object.keys(attrs).forEach(key => {
      if (attrs[key] === '') {
        delete attrs[key];
      }
    });
    const columns = Object.keys(attrs);
    if (columns.length === 0) return this;
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const sql = `UPDATE ${this.constructor.tableName} SET ${setClause} WHERE ${this.constructor.primaryKey} = ?`;
    const stmt = db.prepare(sql);
    stmt.run(...Object.values(attrs), this.attributes[this.constructor.primaryKey]);
    this.original = { ...this.attributes };
    return this;
  }

  get(key) {
    return this.attributes[key];
  }

  set(key, value) {
    this.attributes[key] = value;
    return this;
  }

  toJSON() {
    return { ...this.attributes };
  }
}

export default Model;
