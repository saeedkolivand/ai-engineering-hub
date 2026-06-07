import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export function useRepositories() {
  return useQuery({
    queryKey: ["repositories"],
    queryFn: api.getRepositories,
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: api.getSessions,
  });
}

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: api.getTasks,
  });
}

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: api.getAgents,
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: api.getAnalytics,
  });
}