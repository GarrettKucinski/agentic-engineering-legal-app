# Agentic Engineering Legal App
---

## Overview
---
This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory. The user will use AI chat to establish what document they want and how to fill in the fields. The available documents are covered in catalog.json as the project root, included here:

@catalog.json

The initial prototype was front-end only with no AI chat. As of TES-12, the full V1 technical foundation is in place (see Implementation Status below).

## Development Process
---
When instructed to build a feature:
1. Use your Linear tools to read the feature instructions
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI Design
---
When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is a OPENROUTER_API_KEY in the .env file in the project root.

## Technical Design
---
The entire project should be packaged into a Docker container.
The backend should be in backend/ and be a `uv` project, using FastAPI.
The frontend should be frontend/
The database should use sqllite and be created from scratch every time the Docker container is brought up or down, allowing user sign up and sign in.

The frontend is statically built (`next build` with `output: "export"`) and served by FastAPI's `StaticFiles` at `/`. For local development, the Next.js dev server runs on port 3000 and calls the backend via `NEXT_PUBLIC_API_URL=http://localhost:8000` (set in `frontend/.env.local`).

There should be scripts in scripts/ for:

```bash
# Mac
scripts/start-mac.sh
scripts/stop-mac.sh

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-win.sh
scripts/stop-win.sh
```

Backend available at http://localhost:8000

## Color Scheme
---
- Accent Yellow: #ecad0a
- Blue Primary: #209dd7
- Purple Secondary: #753991 (submit buttons)
- Dark Navy: #032147 (headings)
- Gray Text: #888888

## Implementation Status
---
**TES-11 — Mutual NDA PDF generation** ✅
- `@react-pdf/renderer` replaces `window.print()`; no browser dialog, real selectable text
- `frontend/src/lib/markdown-to-pdf.ts` — marked lexer → react-pdf elements
- `frontend/src/lib/nda-pdf.tsx` — `NdaDocument` with `CoverPage` + `StandardTermsPages`
- Download button in `NdaCreator` with loading/error state and sanitized filename

**TES-12 — V1 product foundation** ✅
- `backend/` — FastAPI + uv + SQLite; `/api/auth/register`, `/api/auth/login`, `/api/health`
- Auth: bcrypt passwords, JWT tokens (30-day), ephemeral DB (dropped on every startup)
- Frontend routes: `/` (redirect), `/login` (register + sign in), `/dashboard` (doc grid), `/nda` (NDA creator)
- `frontend/src/components/ProtectedRoute.tsx` — client-side auth guard (no spinner flash for authenticated users)
- `frontend/src/lib/auth.ts` — localStorage JWT helpers
- `frontend/src/lib/api.ts` — typed fetch wrapper with correct header merging
- `Dockerfile` — multi-stage (Node build → Python slim); `docker-compose.yml` with healthcheck
- `scripts/start-{mac,linux,win}.sh --dev` for local processes; default runs Docker