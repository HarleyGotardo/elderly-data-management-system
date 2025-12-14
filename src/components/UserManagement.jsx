import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';

const UserManagement = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const query = roleFilter ? { role: roleFilter } : {};
      const response = await window.electronAPI.request({
        method: 'GET',
        url: '/api/users',
        query
      });
      
      if (response.data && response.data.success) {
        setUsers(response.data.data);
      } else {
        setError(response.data?.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowCreateModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowCreateModal(true);
  };

  const handleDeleteUser = async (user) => {
    if (user.id === currentUser.id) {
      await Swal.fire({
        icon: 'error',
        title: 'Cannot Delete',
        text: 'You cannot delete your own account',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Delete User',
      text: `Are you sure you want to delete user "${user.username}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc3545',
    });

    if (result.isConfirmed) {
      try {
        const response = await window.electronAPI.request({
          method: 'DELETE',
          url: `/api/users/${user.id}`
        });
        
        if (response.data && response.data.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: 'User has been deleted',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false
          });
          fetchUsers();
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.data?.message || 'Failed to delete user',
          });
        }
      } catch (err) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete user',
        });
      }
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && users.length === 0) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-management">
      <div className="user-header">
        <div className="breadcrumb">
          <a href="#/dashboard">Dashboard</a> / User Management
        </div>
        <h2>User Management</h2>
        <p>Manage system users and their roles</p>
      </div>

      {/* General Error */}
      {error && (
        <div className="error">{error}</div>
      )}

      {/* Search and Filters */}
      <div className="search-filters">
        <h3>Search & Filter</h3>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button>Search</button>
        </div>
        <div className="filter-bar">
          <span>Filter by Role:</span>
          <button 
            className={!roleFilter ? 'active' : ''}
            onClick={() => setRoleFilter('')}
          >
            All
          </button>
          <button 
            className={roleFilter === 'Client' ? 'active' : ''}
            onClick={() => setRoleFilter('Client')}
          >
            Client
          </button>
          <button 
            className={roleFilter === 'Admin' ? 'active' : ''}
            onClick={() => setRoleFilter('Admin')}
          >
            Admin
          </button>
          <button 
            className={roleFilter === 'Super Admin' ? 'active' : ''}
            onClick={() => setRoleFilter('Super Admin')}
          >
            Super Admin
          </button>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="actions-bar">
        <button className="btn-primary" onClick={handleCreateUser}>
          ➕ Add New User
        </button>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>
                  <span className={`status-badge status-${user.role.toLowerCase().replace(' ', '-')}`}>
                    {user.role}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-edit"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteUser(user)}
                      disabled={user.id === currentUser.id}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            No users found
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <UserForm
          user={editingUser}
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            setShowCreateModal(false);
            fetchUsers();
          }}
        />
      )}

      <style>{`
        .user-management {
          padding: 20px;
          background: linear-gradient(135deg, #e8f4fc 0%, #cce5ff 50%, #b3d9ff 100%);
          min-height: 100vh;
        }
        
        .user-management-header {
          background: white;
          padding: 20px;
          border-radius: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
          border: 1px solid #dee2e6;
        }

        .user-management-header h2 {
          margin: 0 0 10px 0;
          color: #1e3a8a;
          font-size: 24px;
          font-weight: 700;
        }
        
        .user-management-header .breadcrumb {
          color: #6c757d;
          font-size: 14px;
          margin-bottom: 15px;
        }
        
        .user-management-header .breadcrumb a {
          color: #3b82f6;
          text-decoration: none;
        }
        
        .user-management-header .breadcrumb a:hover {
          text-decoration: underline;
        }

        .search-filters {
          background: white;
          padding: 20px;
          border-radius: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
          border: 1px solid #dee2e6;
        }
        
        .search-filters h3 {
          margin: 0 0 15px 0;
          color: #1e3a8a;
          font-size: 18px;
          font-weight: 600;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 8px;
        }

        .search-bar {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .search-bar input {
          flex: 1;
          padding: 10px 15px;
          border: 1px solid #dee2e6;
          border-radius: 0;
          font-size: 14px;
          font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          transition: all 0.2s ease;
          background: white;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.15), inset 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .search-bar input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.15), inset 0 1px 2px rgba(0,0,0,0.1), 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        .search-bar button {
          padding: 10px 20px;
          background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
          color: white;
          border: 1px solid #2c5aa0;
          border-radius: 0;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .filter-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filter-bar span {
          font-weight: 600;
          color: #495057;
          font-size: 14px;
        }

        .filter-bar button {
          padding: 8px 16px;
          background: #f8f9fa;
          color: #212529;
          border: 1px solid #dee2e6;
          border-radius: 0;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .filter-bar button:hover {
          background: #e9ecef;
          border-color: #adb5bd;
          transform: translateY(-1px);
        }

        .filter-bar button.active {
          background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
          color: white;
          border-color: #2c5aa0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .actions-bar {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .actions-bar button {
          padding: 10px 20px;
          border: none;
          border-radius: 0;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .btn-primary {
          background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
          color: white;
          border: 1px solid #1e8449;
        }

        .user-table {
          background: white;
          border-radius: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
          border: 1px solid #dee2e6;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }

        th {
          background: #f8f9fa;
          font-weight: 700;
          color: #1e3a8a;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #dee2e6;
        }

        td {
          color: #495057;
          font-size: 14px;
          background: white !important;
        }

        tr {
          background: white !important;
        }

        tr:hover td {
          background: #f8f9fa !important;
        }

        .status-badge {
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-block;
          min-width: 80px;
          text-align: center;
          border-radius: 0;
        }

        .status-client { 
          background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%); 
          color: #495057; 
          border: 1px solid #ced4da;
        }
        .status-admin { 
          background: linear-gradient(135deg, #d4e6f1 0%, #aed6f1 100%); 
          color: #1b4f72; 
          border: 1px solid #85c1e9;
        }
        .status-super-admin { 
          background: linear-gradient(135deg, #d5f4e6 0%, #a9dfbf 100%); 
          color: #196f3d; 
          border: 1px solid #7dcea0;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .action-buttons button {
          padding: 8px 16px;
          border: none;
          border-radius: 0;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }

        .action-buttons button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .action-buttons button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
        }

        .action-buttons button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .btn-edit {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
          color: white;
          border: 1px solid #2471a3;
        }

        .btn-delete {
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
          color: white;
          border: 1px solid #a93226;
        }

        .btn-delete:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .error {
          color: #721c24;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          padding: 15px;
          border-radius: 0;
          margin-bottom: 20px;
          font-weight: 500;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
          font-size: 18px;
          color: #1e3a8a;
          background: white;
          border-radius: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border: 1px solid #dee2e6;
        }
      `}</style>
    </div>
  );
};

// User Form Component
const UserForm = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: '',
    role: user?.role || 'Client'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Username is required';
    if (!user && !formData.password) newErrors.password = 'Password is required';
    if (!formData.role) newErrors.role = 'Role is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    
    try {
      const method = user ? 'PUT' : 'POST';
      const url = user ? `/api/users/${user.id}` : '/api/users';
      
      const response = await window.electronAPI.request({
        method,
        url,
        body: formData
      });
      
      if (response.data && response.data.success) {
        await Swal.fire({
          icon: 'success',
          title: user ? 'Updated!' : 'Created!',
          text: `User has been ${user ? 'updated' : 'created'} successfully`,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false
        });
        onSave();
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.data?.message || 'Failed to save user',
        });
      }
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save user',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        width: '100%',
        maxWidth: '500px',
        border: '1px solid #dee2e6',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderRadius: '0'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          color: '#1e3a8a',
          fontSize: '20px',
          fontWeight: '700'
        }}>
          {user ? 'Edit User' : 'Create New User'}
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
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              style={{
                width: '100%',
                padding: '10px 15px',
                border: '1px solid #dee2e6',
                borderRadius: '0',
                fontSize: '14px',
                background: 'white',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.1)',
                color: '#495057'
              }}
              disabled={loading}
            />
            {errors.username && (
              <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>
                {errors.username}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#495057',
              fontSize: '14px'
            }}>
              Password {!user && '*'}{user && ' (leave blank to keep current)'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={{
                width: '100%',
                padding: '10px 15px',
                border: '1px solid #dee2e6',
                borderRadius: '0',
                fontSize: '14px',
                background: 'white',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.1)',
                color: '#495057'
              }}
              disabled={loading}
            />
            {errors.password && (
              <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>
                {errors.password}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#495057',
              fontSize: '14px'
            }}>
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              style={{
                width: '100%',
                padding: '10px 15px',
                border: '1px solid #dee2e6',
                borderRadius: '0',
                fontSize: '14px',
                background: 'white',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.1)',
                color: '#495057'
              }}
              disabled={loading}
            >
              <option value="Client">Client</option>
              <option value="Admin">Admin</option>
              <option value="Super Admin">Super Admin</option>
            </select>
            {errors.role && (
              <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>
                {errors.role}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: '#6c757d',
                color: 'white',
                border: '1px solid #5a6268',
                borderRadius: '0',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: loading ? '#6c757d' : 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
                color: 'white',
                border: '1px solid #2c5aa0',
                borderRadius: '0',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {loading ? 'Saving...' : (user ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;
