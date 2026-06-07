import { createRoute } from '@tanstack/react-router';
import { ActivityPage } from '@/components/pages/ActivityPage';
import { rootRoute } from './root';

export const activityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/activity',
  component: ActivityPage,
});