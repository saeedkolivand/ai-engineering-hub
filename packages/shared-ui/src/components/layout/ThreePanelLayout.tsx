import React from 'react';
import { NavBar } from './NavBar';
import { RightPanel } from './RightPanel';
import { Breadcrumbs } from './Breadcrumbs';

export const ThreePanelLayout: React.FC = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden font-sans">
      <NavBar />
      <main className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
        <header className="p-2 border-b border-gray-200 flex items-center justify-between">
          <Breadcrumbs />
        </header>
        <section className="flex-1 overflow-y-auto p-4">{children}</section>
      </main>
      <RightPanel />
    </div>
  );
};