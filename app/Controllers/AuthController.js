import Controller from './Controller.js';
import bcrypt from 'bcryptjs';
import db from '../../database/config.js';

class AuthController extends Controller {
  /**
   * Handle user login
   */
  async login(request) {
    try {
      const { username, password } = request.body;

      if (!username || !password) {
        return {
          status: 400,
          data: { success: false, message: 'Username and password are required' }
        };
      }

      // Find user by username
      const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
      const user = stmt.get(username);

      if (!user) {
        return {
          status: 401,
          data: { success: false, message: 'Invalid credentials' }
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        return {
          status: 401,
          data: { success: false, message: 'Invalid credentials' }
        };
      }

      // Return user data (excluding password hash)
      return {
        status: 200,
        data: {
          success: true,
          data: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        status: 500,
        data: { success: false, message: 'Login failed' }
      };
    }
  }

  /**
   * Verify user session
   */
  async verify(request) {
    try {
      const userId = parseInt(request.params.id);

      if (!userId) {
        return {
          status: 400,
          data: { success: false, message: 'User ID is required' }
        };
      }

      // Find user by ID
      const stmt = db.prepare('SELECT id, username, role FROM users WHERE id = ?');
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
          data: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        }
      };
    } catch (error) {
      console.error('Verify error:', error);
      return {
        status: 500,
        data: { success: false, message: 'Verification failed' }
      };
    }
  }

  /**
   * Get current user info
   */
  async me(request) {
    try {
      // This would typically use a token/session to identify user
      // For now, we'll implement it as a simple lookup
      const { userId } = request.body;

      if (!userId) {
        return {
          status: 400,
          data: { success: false, message: 'User ID is required' }
        };
      }

      const stmt = db.prepare('SELECT id, username, role FROM users WHERE id = ?');
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
      console.error('Me error:', error);
      return {
        status: 500,
        data: { success: false, message: 'Failed to get user info' }
      };
    }
  }
}

export default AuthController;
