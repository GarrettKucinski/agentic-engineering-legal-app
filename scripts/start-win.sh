#!/bin/bash
# Start the LegalDraft application on Windows (requires WSL or Git Bash).
#
# Usage:
#   ./scripts/start-win.sh           # Docker mode (default)
#   ./scripts/start-win.sh --dev     # Local dev mode — runs Next.js + uvicorn directly

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "$1" == "--dev" ]]; then
    # Guard against running twice
    if [ -f "$PROJECT_ROOT/.backend.pid" ] || [ -f "$PROJECT_ROOT/.frontend.pid" ]; then
        echo "Error: dev servers appear to already be running. Run './scripts/stop-win.sh --dev' first."
        exit 1
    fi

    echo "Starting in local dev mode..."

    # Backend
    cd "$PROJECT_ROOT/backend"
    if [ ! -d ".venv" ]; then
        echo "  Installing backend dependencies with uv..."
        uv sync
    fi
    uv run uvicorn main:app --reload --port 8000 &
    echo $! > "$PROJECT_ROOT/.backend.pid"

    # Frontend
    cd "$PROJECT_ROOT/frontend"
    if [ ! -d "node_modules" ]; then
        echo "  Installing frontend dependencies..."
        npm install
    fi
    if [ ! -f ".env.local" ] && [ -f ".env.local.example" ]; then
        cp .env.local.example .env.local
    fi
    npm run dev &
    echo $! > "$PROJECT_ROOT/.frontend.pid"

    echo ""
    echo "Dev servers started:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:8000"
    echo ""
    echo "Stop with: ./scripts/stop-win.sh --dev"
else
    # Ensure .env exists for Docker Compose
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        echo "Error: .env file not found. Copy .env.example to .env and fill in the values."
        exit 1
    fi

    echo "Starting with Docker..."
    cd "$PROJECT_ROOT"
    docker compose up --build -d
    echo ""
    echo "App running at http://localhost:8000"
    echo ""
    echo "Stop with: ./scripts/stop-win.sh"
fi
