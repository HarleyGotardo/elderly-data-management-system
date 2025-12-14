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
        maxWidth: '450px',
        border: '1px solid #dee2e6',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          textAlign: 'center',
          color: '#1e3a8a',
          marginBottom: '25px',
          fontSize: '22px',
          fontWeight: '700',
          letterSpacing: '0.5px'
        }}>
          Elderly Data Management System
        </h2>
        
        <h3 style={{
          textAlign: 'center',
          color: '#333',
          marginBottom: '35px',
          fontSize: '16px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Login to Your Account
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '700',
              color: '#333',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
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
                transition: 'all 0.2s ease',
                background: 'white',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.1)',
                color: '#495057',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none';
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

          <div style={{ marginBottom: '35px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '700',
              color: '#333',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
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
                transition: 'all 0.2s ease',
                background: 'white',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.1)',
                color: '#495057',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none';
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
              padding: '14px',
              background: loading 
                ? '#666' 
                : '#1e3a8a',
              color: 'white',
              border: '2px solid #1e3a8a',
              borderRadius: '0',
              fontSize: '14px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'Courier New', monospace",
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxSizing: 'border-box',
              outline: 'none'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.background = '#fff';
                e.target.style.color = '#1e3a8a';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 0 #0f172a';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.background = '#1e3a8a';
                e.target.style.color = 'white';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
            onMouseDown={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </form>

        <div style={{
          marginTop: '35px',
          padding: '20px',
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '0'
        }}>
          <p style={{
            margin: '0',
            fontSize: '12px',
            color: '#495057',
            textAlign: 'center',
            fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
            lineHeight: '1.6'
          }}>
            <strong style={{ color: '#1e3a8a' }}>TEST USERS:</strong><br /><br />
            <strong>SUPER ADMIN:</strong><br />
            Username: <strong>superadmin</strong><br />
            Password: <strong>password123</strong><br /><br />
            <strong>ADMIN:</strong><br />
            Username: <strong>admin</strong><br />
            Password: <strong>password123</strong><br /><br />
            <strong>CLIENT:</strong><br />
            Username: <strong>client</strong><br />
            Password: <strong>password123</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
