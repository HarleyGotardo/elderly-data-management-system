const UserSeeder = require('./seeders/UserSeeder');

async function runSeeder() {
  console.log('🌱 Running database seeders...\n');
  
  try {
    const userSeeder = new UserSeeder();
    await userSeeder.run();
    
    console.log('\n✅ All seeders completed successfully!');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeeder();
