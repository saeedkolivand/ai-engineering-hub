import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hub } from "../lib/hub";
import * as q from "../lib/queries";

export const useRepositories = () => useQuery(q.repositoriesQuery());
export const useRepository = (id: string) => useQuery(q.repositoryQuery(id));
export const useSessions = (repositoryId?: string) => useQuery(q.sessionsQuery(repositoryId));
export const useTasks = (sessionId?: string) => useQuery(q.tasksQuery(sessionId));
export const useAgents = () => useQuery(q.agentsQuery());
export const useSources = () => useQuery(q.sourcesQuery());
export const useAnalytics = () => useQuery(q.analyticsQuery());
export const useIntelligence = () => useQuery(q.intelligenceQuery());

export const useSetSourceEnabled = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      hub.setSourceEnabled(id, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources"] }),
  });
};
