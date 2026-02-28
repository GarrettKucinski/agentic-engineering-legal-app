"""
Shared pytest fixtures for backend tests.

Env vars are set before any project imports so that main.py's module-level
guards (SECRET_KEY, OPENROUTER_API_KEY) don't raise at import time.
"""
import os
import sys

# Must be set before importing main.py
os.environ.setdefault("SECRET_KEY", "test-secret-key-do-not-use-in-production")
os.environ.setdefault("OPENROUTER_API_KEY", "test-openrouter-key")

# Ensure backend/ directory is on the path so `import main` and `import db` work
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
import pytest_asyncio
import db as db_module
from httpx import AsyncClient, ASGITransport
from main import app


@pytest_asyncio.fixture
async def client(tmp_path, monkeypatch):
    """AsyncClient wired to the FastAPI app with an isolated temp SQLite database."""
    db_file = str(tmp_path / "test.db")
    monkeypatch.setattr(db_module, "DB_PATH", db_file)
    db_module.init_db()

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c


@pytest_asyncio.fixture
async def authed_client(client):
    """AsyncClient with a registered + authenticated user. Yields (client, token)."""
    resp = await client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "securepassword"},
    )
    assert resp.status_code == 200
    token = resp.json()["token"]
    yield client, token
