import { createRoute } from '@tanstack/react-router';
import { TaskPage } from '@/components/pages/TaskPage';
import { rootRoute } from './root';

export const taskRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks',
  component: TaskPage,
});