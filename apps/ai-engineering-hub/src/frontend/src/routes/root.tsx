import React from 'react';
import { Outlet } from '@tanstack/react-router';
import { CommandPalette } from '../components/CommandPalette';

export const Root = () => (
  <>
    <CommandPalette />
    <Outlet />
  </>
);