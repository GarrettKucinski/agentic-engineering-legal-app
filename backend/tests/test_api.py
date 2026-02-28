"""
Integration tests for FastAPI endpoints.
The `client` fixture uses an isolated temp SQLite DB per test.
LiteLLM calls are mocked so no real API calls are made.
"""
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


# ---------------------------------------------------------------------------
# Helpers for mocking LiteLLM responses
# ---------------------------------------------------------------------------

def _make_stream_chunk(content: str):
    """Build a fake streaming chunk with choices[0].delta.content."""
    chunk = MagicMock()
    chunk.choices = [MagicMock()]
    chunk.choices[0].delta.content = content
    return chunk


def _make_extraction_response(json_str: str):
    """Build a fake non-streaming completion response."""
    resp = MagicMock()
    resp.choices = [MagicMock()]
    resp.choices[0].message.content = json_str
    return resp


class _FakeAsyncStream:
    """Async iterable that yields pre-built chunks."""
    def __init__(self, chunks):
        self._chunks = chunks

    def __aiter__(self):
        return self._iter()

    async def _iter(self):
        for chunk in self._chunks:
            yield chunk


def _mock_acompletion(stream_text: str = "Hello!", extraction_json: str = "{}"):
    """
    Returns a coroutine-based side_effect function that:
    - On first call (stream=True): returns an async iterable of chunks
    - On second call (extraction): returns a plain response object
    """
    calls = []

    async def _side_effect(*args, **kwargs):
        calls.append(kwargs)
        if kwargs.get("stream"):
            chunks = [_make_stream_chunk(c) for c in list(stream_text)]
            return _FakeAsyncStream(chunks)
        return _make_extraction_response(extraction_json)

    return _side_effect


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------

async def test_health(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# Auth: register
# ---------------------------------------------------------------------------

async def test_register_success(client):
    resp = await client.post(
        "/api/auth/register",
        json={"email": "alice@example.com", "password": "securepass"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "token" in body
    assert isinstance(body["user_id"], int)


async def test_register_password_too_short(client):
    resp = await client.post(
        "/api/auth/register",
        json={"email": "bob@example.com", "password": "short"},
    )
    assert resp.status_code == 422


async def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "password": "password123"}
    await client.post("/api/auth/register", json=payload)
    resp = await client.post("/api/auth/register", json=payload)
    assert resp.status_code == 400
    assert "already registered" in resp.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Auth: login
# ---------------------------------------------------------------------------

async def test_login_success(client):
    creds = {"email": "user@example.com", "password": "mypassword"}
    reg = await client.post("/api/auth/register", json=creds)
    reg_user_id = reg.json()["user_id"]

    resp = await client.post("/api/auth/login", json=creds)
    assert resp.status_code == 200
    body = resp.json()
    assert "token" in body
    assert body["user_id"] == reg_user_id


async def test_login_wrong_password(client):
    await client.post(
        "/api/auth/register",
        json={"email": "user2@example.com", "password": "correctpass"},
    )
    resp = await client.post(
        "/api/auth/login",
        json={"email": "user2@example.com", "password": "wrongpass"},
    )
    assert resp.status_code == 401


async def test_login_unknown_email(client):
    resp = await client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "whatever"},
    )
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Chat: auth guards
# ---------------------------------------------------------------------------

async def test_chat_requires_auth_header(client):
    resp = await client.post("/api/chat", json={"messages": []})
    assert resp.status_code == 422  # Authorization header is required


async def test_chat_rejects_invalid_token(client):
    resp = await client.post(
        "/api/chat",
        json={"messages": []},
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Chat: streaming response (mocked LLM)
# ---------------------------------------------------------------------------

async def test_chat_streams_sse_events(authed_client):
    client, token = authed_client
    extraction_json = json.dumps({"provider": "Acme Corp"})

    with patch("app.services.chat.acompletion", side_effect=_mock_acompletion("Hello!", extraction_json)):
        resp = await client.post(
            "/api/chat",
            json={
                "messages": [],
                "document_type": "Business Associate Agreement",
                "variables": ["Provider"],
            },
            headers={"Authorization": f"Bearer {token}"},
        )

    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers["content-type"]

    # Parse SSE lines
    events = []
    for line in resp.text.splitlines():
        if line.startswith("data: "):
            events.append(json.loads(line[6:]))

    types = [e["type"] for e in events]
    assert "token" in types
    assert "fields" in types
    assert "done" in types

    # Token events carry content
    token_events = [e for e in events if e["type"] == "token"]
    assert all("content" in e for e in token_events)
    assert "".join(e["content"] for e in token_events) == "Hello!"

    # Fields event carries data
    fields_events = [e for e in events if e["type"] == "fields"]
    assert len(fields_events) == 1
    # Generic doc: key_map reverses sanitized -> original; "provider" -> "Provider"
    assert fields_events[0]["data"].get("Provider") == "Acme Corp"

    # done is last
    assert events[-1]["type"] == "done"


async def test_chat_nda_fields_use_snake_case_keys(authed_client):
    """NDA path emits snake_case keys (mapped to camelCase by frontend)."""
    client, token = authed_client
    extraction_json = json.dumps({"party1_name": "Alice", "governing_law": "Delaware"})

    with patch("app.services.chat.acompletion", side_effect=_mock_acompletion("Hi!", extraction_json)):
        resp = await client.post(
            "/api/chat",
            json={"messages": [], "document_type": "Mutual NDA", "variables": []},
            headers={"Authorization": f"Bearer {token}"},
        )

    fields_event = next(
        json.loads(line[6:])
        for line in resp.text.splitlines()
        if line.startswith("data: ") and json.loads(line[6:]).get("type") == "fields"
    )
    assert fields_event["data"]["party1_name"] == "Alice"
    assert fields_event["data"]["governing_law"] == "Delaware"
