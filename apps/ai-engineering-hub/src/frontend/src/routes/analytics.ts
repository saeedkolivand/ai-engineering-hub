import { Route } from '@tanstack/react-router';
import { AnalyticsPage } from '@/components/pages/AnalyticsPage';

export const analyticsRoute = new Route({
  getParentRoute: () => import('./root').then(r => r.rootRoute),
  path: '/analytics',
  component: AnalyticsPage,
});