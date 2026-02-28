import json
import sqlite3

from app.data.db import get_connection


def create_document(user_id: int, title: str, slug: str, fields: dict) -> int:
    """Insert a saved document and return its id."""
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO documents (user_id, title, slug, fields) VALUES (?, ?, ?, ?)",
            (user_id, title, slug, json.dumps(fields)),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def list_documents(user_id: int) -> list[sqlite3.Row]:
    """Return all documents for a user, newest first."""
    conn = get_connection()
    try:
        return conn.execute(
            "SELECT id, title, slug, created_at FROM documents WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
    finally:
        conn.close()


def get_document(doc_id: int, user_id: int) -> sqlite3.Row | None:
    """Return a specific document, verifying it belongs to the user."""
    conn = get_connection()
    try:
        return conn.execute(
            "SELECT id, title, slug, fields, created_at FROM documents WHERE id = ? AND user_id = ?",
            (doc_id, user_id),
        ).fetchone()
    finally:
        conn.close()
