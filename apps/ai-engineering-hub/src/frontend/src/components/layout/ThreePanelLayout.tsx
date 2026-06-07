import React from 'react';
import { NavBar, RightPanel, Breadcrumbs } from 'shared-ui';

interface Props {
  children: React.ReactNode;
}

export const ThreePanelLayout: React.FC<Props> = ({ children }) => (
  <div className="flex h-screen overflow-hidden">
    <NavBar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <Breadcrumbs />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
    <RightPanel />
  </div>
);