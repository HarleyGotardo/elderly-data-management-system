import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionData = localStorage.getItem('authSession');
        if (sessionData) {
          const { userId, username, role } = JSON.parse(sessionData);
          
          // Verify the session is still valid by checking with the backend
          const response = await window.electronAPI.request({
            method: 'GET',
            url: `/api/auth/verify/${userId}`
          });
          
          if (response.data && response.data.success) {
            setCurrentUser({ 
              id: userId, 
              username: response.data.data.username, 
              role: response.data.data.role 
            });
          } else {
            // Session invalid, clear it
            localStorage.removeItem('authSession');
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('authSession');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await window.electronAPI.request({
        method: 'POST',
        url: '/api/auth/login',
        body: { username, password }
      });
      
      if (response.data && response.data.success) {
        const { id, username: user, role } = response.data.data;
        const sessionData = { userId: id, username: user, role };
        
        // Store session in localStorage
        localStorage.setItem('authSession', JSON.stringify(sessionData));
        setCurrentUser({ id, username: user, role });
        
        return { success: true };
      } else {
        setError(response.data?.message || 'Login failed');
        return { success: false, error: response.data?.message || 'Login failed' };
      }
    } catch (err) {
      const errorMessage = 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authSession');
    setCurrentUser(null);
    setError(null);
  };

  const hasRole = (role) => {
    return currentUser && currentUser.role === role;
  };

  const hasRoleOrHigher = (role) => {
    if (!currentUser) return false;
    
    const roleHierarchy = {
      'Client': 0,
      'Admin': 1,
      'Super Admin': 2
    };
    
    const userRoleLevel = roleHierarchy[currentUser.role];
    const requiredRoleLevel = roleHierarchy[role];
    
    return userRoleLevel >= requiredRoleLevel;
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    hasRole,
    hasRoleOrHigher,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
