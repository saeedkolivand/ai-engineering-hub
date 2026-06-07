import { createRootRoute } from '@tanstack/react-router';
import { ThreePanelLayout } from '@/components/layout/ThreePanelLayout';

export const rootRoute = createRootRoute({
  component: ThreePanelLayout,
});