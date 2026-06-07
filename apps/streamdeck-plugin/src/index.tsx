import React from 'react';
import { createRoot } from 'react-dom/client';
import { TokenMonitor } from './TokenMonitor';
import { SavingsMonitor } from './SavingsMonitor';
import { AgentMonitor } from './AgentMonitor';
import { TaskMonitor } from './TaskMonitor';
import { InterventionMonitor } from './InterventionMonitor';
import { ProductivityMonitor } from './ProductivityMonitor';
import { BuildHealthMonitor } from './BuildHealthMonitor';
import { RetrievalMonitor } from './RetrievalMonitor';
import './index.css';

/**
 * Main entry point for the Stream Deck plugin UI.
 * The plugin is rendered inside a small window; layout is vertical.
 */
function App() {
  return (
    <div className="plugin-root" style={{ padding: '8px', fontFamily: 'Arial, sans-serif' }}>
      <TokenMonitor />
      <SavingsMonitor />
      <AgentMonitor />
      <TaskMonitor />
      <InterventionMonitor />
      <ProductivityMonitor />
      <BuildHealthMonitor />
      <RetrievalMonitor />
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}