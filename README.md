# Elderly Data Management System

An Electron-based desktop application for managing senior citizen records with authentication and user management features.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm (comes with Node.js)

### Installation & Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd elderly-data-management-system
```

2. **Install dependencies:**
```bash
npm install
```

3. **Rebuild native modules for Electron:**
```bash
npm run rebuild:electron
```

4. **Set up the database:**
```bash
# Fresh migration (drops all tables and recreates them)
npm run migrate:fresh

# Seed the database with test data (users and sample senior citizens)
npm run db:seed
```

5. **Start the application:**
```bash
npm start
```

## 📋 Default Login Credentials

After running the seeders, you can use these accounts to log in:

| Role | Username | Password |
|------|----------|----------|
| Super Admin | superadmin | password123 |
| Admin | admin | password123 |
| Client | client | password123 |

## 📁 Project Structure

```
elderly-data-management-system/
├── app/                          # Backend application logic
│   ├── Controllers/              # API Controllers
│   │   ├── AuthController.js     # Authentication logic
│   │   ├── SeniorCitizenController.js # Senior citizen CRUD
│   │   └── UserController.js     # User management
│   ├── Models/                   # Data models
│   └── Routes/                   # API routes
│       ├── Router.js             # Route handler class
│       └── web.js                # Route definitions
├── database/                     # Database related files
│   ├── config.js                 # Database configuration
│   ├── migrations/               # Migration files
│   │   ├── 2025-12-14T08-06-04_create_senior_citizens_table.js
│   │   └── 2025-12-14T19-38-00_create_users_table.js
│   ├── seeders/                  # Seeder files
│   │   ├── DatabaseSeeder.js     # Master seeder
│   │   ├── UserSeeder.js         # User data seeder
│   │   └── SeniorCitizenSeeder.js # Senior citizen data seeder
│   ├── autoMigrate.js            # Auto-migration script (manual use only)
│   ├── migrateFresh.js            # Fresh migration script
│   ├── Migration.js              # Migration class
│   ├── Seeder.js                 # Seeder class
│   └── cli.js                    # Database CLI tool
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── LoginPage.jsx         # Login page
│   │   ├── SeniorCitizenForm.jsx # Senior citizen form
│   │   ├── SeniorCitizenList.jsx # Senior citizen list
│   │   └── UserManagement.jsx    # User management interface
│   ├── contexts/                 # React contexts
│   │   └── AuthContext.jsx       # Authentication context
│   ├── App.jsx                   # Main application component
│   ├── main.js                   # Electron main process
│   └── preload.js                # Electron preload script
└── resources/                    # Application resources
    └── icon.png                  # Application icon
```

## 🛠️ Available Scripts

### Database Operations
- `npm run migrate:fresh` - Drop all tables, recreate them, and seed with initial data
- `npm run db:seed` - Run all seeders to populate database with test data
- `npm run db:migrate` - Run migrations without seeding
- `npm run migration:run` - Run pending migrations
- `npm run migration:rollback` - Rollback last batch of migrations
- `npm run migration:reset` - Rollback all migrations

### Development
- `npm start` - Start the application in development mode
- `npm run rebuild:electron` - Rebuild native modules for Electron
- `npm run rebuild:node` - Rebuild native modules for Node.js

### Code Generation
- `npm run make:controller <name>` - Create a new controller
- `npm run make:model <name>` - Create a new model
- `npm run make:view <name>` - Create a new view
- `npm run make:resource <name>` - Create a full resource (controller, model, views)

## 📊 Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `password_hash` - Hashed password
- `role` - User role (Client, Admin, Super Admin)
- `created_at`, `updated_at` - Timestamps

### Senior Citizens Table
Complete senior citizen information including:
- Personal details (name, birth date, sex, civil status)
- Address information
- Representative contacts
- Beneficiary information
- Status tracking (Draft, Pending, Approved, etc.)

## 🔧 Development Guidelines

### Adding New Features

1. **Controllers**: Create in `app/Controllers/`
2. **Routes**: Register in `app/Routes/web.js`
3. **Components**: Create in `src/components/`
4. **Database Changes**: Create migration in `database/migrations/`

### Database Migrations

Create a new migration:
```bash
npm run migration:create <migration_name>
```

Run migrations:
```bash
npm run migration:run
```

### Database Seeders

Create a new seeder:
```bash
npm run seeder:create <seeder_name>
```

Run seeders:
```bash
npm run seeder:run
```

## 🔧 Troubleshooting

### Common Issues

1. **"Cannot find module" or "NODE_MODULE_VERSION mismatch" error**
   - Run: `npm run rebuild:electron`
   - This rebuilds native modules for Electron's Node version

2. **Database not found or empty**
   - Run: `npm run migrate:fresh`
   - This creates the database and runs all migrations

3. **No test data or users**
   - Run: `npm run db:seed`
   - This populates the database with sample data

### Resetting the Database

To completely reset and reseed the database:
```bash
npm run migrate:fresh
npm run db:seed
```

## � Quick Setup for New Developers

For the fastest setup after cloning, run this single command:
```bash
npm run setup
```

This command will:
- Install all dependencies
- Rebuild native modules for Electron
- Create and migrate the database
- Seed with test data (users and sample senior citizens)

After setup completes, simply run:
```bash
npm start
```

## �📝 Important Notes

- The application uses SQLite for data storage (database file: `database/database.sqlite`)
- Passwords are hashed using bcryptjs
- Authentication uses JWT tokens stored in localStorage
- **Database setup is required before first run** - see installation steps
- All database operations are handled through the custom CLI tool

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly:
   - Run migrations
   - Test seeders
   - Verify all features work
5. Submit a pull request

## 📄 License

MIT License

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## 📋 Available Commands

### Database Commands

```bash
# Create a new migration
npm run migration:create create_users_table

# Run all pending migrations
npm run migration:run

# Rollback the last batch of migrations
npm run migration:rollback

# Reset all migrations
npm run migration:reset

# Create a new seeder
npm run seeder:create create_sample_users

# Run all seeders
npm run seeder:run

# Reset all seeders
npm run seeder:reset

# Fresh database (drop all and re-run migrations)
npm run db:fresh

# Run migrations and seeders
npm run db:migrate

# Run seeders only
npm run db:seed
```

### Make Commands (Scaffolding)

```bash
# Create a new controller
npm run make:controller User

# Create a new model
npm run make:model Product --table products --field title

# Create a new view component
npm run make:view User --type list  # Options: list, form, show, basic

# Create a complete resource (model, controller, and all views)
npm run make:resource Category --table categories --field name

# List all make commands
npm run make list
```

### Application Commands

```bash
# Start the development server
npm start

# Package the application
npm run package

# Create distributable
npm run make
```

## 🏗️ Creating a New Resource

### Step 1: Create the Resource

```bash
npm run make:resource Product --table products --field title
```

This creates:
- `app/Models/Product.js` - Model with active record methods
- `app/Controllers/ProductController.js` - Controller with CRUD methods
- `src/components/ProductList.jsx` - List view component
- `src/components/ProductForm.jsx` - Form view component
- `src/components/ProductShow.jsx` - Detail view component

### Step 2: Create Migration

```bash
npm run migration:create create_products_table
```

Edit the generated migration file:

```javascript
// database/migrations/YYYY-MM-DDTHH-MM-SS_create_products_table.js
const db = require('../config');

module.exports = {
  async up() {
    const createTable = `
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    db.exec(createTable);
  },

  async down() {
    db.exec('DROP TABLE IF EXISTS products');
  }
};
```

### Step 3: Run Migration

```bash
npm run migration:run
```

### Step 4: Add Routes

Edit `app/Routes/web.js`:

```javascript
const router = require('./Router');
const ProductController = require('../Controllers/ProductController');

// Add product routes
router.get('/products', { controller: ProductController, method: 'index' });
router.get('/products/{id}', { controller: ProductController, method: 'show' });
router.post('/products', { controller: ProductController, method: 'store' });
router.put('/products/{id}', { controller: ProductController, method: 'update' });
router.delete('/products/{id}', { controller: ProductController, method: 'destroy' });
```

### Step 5: Update Controller

Edit `app/Controllers/ProductController.js` to implement your business logic:

```javascript
const Controller = require('./Controller');
const Product = require('../Models/Product');

class ProductController extends Controller {
  async index() {
    return this.handle(async () => {
      const { page, limit, offset } = this.getPaginationParams();
      
      const products = Product.limit(limit, offset);
      const total = Product.count();
      
      const paginatedProducts = this.paginate(products, total, page, limit);
      
      return this.success(paginatedProducts, 'Products retrieved successfully');
    });
  }

  // ... implement other methods
}

module.exports = ProductController;
```

### Step 6: Update Model

Edit `app/Models/Product.js` to add custom methods:

```javascript
const Model = require('./Model');

class Product extends Model {
  static get tableName() {
    return 'products';
  }

  static findByTitle(title) {
    // Custom find method
  }

  getFormattedPrice() {
    return `$${this.get('price')}`;
  }
}

module.exports = Product;
```

## 📝 Working with Models

### Basic Operations

```javascript
const User = require('./app/Models/User');

// Find all users
const users = User.all();

// Find by ID
const user = User.find(1);

// Create new user
const newUser = User.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

// Update user
user.update({ age: 31 });

// Delete user
user.delete();

// Query with conditions
const adults = User.where('age', '>=', 18);

// Order by
const sortedUsers = User.orderBy('name', 'ASC');

// Limit results
const recentUsers = User.limit(10);
```

### Custom Queries

```javascript
// Raw SQL query
const results = User.query(`
  SELECT * FROM users 
  WHERE age BETWEEN ? AND ? 
  ORDER BY name
`, [18, 65]);

// Get count
const totalUsers = User.count();
```

## 🎨 Working with Views

### Using Components

```jsx
import UserList from './components/UserList';
import UserForm from './components/UserForm';

// In your router or App.jsx
<Route path="/users" component={UserList} />
<Route path="/users/create" component={UserForm} />
```

### Making API Calls

```jsx
// GET request
const response = await window.electronAPI.request({
  method: 'GET',
  path: '/users',
  query: { page: 1, limit: 10 }
});

// POST request
const response = await window.electronAPI.request({
  method: 'POST',
  path: '/users',
  body: { name: 'John', email: 'john@example.com' }
});

// PUT request
const response = await window.electronAPI.request({
  method: 'PUT',
  path: '/users/1',
  body: { name: 'John Updated' }
});

// DELETE request
const response = await window.electronAPI.request({
  method: 'DELETE',
  path: '/users/1'
});
```

## 🔧 Configuration

### Database Configuration

Edit `database/config.js`:

```javascript
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

module.exports = db;
```

### Electron Configuration

The main process is configured in `src/main.js`. It includes:
- IPC handlers for API requests
- Window management
- Security settings

## 🧪 Testing

Run your application:

```bash
npm start
```

The app will open with:
- Users list at `#/users`
- Create user form at `#/users/create`
- Edit user form at `#/users/edit/1`

## 📦 Building for Production

```bash
# Package the application
npm run package

# Create installer
npm run make
```

The distributable will be in `out/` directory.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License

## 🆘 Troubleshooting

### Common Issues

1. **Migration not found**
   - Ensure migration files are in `database/migrations/`
   - Check file naming convention

2. **IPC communication error**
   - Verify preload.js is properly configured
   - Check if routes are registered in `app/Routes/web.js`

3. **Database locked**
   - Close all database connections
   - Restart the application

4. **Component not rendering**
   - Check import paths
   - Verify component exports

### Debug Mode

Enable DevTools in `src/main.js`:

```javascript
mainWindow.webContents.openDevTools();
```

## 📚 Advanced Topics

### Middleware

Add middleware to routes:

```javascript
// Authentication middleware
const authMiddleware = async (request) => {
  if (!request.session.user) {
    return { status: 401, data: { message: 'Unauthorized' } };
  }
};

router.get('/admin/users', { 
  controller: AdminController, 
  method: 'index',
  middleware: [authMiddleware]
});
```

### Custom Validation

In your controller:

```javascript
async store() {
  return this.handle(async () => {
    const data = this.request.body;
    
    // Custom validation
    const rules = {
      email: { required: true, email: true },
      age: { required: false, numeric: true, min: 0, max: 150 }
    };
    
    const errors = this.validate(data, rules);
    if (errors) {
      return this.error('Validation failed', 422, errors);
    }
    
    // Process data...
  });
}
```

### Database Transactions

```javascript
const db = require('../database/config');

const transaction = db.transaction(() => {
  // Multiple operations
  user1.save();
  user2.save();
  user3.save();
});

transaction(); // All or nothing
```

Happy coding! 🎉
