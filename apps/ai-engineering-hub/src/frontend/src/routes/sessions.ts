import { Route } from '@tanstack/react-router';
import { SessionPage } from '@/components/pages/SessionPage';

export const sessionRoute = new Route({
  getParentRoute: () => import('./root').then(r => r.rootRoute),
  path: '/sessions',
  component: SessionPage,
});