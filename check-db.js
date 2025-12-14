const db = require('./database/config.js');

console.log('Checking senior_citizens table...\n');

// Check if full_name is populated
const rows = db.prepare('SELECT id, osca_id, last_name, first_name, full_name, age FROM senior_citizens LIMIT 5').all();
console.log('Sample data:');
console.log(JSON.stringify(rows, null, 2));

// Check table schema
console.log('\n\nTable schema:');
const schema = db.prepare("PRAGMA table_info(senior_citizens)").all();
console.log(JSON.stringify(schema, null, 2));

db.close();
