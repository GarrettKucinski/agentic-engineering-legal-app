#!/bin/bash
# Stop the LegalDraft application on macOS.
#
# Usage:
#   ./scripts/stop-mac.sh           # Docker mode (default)
#   ./scripts/stop-mac.sh --dev     # Local dev mode

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "$1" == "--dev" ]]; then
    echo "Stopping local dev processes..."

    if [ -f "$PROJECT_ROOT/.backend.pid" ]; then
        kill "$(cat "$PROJECT_ROOT/.backend.pid")" 2>/dev/null || true
        rm "$PROJECT_ROOT/.backend.pid"
        echo "  Backend stopped."
    fi

    if [ -f "$PROJECT_ROOT/.frontend.pid" ]; then
        kill "$(cat "$PROJECT_ROOT/.frontend.pid")" 2>/dev/null || true
        rm "$PROJECT_ROOT/.frontend.pid"
        echo "  Frontend stopped."
    fi

    echo "Done."
else
    echo "Stopping Docker containers..."
    cd "$PROJECT_ROOT"
    docker compose down
    echo "Done."
fi
