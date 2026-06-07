import { createRoute } from '@tanstack/react-router';
import { AnalyticsPage } from '@/components/pages/AnalyticsPage';
import { rootRoute } from './root';

export const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: AnalyticsPage,
});