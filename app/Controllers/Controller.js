class Controller {
  constructor() {
    this.request = null;
    this.response = null;
  }

  /**
   * Set request and response objects
   */
  setContext(request, response) {
    this.request = request;
    this.response = response;
  }

  /**
   * Send JSON response
   */
  json(data, status = 200) {
    return {
      status,
      data,
      headers: { 'Content-Type': 'application/json' }
    };
  }

  /**
   * Send success response
   */
  success(data = null, message = 'Success') {
    return this.json({
      success: true,
      message,
      data
    });
  }

  /**
   * Send error response
   */
  error(message = 'Error', status = 500, data = null) {
    return this.json({
      success: false,
      message,
      data
    }, status);
  }

  /**
   * Validate request data
   */
  validate(data, rules) {
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

      // Email validation
      if (rule.email && !this.isValidEmail(value)) {
        errors[field] = `${field} must be a valid email`;
      }

      // Min length validation
      if (rule.minLength && value.length < rule.minLength) {
        errors[field] = `${field} must be at least ${rule.minLength} characters`;
      }

      // Max length validation
      if (rule.maxLength && value.length > rule.maxLength) {
        errors[field] = `${field} must not exceed ${rule.maxLength} characters`;
      }

      // Numeric validation
      if (rule.numeric && isNaN(value)) {
        errors[field] = `${field} must be a number`;
      }

      // Min value validation
      if (rule.min !== undefined && parseFloat(value) < rule.min) {
        errors[field] = `${field} must be at least ${rule.min}`;
      }

      // Max value validation
      if (rule.max !== undefined && parseFloat(value) > rule.max) {
        errors[field] = `${field} must not exceed ${rule.max}`;
      }
    }

    return Object.keys(errors).length === 0 ? null : errors;
  }

  /**
   * Check if email is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get pagination parameters
   */
  getPaginationParams(defaultLimit = 10, maxLimit = 100) {
    const page = parseInt(this.request?.query?.page) || 1;
    const limit = Math.min(parseInt(this.request?.query?.limit) || defaultLimit, maxLimit);
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * Paginate results
   */
  paginate(items, total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: items,
      pagination: {
        current_page: page,
        per_page: limit,
        total: total,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
      }
    };
  }

  /**
   * Handle async errors
   */
  async handle(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('Controller error:', error);
      return this.error(error.message || 'Internal server error', 500);
    }
  }
}

export default Controller;
