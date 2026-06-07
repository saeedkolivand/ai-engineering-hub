import { Route } from '@tanstack/react-router';
import { OverviewPage } from '@/components/pages/OverviewPage';

export const overviewRoute = new Route({
  getParentRoute: () => import('./root').then(r => r.rootRoute),
  path: '/overview',
  component: OverviewPage,
});