import { createRoute } from '@tanstack/react-router';
import { SettingsPage } from '@/components/pages/SettingsPage';
import { rootRoute } from './root';

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});