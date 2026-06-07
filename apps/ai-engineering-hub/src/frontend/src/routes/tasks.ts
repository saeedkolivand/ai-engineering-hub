import { Route } from '@tanstack/react-router';
import { TaskPage } from '@/components/pages/TaskPage';

export const taskRoute = new Route({
  getParentRoute: () => import('./root').then(r => r.rootRoute),
  path: '/tasks',
  component: TaskPage,
});