# Database Schema: AI Engineering Hub

## 1. Overview
The database uses SQLite for local, high-performance storage. The schema is designed to support a hierarchical drill-down workflow from Repositories down to individual Metrics, while allowing for efficient aggregation and real-time event processing.

## 2. Tables

### 2.1 `repositories`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | Unique identifier for the repository. |
| `name` | TEXT | NOT NULL | Name of the repository. |
| `path` | TEXT | NOT NULL | Local file system path. |
| `metadata` | TEXT (JSON) | | Arbitrary metadata. |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp. |

### 2.2 `sessions`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | Unique identifier for the session. |
| `repository_id` | UUID | REFERENCES `repositories`(id) | The associated repository. |
| `start_time` | DATETIME | NOT NULL | Session start time. |
| `end_time` | DATETIME | | Session end time. |
| `status` | TEXT | NOT NULL | Current status (e.g., 'active', 'completed'). |

### 2.3 `tasks`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | Unique identifier for the task. |
| `session_id` | UUID | REFERENCES `sessions`(id) | The associated session. |
| `description` | TEXT | | Task description. |
| `status` | TEXT | NOT NULL | Task status (e.g., 'running', 'success'). |
| `started_at` | DATETIME | | Task start time. |
| `completed_at` | DATETIME | | Task completion time. |

### 2.4 `agents`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | Unique identifier for the agent. |
| `name` | TEXT | NOT NULL | Agent name. |
| `provider` | TEXT | NOT NULL | AI Provider (e.g., 'anthropic', 'google'). |
| `model_id` | TEXT | | Specific model used. |

### 2.5 `task_agents`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `task_id` | UUID | REFERENCES `tasks`(id) | Associated task. |
| `agent_id` | UUID | REFERENCES `agents`(id) | Associated agent. |
| | | PRIMARY KEY (`task_id`, `agent_id`) | |

### 2.6 `interventions`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | Unique identifier for the intervention. |
| `task_id` | UUID | REFERENCES `tasks`(id) | The task being intervened upon. |
| `agent_id` | UUID | REFERENCES `agents`(id) | The agent involved. |
| `timestamp` | DATETIME | NOT NULL | When it happened. |
| `description` | TEXT | | Human action description. |
| `impact` | TEXT | | Impact level (e.g., 'minor', 'critical'). |

### 2.7 `raw_events`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | Unique identifier for the event. |
| `timestamp` | DATETIME | NOT NULL | Event timestamp. |
| `source` | TEXT | NOT NULL | Origin (e.g., 'cline', 'gemini-cli'). |
| `event_type` | TEXT | NOT NULL | Type of event (e.g., 'token_usage', 'tool_call'). |
| `payload` | TEXT (JSON) | | Detailed event data. |
| `repository_id` | UUID | REFERENCES `repositories`(id) | Contextual repository. |
| `session_id` | UUID | REFERENCES `sessions`(id) | Contextual session. |
| `task_id` | UUID | REFERENCES `tasks`(id) | Contextual task. |
| `agent_id` | UUID | REFERENCES `agents`(id) | Contextual agent. |

## 3. Indexing Strategy

To support high-performance queries and drill-downs, the following indexes are mandatory:

- **Time-based queries**: `CREATE INDEX idx_raw_events_timestamp ON raw_events(timestamp);`
- **Type-based queries**: `CREATE INDEX idx_raw_events_type ON raw_events(event_type);`
- **Hierarchical lookups**:
    - `CREATE INDEX idx_sessions_repo ON sessions(repository_id);`
    - `CREATE INDEX idx_tasks_session ON tasks(session_id);`
    - `CREATE INDEX idx_interventions_task ON interventions(task_id);`
- **Drill-down/Aggregation optimization**:
    - `CREATE INDEX idx_raw_events_hierarchy ON raw_events(repository_id, session_id, task_id, agent_id);`

## 4. Performance Considerations

- **JSON Support**: SQLite's `json1` extension (or built-in JSON functions in newer versions) will be used for the `metadata` and `payload` columns.
- **Write Throughput**: As an event-driven system, `raw_events` will experience high write volume. WAL (Write-Ahead Logging) mode will be enabled in SQLite.
- **Read Efficiency**: Covering indexes and composite indexes are used to minimize table scans during heavy analytical queries.