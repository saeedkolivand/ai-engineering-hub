import { createRootRoute, createRoute } from '@tanstack/react-router';
import { Root } from './root';
import { Layout } from './__layout';
import { Overview } from './overview';
import { Repositories } from './repositories';
import { Sessions } from './sessions';
import { Tasks } from './tasks';
import { Agents } from './agents';

export const rootRoute = createRootRoute({
  component: Root,
});

export const routeTree = rootRoute.addChildren([
  createRoute({
    path: '/',
    component: Layout,
    children: [
      {
        path: 'overview',
        component: Overview,
      },
      {
        path: 'repositories',
        component: Repositories,
      },
      {
        path: 'sessions',
        component: Sessions,
      },
      {
        path: 'tasks',
        component: Tasks,
      },
      {
        path: 'agents',
        component: Agents,
      },
      // Additional routes will be added as Phase 5 progresses
    ],
  }),
]);