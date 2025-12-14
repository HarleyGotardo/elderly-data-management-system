class Router {
  constructor() {
    this.routes = new Map();
    this.middleware = [];
  }

  /**
   * Add a GET route
   */
  get(path, handler, middleware = []) {
    this.addRoute('GET', path, handler, middleware);
  }

  /**
   * Add a POST route
   */
  post(path, handler, middleware = []) {
    this.addRoute('POST', path, handler, middleware);
  }

  /**
   * Add a PUT route
   */
  put(path, handler, middleware = []) {
    this.addRoute('PUT', path, handler, middleware);
  }

  /**
   * Add a DELETE route
   */
  delete(path, handler, middleware = []) {
    this.addRoute('DELETE', path, handler, middleware);
  }

  /**
   * Add a route
   */
  addRoute(method, path, handler, middleware = []) {
    const key = `${method}:${path}`;
    this.routes.set(key, {
      method,
      path,
      handler,
      middleware: [...this.middleware, ...middleware]
    });
  }

  /**
   * Add global middleware
   */
  use(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * Find a matching route
   */
  findRoute(method, path) {
    // Direct match first
    const directKey = `${method}:${path}`;
    if (this.routes.has(directKey)) {
      return this.routes.get(directKey);
    }

    // Pattern matching for dynamic routes
    for (const [key, route] of this.routes) {
      if (route.method === method && this.pathMatches(path, route.path)) {
        return route;
      }
    }

    return null;
  }

  /**
   * Check if path matches route pattern
   */
  pathMatches(path, pattern) {
    const pathParts = path.split('/').filter(Boolean);
    const patternParts = pattern.split('/').filter(Boolean);

    if (pathParts.length !== patternParts.length) {
      return false;
    }

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      // Dynamic parameter
      if (patternPart.startsWith('{') && patternPart.endsWith('}')) {
        continue;
      }

      if (patternPart !== pathPart) {
        return false;
      }
    }

    return true;
  }

  /**
   * Extract parameters from path
   */
  extractParams(path, pattern) {
    const pathParts = path.split('/').filter(Boolean);
    const patternParts = pattern.split('/').filter(Boolean);
    const params = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith('{') && patternPart.endsWith('}')) {
        const paramName = patternPart.slice(1, -1);
        params[paramName] = pathPart;
      }
    }

    return params;
  }

  /**
   * Handle a request
   */
  async handle(request) {
    const { method, path, body, query } = request;
    
    // Parse query parameters from URL if not provided
    let cleanPath = path;
    let queryParams = query || {};
    
    if (path.includes('?')) {
      const [pathPart, queryString] = path.split('?');
      cleanPath = pathPart;
      
      // Parse query string into object
      const urlParams = new URLSearchParams(queryString);
      queryParams = Object.fromEntries(urlParams.entries());
    }
    
    const route = this.findRoute(method, cleanPath);
    
    if (!route) {
      return {
        status: 404,
        data: { success: false, message: 'Route not found' }
      };
    }

    try {
      // Extract route parameters
      const params = this.extractParams(cleanPath, route.path);
      request.params = params;
      request.query = queryParams;

      // Run middleware
      for (const middleware of route.middleware) {
        const result = await middleware(request);
        if (result) {
          return result; // Middleware returned a response
        }
      }

      // Execute route handler
      const controller = new route.handler.controller();
      controller.setContext(request, null);
      
      const result = await controller[route.handler.method](request);
      
      return result || {
        status: 200,
        data: { success: true, message: 'OK' }
      };

    } catch (error) {
      console.error('Route handling error:', error);
      return {
        status: 500,
        data: { success: false, message: 'Internal server error' }
      };
    }
  }

  /**
   * Get all routes
   */
  getRoutes() {
    return Array.from(this.routes.values()).map(route => ({
      method: route.method,
      path: route.path,
      handler: route.handler.constructor.name
    }));
  }
}

export default Router;
