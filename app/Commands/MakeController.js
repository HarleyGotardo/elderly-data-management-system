const fs = require('fs');
const path = require('path');

class MakeController {
  constructor() {
    this.controllersPath = path.join(__dirname, '../Controllers');
  }

  async create(name) {
    const className = this.toPascalCase(name);
    const fileName = `${className}Controller.js`;
    const filePath = path.join(this.controllersPath, fileName);

    // Check if controller already exists
    if (fs.existsSync(filePath)) {
      console.log(`Controller ${className} already exists!`);
      return;
    }

    // Ensure Controllers directory exists
    if (!fs.existsSync(this.controllersPath)) {
      fs.mkdirSync(this.controllersPath, { recursive: true });
    }

    const template = `const Controller = require('./Controller');

class ${className}Controller extends Controller {
  /**
   * Display a listing of the resource.
   */
  async index() {
    return this.handle(async () => {
      // TODO: Implement index logic
      return this.success([], '${className} list retrieved successfully');
    });
  }

  /**
   * Display the specified resource.
   */
  async show() {
    return this.handle(async () => {
      const id = this.request.params.id;
      
      if (!id) {
        return this.error('ID is required', 400);
      }

      // TODO: Implement show logic
      return this.success({ id }, '${className} retrieved successfully');
    });
  }

  /**
   * Store a newly created resource in storage.
   */
  async store() {
    return this.handle(async () => {
      const data = this.request.body;
      
      // TODO: Validate input
      // TODO: Implement store logic
      return this.success(data, '${className} created successfully');
    });
  }

  /**
   * Update the specified resource in storage.
   */
  async update() {
    return this.handle(async () => {
      const id = this.request.params.id;
      const data = this.request.body;
      
      if (!id) {
        return this.error('ID is required', 400);
      }

      // TODO: Validate input
      // TODO: Implement update logic
      return this.success({ id, ...data }, '${className} updated successfully');
    });
  }

  /**
   * Remove the specified resource from storage.
   */
  async destroy() {
    return this.handle(async () => {
      const id = this.request.params.id;
      
      if (!id) {
        return this.error('ID is required', 400);
      }

      // TODO: Implement destroy logic
      return this.success(null, '${className} deleted successfully');
    });
  }
}

module.exports = ${className}Controller;
`;

    fs.writeFileSync(filePath, template);
    console.log(`Controller created: ${fileName}`);
    
    // Show next steps
    console.log('\\nNext steps:');
    console.log(`1. Add routes in app/Routes/web.js:`);
    console.log(`   router.get('/${name.toLowerCase()}s', { controller: ${className}Controller, method: 'index' });`);
    console.log(`   router.post('/${name.toLowerCase()}s', { controller: ${className}Controller, method: 'store' });`);
    console.log(`   router.get('/${name.toLowerCase()}s/{id}', { controller: ${className}Controller, method: 'show' });`);
    console.log(`   router.put('/${name.toLowerCase()}s/{id}', { controller: ${className}Controller, method: 'update' });`);
    console.log(`   router.delete('/${name.toLowerCase()}s/{id}', { controller: ${className}Controller, method: 'destroy' });`);
  }

  toPascalCase(str) {
    return str.split(/[-_]/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join('');
  }
}

module.exports = MakeController;
