import React from 'react';
import { NavBar } from '@/components/layout/NavBar';
import { RightPanel } from '@/components/layout/RightPanel';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

export const ThreePanelLayout: React.FC = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden font-sans">
      {/* Left Navigation */}
      <NavBar />

      {/* Center Content */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
        <header className="p-2 border-b border-gray-200 flex items-center justify-between">
          <Breadcrumbs />
          {/* Command Palette trigger could be added here */}
        </header>
        <section className="flex-1 overflow-y-auto p-4">{children}</section>
      </main>

      {/* Right Context Panel */}
      <RightPanel />
    </div>
  );
};