"""Minimal query: search DB directly with a fixed query vector."""
import asyncio
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine

ENGINE = create_async_engine(
    "postgresql+asyncpg://postgres:postgres@localhost:5432/chatbot_plugin",
    echo=False,
)
QUERY_VEC = [1.0] + [0.0] * 767  # should match v0 most closely

async def main():
    from chatbot_plugin_sdk.models import Article, ArticleChunk

    async with ENGINE.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

    async with ENGINE.connect() as conn:
        stmt = (
            select(
                ArticleChunk.id,
                ArticleChunk.chunk_index,
                ArticleChunk.content,
                Article.title,
                Article.url,
                ArticleChunk.dense_vector.cosine_distance(QUERY_VEC).label("dist"),
            )
            .join(Article, ArticleChunk.article_id == Article.id)
            .order_by(ArticleChunk.dense_vector.cosine_distance(QUERY_VEC))
            .limit(3)
        )
        rows = (await conn.execute(stmt)).all()

        print("=== query vector = [1.0, 0, 0, ...] ===")
        for r in rows:
            print(f"  chunk {r.chunk_index}: dist={r.dist:.4f} | {r.content[:40]}")

asyncio.run(main())
