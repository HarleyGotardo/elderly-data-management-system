import React, { useState, useEffect } from 'react';
import SeniorCitizenList from './components/SeniorCitizenList';
import SeniorCitizenForm from './components/SeniorCitizenForm';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>ELDERLY DATA MANAGEMENT SYSTEM</h1>
        <p>Electronic Data Management System for Senior Citizens</p>
      </div>
      
      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h3>Senior Citizen Management</h3>
          <div className="button-grid">
            <button 
              className="dashboard-button primary"
              onClick={() => window.location.hash = '#/senior-citizens'}
            >
              <div className="button-icon">👥</div>
              <div className="button-text">Senior Citizens Registry</div>
              <div className="button-subtext">View & manage senior citizens</div>
            </button>
            
            <button 
              className="dashboard-button primary"
              onClick={() => window.location.hash = '#/senior-citizens/create'}
            >
              <div className="button-icon">➕</div>
              <div className="button-text">Add New Senior Citizen</div>
              <div className="button-subtext">Register new senior citizen</div>
            </button>
          </div>
        </div>
        
        <div className="dashboard-section">
          <h3>Reports & Analytics</h3>
          <div className="button-grid">
            <button className="dashboard-button secondary" disabled>
              <div className="button-icon">📊</div>
              <div className="button-text">Statistical Reports</div>
              <div className="button-subtext">Generate reports</div>
            </button>
            
            <button className="dashboard-button secondary" disabled>
              <div className="button-icon">📈</div>
              <div className="button-text">Analytics Dashboard</div>
              <div className="button-subtext">View analytics</div>
            </button>
          </div>
        </div>
        
        <div className="dashboard-section">
          <h3>System Administration</h3>
          <div className="button-grid">
            <button className="dashboard-button secondary" disabled>
              <div className="button-icon">⚙️</div>
              <div className="button-text">System Settings</div>
              <div className="button-subtext">Configure system</div>
            </button>
            
            <button className="dashboard-button secondary" disabled>
              <div className="button-icon">👤</div>
              <div className="button-text">User Management</div>
              <div className="button-subtext">Manage users</div>
            </button>
          </div>
        </div>
      </div>
      
      <div className="dashboard-footer">
        <p>GOVERNMENT PROPERTY - NOT FOR SALE</p>
      </div>
      
      <style>{`
        .dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #e8f4fc 0%, #cce5ff 50%, #b3d9ff 100%);
          padding: 20px;
          font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        }
        
        .dashboard-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .dashboard-header h1 {
          color: #1e3a8a;
          font-size: 28px;
          margin-bottom: 8px;
          font-weight: 700;
        }
        
        .dashboard-header p {
          color: #6c757d;
          font-size: 16px;
          margin: 0;
        }
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .dashboard-section {
          background: white;
          border-radius: 0;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .dashboard-section h3 {
          color: #1e3a8a;
          font-size: 18px;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e9ecef;
        }
        
        .button-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
        }
        
        .dashboard-button {
          background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
          border: 1px solid #2c5aa0;
          border-radius: 0;
          padding: 20px 15px;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          min-height: 120px;
        }
        
        .dashboard-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #357abd 0%, #2968a3 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }
        
        .dashboard-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .dashboard-button.secondary {
          background: #f8f9fa;
          color: #212529;
          border: 1px solid #dee2e6;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .dashboard-button.secondary:hover:not(:disabled) {
          background: #e9ecef;
          border-color: #adb5bd;
        }
        
        .dashboard-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .button-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }
        
        .button-text {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
        }
        
        .button-subtext {
          font-size: 11px;
          opacity: 0.9;
        }
        
        .dashboard-footer {
          text-align: center;
          padding: 15px;
          background: white;
          border-radius: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .dashboard-footer p {
          color: #dc3545;
          font-weight: 600;
          margin: 0;
          font-size: 14px;
        }
        
        @media (max-width: 768px) {
          .dashboard {
            padding: 10px;
          }
          
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          
          .button-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingSeniorId, setEditingSeniorId] = useState(null);

  // Handle routing based on hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove #
      
      if (hash === '' || hash === '/dashboard') {
        setCurrentView('dashboard');
        setEditingSeniorId(null);
      } else if (hash === '/senior-citizens') {
        setCurrentView('list');
        setEditingSeniorId(null);
      } else if (hash.startsWith('/senior-citizens/create')) {
        setCurrentView('create');
        setEditingSeniorId(null);
      } else if (hash.startsWith('/senior-citizens/edit/')) {
        const seniorId = hash.split('/senior-citizens/edit/')[1];
        setCurrentView('edit');
        setEditingSeniorId(seniorId);
      }
    };

    // Initial check
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleSeniorSaved = (senior) => {
    // Redirect to senior citizen list after successful save
    window.location.hash = '#/senior-citizens';
  };

  const handleFormCancel = () => {
    // Redirect to senior citizen list on cancel
    window.location.hash = '#/senior-citizens';
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'list':
        return <SeniorCitizenList />;
      case 'create':
        return (
          <SeniorCitizenForm 
            onSave={handleSeniorSaved}
            onCancel={handleFormCancel}
          />
        );
      case 'edit':
        return (
          <SeniorCitizenForm 
            seniorId={editingSeniorId}
            onSave={handleSeniorSaved}
            onCancel={handleFormCancel}
          />
        );
      default:
        return <SeniorCitizenList />;
    }
  };

  return (
    <div className="app">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background: linear-gradient(135deg, #e8f4fc 0%, #cce5ff 50%, #b3d9ff 100%);
          color: #212529;
        }

        .app {
          min-height: 100vh;
        }
      `}</style>
      
      {renderView()}
    </div>
  );
};

export default App;
