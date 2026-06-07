import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useHotkeys } from '@reecelucas/react-hotkeys-hook';
import { useNavigate } from '@tanstack/react-router';
import { Dialog, DialogOverlay, DialogContent } from '@reach/dialog';
import '@reach/dialog/styles.css';

interface Command {
  title: string;
  action: () => void;
}

const commands: Command[] = [
  {
    title: 'Go to Overview',
    action: () => {
      navigate('/overview');
    },
  },
  {
    title: 'Go to Repositories',
    action: () => {
      navigate('/repositories');
    },
  },
  {
    title: 'Go to Sessions',
    action: () => {
      navigate('/sessions');
    },
  },
  // Add more commands as needed
];

let navigate: ReturnType<typeof useNavigate>;

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(filter.toLowerCase())
  );

  // Register global hotkey Ctrl+K
  useHotkeys('ctrl+k', (e) => {
    e.preventDefault();
    setOpen((o) => !o);
  });

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!open) return null;

  return createPortal(
    <DialogOverlay isOpen={open} onDismiss={() => setOpen(false)}>
      <DialogContent aria-label='Command Palette' className='command-palette'>
        <input
          ref={inputRef}
          type='text'
          placeholder='Type a command…'
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className='command-input'
        />
        <ul className='command-list'>
          {filtered.map((cmd, idx) => (
            <li key={idx} onClick={() => { cmd.action(); setOpen(false); }}>
              {cmd.title}
            </li>
          ))}
        </ul>
      </DialogContent>
    </DialogOverlay>,
    document.body
  );
};