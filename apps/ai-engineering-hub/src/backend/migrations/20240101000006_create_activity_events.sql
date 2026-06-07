CREATE TABLE IF NOT EXISTS activity_events (
    id TEXT PRIMARY KEY,
    repository_id TEXT REFERENCES repositories(id),
    session_id TEXT REFERENCES sessions(id),
    task_id TEXT REFERENCES tasks(id),
    agent_id TEXT REFERENCES agents(id),
    event_type TEXT NOT NULL,
    description TEXT,
    token_impact INTEGER DEFAULT 0,
    metadata TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_events_timestamp ON activity_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_events_repository ON activity_events(repository_id);
CREATE INDEX IF NOT EXISTS idx_metrics_task ON metrics(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_session ON tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_repository ON sessions(repository_id);