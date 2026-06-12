# --- Stage 1: Build ---
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/src \
    PORT=8000

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Clone SDK sibling repo into WORKDIR so ../chatbot-plugin-sdk resolves
RUN git clone https://github.com/Teng91/chatbot-plugin-sdk.git /chatbot-plugin-sdk

COPY --from=ghcr.io/astral-sh/uv:0.10.12 /uv /usr/local/bin/uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# --- Stage 2: Run ---
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/src \
    PORT=8000

WORKDIR /app

COPY --from=builder /app/.venv /app/.venv

# Editable install needs the source checked out at the sibling path
COPY --from=builder /chatbot-plugin-sdk /chatbot-plugin-sdk

COPY src/ ./src/
COPY alembic/ ./alembic/
COPY alembic.ini .

RUN addgroup --system appuser && adduser --system --group appuser
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["sh", "-c", ".venv/bin/uvicorn chatbot_plugin.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
