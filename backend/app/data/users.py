import sqlite3

from app.data.db import get_connection


def create_user(email: str, password_hash: str) -> int:
    """Insert a new user and return their id. Raises sqlite3.IntegrityError on duplicate email."""
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (email, password_hash),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_user_by_email(email: str) -> sqlite3.Row | None:
    """Return the user row for the given email, or None if not found."""
    conn = get_connection()
    try:
        return conn.execute(
            "SELECT id, password_hash FROM users WHERE email = ?", (email,)
        ).fetchone()
    finally:
        conn.close()
