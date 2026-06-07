/** Request payloads for the public REST API */
export interface ListRepositoriesRequest {}
export interface ListSessionsRequest {}
export interface ListTasksRequest {}
export interface ListAgentsRequest {}
export interface ListMetricsRequest {}

/** Response payloads – mirror the types exported from shared-types */
import { Repository, Session, Task, Agent, Metric } from '../../shared-types/src';

export interface ListRepositoriesResponse {
  repositories: Repository[];
}
export interface ListSessionsResponse {
  sessions: Session[];
}
export interface ListTasksResponse {
  tasks: Task[];
}
export interface ListAgentsResponse {
  agents: Agent[];
}
export interface ListMetricsResponse {
  metrics: Metric[];
}

/** Additional API contract definitions can be added as needed */