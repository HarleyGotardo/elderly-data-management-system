const fs = require('fs');
const path = require('path');

class MakeModel {
  constructor() {
    this.modelsPath = path.join(__dirname, '../Models');
  }

  async create(name, options = {}) {
    const className = this.toPascalCase(name);
    const tableName = options.table || this.toSnakeCase(name) + 's';
    const fileName = `${className}.js`;
    const filePath = path.join(this.modelsPath, fileName);

    // Check if model already exists
    if (fs.existsSync(filePath)) {
      console.log(`Model ${className} already exists!`);
      return;
    }

    // Ensure Models directory exists
    if (!fs.existsSync(this.modelsPath)) {
      fs.mkdirSync(this.modelsPath, { recursive: true });
    }

    const template = `const Model = require('./Model');
const db = require('../../database/config');

class ${className} extends Model {
  static get tableName() {
    return '${tableName}';
  }

  /**
   * Find record by custom field
   */
  static findBy${this.toPascalCase(options.field || 'name')}(value) {
    const stmt = db.prepare(\`SELECT * FROM \${this.tableName} WHERE ${options.field || 'name'} = ?\`);
    const row = stmt.get(value);
    
    if (!row) return null;
    
    const model = new this(row);
    model.exists = true;
    return model;
  }

  /**
   * Get formatted display value
   */
  getDisplayName() {
    return this.get('${options.field || 'name'}');
  }

  /**
   * Validation rules for ${className.toLowerCase()} data
   */
  static get validationRules() {
    return {
      ${options.field || 'name'}: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 255
      }
    };
  }

  /**
   * Validate ${className.toLowerCase()} data
   */
  static validate(data) {
    const rules = this.validationRules;
    const errors = {};

    for (const field in rules) {
      const rule = rules[field];
      const value = data[field];

      // Required validation
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors[field] = \`\${field} is required\`;
        continue;
      }

      // Skip other validations if field is not required and empty
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      if (rule.type && typeof value !== rule.type) {
        errors[field] = \`\${field} must be of type \${rule.type}\`;
      }

      // Min length validation
      if (rule.minLength && value.length < rule.minLength) {
        errors[field] = \`\${field} must be at least \${rule.minLength} characters\`;
      }

      // Max length validation
      if (rule.maxLength && value.length > rule.maxLength) {
        errors[field] = \`\${field} must not exceed \${rule.maxLength} characters\`;
      }
    }

    return Object.keys(errors).length === 0 ? null : errors;
  }
}

module.exports = ${className};
`;

    fs.writeFileSync(filePath, template);
    console.log(`Model created: ${fileName}`);
    
    // Show next steps
    console.log('\\nNext steps:');
    console.log(`1. Create a migration for the ${tableName} table:`);
    console.log(`   npm run migration:create create_${tableName}_table`);
    console.log(`2. Add the table columns in the migration file`);
    console.log(`3. Run the migration:`);
    console.log(`   npm run migration:run`);
  }

  toPascalCase(str) {
    return str.split(/[-_]/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join('');
  }

  toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => '_' + letter.toLowerCase()).slice(1);
  }
}

module.exports = MakeModel;
