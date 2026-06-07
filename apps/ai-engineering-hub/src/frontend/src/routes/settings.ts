import { Route } from '@tanstack/react-router';
import { SettingsPage } from '@/components/pages/SettingsPage';

export const settingsRoute = new Route({
  getParentRoute: () => import('./root').then(r => r.rootRoute),
  path: '/settings',
  component: SettingsPage,
});