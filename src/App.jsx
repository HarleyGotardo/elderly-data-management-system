import React from 'react';

const App = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Elderly Data Management System</h1>
        <p>Welcome to your MVC Electron Application!</p>
      </header>
      
      <main className="app-main">
        <div className="welcome-card">
          <h2>Getting Started</h2>
          <p>This is a clean MVC template. Start building your application:</p>
          <ul>
            <li>Create models: <code>npm run make:model Elderly</code></li>
            <li>Create controllers: <code>npm run make:controller Elderly</code></li>
            <li>Create views: <code>npm run make:view Elderly --type list</code></li>
            <li>Or create all at once: <code>npm run make:resource Elderly</code></li>
          </ul>
        </div>
      </main>

      <style jsx global>{`
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
          text-align: center;
        }

        .app-header h1 {
          margin-bottom: 10px;
          color: #2c3e50;
          font-size: 28px;
        }

        .app-header p {
          color: #6c757d;
          font-size: 16px;
        }

        .app-main {
          flex: 1;
          padding: 40px 20px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .welcome-card {
          background: #fff;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          max-width: 600px;
          width: 100%;
        }

        .welcome-card h2 {
          margin-bottom: 20px;
          color: #2c3e50;
        }

        .welcome-card p {
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .welcome-card ul {
          list-style: none;
          padding: 0;
        }

        .welcome-card li {
          margin-bottom: 10px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
        }

        .welcome-card code {
          color: #007bff;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default App;
