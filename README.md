# Electron MVC Framework Template

A Laravel-inspired MVC architecture template for building desktop applications with Electron, React, and SQLite.

## 🚀 Features

- **MVC Architecture**: Models, Controllers, and Views separation
- **Active Record Pattern**: Easy database operations with Model base class
- **Database Migrations**: Version control for your database schema
- **Database Seeders**: Populate your database with initial data
- **CLI Commands**: Generate controllers, models, views, and resources
- **IPC Communication**: Secure communication between main and renderer processes
- **React Components**: Pre-built CRUD component templates
- **SQLite Database**: Lightweight, file-based database

## 📁 Project Structure

```
├── app/
│   ├── Commands/          # CLI command generators
│   │   ├── cli.js         # Main CLI entry point
│   │   ├── MakeController.js
│   │   ├── MakeModel.js
│   │   └── MakeView.js
│   ├── Controllers/       # Application controllers
│   │   └── Controller.js  # Base controller class
│   ├── Models/           # Application models
│   │   └── Model.js      # Base model class
│   ├── Routes/           # Route definitions
│   │   ├── Router.js     # Router class
│   │   └── web.js        # Web routes (empty - add your routes)
│   └── Views/            # React components (empty - create your views)
├── database/
│   ├── config.js         # Database configuration
│   ├── migrations/       # Migration files (empty)
│   ├── seeders/          # Seeder files (empty)
│   ├── Migration.js      # Migration manager
│   ├── Seeder.js         # Seeder manager
│   └── cli.js           # Database CLI
├── src/
│   ├── components/       # React components (empty)
│   ├── main.js          # Electron main process
│   ├── preload.js       # Preload script
│   ├── renderer.jsx     # React entry point
│   └── App.jsx          # Main React app
└── package.json
```

## 🛠️ Installation

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
