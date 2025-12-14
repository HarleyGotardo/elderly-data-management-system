#!/usr/bin/env node

const { Command } = require('commander');
const Migration = require('./Migration');
const Seeder = require('./Seeder');

const program = new Command();

program
  .name('db')
  .description('Database migration and seeding CLI')
  .version('1.0.0');

// Migration commands
program
  .command('migration:create <name>')
  .description('Create a new migration')
  .action(async (name) => {
    try {
      const migration = new Migration();
      await migration.createMigration(name);
    } catch (error) {
      console.error('Error creating migration:', error);
      process.exit(1);
    }
  });

program
  .command('migration:run')
  .description('Run all pending migrations')
  .action(async () => {
    try {
      const migration = new Migration();
      await migration.runMigrations();
    } catch (error) {
      console.error('Error running migrations:', error);
      process.exit(1);
    }
  });

program
  .command('migration:rollback')
  .description('Rollback the last batch of migrations')
  .action(async () => {
    try {
      const migration = new Migration();
      await migration.rollbackLastBatch();
    } catch (error) {
      console.error('Error rolling back migrations:', error);
      process.exit(1);
    }
  });

program
  .command('migration:reset')
  .description('Rollback all migrations')
  .action(async () => {
    try {
      const migration = new Migration();
      await migration.reset();
    } catch (error) {
      console.error('Error resetting migrations:', error);
      process.exit(1);
    }
  });

// Seeder commands
program
  .command('seeder:create <name>')
  .description('Create a new seeder')
  .action(async (name) => {
    try {
      const seeder = new Seeder();
      await seeder.createSeeder(name);
    } catch (error) {
      console.error('Error creating seeder:', error);
      process.exit(1);
    }
  });

program
  .command('seeder:run')
  .description('Run all pending seeders')
  .action(async () => {
    try {
      const seeder = new Seeder();
      await seeder.runSeeders();
    } catch (error) {
      console.error('Error running seeders:', error);
      process.exit(1);
    }
  });

program
  .command('seeder:reset')
  .description('Reset all seeders')
  .action(async () => {
    try {
      const seeder = new Seeder();
      await seeder.reset();
    } catch (error) {
      console.error('Error resetting seeders:', error);
      process.exit(1);
    }
  });

// Combined commands
program
  .command('fresh')
  .description('Drop all tables and re-run all migrations')
  .action(async () => {
    try {
      const migration = new Migration();
      await migration.reset();
      await migration.runMigrations();
      console.log('Database refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing database:', error);
      process.exit(1);
    }
  });

program
  .command('seed')
  .description('Run all seeders')
  .action(async () => {
    try {
      const seeder = new Seeder();
      await seeder.runSeeders();
    } catch (error) {
      console.error('Error seeding database:', error);
      process.exit(1);
    }
  });

program
  .command('migrate')
  .alias('m')
  .description('Run migrations and seeders')
  .action(async () => {
    try {
      const migration = new Migration();
      await migration.runMigrations();
      
      const seeder = new Seeder();
      await seeder.runSeeders();
      
      console.log('Database migrated and seeded successfully!');
    } catch (error) {
      console.error('Error migrating and seeding:', error);
      process.exit(1);
    }
  });

program.parse();
