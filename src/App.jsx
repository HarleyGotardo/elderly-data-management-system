import React, { useState, useEffect } from 'react';
import SeniorCitizenList from './components/SeniorCitizenList';
import SeniorCitizenForm from './components/SeniorCitizenForm';

const App = () => {
  const [currentView, setCurrentView] = useState('list');
  const [editingSeniorId, setEditingSeniorId] = useState(null);

  // Handle routing based on hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove #
      
      if (hash === '/senior-citizens' || hash === '') {
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
      <header className="app-header">
        <h1>Senior Citizen Benefit EDMS</h1>
        <p>Electronic Data Management System for R.A. 11982</p>
        <nav className="app-nav">
          <a href="#/senior-citizens" className={currentView === 'list' ? 'active' : ''}>
            Senior Citizens Registry
          </a>
          <a href="#/senior-citizens/create" className={currentView === 'create' ? 'active' : ''}>
            Add New Senior Citizen
          </a>
        </nav>
      </header>
      
      <main className="app-main">
        {renderView()}
      </main>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background: #f5f5f5;
          color: #333;
        }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .app-header {
          background: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 20px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .app-header h1 {
          margin-bottom: 5px;
          color: #2c3e50;
          font-size: 28px;
        }

        .app-header p {
          margin-bottom: 15px;
          color: #7f8c8d;
          font-size: 14px;
        }

        .app-nav {
          display: flex;
          gap: 20px;
        }

        .app-nav a {
          text-decoration: none;
          color: #6c757d;
          padding: 8px 16px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .app-nav a:hover {
          background: #f8f9fa;
          color: #495057;
        }

        .app-nav a.active {
          background: #3498db;
          color: white;
        }

        .app-main {
          flex: 1;
          padding: 20px;
        }

        /* Utility classes */
        .text-center {
          text-align: center;
        }

        .mb-20 {
          margin-bottom: 20px;
        }

        .mt-20 {
          margin-top: 20px;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .app-header {
            padding: 15px;
          }

          .app-header h1 {
            font-size: 20px;
          }

          .app-nav {
            flex-direction: column;
            gap: 10px;
          }

          .app-main {
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
