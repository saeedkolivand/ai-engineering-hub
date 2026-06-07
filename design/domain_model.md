# Domain Model: AI Engineering Hub

## 1. Overview
The domain model represents the core business logic of the AI Engineering Operations Platform. It is organized around Bounded Contexts to ensure separation of concerns and scalability.

## 2. Bounded Contexts

### 2.1 Metrics Ingestion Context
**Responsibility**: Ingesting raw data from various AI tools and logs.
**Key Concepts**:
- `IngestionSource`: Where the data comes from (e.g., Claude Code, Cline).
- `RawEvent`: A single piece of telemetry data.
- `LogParser`: Logic to transform unstructured logs into structured events.

### 2.2 Session & Task Management Context
**Responsibility**: Tracking the hierarchy of AI engineering work.
**Key Concepts**:
- `Repository`: The root container for all engineering activities.
- `Session`: A temporal grouping of tasks within a repository.
- `Task`: A specific objective being pursued by an agent.
- `Agent`: The AI entity (or entities) performing the work.
- `Intervention`: A human-in-the-loop event that alters the agent's state or task.

### 2.3 Analytics Context
**Responsibility**: Calculating high-level metrics from raw events.
**Key Concepts**:
- `MetricAggregator`: Service that processes raw events into meaningful statistics.
- `TokenUsage`: Tracking consumption across providers and time.
- `ProductivityMetric`: Calculations for success rates, retry rates, etc.
- `QualityMetric`: Calculations for build/test success and regressions.
- `SavingsMetric`: Calculating cost/time saved via automation.

### 2.4 Repository Intelligence Context
**Responsibility**: Deep analysis of repository patterns and bottlenecks.
**Key Concepts**:
- `Hotspot`: Areas of high activity or frequent failure.
- `Bottleneck`: Latency or retrieval issues.
- `WorkflowPattern`: Common sequences of agent actions.

### 2.5 Real-time Event Context
**Responsibility**: Propagating live updates to the UI and external plugins.
**Key Concepts**:
- `LiveEvent`: An event ready for broadcast via WebSocket.
- `EventStream`: The managed stream of live updates.

## 3. Core Entities & Aggregates

### 3.1 Repository (Aggregate Root)
- `id`: UUID
- `name`: String
- `path`: String
- `metadata`: Map<String, String>
- `created_at`: Timestamp

### 3.2 Session (Aggregate Root)
- `id`: UUID
- `repository_id`: UUID
- `start_time`: Timestamp
- `end_time`: Option<Timestamp>
- `status`: SessionStatus (Active, Completed, Interrupted)

### 3.3 Task (Aggregate Root)
- `id`: UUID
- `session_id`: UUID
- `description`: String
- `status`: TaskStatus (Pending, Running, Success, Failed, Interrupted)
- `started_at`: Timestamp
- `completed_at`: Option<Timestamp>

### 3.4 Agent (Entity)
- `id`: UUID
- `name`: String
- `provider`: ProviderType (Claude, Gemini, etc.)
- `model_id`: String

### 3.5 Intervention (Entity)
- `id`: UUID
- `task_id`: UUID
- `agent_id`: UUID
- `timestamp`: Timestamp
- `description`: String
- `impact`: InterventionImpact (Minor, Major, Critical)

### 3.6 RawEvent (Value Object / Entity)
- `id`: UUID
- `timestamp`: Timestamp
- `source`: String
- `event_type`: String
- `payload`: JSON/Structured Data

## 4. Relationships (Hierarchy)
`Repository` $\rightarrow$ `Session` $\rightarrow$ `Task` $\rightarrow$ `Agent` $\rightarrow$ `Intervention` $\rightarrow$ `Metric`