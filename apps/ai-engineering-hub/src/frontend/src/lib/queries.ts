import { queryOptions } from "@tanstack/react-query";
import { hub } from "./hub";

// Shared query options: routes use `ensureQueryData` (loaders), components use `useQuery`.
export const repositoriesQuery = () =>
  queryOptions({ queryKey: ["repositories"], queryFn: () => hub.repositories() });

export const repositoryQuery = (id: string) =>
  queryOptions({ queryKey: ["repository", id], queryFn: () => hub.repository(id) });

export const sessionsQuery = (repositoryId?: string) =>
  queryOptions({
    queryKey: ["sessions", repositoryId ?? "all"],
    queryFn: () => hub.sessions(repositoryId),
  });

export const tasksQuery = (sessionId?: string) =>
  queryOptions({
    queryKey: ["tasks", sessionId ?? "all"],
    queryFn: () => hub.tasks(sessionId),
  });

export const agentsQuery = () =>
  queryOptions({ queryKey: ["agents"], queryFn: () => hub.agents() });

export const sourcesQuery = () =>
  queryOptions({ queryKey: ["sources"], queryFn: () => hub.sources() });

export const analyticsQuery = () =>
  queryOptions({ queryKey: ["analytics"], queryFn: () => hub.analytics() });

export const intelligenceQuery = () =>
  queryOptions({ queryKey: ["intelligence"], queryFn: () => hub.intelligence() });
