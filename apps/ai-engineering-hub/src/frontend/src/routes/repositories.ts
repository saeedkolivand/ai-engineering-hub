import { Route } from '@tanstack/react-router';
import { RepositoryPage } from '@/components/pages/RepositoryPage';

export const repositoryRoute = new Route({
  getParentRoute: () => import('./root').then(r => r.rootRoute),
  path: '/repositories',
  component: RepositoryPage,
});