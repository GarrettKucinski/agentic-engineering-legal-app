# LegalDraft — Claude Code Guide

AI-assisted legal document creation app. FastAPI backend + Next.js frontend, served together in Docker.

## Project Structure

```
/
├── catalog.json          # Registry of 12 document templates (name, description, filename)
├── templates/            # Template markdown files (Common Paper format with span variables)
├── backend/              # FastAPI app (Python 3.12, uv)
│   └── app/
│       ├── catalog.py    # load_catalog(), load_template(), extract_template_variables()
│       ├── config.py     # Env vars: SECRET_KEY, OPENROUTER_API_KEY, CATALOG_PATH, TEMPLATES_DIR
│       ├── main.py       # FastAPI app, router registration, static file mount
│       ├── models/       # Pydantic models: chat.py, auth.py, templates.py
│       ├── prompts.py    # System prompts for selection + field-collection phases
│       ├── routes/       # auth.py, chat.py, health.py, templates.py
│       ├── services/     # chat.py (generate_chat_stream), auth.py
│       └── utils.py      # build_extraction_model() — dynamic Pydantic from variable list
└── frontend/             # Next.js 14 app (TypeScript, Tailwind)
    └── src/
        ├── app/          # Routes: / (redirect), /dashboard, /nda, /doc/[slug], /login
        ├── components/   # AiChat, DocCreator, DocPlaceholder, DocPreview, NdaCreator, etc.
        └── lib/          # api.ts, auth.ts, doc-template.ts, types.ts
```

## Key Patterns

### Chat SSE Protocol
`POST /api/chat` streams server-sent events. The frontend handles these event types:
- `token` — incremental text for the AI response
- `document_selected` — `{name, slug}` when the AI identifies a template (selection phase only)
- `fields` — `{data: Record<string, string>}` extracted field values (field-collection phase only)
- `done` — stream complete

### Two-Phase Chat
`generate_chat_stream` (backend) has two phases, determined by `document_type`:
1. **Selection phase** (`document_type is None`): AI asks what document the user needs. Emits `document_selected` + `done`. No `fields` emitted.
2. **Field-collection phase** (`document_type` set): AI collects template fields. Emits `fields` + `done`.

**NDA special case**: `is_nda = document_type == "Mutual NDA" and not variables`
- `variables` empty → direct `/nda` route → NDA-specific typed extraction (`NdaFieldExtraction`, snake_case keys)
- `variables` populated → dashboard intent flow → generic extraction (display name keys via `key_map`)

### Template Variables
Templates use Common Paper HTML spans: `<span class="coverpage_link|keyterms_link|orderform_link">Variable Name</span>`. `extract_template_variables()` extracts and deduplicates these. The backend (`catalog.py`) and frontend (`doc-template.ts`) use identical regex logic.

### Catalog + Templates in Docker
`catalog.json` and `templates/` are copied into the backend runtime stage (Stage 2) of the Dockerfile. Local dev uses `CATALOG_PATH=../catalog.json` and `TEMPLATES_DIR=../templates` (relative to `backend/`). Docker overrides via `ENV CATALOG_PATH=./catalog.json`.

## Routes

| URL | Component | Purpose |
|-----|-----------|---------|
| `/dashboard` | `DashboardClient` | Intent-driven flow: AI asks, selects template, collects fields |
| `/nda` | `NdaCreator` | Bespoke Mutual NDA creator with typed form state (`NdaFormData`) |
| `/doc/[slug]` | `DocCreator` | Generic document creator for all other templates |

Both `/nda` and `/doc/[slug]` continue to work for direct links.

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/health` | No | Health check |
| `POST` | `/api/auth/register` | No | Register user |
| `POST` | `/api/auth/login` | No | Login, returns JWT |
| `POST` | `/api/chat` | Yes | Streaming chat (SSE) |
| `GET` | `/api/templates/{slug}` | Yes | Get template markdown + variables |

## Environment Variables

| Variable | Default (local dev) | Required |
|----------|---------------------|---------|
| `SECRET_KEY` | — | Yes |
| `OPENROUTER_API_KEY` | — | Yes |
| `CATALOG_PATH` | `../catalog.json` | No |
| `TEMPLATES_DIR` | `../templates` | No |
| `STATIC_DIR` | `frontend/out` | No |

## Development

```bash
# Backend (from backend/)
uv pip install --system .
uvicorn app.main:app --reload --port 8000

# Frontend (from frontend/)
npm install
npm run dev   # port 3000, set NEXT_PUBLIC_API_URL=http://localhost:8000

# Tests (from frontend/)
npm test      # vitest

# Docker (from project root)
docker build -t legaldraft .
docker run -p 8000:8000 -e SECRET_KEY=... -e OPENROUTER_API_KEY=... legaldraft
```

## Model

LLM: `openrouter/openai/gpt-oss-120b` via LiteLLM + OpenRouter (Cerebras provider for speed). All chat calls use `reasoning_effort="low"`.

## Known Issues

- `mapFieldsToFormData` in `api.ts` passes through unknown keys instead of filtering to `NdaFormData` fields — pre-existing test failure on `main`.

## Claude Code Conventions

- Never include "Generated with Claude Code" or similar attribution taglines in PR descriptions, commit messages, or any project files.
