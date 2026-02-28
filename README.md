# LegalDraft

AI-assisted legal document creation app. Chat with an AI to describe what you need, and LegalDraft selects the right template, collects the required fields, and generates a filled-out document for you.

Built with a FastAPI backend and Next.js 14 frontend, served together in Docker.

## What It Does

LegalDraft guides users through a two-phase conversational flow:

1. **Document selection** — The AI asks what you need and identifies the right template from a catalog of 12 legal document types.
2. **Field collection** — The AI gathers the required information for the chosen template and populates it.

Users can also navigate directly to `/nda` for a bespoke Mutual NDA creator, or to `/doc/[slug]` for any template by direct link.

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

## Running Locally

### Prerequisites

- Python 3.12 with [uv](https://github.com/astral-sh/uv)
- Node.js (LTS)
- A `SECRET_KEY` and an `OPENROUTER_API_KEY` (see Environment Variables below)

### Backend

```bash
cd backend
uv pip install --system .
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### Frontend

In a separate terminal:

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Running Tests

```bash
cd frontend
npm test
```

Tests use [Vitest](https://vitest.dev/).

## Docker

Build and run the entire app as a single container from the project root:

```bash
docker build -t legaldraft .
docker run -p 8000:8000 \
  -e SECRET_KEY=your-secret-key \
  -e OPENROUTER_API_KEY=your-openrouter-key \
  legaldraft
```

The app will be available at `http://localhost:8000`. The frontend is served as static files by the FastAPI backend in Docker.

## Environment Variables

| Variable | Default (local dev) | Required | Description |
|----------|---------------------|----------|-------------|
| `SECRET_KEY` | — | Yes | JWT signing secret |
| `OPENROUTER_API_KEY` | — | Yes | API key for OpenRouter (LLM access) |
| `CATALOG_PATH` | `../catalog.json` | No | Path to `catalog.json` (relative to `backend/`) |
| `TEMPLATES_DIR` | `../templates` | No | Path to templates directory (relative to `backend/`) |
| `STATIC_DIR` | `frontend/out` | No | Path to the Next.js static export (used in Docker) |

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/health` | No | Health check |
| `POST` | `/api/auth/register` | No | Register a new user |
| `POST` | `/api/auth/login` | No | Login, returns JWT |
| `POST` | `/api/chat` | Yes | Streaming chat via SSE |
| `GET` | `/api/templates/{slug}` | Yes | Get template markdown and variables |

## Frontend Routes

| URL | Purpose |
|-----|---------|
| `/dashboard` | Intent-driven flow: AI selects template and collects fields |
| `/nda` | Bespoke Mutual NDA creator with typed form state |
| `/doc/[slug]` | Generic document creator for any template by slug |
| `/login` | Authentication |

## Model

LLM: `openrouter/openai/gpt-oss-120b` via LiteLLM + OpenRouter (Cerebras provider for speed). All chat calls use `reasoning_effort="low"`.
