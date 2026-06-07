import { Route } from '@tanstack/react-router';
import { ThreePanelLayout } from '@/components/layout/ThreePanelLayout';

export const rootRoute = new Route({
  getParentRoute: () => null,
  path: '/',
  component: ThreePanelLayout,
});