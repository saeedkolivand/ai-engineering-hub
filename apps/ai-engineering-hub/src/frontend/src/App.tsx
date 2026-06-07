import React from 'react';
import { RouterProvider, createRouter, Route } from '@tanstack/router';
import { Repositories } from './routes/Repositories';
import { Sessions } from './routes/Sessions';
import { Overview } from './routes/Overview';
import { Tasks } from './routes/Tasks';
import { Agents } from './routes/Agents';
import { Retrieval } from './routes/Retrieval';
import { Analytics } from './routes/Analytics';
import { Quality } from './routes/Quality';
import { Activity } from './routes/Activity';
import { Settings } from './routes/Settings';
import { CommandPalette } from './components/CommandPalette';
import { Breadcrumbs } from './components/Breadcrumbs';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ActivityFeed } from './components/ActivityFeed';
import './index.css';

/* Design token example – CSS variables are defined in shared-design-tokens */
const rootStyle = {
  '--primary-color': '#0066ff',
  '--secondary-color': '#555',
  '--font-family': 'Arial, sans-serif',
} as React.CSSProperties;

const routeTree = new Route({
  getParentRoute: () => null,
  id: 'root',
  component: () => (
    <div className="app-container" style={{ ...rootStyle, display: 'flex', height: '100vh', fontFamily: 'var(--font-family)' }}>
      <nav className="left-nav" style={{ width: '250px', borderRight: '1px solid #ddd', padding: '1rem', background: '#f9f9f9' }}>
        <h2>Navigation</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><a href="/overview">Overview</a></li>
          <li><a href="/repositories">Repositories</a></li>
          <li><a href="/sessions">Sessions</a></li>
          <li><a href="/tasks">Tasks</a></li>
          <li><a href="/agents">Agents</a></li>
          <li><a href="/retrieval">Retrieval</a></li>
          <li><a href="/analytics">Analytics</a></li>
          <li><a href="/quality">Quality</a></li>
          <li><a href="/activity">Activity</a></li>
          <li><a href="/settings">Settings</a></li>
        </ul>
      </nav>
      <main className="center-content" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        <CommandPalette />
        <Breadcrumbs />
        <ErrorBoundary>
          <Route path="/overview" component={Overview} />
          <Route path="/repositories" component={Repositories} />
          <Route path="/sessions" component={Sessions} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/agents" component={Agents} />
          <Route path="/retrieval" component={Retrieval} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/quality" component={Quality} />
          <Route path="/activity" component={Activity} />
          <Route path="/settings" component={Settings} />
        </ErrorBoundary>
      </main>
      <aside className="right-panel" style={{ width: '300px', borderLeft: '1px solid #ddd', padding: '1rem', background: '#fafafa' }}>
        <h3>Details / Live Panels</h3>
        <ActivityFeed />
        {/* Additional context panels such as Timeline could be placed here */}
      </aside>
    </div>
  ),
});

const router = createRouter({
  routeTree,
});

export default function App() {
  return <RouterProvider router={router} />;
}