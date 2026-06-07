import { createRoute } from '@tanstack/react-router';
import { OverviewPage } from '@/components/pages/OverviewPage';
import { rootRoute } from './root';

export const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/overview',
  component: OverviewPage,
});