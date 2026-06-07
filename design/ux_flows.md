# UX Flows & Layout: AI Engineering Hub

## 1. Design Philosophy
The platform is an **operational tool**, not a reporting dashboard. It is designed for engineers who keep it open as their "Command Center".

- **Information Density**: High. Use compact tables, minimized padding, and clear typography to maximize visible data.
- **Operational Awareness**: Real-time updates (Activity Feed) ensure the user is always aware of background processes.
- **Workflow Efficiency**: Deeply integrated keyboard navigation and a powerful command palette.
- **Contextual Depth**: Every data point must be clickable and lead to a deeper level of investigation (Drill-down).

## 2. Mandatory Layout

### 2.1 Three-Panel Architecture
1. **Left Navigation (The Anchor)**: 
   - Provides global context switching.
   - Fixed width (collapsed/expanded states).
   - Links: Overview, Repositories, Sessions, Tasks, Agents, Retrieval, Analytics, Quality, Activity, Settings.
2. **Center Content (The Workspace)**:
   - The primary interaction area.
   - Contains high-density tables (TanStack Table), visualizations, and detailed entity views.
   - Header: Breadcrumbs for hierarchy, Global Search, and Command Palette trigger.
3. **Right Context Panel (The Inspector)**:
   - Context-aware sidebar.
   - Displays metadata, related entities, and quick actions for the currently selected item in the Center Content.
   - Collapsible to maximize workspace.

## 3. Core Workflow: The Drill-Down Path

The platform follows a strict hierarchical relationship:
`Repository` $\rightarrow$ `Session` $\rightarrow$ `Task` $\rightarrow$ `Agent` $\rightarrow$ `Intervention` $\rightarrow$ `Metric`

### 3.1 Repository Exploration Flow
1. **Discovery**: User selects "Repositories" from Left Nav $\rightarrow$ Center displays a high-density Repository List.
2. **Selection**: User clicks a Repository row $\rightarrow$ Center transitions to "Repository Detail View" (showing active sessions, intelligence hotspots).
3. **Context**: Right panel displays Repository metadata (path, owner, etc.) and quick actions (e.g., "Start New Session").

### 3.2 Task Investigation Flow
1. **Session Entry**: From Repository View, user selects a Session $\rightarrow$ Center shows "Session Detail View" (Task list, Timeline).
2. **Task Selection**: User clicks a Task $\rightarrow$ Center transitions to "Task Detail View" (Agent logs, intervention history, task status).
3. **Deep Dive**: User clicks an Agent in the task log $\rightarrow$ Center transitions to "Agent Detail View".

### 3.3 Metric Investigation Flow
1. **Observation**: User sees a spike in token usage in the "Overview" or "Analytics" view.
2. **Drill-down**: User clicks the specific metric/datapoint $\rightarrow$ Center filters the Task/Session list to show only those contributing to that metric.
3. **Root Cause**: User investigates the `RawEvent` responsible for the metric spike via the Detail View.

## 4. Navigation & Interaction Patterns

### 4.1 Command Palette (Ctrl+K)
- Fast navigation to any view.
- Quick search for Repositories, Tasks, or Agents.
- Command execution (e.g., "Start Session", "Import Logs").

### 4.2 Global Search
- Unified search bar in the Center Header.
- Fuzzy matching across all major entities.

### 4.3 Breadcrumbs
- Always visible at the top of the Center Content.
- Allows instant jumping back up the hierarchy (e.g., `Repos > my-project > sessions > session-abc`).

### 4.4 Keyboard Shortcuts
- `Ctrl+K`: Command Palette.
- `Esc`: Close panels/modals.
- `Arrow Keys / Tab`: Table and list navigation.
- `Enter`: Select/Drill-down.

## 5. Real-time Activity Feed
- **Location**: Integrated into the "Activity" view and as a collapsible "Toast/Live" notification area.
- **Content**: High-velocity updates (e.g., "Agent X started Task Y", "New log ingested from Claude Code").
- **Interaction**: Clicking an activity item immediately navigates the user to the relevant entity in the Center Content.