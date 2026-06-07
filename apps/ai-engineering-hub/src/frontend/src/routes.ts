import { rootRoute } from './routes/root';
import { overviewRoute } from './routes/overview';
import { repositoryRoute } from './routes/repositories';
import { sessionRoute } from './routes/sessions';
import { taskRoute } from './routes/tasks';
import { agentRoute } from './routes/agents';
import { analyticsRoute } from './routes/analytics';
import { activityRoute } from './routes/activity';
import { settingsRoute } from './routes/settings';

// Build the route tree
export const routeTree = rootRoute.addChildren([
  overviewRoute,
  repositoryRoute,
  sessionRoute,
  taskRoute,
  agentRoute,
  analyticsRoute,
  activityRoute,
  settingsRoute,
]);