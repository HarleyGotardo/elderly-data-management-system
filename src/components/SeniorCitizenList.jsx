import React, { useState, useEffect } from 'react';

const SeniorCitizenList = () => {
  // Utility function to calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Utility function to format full name from parts
  const formatFullName = (senior) => {
    const parts = [
      senior.last_name,
      senior.first_name,
      senior.middle_name,
      senior.ext_name
    ].filter(Boolean);
    
    // Format as "Last Name, First Name Middle Name Ext"
    if (parts.length === 0) return '-';
    const lastName = senior.last_name || '';
    const firstName = senior.first_name || '';
    const middleName = senior.middle_name || '';
    const extName = senior.ext_name || '';
    
    let fullName = lastName;
    if (firstName) {
      fullName += ', ' + firstName;
    }
    if (middleName) {
      fullName += ' ' + middleName;
    }
    if (extName) {
      fullName += ' ' + extName;
    }
    return fullName || '-';
  };
  const [seniorCitizens, setSeniorCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchSeniorCitizens();
    fetchStats();
  }, [currentPage, statusFilter]);

  const fetchSeniorCitizens = async (page = currentPage) => {
    try {
      setLoading(true);
      const query = { page, limit: 10 };
      
      if (searchTerm) {
        query.search = searchTerm;
      }
      
      if (statusFilter) {
        query.status = statusFilter;
      }
      
      const response = await window.electronAPI.request({
        method: 'GET',
        path: '/senior-citizens',
        query
      });
      
      if (response.data && response.data.success) {
        setSeniorCitizens(response.data.data.data || []);
        setTotalPages(response.data.data.pagination?.total_pages || 1);
        setError('');
      } else {
        setError(response.data?.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Failed to fetch senior citizens');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await window.electronAPI.request({
        method: 'GET',
        path: '/senior-citizens/stats'
      });
      
      if (response.data && response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleSearch = async () => {
    setCurrentPage(1);
    fetchSeniorCitizens(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this senior citizen record?')) {
      return;
    }

    try {
      const response = await window.electronAPI.request({
        method: 'DELETE',
        path: `/senior-citizens/${id}`
      });
      
      if (response.data && response.data.success) {
        fetchSeniorCitizens(currentPage);
        fetchStats();
      } else {
        setError(response.data?.message || 'Operation failed');
      }
    } catch (err) {
      setError('Failed to delete senior citizen');
    }
  };

  const handleSubmit = async (id) => {
    if (!confirm('Submit this record for admin review? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await window.electronAPI.request({
        method: 'POST',
        path: `/senior-citizens/${id}/submit`
      });
      
      if (response.data && response.data.success) {
        fetchSeniorCitizens(currentPage);
        fetchStats();
      } else {
        setError(response.data?.message || 'Operation failed');
      }
    } catch (err) {
      setError('Failed to submit record');
    }
  };

  const handleExport = async () => {
    try {
      const query = {};
      
      if (statusFilter) {
        query.status = statusFilter;
      }
      
      const response = await window.electronAPI.request({
        method: 'GET',
        path: '/senior-citizens/export',
        query
      });
      
      if (response.data && response.data.success) {
        // Create and download file
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `senior-citizens-export-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      } else {
        setError(response.data?.message || 'Export failed');
      }
    } catch (err) {
      setError('Failed to export data');
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        const response = await window.electronAPI.request({
          method: 'POST',
          path: '/senior-citizens/import',
          body: data
        });
        
        if (response.data && response.data.success) {
          alert(`Import completed. Updated ${response.data.data?.updated_count || 0} records.`);
          fetchSeniorCitizens(currentPage);
          fetchStats();
        } else {
          setError(response.data?.message || 'Import failed');
        }
      } catch (err) {
        setError('Failed to import data');
      }
    };
    
    input.click();
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getStatusBadge = (status) => {
    if (!status) {
      return <span className="status-badge status-gray">Unknown</span>;
    }
    
    const colors = {
      'DRAFT': 'gray',
      'PENDING_ADMIN_REVIEW': 'blue',
      'CLEAN': 'green',
      'DUPLICATE': 'red',
      'SUSPECTED': 'orange',
      'APPROVED': 'emerald',
      'HOLD': 'yellow',
      'DENIED': 'red'
    };
    
    return (
      <span className={`status-badge status-${colors[status] || 'gray'}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  if (loading && seniorCitizens.length === 0) {
    return <div className="loading">Loading senior citizens...</div>;
  }

  return (
    <div className="senior-citizen-list">
      <div className="list-header">
        <h2>Senior Citizens Registry</h2>
        
        {/* Stats Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total</h3>
              <p className="stat-number">{stats.total}</p>
            </div>
            <div className="stat-card">
              <h3>Draft</h3>
              <p className="stat-number">{stats.by_status.DRAFT || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Pending Review</h3>
              <p className="stat-number">{stats.by_status.PENDING_ADMIN_REVIEW || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Approved</h3>
              <p className="stat-number">{stats.by_status.APPROVED || 0}</p>
            </div>
            {stats.vulnerable_sectors && (
              <>
                <div className="stat-card">
                  <h3>Indigenous</h3>
                  <p className="stat-number">{stats.vulnerable_sectors.ip}</p>
                </div>
                <div className="stat-card">
                  <h3>PWD</h3>
                  <p className="stat-number">{stats.vulnerable_sectors.pwd}</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Search and Filters */}
      <div className="search-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>Search</button>
          <button onClick={() => { setSearchTerm(''); setCurrentPage(1); fetchSeniorCitizens(1); }}>Clear</button>
        </div>
        
        <div className="filter-bar">
          <span>Filter by Status:</span>
          <button 
            className={statusFilter === '' ? 'active' : ''}
            onClick={() => handleStatusFilter('')}
          >
            All
          </button>
          <button 
            className={statusFilter === 'DRAFT' ? 'active' : ''}
            onClick={() => handleStatusFilter('DRAFT')}
          >
            Draft
          </button>
          <button 
            className={statusFilter === 'PENDING_ADMIN_REVIEW' ? 'active' : ''}
            onClick={() => handleStatusFilter('PENDING_ADMIN_REVIEW')}
          >
            Pending Review
          </button>
          <button 
            className={statusFilter === 'APPROVED' ? 'active' : ''}
            onClick={() => handleStatusFilter('APPROVED')}
          >
            Approved
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="actions-bar">
        <button onClick={() => window.location.href = '#/senior-citizens/create'}>
          Add New Senior Citizen
        </button>
        <button onClick={handleExport}>
          Export Data
        </button>
        <button onClick={handleImport}>
          Import Updates
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="error">{error}</div>}

      {/* Senior Citizens Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>OSCA ID</th>
              <th>Full Name</th>
              <th>Age</th>
              <th>Sex</th>
              <th>Address</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {seniorCitizens.map((senior) => (
              <tr key={senior.id}>
                <td>{senior.osca_id}</td>
                <td>{formatFullName(senior)}</td>
                <td>{calculateAge(senior.date_of_birth) || '-'}</td>
                <td>{senior.sex}</td>
                <td className="address-cell">
                  <div title={senior.full_address}>
                    {senior.barangay}, {senior.municipality}
                  </div>
                </td>
                <td>{getStatusBadge(senior.status)}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => window.location.href = `#/senior-citizens/edit/${senior.id}`}
                      className="edit-btn"
                      disabled={senior.locked === 1}
                    >
                      Edit
                    </button>
                    {senior.status === 'DRAFT' && (
                      <button 
                        onClick={() => handleSubmit(senior.id)}
                        className="submit-btn"
                      >
                        Submit
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(senior.id)}
                      className="delete-btn"
                      disabled={senior.locked === 1 || senior.status !== 'DRAFT'}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      <style>{`
        .senior-citizen-list {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .list-header {
          margin-bottom: 30px;
        }

        .list-header h2 {
          margin-bottom: 20px;
          color: #2c3e50;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: #fff;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }

        .stat-card h3 {
          margin: 0 0 5px 0;
          color: #7f8c8d;
          font-size: 14px;
        }

        .stat-number {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
          color: #2c3e50;
        }

        .search-filters {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .search-bar {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .search-bar input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .search-bar button {
          padding: 10px 20px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .search-bar button:hover {
          background: #2980b9;
        }

        .filter-bar {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .filter-bar span {
          font-weight: bold;
          color: #555;
        }

        .filter-bar button {
          padding: 8px 16px;
          background: #ecf0f1;
          border: 1px solid #bdc3c7;
          border-radius: 4px;
          cursor: pointer;
        }

        .filter-bar button:hover {
          background: #d5dbdb;
        }

        .filter-bar button.active {
          background: #3498db;
          color: white;
          border-color: #3498db;
        }

        .actions-bar {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .actions-bar button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .actions-bar button:first-child {
          background: #27ae60;
          color: white;
        }

        .actions-bar button:nth-child(2),
        .actions-bar button:nth-child(3) {
          background: #8e44ad;
          color: white;
        }

        .actions-bar button:hover {
          opacity: 0.9;
        }

        .error {
          color: #e74c3c;
          background: #fdf2f2;
          border: 1px solid #f5c6cb;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .table-container {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ecf0f1;
        }

        th {
          background: #f8f9fa;
          font-weight: bold;
          color: #2c3e50;
        }

        tr:hover {
          background: #f8f9fa;
        }

        .address-cell {
          max-width: 200px;
        }

        .address-cell div {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .status-gray { background: #ecf0f1; color: #7f8c8d; }
        .status-blue { background: #d4e6f1; color: #2874a6; }
        .status-green { background: #d5f4e6; color: #239b56; }
        .status-red { background: #fadbd8; color: #c0392b; }
        .status-orange { background: #fdebd0; color: #dc7633; }
        .status-emerald { background: #d1f2eb; color: #148f77; }
        .status-yellow { background: #fef9e7; color: #f39c12; }

        .action-buttons {
          display: flex;
          gap: 5px;
        }

        .action-buttons button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .action-buttons button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .edit-btn {
          background: #3498db;
          color: white;
        }

        .submit-btn {
          background: #f39c12;
          color: white;
        }

        .delete-btn {
          background: #e74c3c;
          color: white;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          margin-top: 20px;
        }

        .pagination button {
          padding: 8px 16px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .pagination button:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }

        .loading {
          text-align: center;
          padding: 40px;
          font-size: 18px;
          color: #7f8c8d;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .search-bar {
            flex-direction: column;
          }

          .filter-bar {
            flex-wrap: wrap;
          }

          .actions-bar {
            flex-direction: column;
          }

          .table-container {
            overflow-x: auto;
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default SeniorCitizenList;
