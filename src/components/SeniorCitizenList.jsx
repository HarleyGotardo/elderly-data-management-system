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
        <div className="breadcrumb">
          <a href="#/dashboard">Dashboard</a> / Senior Citizens Registry
        </div>
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
          background: linear-gradient(135deg, #e8f4fc 0%, #cce5ff 50%, #b3d9ff 100%);
          min-height: 100vh;
        }

        .list-header {
          background: white;
          padding: 20px;
          border: 1px solid #dee2e6;
          margin-bottom: 30px;
        }

        .list-header h2 {
          margin: 0 0 10px 0;
          color: #1e3a8a;
          font-size: 24px;
          font-weight: 700;
        }
        
        .list-header .breadcrumb {
          color: #6c757d;
          font-size: 14px;
          margin-bottom: 15px;
        }
        
        .list-header .breadcrumb a {
          color: #3b82f6;
          text-decoration: none;
        }
        
        .list-header .breadcrumb a:hover {
          text-decoration: underline;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border: 1px solid #dee2e6;
          text-align: center;
          transition: transform 0.2s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.15);
        }

        .stat-card h3 {
          margin: 0 0 8px 0;
          color: #6c757d;
          font-size: 14px;
          font-weight: 600;
        }

        .stat-number {
          margin: 0;
          font-size: 32px;
          font-weight: 700;
          color: #1e3a8a;
        }

        .search-filters {
          background: white;
          padding: 20px;
          border: 1px solid #dee2e6;
          margin-bottom: 20px;
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
          cursor: pointer;
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
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .actions-bar button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }

        .actions-bar button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
        }

        .actions-bar button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .actions-bar button:first-child {
          background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
          color: white;
          border: 1px solid #1e8449;
        }

        .actions-bar button:nth-child(2),
        .actions-bar button:nth-child(3) {
          background: linear-gradient(135deg, #8e44ad 0%, #7d3c98 100%);
          color: white;
          border: 1px solid #6c3483;
        }

        .error {
          color: #721c24;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          padding: 15px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .table-container {
          background: white;
          border: 1px solid #dee2e6;
          overflow: hidden;
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

        .address-cell {
          max-width: 200px;
        }

        .address-cell div {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
        }

        .status-gray { 
          background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%); 
          color: #495057; 
          border: 1px solid #ced4da;
        }
        .status-blue { 
          background: linear-gradient(135deg, #d4e6f1 0%, #aed6f1 100%); 
          color: #1b4f72; 
          border: 1px solid #85c1e9;
        }
        .status-green { 
          background: linear-gradient(135deg, #d5f4e6 0%, #a9dfbf 100%); 
          color: #196f3d; 
          border: 1px solid #7dcea0;
        }
        .status-red { 
          background: linear-gradient(135deg, #fadbd8 0%, #f5b7b1 100%); 
          color: #922b21; 
          border: 1px solid #ec7063;
        }
        .status-orange { 
          background: linear-gradient(135deg, #fdebd0 0%, #f8c471 100%); 
          color: #935116; 
          border: 1px solid #f5b041;
        }
        .status-emerald { 
          background: linear-gradient(135deg, #d1f2eb 0%, #a3e4d7 100%); 
          color: #0e6655; 
          border: 1px solid #76d7c4;
        }
        .status-yellow { 
          background: linear-gradient(135deg, #fef9e7 0%, #fcf3cf 100%); 
          color: #7d6608; 
          border: 1px solid #f4d03f;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .action-buttons button {
          padding: 8px 16px;
          border: none;
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

        .edit-btn {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
          color: white;
          border: 1px solid #2471a3;
        }

        .submit-btn {
          background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
          color: white;
          border: 1px solid #d68910;
        }

        .delete-btn {
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
          color: white;
          border: 1px solid #a93226;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
          margin-top: 30px;
          padding: 20px;
          background: white;
          border: 1px solid #dee2e6;
        }

        .pagination span {
          color: #1e3a8a;
          font-weight: 600;
          font-size: 14px;
        }

        .pagination button {
          padding: 10px 20px;
          background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
          color: white;
          border: 1px solid #2c5aa0;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .pagination button:hover:not(:disabled) {
          background: linear-gradient(135deg, #357abd 0%, #2968a3 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }
        
        .pagination button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
        }

        .pagination button:disabled {
          background: #e9ecef;
          color: #6c757d;
          border-color: #ced4da;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        @media (max-width: 768px) {
          .senior-citizen-list {
            padding: 10px;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .search-bar {
            flex-direction: column;
          }
          
          .filter-bar {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .actions-bar {
            flex-direction: column;
          }
          
          .table-container {
            overflow-x: auto;
          }
          
          table {
            min-width: 700px;
          }
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
