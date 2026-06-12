"""Minimal seed: insert test article + chunks directly via SDK."""
import asyncio
import uuid
from chatbot_plugin_sdk import RagArticleProcessor

article_id = uuid.UUID("11111111-1111-1111-1111-111111111111")

# 768-dim vectors with intentional similarity pattern
v0 = [1.0] + [0.0] * 767   # article chunk 0
v1 = [0.9] + [0.1] * 767   # article chunk 1
v2 = [0.0] * 768           # noise chunk

async def main():
    p = RagArticleProcessor()
    p.configure(dbname="chatbot_plugin", user="postgres", password="postgres")
    await p._save_article_and_chunks(
        article_id=article_id,
        metadata={
            "url": "https://example.com/rag-intro",
            "title": "RAG 介紹",
            "source": "example.com",
            "metadata": {"author": "test", "tags": ["RAG"]},
        },
        chunks_data=[
            {"chunk_index": 0, "content": "RAG 是一種結合檢索與生成的技術。", "dense_vector": v0},
            {"chunk_index": 1, "content": "它透過外部知識庫增強語言模型的回答品質。", "dense_vector": v1},
            {"chunk_index": 2, "content": "這是一句不相關的填充文字。", "dense_vector": v2},
        ],
    )
    print("Inserted 1 article + 3 chunks.")

asyncio.run(main())
