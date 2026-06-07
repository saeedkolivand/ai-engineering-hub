CREATE TABLE IF NOT EXISTS metrics (
    id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);