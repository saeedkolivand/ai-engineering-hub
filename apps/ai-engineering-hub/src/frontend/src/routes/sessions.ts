import { createRoute } from '@tanstack/react-router';
import { SessionPage } from '@/components/pages/SessionPage';
import { rootRoute } from './root';

export const sessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sessions',
  component: SessionPage,
});