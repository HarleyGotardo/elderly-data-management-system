#!/usr/bin/env node

const { Command } = require('commander');
const MakeController = require('./MakeController');
const MakeModel = require('./MakeModel');
const MakeView = require('./MakeView');

const program = new Command();

program
  .name('make')
  .description('MVC scaffolding CLI for Electron app')
  .version('1.0.0');

// Make controller
program
  .command('controller <name>')
  .description('Create a new controller')
  .action(async (name) => {
    try {
      const maker = new MakeController();
      await maker.create(name);
    } catch (error) {
      console.error('Error creating controller:', error);
      process.exit(1);
    }
  });

// Make model
program
  .command('model <name>')
  .description('Create a new model')
  .option('-t, --table <tableName>', 'Specify custom table name')
  .option('-f, --field <fieldName>', 'Specify primary field name', 'name')
  .action(async (name, options) => {
    try {
      const maker = new MakeModel();
      await maker.create(name, options);
    } catch (error) {
      console.error('Error creating model:', error);
      process.exit(1);
    }
  });

// Make view
program
  .command('view <name>')
  .description('Create a new view component')
  .option('-t, --type <type>', 'View type: list, form, show, or basic', 'list')
  .action(async (name, options) => {
    try {
      const maker = new MakeView();
      await maker.create(name, options.type);
    } catch (error) {
      console.error('Error creating view:', error);
      process.exit(1);
    }
  });

// Make resource (all MVC components)
program
  .command('resource <name>')
  .description('Create a complete resource (model, controller, and views)')
  .option('-t, --table <tableName>', 'Specify custom table name')
  .option('-f, --field <fieldName>', 'Specify primary field name', 'name')
  .action(async (name, options) => {
    try {
      console.log(`Creating resource: ${name}`);
      
      // Create model
      const modelMaker = new MakeModel();
      await modelMaker.create(name, options);
      
      // Create controller
      const controllerMaker = new MakeController();
      await controllerMaker.create(name);
      
      // Create views
      const viewMaker = new MakeView();
      await viewMaker.create(name, 'list');
      await viewMaker.create(name, 'form');
      await viewMaker.create(name, 'show');
      
      console.log('\\nResource created successfully!');
      console.log('\\nNext steps:');
      console.log(`1. Create migration: npm run migration:create create_${options.table || name.toLowerCase() + 's'}_table`);
      console.log(`2. Run migration: npm run migration:run`);
      console.log(`3. Add routes to app/Routes/web.js`);
      console.log(`4. Update your React router to include the new views`);
    } catch (error) {
      console.error('Error creating resource:', error);
      process.exit(1);
    }
  });

// List available commands
program
  .command('list')
  .description('List all available make commands')
  .action(() => {
    console.log('\\nAvailable make commands:');
    console.log('  make:controller <name>    - Create a new controller');
    console.log('  make:model <name>         - Create a new model');
    console.log('  make:view <name>          - Create a new view component');
    console.log('  make:resource <name>      - Create a complete resource (model, controller, views)');
    console.log('\\nOptions:');
    console.log('  --table, -t    Specify custom table name (for models)');
    console.log('  --field, -f    Specify primary field name (for models)');
    console.log('  --type, -t     View type: list, form, show, or basic (for views)');
    console.log('\\nExamples:');
    console.log('  npm run make:controller User');
    console.log('  npm run make:model Product --table products --field title');
    console.log('  npm run make:view User --type list');
    console.log('  npm run make:resource Category --table categories --field name');
  });

program.parse();
