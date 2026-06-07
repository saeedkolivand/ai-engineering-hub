import React from 'react';
import { useLocation } from '@tanstack/router';

/**
 * Simple breadcrumb component that reflects the current router pathname.
 * Example: /repositories/42 → Repositories / 42
 */
export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="breadcrumb" style={{ marginBottom: '0.5rem' }}>
      {segments.map((seg, idx) => (
        <span key={idx}>
          {seg}
          {idx < segments.length - 1 && ' / '}
        </span>
      ))}
    </nav>
  );
}