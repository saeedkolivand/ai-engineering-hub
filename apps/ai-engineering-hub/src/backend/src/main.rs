#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let pool = crate::db::init_db().await?;
    let (tx, _) = tokio::sync::broadcast::channel(100);
    let state = crate::db::AppState { pool, tx };

    let router = crate::ws::build_router(state.clone())
        .merge(crate::routes::analytics::analytics_router())
        .merge(crate::routes::analytics_savings::savings_router());

    axum::Server::bind("127.0.0.1:0".parse()?)
        .serve(router.into_make_service())
        .await?;
    Ok(())
}