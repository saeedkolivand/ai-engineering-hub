import { Route } from '@tanstack/react-router';
import { AgentPage } from '@/components/pages/AgentPage';

export const agentRoute = new Route({
  getParentRoute: () => import('./root').then(r => r.rootRoute),
  path: '/agents',
  component: AgentPage,
});