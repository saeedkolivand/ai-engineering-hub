-- Migration: create metrics table
CREATE TABLE IF NOT EXISTS metrics (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    metric_type TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT,
    recorded_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);