import Model from './Model.js';
import dbPromise from '../../database/config.js';

class SeniorCitizen extends Model {
  static get tableName() {
    return 'senior_citizens';
  }

  /**
   * Find senior citizen by OSCA ID
   */
  static async findByOscaId(oscaId) {
    const db = await dbPromise;
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE osca_id = ?`);
    const rows = stmt.all(oscaId);
    
    if (!rows || rows.length === 0) return null;
    
    const senior = new this(rows[0]);
    senior.exists = true;
    return senior;
  }

  /**
   * Find senior citizen by NCSC RRN
   */
  static async findByNcscRrn(rrn) {
    const db = await dbPromise;
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE ncsc_rrn = ?`);
    const rows = stmt.all(rrn);
    
    if (!rows || rows.length === 0) return null;
    
    const senior = new this(rows[0]);
    senior.exists = true;
    return senior;
  }

  /**
   * Check for duplicate within LGU (Name + DOB)
   */
  static async checkDuplicateInLgu(fullName, dateOfBirth, lguId) {
    const db = await dbPromise;
    const stmt = db.prepare(`
      SELECT * FROM ${this.tableName} 
      WHERE full_name = ? AND date_of_birth = ? AND lgu_id = ?
    `);
    const rows = stmt.all(fullName, dateOfBirth, lguId);
    
    if (!rows || rows.length === 0) return null;
    
    const senior = new this(rows[0]);
    senior.exists = true;
    return senior;
  }

  /**
   * Get seniors by LGU
   */
  static async getByLgu(lguId, limit = null, offset = 0) {
    const db = await dbPromise;
    let query = `SELECT * FROM ${this.tableName} WHERE lgu_id = ? ORDER BY created_at DESC`;
    let params = [lguId];
    
    if (limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
    }
    
    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    
    return rows.map(row => {
      const senior = new this(row);
      senior.exists = true;
      return senior.toJSON(); // Return plain object instead of Model instance
    });
  }

  /**
   * Get count by status for LGU
   */
  static async getCountByStatus(lguId) {
    const db = await dbPromise;
    const stmt = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM ${this.tableName} 
      WHERE lgu_id = ? 
      GROUP BY status
    `);
    return stmt.all(lguId);
  }

  /**
   * Search seniors by name
   */
  static async searchByName(searchTerm, lguId = null, limit = null) {
    const db = await dbPromise;
    let query = `SELECT * FROM ${this.tableName} WHERE full_name LIKE ?`;
    let params = [`%${searchTerm}%`];
    
    if (lguId) {
      query += ` AND lgu_id = ?`;
      params.push(lguId);
    }
    
    query += ` ORDER BY full_name LIMIT 50`;
    
    if (limit) {
      query = query.replace('LIMIT 50', `LIMIT ${limit}`);
    }
    
    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    
    return rows.map(row => {
      const senior = new this(row);
      senior.exists = true;
      return senior.toJSON(); // Return plain object instead of Model instance
    });
  }

  /**
   * Get vulnerable sector statistics
   */
  static async getVulnerableStats(lguId) {
    const db = await dbPromise;
    const stmt = db.prepare(`
      SELECT 
        COUNT(CASE WHEN is_ip = 1 THEN 1 END) as ip_count,
        COUNT(CASE WHEN is_pwd = 1 THEN 1 END) as pwd_count,
        COUNT(*) as total
      FROM ${this.tableName} 
      WHERE lgu_id = ?
    `);
    const rows = stmt.all(lguId);
    return rows[0] || { ip_count: 0, pwd_count: 0, total: 0 };
  }

  /**
   * Get seniors by status
   */
  static async getByStatus(status, lguId = null) {
    const db = await dbPromise;
    let query = `SELECT * FROM ${this.tableName} WHERE status = ?`;
    let params = [status];
    
    if (lguId) {
      query += ` AND lgu_id = ?`;
      params.push(lguId);
    }
    
    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    
    return rows.map(row => {
      const senior = new this(row);
      senior.exists = true;
      return senior.toJSON(); // Return plain object instead of Model instance
    });
  }

  /**
   * Calculate age from date of birth
   */
  getAge() {
    const dob = this.get('date_of_birth');
    if (!dob) return null;
    
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Check if senior is eligible (60+ years old)
   */
  isEligible() {
    const age = this.getAge();
    return age >= 60;
  }

  /**
   * Get formatted full name
   */
  getFormattedFullName() {
    const lastName = this.get('last_name') || '';
    const firstName = this.get('first_name') || '';
    const middleName = this.get('middle_name') || '';
    const extName = this.get('ext_name') || '';
    
    let fullName = `${lastName}, ${firstName}`;
    if (middleName) fullName += ` ${middleName}`;
    if (extName) fullName += ` ${extName}`;
    
    return fullName;
  }

  /**
   * Get formatted address
   */
  getFormattedAddress() {
    const parts = [
      this.get('house_number'),
      this.get('street'),
      this.get('barangay'),
      this.get('municipality'),
      this.get('province'),
      this.get('region')
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  /**
   * Validation rules for senior citizen data
   */
  static get validationRules() {
    return {
      // Core IDs
      osca_id: {
        required: true,
        type: 'string',
        minLength: 5,
        maxLength: 50
      },
      ncsc_rrn: {
        required: false,
        type: 'string',
        minLength: 5,
        maxLength: 50
      },
      
      // Personal Information
      last_name: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 100
      },
      first_name: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 100
      },
      middle_name: {
        required: false,
        type: 'string',
        maxLength: 100
      },
      ext_name: {
        required: false,
        type: 'string',
        maxLength: 20
      },
      date_of_birth: {
        required: true,
        type: 'string',
        pattern: /^\d{4}-\d{2}-\d{2}$/
      },
      sex: {
        required: true,
        type: 'string',
        enum: ['Male', 'Female']
      },
      civil_status: {
        required: true,
        type: 'string',
        enum: ['Single', 'Married', 'Widowed', 'Separated', 'Legally Separated']
      },
      citizenship: {
        required: true,
        type: 'string',
        enum: ['Filipino', 'Dual']
      },
      
      // Location
      region: {
        required: true,
        type: 'string',
        maxLength: 100
      },
      province: {
        required: true,
        type: 'string',
        maxLength: 100
      },
      municipality: {
        required: true,
        type: 'string',
        maxLength: 100
      },
      barangay: {
        required: true,
        type: 'string',
        maxLength: 100
      },
      house_number: {
        required: false,
        type: 'string',
        maxLength: 50
      },
      street: {
        required: false,
        type: 'string',
        maxLength: 100
      },
      
      // Relationships
      spouse_name: {
        required: false,
        type: 'string',
        maxLength: 255
      },
      
      // System fields
      lgu_id: {
        required: true,
        type: 'number',
        min: 1
      }
    };
  }

  /**
   * Validate senior citizen data
   */
  static validate(data) {
    const rules = this.validationRules;
    const errors = {};

    for (const field in rules) {
      const rule = rules[field];
      const value = data[field];

      // Required validation
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors[field] = `${field} is required`;
        continue;
      }

      // Skip other validations if field is not required and empty
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      if (rule.type && typeof value !== rule.type) {
        errors[field] = `${field} must be of type ${rule.type}`;
      }

      // String validations
      if (typeof value === 'string') {
        // Min length validation
        if (rule.minLength && value.length < rule.minLength) {
          errors[field] = `${field} must be at least ${rule.minLength} characters`;
        }

        // Max length validation
        if (rule.maxLength && value.length > rule.maxLength) {
          errors[field] = `${field} must not exceed ${rule.maxLength} characters`;
        }

        // Pattern validation
        if (rule.pattern && !rule.pattern.test(value)) {
          errors[field] = `${field} format is invalid`;
        }

        // Enum validation
        if (rule.enum && !rule.enum.includes(value)) {
          errors[field] = `${field} must be one of: ${rule.enum.join(', ')}`;
        }
      }

      // Number validations
      if (typeof value === 'number') {
        // Min validation
        if (rule.min !== undefined && value < rule.min) {
          errors[field] = `${field} must be at least ${rule.min}`;
        }
      }
    }

    // Custom validation: Check age is 60+
    if (data.date_of_birth) {
      const birthDate = new Date(data.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 60) {
        errors.date_of_birth = 'Applicant must be 60 years or older';
      }
    }

    return Object.keys(errors).length === 0 ? null : errors;
  }

  /**
   * Before save: Set computed fields
   */
  async beforeSave() {
    // Set full_name from individual name parts
    this.set('full_name', this.getFormattedFullName());
    
    // Set age
    this.set('age', this.getAge());
    
    // Set status to draft if not set
    if (!this.get('status')) {
      this.set('status', 'DRAFT');
    }
  }

  /**
   * Submit to admin
   */
  async submitToAdmin() {
    this.set('status', 'PENDING_ADMIN_REVIEW');
    this.set('submitted_at', new Date().toISOString());
    return this.save();
  }

  /**
   * Lock record (after admin approval)
   */
  async lock() {
    this.set('locked', 1);
    return this.save();
  }

  /**
   * Check if record is locked
   */
  isLocked() {
    return this.get('locked') === 1;
  }
}

export default SeniorCitizen;
