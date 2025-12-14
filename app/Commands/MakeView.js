const fs = require('fs');
const path = require('path');

class MakeView {
  constructor() {
    this.viewsPath = path.join(__dirname, '../../src/components');
  }

  async create(name, type = 'list') {
    const className = this.toPascalCase(name);
    const fileName = `${className}${this.toPascalCase(type)}.jsx`;
    const filePath = path.join(this.viewsPath, fileName);

    // Check if view already exists
    if (fs.existsSync(filePath)) {
      console.log(`View ${fileName} already exists!`);
      return;
    }

    // Ensure components directory exists
    if (!fs.existsSync(this.viewsPath)) {
      fs.mkdirSync(this.viewsPath, { recursive: true });
    }

    let template = '';

    switch (type) {
      case 'list':
        template = this.getListTemplate(className);
        break;
      case 'form':
        template = this.getFormTemplate(className);
        break;
      case 'show':
        template = this.getShowTemplate(className);
        break;
      default:
        template = this.getBasicTemplate(className);
    }

    fs.writeFileSync(filePath, template);
    console.log(`View created: ${fileName}`);
    
    // Show next steps
    console.log('\\nNext steps:');
    console.log(`1. Import the component in your router or App.jsx`);
    console.log(`2. Add the API endpoints in your controller`);
    console.log(`3. Update the view with your specific fields`);
  }

  getListTemplate(className) {
    return `import React, { useState, useEffect } from 'react';

const ${className}List = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchItems();
  }, [currentPage]);

  const fetchItems = async (page = currentPage) => {
    try {
      setLoading(true);
      const response = await window.electronAPI.request({
        method: 'GET',
        path: '/${className.toLowerCase()}s',
        query: { page, limit: 10 }
      });
      
      if (response.success) {
        setItems(response.data.data);
        setTotalPages(response.data.pagination.total_pages);
        setError('');
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await window.electronAPI.request({
        method: 'DELETE',
        path: \`/\${className.toLowerCase()}s/\${id}\`
      });
      
      if (response.success) {
        fetchItems(currentPage);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  if (loading && items.length === 0) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="${className.toLowerCase()}-list">
      <h2>${className}s</h2>
      
      {error && <div className="error">{error}</div>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>
                  <button onClick={() => handleDelete(item.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{\`
        .${className.toLowerCase()}-list {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }

        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        th {
          background: #f8f9fa;
          font-weight: bold;
        }

        tr:hover {
          background: #f8f9fa;
        }

        .error {
          color: #dc3545;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .loading {
          text-align: center;
          padding: 40px;
          font-size: 18px;
          color: #6c757d;
        }
      \`}</style>
    </div>
  );
};

export default ${className}List;
`;
  }

  getFormTemplate(className) {
    return `import React, { useState, useEffect } from 'react';

const ${className}Form = ({ itemId, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (itemId) {
      setIsEditing(true);
      fetchItem();
    }
  }, [itemId]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const response = await window.electronAPI.request({
        method: 'GET',
        path: \`/\${className.toLowerCase()}s/\${itemId}\`
      });
      
      if (response.success) {
        setFormData({
          name: response.data.name
        });
      } else {
        setErrors({ general: response.message });
      }
    } catch (err) {
      setErrors({ general: 'Failed to fetch data' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const requestData = {
        method: isEditing ? 'PUT' : 'POST',
        path: isEditing ? \`/\${className.toLowerCase()}s/\${itemId}\` : \`/\${className.toLowerCase()}s\`,
        body: formData
      };

      const response = await window.electronAPI.request(requestData);
      
      if (response.success) {
        if (onSave) {
          onSave(response.data);
        }
      } else {
        setErrors(response.data || { general: response.message });
      }
    } catch (err) {
      setErrors({ general: 'Failed to save' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="${className.toLowerCase()}-form">
      <h2>{isEditing ? 'Edit' : 'Create'} ${className}</h2>
      
      {errors.general && <div className="error">{errors.general}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
          </button>
        </div>
      </form>

      <style jsx>{\`
        .${className.toLowerCase()}-form {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }

        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .form-actions button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .form-actions button[type="button"] {
          background: #6c757d;
          color: white;
        }

        .form-actions button[type="submit"] {
          background: #007bff;
          color: white;
        }

        .error {
          color: #dc3545;
          background: #f8d7da;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .loading {
          text-align: center;
          padding: 40px;
        }
      \`}</style>
    </div>
  );
};

export default ${className}Form;
`;
  }

  getShowTemplate(className) {
    return `import React, { useState, useEffect } from 'react';

const ${className}Show = ({ itemId }) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (itemId) {
      fetchItem();
    }
  }, [itemId]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const response = await window.electronAPI.request({
        method: 'GET',
        path: \`/\${className.toLowerCase()}s/\${itemId}\`
      });
      
      if (response.success) {
        setItem(response.data);
        setError('');
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to fetch item');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!item) {
    return <div className="not-found">Item not found</div>;
  }

  return (
    <div className="${className.toLowerCase()}-show">
      <h2>${className} Details</h2>
      
      <div className="item-details">
        <div className="detail-row">
          <span className="label">ID:</span>
          <span className="value">{item.id}</span>
        </div>
        <div className="detail-row">
          <span className="label">Name:</span>
          <span className="value">{item.name}</span>
        </div>
        <div className="detail-row">
          <span className="label">Created:</span>
          <span className="value">{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <style jsx>{\`
        .${className.toLowerCase()}-show {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .item-details {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .detail-row {
          display: flex;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .label {
          font-weight: bold;
          width: 150px;
          color: #666;
        }

        .value {
          flex: 1;
        }

        .loading, .error, .not-found {
          text-align: center;
          padding: 40px;
          font-size: 18px;
        }

        .error {
          color: #dc3545;
        }

        .not-found {
          color: #6c757d;
        }
      \`}</style>
    </div>
  );
};

export default ${className}Show;
`;
  }

  getBasicTemplate(className) {
    return `import React from 'react';

const ${className} = () => {
  return (
    <div className="${className.toLowerCase()}">
      <h2>${className} Component</h2>
      <p>This is a basic ${className} component.</p>
      
      <style jsx>{\`
        .${className.toLowerCase()} {
          padding: 20px;
        }
      \`}</style>
    </div>
  );
};

export default ${className};
`;
  }

  toPascalCase(str) {
    return str.split(/[-_]/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join('');
  }
}

module.exports = MakeView;
