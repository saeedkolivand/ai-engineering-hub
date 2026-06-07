import { Route } from '@tanstack/react-router';
import { ActivityPage } from '@/components/pages/ActivityPage';

export const activityRoute = new Route({
  getParentRoute: () => import('./root').then(r => r.rootRoute),
  path: '/activity',
  component: ActivityPage,
});