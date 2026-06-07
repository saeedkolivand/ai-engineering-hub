import { createRoute } from '@tanstack/react-router';
import { RepositoryPage } from '@/components/pages/RepositoryPage';
import { rootRoute } from './root';

export const repositoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/repositories',
  component: RepositoryPage,
});