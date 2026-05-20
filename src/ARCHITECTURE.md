# Architecture Design

This document describes the target architecture for chatbot-plugin. Features are implemented incrementally — this serves as the design reference, not a description of current state.

## Target Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    scrape-and-analyze                             │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐  │
│  │   Frontend  │  │   Backend   │  │   chatbot-plugin        │  │
│  │  (Next.js)  │──│  (FastAPI)  │◀─┤                          │  │
│  │             │  │             │  │  ┌────────────────────┐  │  │
│  │  /chat page │  │             │  │  │  Routers           │  │  │
│  │             │  │             │  │  │  /message          │  │  │
│  └─────────────┘  └──────┬──────┘  │  │  /search           │  │  │
│                          │         │  │  /index            │  │  │
│                          │         │  └─────────┬──────────┘  │  │
│                          │         │            │             │  │
│                          │         │  ┌─────────▼──────────┐  │  │
│                          │         │  │  LangChain RAG     │  │  │
│                          │         │  │  - Retriever       │  │  │
│                          │         │  │  - Prompt Template │  │  │
│                          │         │  │  - Output Parser   │  │  │
│                          │         │  └─────────┬──────────┘  │  │
│                          │         │            │             │  │
│                          │         │  ┌─────────▼──────────┐  │  │
│                          │         │  │  Hybrid Search     │  │  │
│                          │         │  │  Dense  (pgvector) │  │  │
│                          │         │  │  Sparse (BGE-M3 /  │  │  │
│                          │         │  │          tsvector) │  │  │
│                          │         │  │  RRF Fusion        │  │  │
│                          │         │  └─────────┬──────────┘  │  │
│                          │         └────────────┼─────────────┘  │
│                          │                      │                │
│                          ▼                      ▼                │
│                   ┌─────────────────────────────────┐             │
│                   │  PostgreSQL 15 + pgvector       │             │
│                   │  articles, analyses,            │             │
│                   │  article_chunks (dense + sparse)│             │
│                   └─────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    ┌─────────────┐     ┌──────────────┐
                    │ LLM Provider│     │ Embedding     │
                    │ (Anthropic/ │     │ (BGE-M3)      │
                    │   Gemini)   │     │               │
                    └─────────────┘     └──────────────┘
```

## Hybrid Search + RRF Flow

```
User Query
    │
    ▼
┌──────────────┐
│  Embed Query  │  BGE-M3 → query_dense_vec + query_sparse_vec
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│  Parallel Search                              │
│                                               │
│  Dense:  cosine similarity via pgvector       │
│          ORDER BY dense_vector <=> query_vec  │
│                                               │
│  Sparse: BM25 tsvector / neural sparse         │
└──────┬───────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│  RRF Fusion   │  score_d(i) = 1/(k + rank_d(i))
│  k=60         │  score_s(i) = 1/(k + rank_s(i))
│               │  final(i) = score_d(i) + score_s(i)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Top-K Chunks │  Take top 10-20 chunks
│  → Context    │  Deduplicate, assemble into context
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  LLM Generate │  LangChain prompt template + context + query
│  + Citation   │  Each context segment annotated [source: article_title]
└──────────────┘
```

## Target Project Structure

```
chatbot-plugin/
├── pyproject.toml              # Package definition & dependencies
├── alembic/                    # Migrations for article_chunks table
│   └── versions/
│       └── 001_add_pgvector_chunks.py
├── src/
│   └── chatbot_plugin/
│       ├── __init__.py         # Package entry point
│       ├── app.py              # FastAPI sub-app
│       ├── config.py           # Pydantic settings (CHATBOT_* env vars)
│       ├── db.py               # DB session (shares scrape-and-analyze PG)
│       ├── routers/
│       │   ├── __init__.py
│       │   ├── chat.py         # POST /message (main conversation)
│       │   └── search.py       # POST /search (pure retrieval)
│       ├── service.py          # ChatService - conversation orchestration
│       ├── rag/
│       │   ├── __init__.py
│       │   ├── retriever.py    # LangChain retriever (hybrid search + RRF)
│       │   ├── prompt.py       # Prompt templates & context assembly
│       │   └── chain.py        # LangChain RAG chain definition
│       ├── indexer.py          # Background indexing pipeline
│       └── models/
│           ├── __init__.py
│           └── embedding.py    # ArticleChunk SQLAlchemy model
└── tests/
    └── test_service.py         # Unit tests
```

## Database Schema

The plugin adds the following to the shared PostgreSQL:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE article_chunks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id      UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    chunk_index     INT NOT NULL,
    content         TEXT NOT NULL,
    dense_vector    vector(1024),            -- BGE-M3 dense
    sparse_vector   JSONB,                   -- BGE-M3 sparse weights
    embedding_model VARCHAR(100) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, chunk_index, embedding_model)
);

-- BM25 fallback + RRF hybrid
ALTER TABLE articles ADD COLUMN search_tsv tsvector
    GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,''))
    ) STORED;
CREATE INDEX idx_articles_tsv ON articles USING gin(search_tsv);

-- HNSW index for dense search
CREATE INDEX idx_chunks_dense ON article_chunks
    USING hnsw (dense_vector vector_cosine_ops);
```

Why chunking instead of per-article embedding:
- Papers are thousands of words — whole-article embeddings dilute semantic meaning
- Chunks (256-512 tokens) give more precise retrieval and focused context
- Each chunk keeps `article_id` FK for tracing back to the source paper

## Configuration (full)

| Variable | Default | Description |
|----------|---------|-------------|
| `CHATBOT_LLM_PROVIDER` | `claude` | LLM provider: `claude`, `gemini`, `openrouter` |
| `CHATBOT_LLM_MODEL` | `claude-sonnet-4-6-20250514` | Model name |
| `CHATBOT_MAX_CONTEXT_ARTICLES` | `10` | Max articles to retrieve for RAG context |
| `CHATBOT_MAX_CONTEXT_TOKENS` | `8000` | Max tokens in prompt |
| `CHATBOT_EMBEDDING_MODEL` | `BAAI/bge-m3` | Embedding model |
| `CHATBOT_EMBEDDING_DIMENSION` | `1024` | Dense vector dimension |
| `CHATBOT_RRF_K` | `60` | RRF constant k |

## API Endpoints (full)

### `POST /chat/message`

Send a message and receive a chatbot reply with RAG context.

**Request:**
```json
{
  "message": "What articles discuss RAG implementation?",
  "user_id": "optional-user-id"
}
```

**Response:**
```json
{
  "reply": "Based on 3 articles, RAG implementation involves...",
  "articles_used": [
    {"id": "...", "title": "..."},
    {"id": "...", "title": "..."}
  ]
}
```

### `POST /chat/search`

Pure hybrid search without LLM generation.

**Request:**
```json
{
  "query": "retrieval augmented generation",
  "top_k": 10,
  "topic_id": "optional-uuid-filter"
}
```

**Response:**
```json
{
  "chunks": [
    {"content": "...", "article_id": "...", "article_title": "...", "score": 0.87}
  ]
}
```

### `POST /chat/index`

Trigger embedding indexing for new articles.

**Request:**
```json
{
  "article_id": "optional-uuid-for-single-article"
}
```

**Response:**
```json
{
  "job_id": "...",
  "status": "started"
}
```

### `GET /chat/status`

Check indexing status and vector store stats.

**Response:**
```json
{
  "total_chunks": 1523,
  "last_indexed_at": "2026-05-20T10:00:00Z",
  "pending_articles": 5
}
```

## Integration with scrape-and-analyze

| Concern | Approach |
|---------|----------|
| **Database** | Shared PostgreSQL + pgvector; plugin adds `article_chunks` table |
| **Mounting** | `app.mount("/chat", chatbot_app)` in backend `main.py` |
| **Indexing trigger** | Polling (scan `articles.scraped_at > last_indexed_at`) or webhook from scrape pipeline |
| **Frontend** | Add `/chat` page in existing Next.js app |
| **Models** | `models/` directory shared between backend and plugin via Docker volume |

## Embedding Model Strategy

| Stage | Approach | Trade-off |
|-------|----------|-----------|
| **Development** | `sentence-transformers` CPU mode (BGE-M3) inside backend container | Slow but zero infra cost; query ~300-500ms, batch indexing ~10min |
| **Production (no GPU)** | TEI Docker container on CPU | Better concurrency than in-process; same latency |
| **Production (with GPU)** | TEI on GPU (RTX 4090 / cloud GPU / K8s GPU node) | Query <10ms; requires GPU hardware |

Options if no in-house GPU:
- **RunPod** (~$0.2-0.4/hr for A10G) — rent GPU instance, run TEI
- **Modal** (serverless GPU) — pay per-second, cold start ~5s
- **Together AI Embedding API** — hosted BGE-M3, ~$0.02/1M tokens, but data leaves network

## Implementation Phases

### Phase 1: Core Chat
- LLM provider integration (Claude, Gemini) via LangChain
- RAG context retrieval from PostgreSQL (text-based first)
- Chat router + service skeleton
- Basic prompt templates with citation

### Phase 2: Embedding & Hybrid Search
- Add pgvector extension + `article_chunks` table + Alembic migration
- Chunking pipeline (token-based splitting)
- BGE-M3 embedding integration (CPU mode via sentence-transformers)
- Dense vector search via pgvector
- BM25 tsvector search
- RRF fusion retriever (LangChain custom retriever)
- Background indexer for new articles

### Phase 3: Chat Enhancements
- Streaming responses (SSE)
- Chat history persistence
- Multi-turn conversation support
- Topic-scoped queries

### Phase 4: Production Hardening
- TEI deployment for embedding serving (GPU when available)
- BGE-M3 neural sparse vectors (replace BM25)
- Reranker layer
- Monitoring & observability

### Phase 5: Frontend
- Chat UI component in Next.js
- Source article citation cards
- Search-only mode UI
