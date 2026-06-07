import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      setOpen(v => !v);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const execute = (path: string) => {
    navigate({ to: path });
    setOpen(false);
    setQuery('');
  };

  const commands = [
    { label: 'Repositories', path: '/repositories' },
    { label: 'Sessions', path: '/sessions' },
    // add more commands as UI expands
  ];

  const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20%',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'white',
      border: '1px solid #ccc',
      borderRadius: '4px',
      width: '300px',
      zIndex: 1000,
      padding: '0.5rem'
    }}>
      <input
        autoFocus
        placeholder="Command…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
      />
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: '200px', overflowY: 'auto' }}>
        {filtered.map(c => (
          <li key={c.path}
              style={{ padding: '0.3rem', cursor: 'pointer' }}
              onClick={() => execute(c.path)}>
            {c.label}
          </li>
        ))}
        {filtered.length === 0 && <li style={{ padding: '0.3rem' }}>No matches</li>}
      </ul>
    </div>
  );
}