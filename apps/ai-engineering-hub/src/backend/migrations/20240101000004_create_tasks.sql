CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    agent_id TEXT REFERENCES agents(id),
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TEXT,
    completed_at TEXT,
    tokens_used INTEGER DEFAULT 0,
    tokens_saved INTEGER DEFAULT 0,
    interventions INTEGER DEFAULT 0,
    retries INTEGER DEFAULT 0,
    first_pass_success INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);