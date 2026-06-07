-- Repository table
CREATE TABLE IF NOT EXISTS repository (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_repository_name ON repository(name);

-- Session table
CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    repository_id TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    FOREIGN KEY (repository_id) REFERENCES repository(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_repo ON session(repository_id);
CREATE INDEX IF NOT EXISTS idx_session_started ON session(started_at);

-- Task table
CREATE TABLE IF NOT EXISTS task (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_session ON task(session_id);
CREATE INDEX IF NOT EXISTS idx_task_status ON task(status);

-- Agent table
CREATE TABLE IF NOT EXISTS agent (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    last_seen INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_status ON agent(status);
CREATE INDEX IF NOT EXISTS idx_agent_last_seen ON agent(last_seen);

-- Metric table
CREATE TABLE IF NOT EXISTS metric (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    value TEXT NOT NULL,
    unit TEXT,
    timestamp INTEGER NOT NULL,
    category TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_metric_category ON metric(category);
CREATE INDEX IF NOT EXISTS idx_metric_timestamp ON metric(timestamp);