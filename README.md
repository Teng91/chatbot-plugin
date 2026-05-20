# Chatbot Plugin

Pluggable conversational AI chatbot for the [scrape-and-analyze](https://github.com/your-org/scrape-and-analyze) platform.

This plugin provides a RAG-enabled chatbot that can answer questions based on scraped articles, analyses, and tags from the scrape-and-analyze database.

> **Status:** Early development. See [Roadmap](#roadmap) for planned features.

## Installation

```bash
# In your scrape-and-analyze directory
uv add chatbot-plugin
```

## Quick Start

### 1. Mount the router

In your `backend/main.py`:

```python
from chatbot_plugin.routers import chat_router

app.include_router(chat_router, prefix="/chat", tags=["chat"])
```

### 2. Configure environment variables

```bash
CHATBOT_LLM_PROVIDER=claude
CHATBOT_LLM_MODEL=claude-sonnet-4-6-20250514
CHATBOT_MAX_CONTEXT_ARTICLES=10
CHATBOT_MAX_CONTEXT_TOKENS=8000
```

### 3. Use the API

```bash
curl -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "What articles discuss RAG implementation?"}'
```

## Project Structure

```
chatbot-plugin/
├── pyproject.toml          # Package definition & dependencies
├── src/
│   └── chatbot_plugin/
│       ├── __init__.py     # Package entry point
│       ├── config.py       # Pydantic settings (CHATBOT_* env vars)
│       ├── routers.py      # FastAPI router endpoints
│       └── service.py      # Core chat logic (stub)
└── tests/
    └── test_service.py     # Unit tests
```

## Configuration

All settings are read from environment variables with the `CHATBOT_` prefix:

| Variable | Default | Description |
|----------|---------|-------------|
| `CHATBOT_LLM_PROVIDER` | `claude` | LLM provider: `claude`, `gemini`, `openrouter` |
| `CHATBOT_LLM_MODEL` | `claude-sonnet-4-6-20250514` | Model name |
| `CHATBOT_MAX_CONTEXT_ARTICLES` | `10` | Max articles to retrieve for RAG context |
| `CHATBOT_MAX_CONTEXT_TOKENS` | `8000` | Max tokens in prompt |

## API Endpoints

### `POST /chat/message`

Send a message and receive a chatbot reply.

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
  "articles_used": 3
}
```

## Development

### Running tests

```bash
uv run pytest src/tests/ -v
```

### Running with coverage

```bash
uv run pytest src/tests/ --cov=chatbot_plugin --cov-report=html
```

## Roadmap

- [ ] LLM provider integration (Claude, Gemini) via LangChain
- [ ] RAG context retrieval from PostgreSQL (text-based first)
- [ ] Streaming responses (SSE)
- [ ] Chat history persistence
- [ ] Multi-turn conversation support
- [ ] Citation/linkback to source articles
- [ ] Embedding & hybrid search (BGE-M3 dense + sparse, RRF fusion, pgvector)
- [ ] Frontend chat UI component

## License

MIT
