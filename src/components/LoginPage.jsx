import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      await Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter both username and password',
      });
      return;
    }

    setLoading(true);
    
    try {
      const result = await login(username, password);
      
      if (result.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          text: 'Welcome back!',
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false
        });
        
        // Redirect to dashboard
        window.location.href = '#/dashboard';
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: result.error || 'Invalid credentials',
        });
      }
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: 'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8f4fc 0%, #cce5ff 50%, #b3d9ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid #dee2e6',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          textAlign: 'center',
          color: '#1e3a8a',
          marginBottom: '30px',
          fontSize: '24px',
          fontWeight: '700'
        }}>
          Senior Citizen System
        </h2>
        
        <h3 style={{
          textAlign: 'center',
          color: '#495057',
          marginBottom: '30px',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Login to Your Account
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#495057',
              fontSize: '14px'
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 15px',
                border: '1px solid #dee2e6',
                borderRadius: '0',
                fontSize: '14px',
                fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                background: 'white',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.1)',
                color: '#495057',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.1), 0 0 0 2px rgba(59, 130, 246, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#dee2e6';
                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.1)';
              }}
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#495057',
              fontSize: '14px'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 15px',
                border: '1px solid #dee2e6',
                borderRadius: '0',
                fontSize: '14px',
                fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                background: 'white',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.1)',
                color: '#495057',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.1), 0 0 0 2px rgba(59, 130, 246, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#dee2e6';
                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.1)';
              }}
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading 
                ? '#6c757d' 
                : 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
              color: 'white',
              border: '1px solid #2c5aa0',
              borderRadius: '0',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif"
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.background = 'linear-gradient(135deg, #357abd 0%, #2968a3 100%)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.background = 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              }
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{
          marginTop: '30px',
          padding: '15px',
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '0'
        }}>
          <p style={{
            margin: '0',
            fontSize: '12px',
            color: '#6c757d',
            textAlign: 'center'
          }}>
            Default Admin Account:<br />
            Username: <strong>admin</strong><br />
            Password: <strong>admin123</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
