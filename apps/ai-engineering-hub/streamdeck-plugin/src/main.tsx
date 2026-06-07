import React from 'react';
import ReactDOM from 'react-dom/client';
import { createRoot } from '@tanstack/start';
import { StreamDeckProvider } from '@deckmaster/react';
import { useMetricUpdates } from '../hooks/useMetricUpdates';
import { TokenMonitor } from './components/TokenMonitor';
import './index.css';

function App() {
  const metrics = useMetricUpdates();

  return (
    <div className="plugin-container">
      <TokenMonitor data={metrics.token} />
      {/* Additional monitor components would be added here */}
    </div>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <StreamDeckProvider>
      <App />
    </StreamDeckProvider>
  </React.StrictMode>
);