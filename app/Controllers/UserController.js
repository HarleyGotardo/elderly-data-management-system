import Controller from './Controller.js';
import bcrypt from 'bcryptjs';
import db from '../../database/config.js';

class UserController extends Controller {
  /**
   * Get all users
   */
  async index(request) {
    try {
      const { role } = request.query || {};
      
      let query = 'SELECT id, username, role, created_at, updated_at FROM users';
      let params = [];
      
      if (role) {
        query += ' WHERE role = ?';
        params.push(role);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const stmt = db.prepare(query);
      const users = stmt.all(...params);
      
      return {
        status: 200,
        data: {
          success: true,
          data: users
        }
      };
    } catch (error) {
      console.error('Get users error:', error);
      return {
        status: 500,
        data: { success: false, message: 'Failed to fetch users' }
      };
    }
  }

  /**
   * Get a single user
   */
  async show(request) {
    try {
      const userId = parseInt(request.params.id);
      
      if (!userId) {
        return {
          status: 400,
          data: { success: false, message: 'User ID is required' }
        };
      }
      
      const stmt = db.prepare('SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?');
      const user = stmt.get(userId);
      
      if (!user) {
        return {
          status: 404,
          data: { success: false, message: 'User not found' }
        };
      }
      
      return {
        status: 200,
        data: {
          success: true,
          data: user
        }
      };
    } catch (error) {
      console.error('Get user error:', error);
      return {
        status: 500,
        data: { success: false, message: 'Failed to fetch user' }
      };
    }
  }

  /**
   * Create a new user
   */
  async store(request) {
    try {
      const { username, password, role } = request.body;
      
      if (!username || !password || !role) {
        return {
          status: 400,
          data: { success: false, message: 'Username, password, and role are required' }
        };
      }
      
      if (!['Client', 'Admin', 'Super Admin'].includes(role)) {
        return {
          status: 400,
          data: { success: false, message: 'Invalid role' }
        };
      }
      
      // Check if username already exists
      const checkStmt = db.prepare('SELECT id FROM users WHERE username = ?');
      const existingUser = checkStmt.get(username);
      
      if (existingUser) {
        return {
          status: 400,
          data: { success: false, message: 'Username already exists' }
        };
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const stmt = db.prepare(`
        INSERT INTO users (username, password_hash, role) 
        VALUES (?, ?, ?)
      `);
      
      const result = stmt.run(username, hashedPassword, role);
      
      return {
        status: 201,
        data: {
          success: true,
          data: {
            id: result.lastInsertRowid,
            username,
            role
          }
        }
      };
    } catch (error) {
      console.error('Create user error:', error);
      return {
        status: 500,
        data: { success: false, message: 'Failed to create user' }
      };
    }
  }

  /**
   * Update a user
   */
  async update(request) {
    try {
      const userId = parseInt(request.params.id);
      const { username, password, role } = request.body;
      
      if (!userId) {
        return {
          status: 400,
          data: { success: false, message: 'User ID is required' }
        };
      }
      
      if (!username || !role) {
        return {
          status: 400,
          data: { success: false, message: 'Username and role are required' }
        };
      }
      
      if (!['Client', 'Admin', 'Super Admin'].includes(role)) {
        return {
          status: 400,
          data: { success: false, message: 'Invalid role' }
        };
      }
      
      // Check if user exists
      const checkStmt = db.prepare('SELECT id FROM users WHERE id = ?');
      const existingUser = checkStmt.get(userId);
      
      if (!existingUser) {
        return {
          status: 404,
          data: { success: false, message: 'User not found' }
        };
      }
      
      // Check if username is taken by another user
      const usernameCheckStmt = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?');
      const usernameTaken = usernameCheckStmt.get(username, userId);
      
      if (usernameTaken) {
        return {
          status: 400,
          data: { success: false, message: 'Username already exists' }
        };
      }
      
      // Build update query
      let updateQuery = 'UPDATE users SET username = ?, role = ?';
      let updateParams = [username, role];
      
      if (password && password.trim() !== '') {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateQuery += ', password_hash = ?';
        updateParams.push(hashedPassword);
      }
      
      updateQuery += ' WHERE id = ?';
      updateParams.push(userId);
      
      const stmt = db.prepare(updateQuery);
      stmt.run(...updateParams);
      
      return {
        status: 200,
        data: {
          success: true,
          data: {
            id: userId,
            username,
            role
          }
        }
      };
    } catch (error) {
      console.error('Update user error:', error);
      return {
        status: 500,
        data: { success: false, message: 'Failed to update user' }
      };
    }
  }

  /**
   * Delete a user
   */
  async destroy(request) {
    try {
      const userId = parseInt(request.params.id);
      
      if (!userId) {
        return {
          status: 400,
          data: { success: false, message: 'User ID is required' }
        };
      }
      
      // Check if user exists
      const checkStmt = db.prepare('SELECT id FROM users WHERE id = ?');
      const existingUser = checkStmt.get(userId);
      
      if (!existingUser) {
        return {
          status: 404,
          data: { success: false, message: 'User not found' }
        };
      }
      
      // Delete user
      const stmt = db.prepare('DELETE FROM users WHERE id = ?');
      stmt.run(userId);
      
      return {
        status: 200,
        data: {
          success: true,
          message: 'User deleted successfully'
        }
      };
    } catch (error) {
      console.error('Delete user error:', error);
      return {
        status: 500,
        data: { success: false, message: 'Failed to delete user' }
      };
    }
  }
}

export default UserController;
