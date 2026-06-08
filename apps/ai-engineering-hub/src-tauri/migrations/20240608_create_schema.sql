-- Canonical schema for AI Engineering Hub.
-- Hierarchical drill-down (repository -> session -> task -> agent -> intervention -> metric)
-- plus a dynamic `sources` registry so any tool can be tracked without a code change.

-- Dynamic tool/source registry. The named tools (Claude Code, RTK, Graphify, ...) are
-- seed presets here, NOT hardcoded in code.
CREATE TABLE IF NOT EXISTS sources (
    id            TEXT PRIMARY KEY,            -- UUID
    key           TEXT NOT NULL UNIQUE,        -- slug, e.g. 'claude-code', 'rtk'
    display_name  TEXT NOT NULL,
    kind          TEXT NOT NULL DEFAULT 'cli', -- cli | mcp | library | service | custom
    origin        TEXT NOT NULL DEFAULT 'user_defined', -- builtin_preset | auto_detected | user_defined
    capabilities  TEXT NOT NULL DEFAULT '{}',  -- JSON: emits_tokens/savings/build/test/lint/retrieval
    mapping_rules TEXT,                         -- JSON for the ConfigurableAdapter (JSONPath/regex -> canonical)
    enabled       INTEGER NOT NULL DEFAULT 0,   -- 0/1
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at  DATETIME,
    event_count   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS repositories (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    path       TEXT NOT NULL,
    metadata   TEXT,                            -- JSON
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id            TEXT PRIMARY KEY,
    repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    start_time    DATETIME NOT NULL,
    end_time      DATETIME,
    status        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id           TEXT PRIMARY KEY,
    session_id   TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    description  TEXT,
    status       TEXT NOT NULL,
    started_at   DATETIME,
    completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS agents (
    id       TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    provider TEXT NOT NULL,                     -- 'anthropic', 'google', ...
    model_id TEXT
);

CREATE TABLE IF NOT EXISTS task_agents (
    task_id  TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, agent_id)
);

CREATE TABLE IF NOT EXISTS interventions (
    id          TEXT PRIMARY KEY,
    task_id     TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    agent_id    TEXT REFERENCES agents(id) ON DELETE SET NULL,
    timestamp   DATETIME NOT NULL,
    description TEXT,
    impact      TEXT
);

-- High-volume event landing table. `source` is the dynamic tool dimension;
-- `provider` and `agent` are independent dimensions resolved from the payload/joins.
CREATE TABLE IF NOT EXISTS raw_events (
    id            TEXT PRIMARY KEY,
    timestamp     DATETIME NOT NULL,
    source        TEXT NOT NULL,                -- source key (denormalized for fast group-by)
    source_id     TEXT REFERENCES sources(id) ON DELETE SET NULL,
    event_type    TEXT NOT NULL,
    payload       TEXT,                          -- JSON
    repository_id TEXT REFERENCES repositories(id) ON DELETE SET NULL,
    session_id    TEXT REFERENCES sessions(id) ON DELETE SET NULL,
    task_id       TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    agent_id      TEXT REFERENCES agents(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_raw_events_timestamp ON raw_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_raw_events_type      ON raw_events(event_type);
CREATE INDEX IF NOT EXISTS idx_raw_events_source    ON raw_events(source);
CREATE INDEX IF NOT EXISTS idx_raw_events_hierarchy ON raw_events(repository_id, session_id, task_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_sessions_repo        ON sessions(repository_id);
CREATE INDEX IF NOT EXISTS idx_tasks_session        ON tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_interventions_task   ON interventions(task_id);
