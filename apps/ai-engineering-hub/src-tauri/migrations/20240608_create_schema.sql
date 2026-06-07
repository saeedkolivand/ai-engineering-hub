-- Migration: create initial schema for AI Engineering Hub
-- This file creates all tables and indexes as defined in design/database_schema.md

BEGIN TRANSACTION;

-- repositories table
CREATE TABLE IF NOT EXISTS repositories (
    id TEXT PRIMARY KEY,               -- UUID
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    metadata TEXT,                     -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    status TEXT NOT NULL
);

-- tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    description TEXT,
    status TEXT NOT NULL,
    started_at DATETIME,
    completed_at DATETIME
);

-- agents table
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    model_id TEXT
);

-- task_agents junction table
CREATE TABLE IF NOT EXISTS task_agents (
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, agent_id)
);

-- interventions table
CREATE TABLE IF NOT EXISTS interventions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    timestamp DATETIME NOT NULL,
    description TEXT,
    impact TEXT
);

-- raw_events table
CREATE TABLE IF NOT EXISTS raw_events (
    id TEXT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    source TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT,                     -- JSON
    repository_id TEXT REFERENCES repositories(id) ON DELETE SET NULL,
    session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL,
    task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_raw_events_timestamp ON raw_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_raw_events_type ON raw_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sessions_repo ON sessions(repository_id);
CREATE INDEX IF NOT EXISTS idx_tasks_session ON tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_interventions_task ON interventions(task_id);
CREATE INDEX IF NOT EXISTS idx_raw_events_hierarchy ON raw_events(repository_id, session_id, task_id, agent_id);

COMMIT;