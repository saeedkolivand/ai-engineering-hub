use axum::{
    routing::{get, post, put},
    Router,
    Json,
    extract::{Path, Extension},
    response::IntoResponse,
    http::StatusCode,
};
use sqlx::SqlitePool;
use uuid::Uuid;
use serde_json::json;
use shared_types::{Repository, Session, Task, Agent};

pub fn router() -> Router {
    Router::new()
        // Repository routes
        .route("/api/repositories", get(list_repositories).post(create_repository))
        .route("/api/repositories/:id", get(get_repository).delete(delete_repository))
        // Session routes
        .route("/api/sessions", post(create_session))
        .route("/api/sessions/:id", get(get_session).put(update_session))
        // Task routes
        .route("/api/tasks", post(create_task))
        .route("/api/tasks/:id", get(get_task).put(update_task))
        // Agent routes
        .route("/api/agents", get(list_agents))
        // Health
        .route("/api/health", get(health_handler))
}

/// Health check
async fn health_handler() -> impl IntoResponse {
    (StatusCode::OK, "OK")
}

/// List all repositories
async fn list_repositories(Extension(pool): Extension<SqlitePool>) -> impl IntoResponse {
    let rows = sqlx::query_as!(
        Repository,
        r#"SELECT id as "id: Uuid", name, path, metadata as "metadata: serde_json::Value?", created_at as "created_at: _"
          FROM repositories"
    )
    .fetch_all(&pool)
    .await;

    match rows {
        Ok(repos) => (StatusCode::OK, Json(json!({"repositories": repos}))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": e.to_string()})),
        ),
    }
}

/// Get a single repository
async fn get_repository(
    Path(id): Path<Uuid>,
    Extension(pool): Extension<SqlitePool>,
) -> impl IntoResponse {
    let row = sqlx::query_as!(
        Repository,
        r#"SELECT id as "id: Uuid", name, path, metadata as "metadata: serde_json::Value?", created_at as "created_at: _"
          FROM repositories WHERE id = ?"#,
        id
    )
    .fetch_one(&pool)
    .await;

    match row {
        Ok(repo) => (StatusCode::OK, Json(repo)),
        Err(sqlx::Error::RowNotFound) => (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "Repository not found"})),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": e.to_string()})),
        ),
    }
}

/// Create a new repository
async fn create_repository(
    Json(payload): Json<Repository>,
    Extension(pool): Extension<SqlitePool>,
) -> impl IntoResponse {
    let result = sqlx::query!(
        r#"INSERT INTO repositories (id, name, path, metadata, created_at)
          VALUES (?, ?, ?, ?, ?)"#,
        payload.id,
        payload.name,
        payload.path,
        payload.metadata,
        payload.created_at
    )
    .execute(&pool)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(json!({"id": payload.id}))),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": e.to_string()})),
        ),
    }
}

/// Delete a repository
async fn delete_repository(
    Path(id): Path<Uuid>,
    Extension(pool): Extension<SqlitePool>,
) -> impl IntoResponse {
    let result = sqlx::query!("DELETE FROM repositories WHERE id = ?", id)
        .execute(&pool)
        .await;

    match result {
        Ok(r) if r.rows_affected() > 0 => (StatusCode::NO_CONTENT, Json(json!({}))),
        Ok(_) => (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "Repository not found"})),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": e.to_string()})),
        ),
    }
}

/// Create a session
async fn create_session(
    Json(payload): Json<Session>,
    Extension(pool): Extension<SqlitePool>,
) -> impl IntoResponse {
    let result = sqlx::query!(
        r#"INSERT INTO sessions (id, repository_id, start_time, end_time, status)
          VALUES (?, ?, ?, ?, ?)"#,
        payload.id,
        payload.repository_id,
        payload.start_time,
        payload.end_time,
        format!("{:?}", payload.status)
    )
    .execute(&pool)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(json!({"id": payload.id}))),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": e.to_string()})),
        ),
    }
}

/// Get a session
async fn get_session(
    Path(id): Path<Uuid>,
    Extension(pool): Extension<SqlitePool>,
) -> impl IntoResponse {
    let row = sqlx::query_as!(
        Session,
        r#"SELECT id as "id: Uuid", repository_id as "repository_id: Uuid", start_time as "start_time: _",
               end_time as "end_time: _", status as "status: String"
          FROM sessions WHERE id = ?"#,
        id
    )
    .fetch_one(&pool)
    .await;

    match row {
        Ok(session) => (StatusCode::OK, Json(session)),
        Err(sqlx::Error::RowNotFound) => (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "Session not found"})),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": e.to_string()})),
        ),
    }
}

/// Update a session (e.g., set end_time or status)
async fn update_session(
    Path(id): Path<Uuid>,
    Json(payload): Json<serde_json::Value>,
    Extension(pool): Extension<SqlitePool>,
) -> impl IntoResponse {
    // Simple example: only allow updating end_time and status
    let end_time = payload.get("end_time").and_then(|v| v.as_str());
    let status = payload.get("status").and_then(|v| v.as_str());

    let mut query = String::from("UPDATE sessions SET ");
    let mut args: Vec<(&str, &dyn sqlx::Encode<sqlx::Sqlite> + sqlx::Type<sqlx::Sqlite>)> = Vec::new();

    if let Some(et) = end_time {
        query.push_str("end_time = ?, ");
        args.push(("end_time", &et));
    }
    if let Some(st) = status {
        query.push_str("status = ?, ");
        args.push(("status", &st));
    }
    // Trim trailing comma and space
    query.truncate(query.len() - 2);
    query.push_str(" WHERE id = ?");
    args.push(("id", &id));

    let mut qb = sqlx::query(&query);
    for (key, value) in args {
        qb = qb.bind(value);
    }

    let result = qb.execute(&pool).await;

    match result {
        Ok(_) => (StatusCode::OK, Json(json!({"message": "Session updated"}))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": e.to_string()})),
        ),
    }
}

/// Create a task
async fn create_task(
    Json(payload): Json<Task>,
    Extension(pool): Extension<SqlitePool>,
) -> impl IntoResponse {
    let result = sqlx::query!(
        r#"INSERT INTO tasks (id, session_id, description, status, started_at, completed_at)
          VALUES (?, ?, ?, ?, ?, ?)"#,
        payload.id,
        payload.session_id,
        payload.description,
        format!("{:?}", payload.status),
        payload.started_at,
        payload.completed_at
    )
    .execute(&pool)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(json!({"id": payload.id}))),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": e.to_string()})),
        ),
    }
}

/// Get a task
async fn get_task(
    Path(id): Path<Uuid>,
    Extension(pool): Extension<SqlitePool>,
) -> impl IntoResponse {
    let row = sqlx::query_as!(
        Task,
        r#"SELECT id as "id: Uuid", session_id as "session_id: Uuid", description, status as "status: String",
               started_at as "started_at: _", completed_at as "completed_at: _"
          FROM tasks WHERE id = ?"#,
        id
    )
    .fetch_one(&pool)
    .await;

    match row {
        Ok(task) => (StatusCode::OK, Json(task)),
        Err(sqlx::Error::RowNotFound) => (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "Task not found"})),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": e.to_string()})),
        ),
    }
}

/// Update a task (status, description, etc.)
async fn update_task(
    Path(id): Path<Uuid>,
    Json(payload): Json<serde_json::Value>,
    Extension(pool): Extension<SqlitePool>,
) -> impl IntoResponse {
    let mut query = String::from("UPDATE tasks SET ");
    let mut args: Vec<(&str, &dyn sqlx::Encode<sqlx::Sqlite> + sqlx::Type<sqlx::Sqlite>)> = Vec::new();

    if let Some(desc) = payload.get("description").and_then(|v| v.as_str()) {
        query.push_str("description = ?, ");
        args.push(("description", &desc));
    }
    if let Some(status) = payload.get("status").and_then(|v| v.as_str()) {
        query.push_str("status = ?, ");
        args.push(("status", &status));
    }

    query.truncate(query.len() - 2);
    query.push_str(" WHERE id = ?");
    args.push(("id", &id));

    let mut qb = sqlx::query(&query);
    for (key, value) in args {
        qb = qb.bind(value);
    }

    let result = qb.execute(&pool).await;

    match result {
        Ok(_) => (StatusCode::OK, Json(json!({"message": "Task updated"}))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": e.to_string()})),
        ),
    }
}

/// List agents (placeholder)
async fn list_agents(Extension(pool): Extension<SqlitePool>) -> impl IntoResponse {
    let rows = sqlx::query_as!(
        Agent,
        r#"SELECT id as "id: Uuid", name, provider, model_id FROM agents"
    )
    .fetch_all(&pool)
    .await;

    match rows {
        Ok(agents) => (StatusCode::OK, Json(json!({"agents": agents}))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": e.to_string()})),
        ),
    }
}