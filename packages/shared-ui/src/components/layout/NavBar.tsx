import React from 'react';
import { Link } from '@tanstack/react-router';

const navItems = [
  { label: 'Overview', to: '/overview' },
  { label: 'Repositories', to: '/repositories' },
  { label: 'Sessions', to: '/sessions' },
  { label: 'Tasks', to: '/tasks' },
  { label: 'Agents', to: '/agents' },
  { label: 'Analytics', to: '/analytics' },
  { label: 'Activity', to: '/activity' },
  { label: 'Settings', to: '/settings' },
];

export const NavBar: React.FC = () => {
  return (
    <nav className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 font-bold text-xl">AI Hub</div>
      <ul className="flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <li key={item.to} className="hover:bg-gray-700">
            <Link
              to={item.to}
              className="block px-4 py-2"
              activeProps={{ className: 'bg-gray-700' }}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};