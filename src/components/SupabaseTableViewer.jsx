import React, { useState, useEffect } from 'react';
import SupabaseService from '../services/SupabaseService';

const SupabaseTableViewer = () => {
  const [selectedTable, setSelectedTable] = useState('senior_citizens');
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({});
  const [editingRecord, setEditingRecord] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const supabaseService = new SupabaseService();
  
  const tables = [
    'senior_citizens',
    'duplicate_records',
    'lgu',
    'senior_citizen_requirements',
    'sync_logs'
  ];

  // Load table data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await supabaseService.fetchTable(
        selectedTable,
        filters,
        page,
        50
      );
      
      setData(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      
      // Get column structure
      const structure = await supabaseService.getTableStructure(selectedTable);
      setColumns(structure);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedTable, page, filters]);

  // Handle filter change
  const handleFilterChange = (column, operator, value) => {
    setFilters(prev => ({
      ...prev,
      [column]: { operator, value }
    }));
  };

  // Clear filter
  const clearFilter = (column) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      await supabaseService.deleteRecord(selectedTable, id);
      loadData();
    } catch (err) {
      alert('Error deleting record: ' + err.message);
    }
  };

  // Handle edit
  const handleEdit = (record) => {
    setEditingRecord({ ...record });
  };

  // Handle update
  const handleUpdate = async () => {
    try {
      await supabaseService.updateRecord(
        selectedTable,
        editingRecord.id,
        editingRecord
      );
      setEditingRecord(null);
      loadData();
    } catch (err) {
      alert('Error updating record: ' + err.message);
    }
  };

  // Handle create
  const handleCreate = async (newRecord) => {
    try {
      await supabaseService.createRecord(selectedTable, newRecord);
      setShowCreateForm(false);
      loadData();
    } catch (err) {
      alert('Error creating record: ' + err.message);
    }
  };

  // Render cell value
  const renderCellValue = (value, column) => {
    if (value === null || value === undefined) return (
      <span className="null-value">NULL</span>
    );
    if (column.type === 'boolean') return (
      <span className={`boolean-value ${value ? 'true' : 'false'}`}>
        {value ? '✓' : '✗'}
      </span>
    );
    if (column.type === 'object') return (
      <span className="json-value">{JSON.stringify(value)}</span>
    );
    if (value instanceof Date) return value.toLocaleString();
    return String(value);
  };

  // Filter data based on search term
  const filteredData = data.filter(row => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return Object.values(row).some(value => 
      String(value).toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="supabase-table-viewer">
      {/* Header with Breadcrumb */}
      <div className="list-header">
        <div className="breadcrumb">
          <a href="#/dashboard">Dashboard</a> / Online Database{selectedTable && ` / ${selectedTable}`}
        </div>
        <h2>Online Database</h2>
        
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Records</h3>
            <p className="stat-number">{total}</p>
          </div>
          <div className="stat-card">
            <h3>Showing</h3>
            <p className="stat-number">{filteredData.length}</p>
          </div>
          <div className="stat-card">
            <h3>Table</h3>
            <p className="stat-number">{selectedTable}</p>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="controls-bar">
        <div className="control-group">
          <label className="control-label">Table:</label>
          <select 
            className="table-selector"
            value={selectedTable} 
            onChange={(e) => {
              setSelectedTable(e.target.value);
              setPage(1);
              setFilters({});
            }}
          >
            {tables.map(table => (
              <option key={table} value={table}>{table}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="control-actions">
          <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
            <span className="btn-icon">➕</span>
            New Record
          </button>
          <button className="btn btn-secondary" onClick={loadData}>
            <span className="btn-icon">🔄</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="section-header">
          <h3>Filters</h3>
          <button 
            className="btn-link"
            onClick={() => setFilters({})}
          >
            Clear All
          </button>
        </div>
        <div className="filters-grid">
          {columns.slice(0, 6).map(col => (
            <div key={col.name} className="filter-item">
              <label>{col.name}:</label>
              <div className="filter-controls">
                <select 
                  className="filter-operator"
                  value={filters[col.name]?.operator || ''}
                  onChange={(e) => handleFilterChange(col.name, e.target.value, filters[col.name]?.value || '')}
                >
                  <option value="">--</option>
                  <option value="eq">Equals</option>
                  <option value="neq">Not Equals</option>
                  <option value="gt">Greater Than</option>
                  <option value="gte">Greater or Equal</option>
                  <option value="lt">Less Than</option>
                  <option value="lte">Less or Equal</option>
                  <option value="like">Like</option>
                  <option value="ilike">ILike</option>
                  <option value="is">Is Null</option>
                  <option value="in">In Array</option>
                </select>
                <input 
                  type="text"
                  className="filter-value"
                  value={filters[col.name]?.value || ''}
                  onChange={(e) => handleFilterChange(col.name, filters[col.name]?.operator || 'eq', e.target.value)}
                  placeholder="Value"
                />
                {filters[col.name] && (
                  <button 
                    className="btn-clear"
                    onClick={() => clearFilter(col.name)}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      )}

      {/* Data Table */}
      {!loading && !error && (
        <>
          <div className="table-container">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {columns.map(col => (
                      <th key={col.name}>
                        <div className="th-content">
                          {col.name}
                          <span className="column-type">({col.type})</span>
                        </div>
                      </th>
                    ))}
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, index) => (
                    <tr key={row.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                      {columns.map(col => (
                        <td key={col.name}>
                          {editingRecord?.id === row.id ? (
                            <input
                              type="text"
                              className="edit-input"
                              value={editingRecord[col.name] || ''}
                              onChange={(e) => setEditingRecord({
                                ...editingRecord,
                                [col.name]: e.target.value
                              })}
                            />
                          ) : (
                            renderCellValue(row[col.name], col)
                          )}
                        </td>
                      ))}
                      <td className="actions-cell">
                        {editingRecord?.id === row.id ? (
                          <div className="action-buttons">
                            <button className="btn btn-sm btn-success" onClick={handleUpdate}>
                              ✓
                            </button>
                            <button className="btn btn-sm btn-secondary" onClick={() => setEditingRecord(null)}>
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button className="btn btn-sm btn-primary" onClick={() => handleEdit(row)}>
                              ✏️
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(row.id)}>
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <button 
                className="btn btn-pagination"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Previous
              </button>
              <div className="page-info">
                Page {page} of {totalPages}
              </div>
              <button 
                className="btn btn-pagination"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Record</h3>
              <button className="btn-close" onClick={() => setShowCreateForm(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {columns.map(col => (
                  <div key={col.name} className="form-group">
                    <label>{col.name}:</label>
                    <input 
                      type="text"
                      className="form-input"
                      id={`create-${col.name}`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => {
                const newRecord = {};
                columns.forEach(col => {
                  const value = document.getElementById(`create-${col.name}`).value;
                  newRecord[col.name] = value || null;
                });
                handleCreate(newRecord);
              }}>
                Create
              </button>
              <button className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .supabase-table-viewer {
          padding: 20px;
          background: #f8f9fa;
          min-height: 100vh;
        }
        
        /* List Header - Matching SeniorCitizenList */
        .list-header h2 {
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
        }
        
        .stat-card h3 {
          font-size: 14px;
          color: #6c757d;
          margin: 0 0 10px 0;
          font-weight: 500;
        }
        
        .stat-number {
          font-size: 28px;
          font-weight: 700;
          color: #1e3a8a;
          margin: 0;
        }
        
        /* Controls Bar */
        .controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 15px 20px;
          background: white;
          border-radius: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .control-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .control-label {
          font-weight: 600;
          color: #495057;
        }
        
        .table-selector {
          padding: 8px 12px;
          border: 2px solid #e9ecef;
          border-radius: 0;
          font-size: 14px;
          background: white;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .table-selector:hover {
          border-color: #667eea;
        }
        
        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .search-icon {
          position: absolute;
          left: 12px;
          color: #6c757d;
        }
        
        .search-box input {
          padding: 8px 12px 8px 35px;
          border: 2px solid #e9ecef;
          border-radius: 0;
          width: 250px;
          font-size: 14px;
          transition: all 0.3s;
        }
        
        .search-box input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .control-actions {
          display: flex;
          gap: 10px;
        }
        
        /* Buttons */
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: none;
          border-radius: 0;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        
        .btn-secondary:hover {
          background: #5a6268;
        }
        
        .btn-success {
          background: #28a745;
          color: white;
        }
        
        .btn-danger {
          background: #dc3545;
          color: white;
        }
        
        .btn-sm {
          padding: 4px 8px;
          font-size: 12px;
        }
        
        .btn-pagination {
          padding: 8px 16px;
          background: white;
          border: 2px solid #e9ecef;
          color: #495057;
        }
        
        .btn-pagination:hover:not(:disabled) {
          background: #f8f9fa;
          border-color: #667eea;
        }
        
        .btn-pagination:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-link {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          font-size: 14px;
        }
        
        .btn-link:hover {
          text-decoration: underline;
        }
        
        .btn-clear {
          background: none;
          border: none;
          color: #dc3545;
          cursor: pointer;
          padding: 4px;
        }
        
        .btn-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #6c757d;
        }
        
        .btn-icon {
          font-size: 16px;
        }
        
        /* Filters Section */
        .filters-section {
          background: white;
          padding: 20px;
          border-radius: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          margin-bottom: 20px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .section-header h3 {
          margin: 0;
          color: #1a1a1a;
        }
        
        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }
        
        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .filter-item label {
          font-size: 13px;
          font-weight: 600;
          color: #495057;
        }
        
        .filter-controls {
          display: flex;
          gap: 5px;
          align-items: center;
        }
        
        .filter-operator {
          flex: 0 0 100px;
          min-width: 100px;
          padding: 6px 8px;
          border: 1px solid #dee2e6;
          border-radius: 0;
          font-size: 13px;
        }
        
        .filter-value {
          flex: 1;
          min-width: 0;
          padding: 6px 8px;
          border: 1px solid #dee2e6;
          border-radius: 0;
          font-size: 13px;
        }
        
        /* Alert */
        .alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 0;
          margin-bottom: 20px;
        }
        
        .alert-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .alert-icon {
          font-size: 18px;
        }
        
        /* Loading */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Table */
        .table-container {
          background: white;
          border-radius: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          overflow: hidden;
        }
        
        .table-wrapper {
          overflow-x: auto;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .data-table th {
          background: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 2px solid #dee2e6;
          white-space: nowrap;
        }
        
        .th-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .column-type {
          font-size: 11px;
          font-weight: normal;
          color: #6c757d;
        }
        
        .data-table td {
          padding: 12px;
          border-bottom: 1px solid #dee2e6;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .data-table tr.even {
          background: #f8f9fa;
        }
        
        .data-table tr:hover {
          background: #e9ecef;
        }
        
        .actions-column {
          width: 120px;
          text-align: center;
        }
        
        .actions-cell {
          padding: 8px;
        }
        
        .action-buttons {
          display: flex;
          gap: 5px;
          justify-content: center;
        }
        
        .edit-input {
          width: 100%;
          padding: 4px 8px;
          border: 1px solid #667eea;
          border-radius: 0;
        }
        
        /* Cell Values */
        .null-value {
          color: #6c757d;
          font-style: italic;
        }
        
        .boolean-value {
          font-weight: bold;
        }
        
        .boolean-value.true {
          color: #28a745;
        }
        
        .boolean-value.false {
          color: #dc3545;
        }
        
        .json-value {
          font-family: monospace;
          font-size: 12px;
          color: #495057;
        }
        
        /* Pagination */
        .pagination-container {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          padding: 20px;
          background: white;
          border-radius: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          margin-top: 20px;
        }
        
        .page-info {
          font-weight: 500;
          color: #495057;
        }
        
        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal {
          background: white;
          border-radius: 0;
          max-width: 800px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #dee2e6;
        }
        
        .modal-header h3 {
          margin: 0;
          color: #1a1a1a;
        }
        
        .modal-body {
          padding: 20px;
          max-height: 60vh;
          overflow-y: auto;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: #495057;
        }
        
        .form-input {
          padding: 8px 12px;
          border: 1px solid #dee2e6;
          border-radius: 0;
          font-size: 14px;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 20px;
          border-top: 1px solid #dee2e6;
          background: #f8f9fa;
        }
      `}</style>
    </div>
  );
};

export default SupabaseTableViewer;
