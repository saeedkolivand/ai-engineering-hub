import React from 'react';
import { Link, Outlet } from '@tanstack/react-router';
import './layout.css';

export const Layout = () => (
  <div className='app-container'>
    <nav className='sidebar'>
      <ul>
        <li><Link to='/overview'>Overview</Link></li>
        <li><Link to='/repositories'>Repositories</Link></li>
        <li><Link to='/sessions'>Sessions</Link></li>
        <li><Link to='/tasks'>Tasks</Link></li>
        <li><Link to='/agents'>Agents</Link></li>
        {/* Add remaining navigation items here */}
      </ul>
    </nav>
    <main className='content'>
      <Outlet />
    </main>
    {/* Right context panel placeholder */}
    <aside className='right-panel'>
      {/* Contextual metadata will appear here */}
    </aside>
  </div>
);