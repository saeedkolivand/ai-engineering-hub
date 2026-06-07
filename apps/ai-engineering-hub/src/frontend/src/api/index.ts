import { apiClient } from './client';
import type {
  ListRepositoriesResponse,
  ListSessionsResponse,
  ListTasksResponse,
  ListAgentsResponse,
  ListMetricsResponse,
} from '@shared-api-contracts';

export const fetchRepositories = async () => {
  const res = await apiClient.get<ListRepositoriesResponse>('/api/v1/repositories');
  return res.data;
};

export const fetchSessions = async () => {
  const res = await apiClient.get<ListSessionsResponse>('/api/v1/sessions');
  return res.data;
};

export const fetchTasks = async () => {
  const res = await apiClient.get<ListTasksResponse>('/api/v1/tasks');
  return res.data;
};

export const fetchAgents = async () => {
  const res = await apiClient.get<ListAgentsResponse>('/api/v1/agents');
  return res.data;
};

export const fetchMetrics = async () => {
  const res = await apiClient.get<ListMetricsResponse>('/api/v1/metrics');
  return res.data;
};