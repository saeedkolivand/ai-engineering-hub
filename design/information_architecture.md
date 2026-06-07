# Information Architecture: AI Engineering Hub

## 1. Overview
The Information Architecture (IA) defines the structural organization and navigation paths within the AI Engineering Hub. The goal is to provide deep drill-down capabilities while maintaining operational awareness.

## 2. Core Navigation Hierarchy (Left Nav)

### 2.1 Overview
- Global KPI Summaries (Tokens, Savings, Productivity, Quality).
- Recent Activity Highlights.
- System Health/Status.

### 2.2 Repositories
- Repository List (Table).
- Repository Detail View:
    - Metadata & Stats.
    - Session List (Drill-down to Session).
    - Intelligence Insights (Hotspots, Bottlenecks).

### 2.3 Sessions
- Global Session List.
- Session Detail View:
    - Task List (Drill-down to Task).
    - Timeline of events.
    - Resource consumption summary.

### 2.4 Tasks
- Global Task List.
- Task Detail View:
    - Agent logs/activity.
    - Intervention history.
    - Success/Failure analysis.

### 2.5 Agents
- Agent List (Catalog of all agents used).
- Agent Detail View:
    - Performance metrics per agent/provider.
    - Usage patterns.

### 2.6 Retrieval
- Retrieval Performance (Accuracy, Latency, Savings).
- Context Window Health.
- Vector DB/Index performance (if applicable).

### 2.7 Analytics
- Token Analytics (Daily/Weekly/Monthly, Provider, Repo).
- Savings Analytics (RTK, Graphify, CodeGraph, Total).
- Productivity Analytics (Success rates, Intervention rates).
- Quality Analytics (Build/Test/Lint success, Regressions).

### 2.8 Quality
- Build Success Rates.
- Test Success Rates.
- Linting Status.
- Regression Tracking.

### 2.9 Activity
- Global Activity Feed (Live).
- Timeline Views (Repo/Session/Task/Agent).

### 2.10 Settings
- Connection/Integration settings.
- User preferences.
- Database management.

## 3. Drill-down Workflow (The Golden Path)

`Repository` $\rightarrow$ `Session` $\rightarrow$ `Task` $\rightarrow$ `Agent` $\rightarrow$ `Intervention` $\rightarrow$ `Metric`

Every metric at any level must support a "drill-down" action to reveal the underlying raw events or the next level of granularity in the hierarchy.

## 4. UI Layout Strategy

### 4.1 Three-Panel Layout
1. **Left Navigation**: Fixed, slim or expanded, provides high-level context switching.
2. **Center Content**: Dynamic, primary workspace for tables, charts, and workflow execution.
3. **Right Context Panel**: Context-aware sidebar. Changes based on the selected entity in the Center Content (e.g., if a Task is selected, show Task metadata and related Agent).

### 4.2 Command & Search
- **Command Palette (Ctrl+K)**: Global action hub for navigation and quick commands.
- **Global Search**: Search across Repositories, Sessions, Tasks, and Agents.
- **Breadcrumbs**: Always visible at the top of the Center Content to show current depth in the hierarchy.

## 5. Data Density & Interaction
- **Tables-First**: Use high-density TanStack Tables for almost all data views.
- **Virtualization**: Essential for all large lists (Sessions, Tasks, Activity Feed).
- **Keyboard Navigation**: Support for arrow keys, tab, and command palette for power users.