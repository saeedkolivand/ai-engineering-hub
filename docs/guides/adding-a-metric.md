# Adding an analytics metric

**Metrics** are aggregations over `raw_events`. A new metric = a new type + a database query + an API endpoint + a UI table column.

Example: **Lint Success Rate** (build quality).

## 1. Type contract (single source of truth)

Update both TS and Rust mirrors.

**TS:** `packages/shared-types/src/index.ts`

```typescript
export interface QualityMetrics {
  build_success: number | null;
  test_success: number | null;
  lint_success: number | null;      // ← NEW
  regressions: number | null;
}
```

**Rust:** `packages/shared-types/src/lib.rs`

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct QualityMetrics {
    pub build_success: Option<f64>,
    pub test_success: Option<f64>,
    pub lint_success: Option<f64>,      // ← NEW
    pub regressions: Option<f64>,
}
```

## 2. Database layer (optional)

If the metric needs a new payload field, add a migration.

**Create:** `apps/ai-engineering-hub/src-tauri/migrations/YYYYMMDDHHMMSS_add_lint_status.sql`

```sql
-- No schema change needed if tools just emit lint_status in the JSON payload.
-- If you want an indexed column, add it to raw_events:
-- ALTER TABLE raw_events ADD COLUMN lint_status TEXT;
-- CREATE INDEX idx_lint_status ON raw_events(lint_status);
```

For most metrics, the payload JSON is enough — no migration needed.

## 3. Query (analytics.rs)

Add a query function in `apps/ai-engineering-hub/core/src/analytics.rs`:

```rust
pub async fn lint_success_rate(pool: &SqlitePool) -> AppResult<Option<f64>> {
    let sql = "SELECT CASE \
               WHEN SUM(json_extract(payload, '$.lint_status') IS NOT NULL) = 0 \
               THEN NULL \
               ELSE SUM(CASE WHEN json_extract(payload, '$.lint_status') = 'success' \
                    THEN 1 ELSE 0 END) * 100.0 / \
                    SUM(json_extract(payload, '$.lint_status') IS NOT NULL) \
               END AS value FROM raw_events";
    scalar_opt(pool, sql).await
}
```

Update `quality_metrics()` to call it:

```rust
pub async fn quality_metrics(pool: &SqlitePool) -> AppResult<QualityMetrics> {
    Ok(QualityMetrics {
        build_success: scalar_opt(pool, &rate_over_present("$.build_status", "'success'")).await?,
        test_success: scalar_opt(pool, &rate_over_present("$.test_status", "'success'")).await?,
        lint_success: lint_success_rate(pool).await?,  // ← NEW
        regressions: scalar_opt(pool, &rate_over_present("$.regression", "'true'")).await?,
    })
}
```

## 4. API exposure (server.rs)

The route already aggregates and serves all metrics — no change needed. `GET /api/v1/analytics` automatically includes the new field in `QualityMetrics`.

Update the OpenAPI docs (inline comments in the route) if you want:

```rust
/// GET /api/v1/analytics — all metrics
/// Returns AnalyticsMetrics with categories: tokens, savings, productivity,
/// quality (including build_success, test_success, lint_success, regressions), retrieval.
```

## 5. Frontend rendering

Add a row to the Quality table in `apps/ai-engineering-hub/src/frontend/src/routes/quality.tsx`:

```tsx
{
  label: "Lint Success",
  value: data.quality.lint_success,
  category: "quality"
}
```

The `pct()` helper already handles `null → "—"`.

## 6. Test it

```bash
cargo build --workspace
pnpm app:dev  # Push events with lint_status
```

Curl to test:

```bash
curl http://127.0.0.1:47800/api/v1/analytics | jq .quality.lint_success
```

## Dimensions (optional — bonus)

To break down lint success by source / provider / agent / repository, add a dimensional query (see [Analytics](../analytics.md)):

```rust
pub async fn lint_success_breakdown(
    pool: &SqlitePool,
    group_by: &str,  // "source" | "provider" | "agent" | "repository"
) -> AppResult<Vec<Breakdown>> {
    // Similar to token_metrics() — group by the dimension, aggregate the rate
    todo!()
}
```

Expose at `/api/v1/analytics/quality/lint-success?group_by=source` and add a filter control to the UI.

---

Related: [Analytics](../analytics.md) · [API reference](../api.md)
