import React from 'react';
import { useRouterState } from '@tanstack/react-router';

export const Breadcrumbs: React.FC = () => {
  const matches = useRouterState({ select: (state) => state.matches });

  if (!matches || matches.length === 0) {
    return null;
  }

  return (
    <nav className="flex space-x-2 text-sm">
      {matches.map((match, idx) => (
        <span key={match.id || idx} className="text-gray-700">
          {match.routeId || match.id || '/'}
          {idx < matches.length - 1 && <span className="mx-1">/</span>}
        </span>
      ))}
    </nav>
  );
};