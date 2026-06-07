import React from 'react';
import { useMatches } from '@tanstack/react-router';

export const Breadcrumbs: React.FC = () => {
  const matches = useMatches();

  return (
    <nav className="flex space-x-2 text-sm">
      {matches.map((match, idx) => (
        <span key={idx} className="text-gray-700">
          {match.route.id}
          {idx < matches.length - 1 && <span className="mx-1">/</span>}
        </span>
      ))}
    </nav>
  );
};