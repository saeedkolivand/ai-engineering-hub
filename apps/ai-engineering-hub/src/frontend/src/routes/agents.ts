import { createRoute } from '@tanstack/react-router';
import { AgentPage } from '@/components/pages/AgentPage';
import { rootRoute } from './root';

export const agentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/agents',
  component: AgentPage,
});