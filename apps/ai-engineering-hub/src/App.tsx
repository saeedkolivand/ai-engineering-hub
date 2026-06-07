import React from 'react';
import { Link } from '@tanstack/router';
import './index.css';

export default function App() {
  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh' }}>
      {/* Left Navigation */}
      <nav className="left-nav" style={{ width: '250px', borderRight: '1px solid #ddd', padding: '1rem' }}>
        <h2>Navigation</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><Link to="/">Overview</Link></li>
          <li><Link to="/repositories">Repositories</Link></li>
          <li><Link to="/sessions">Sessions</Link></li>
          <li><Link to="/tasks">Tasks</Link></li>
          <li><Link to="/agents">Agents</Link></li>
          <li><Link to="/retrieval">Retrieval</Link></li>
          <li><Link to="/analytics">Analytics</Link></li>
          <li><Link to="/quality">Quality</Link></li>
          <li><Link to="/activity">Activity</Link></li>
          <li><Link to="/settings">Settings</Link></li>
        </ul>
      </nav>

      {/* Center Content */}
      <main className="center-content" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        <h1>Welcome to AI Engineering Hub</h1>
        <p>This is a placeholder view. Real routes will render tables and dashboards.</p>
      </main>

      {/* Right Context Panel */}
      <aside className="right-panel" style={{ width: '300px', borderLeft: '1px solid #ddd', padding: '1rem' }}>
        <h3>Details</h3>
        <p>Select an entity to see metadata and actions.</p>
      </aside>
    </div>
  );
}