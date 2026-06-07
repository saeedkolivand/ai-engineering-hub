CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    model_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);