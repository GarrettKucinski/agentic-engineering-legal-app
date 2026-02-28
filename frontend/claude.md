# Agentic Engineering Legal App
---

## Overview
---
A SaaS product for drafting legal agreements via AI chat. Users describe what they need, the AI collects field values through conversation, and the document preview updates live. Available documents are defined in `catalog.json` at the project root:

@catalog.json

## Development Process
---
When instructed to build a feature:
1. Use Linear tools to read the feature instructions
2. Follow the feature-dev 7-step process (no skipping steps)
3. Submit a PR using GitHub tools and post the PR link as a Linear comment

## AI Design
---
LLM calls use LiteLLM via OpenRouter with Cerebras as the inference provider (`openrouter/openai/gpt-oss-120b`). Use Structured Outputs to extract field values from conversation. `OPENROUTER_API_KEY` is in `.env` at the project root.

## Technical Design
---
- **Backend:** `backend/` — FastAPI + uv (Python), SQLite (ephemeral, recreated on every container start — known bug: `init_db` drops tables on every startup, tracked in TES-20)
- **Frontend:** `frontend/` — Next.js (App Router, `output: "export"`), served by FastAPI `StaticFiles` at `/`
- **Packaging:** Single Docker container; `docker-compose.yml` with healthcheck
- **Local dev:** Next.js dev server on port 3000, backend on port 8000 via `NEXT_PUBLIC_API_URL=http://localhost:8000` in `frontend/.env.local`
- **Scripts:** `scripts/start-{mac,linux,win}.sh` (default: Docker; `--dev` flag: local processes)

## Testing
---
- **Backend:** pytest + pytest-asyncio + httpx — run with `cd backend && uv run pytest`
  - `tests/test_utils.py` — 28 unit tests (`_sanitize_field_name`, `build_chat_prompt`, `build_extraction_model`, `verify_password`)
  - `tests/test_api.py` — 11 integration tests (health, auth, chat); LiteLLM mocked with `FakeAsyncStream`; each test gets an isolated SQLite DB via `tmp_path`
- **Frontend:** vitest + jsdom — run with `cd frontend && npm test`
  - `src/__tests__/doc-template.test.ts` — 28 tests (`extractTemplateVariables`, `resolveTemplate`, `filenameToSlug`)
  - `src/__tests__/api.test.ts` — 22 tests (`mapFieldsToFormData` snake_case → camelCase mapping)

## Color Scheme
---
- Blue Primary: `#209dd7` (buttons, accents)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`
- Accent Yellow: `#ecad0a`
- Purple Secondary: `#753991` (submit buttons)

## Implementation Status
---

**TES-11 — Mutual NDA PDF generation** ✅
- `@react-pdf/renderer` replaces `window.print()`
- `frontend/src/lib/markdown-to-pdf.ts` — marked lexer → react-pdf elements
- `frontend/src/lib/nda-pdf.tsx` — `NdaDocument` with `CoverPage` + `StandardTermsPages`

**TES-12 — V1 product foundation** ✅
- Backend: `/api/auth/register`, `/api/auth/login`, `/api/health`; JWT (30-day); ephemeral SQLite
- Frontend routes: `/` (redirect), `/login`, `/dashboard` (doc grid), `/nda` (Mutual NDA creator)
- `ProtectedRoute`, `auth.ts` (localStorage JWT helpers), `api.ts` (typed fetch wrapper)
- Dockerfile multi-stage (Node build → Python slim)

**TES-13 — AI chat for Mutual NDA** ✅
- Backend: `/api/chat` SSE endpoint; Cerebras/OpenRouter LLM; `NdaFieldExtraction` Pydantic model extracts fields from conversation; emits `{type: token|fields|done}` events
- Auth: argon2-cffi replaces bcrypt/passlib
- Frontend: `AiChat` component with SSE streaming, live `streamingContent`, pulsing cursor animation; `chatStream` in `api.ts` parses SSE; `NdaCreator` wires chat → form fields → `NdaPreview`

**TES-14 — All 12 document types** ✅
- Generic `/doc/[slug]` route (`generateStaticParams` builds all 11 non-NDA slugs; Mutual NDA excluded — uses `/nda`)
- `DocCreator` + `DocPreview`: generic orchestrator and live preview for all non-NDA documents
- `frontend/src/lib/doc-template.ts`: `extractTemplateVariables` (parses Common Paper span classes from markdown), `resolveTemplate`, `filenameToSlug`
- Backend: `build_chat_prompt` and `build_extraction_model` generate per-document prompts and Pydantic models dynamically; addendum types (`AI Addendum`, `Mutual NDA Cover Page`) get special guidance
- `AiChat` is now document-agnostic (`documentType`, `variables` props); `chatStream` passes them to backend; `onFields` callback is `Record<string,string>`; `NdaCreator` maps via exported `mapFieldsToFormData`
- `CatalogEntry` type shared from `@/lib/types`; `filenameToSlug` used consistently (no inline duplication)
- Dashboard: all 12 entries enabled; addendum badge for AI Addendum and Mutual NDA Cover Page

## Planned / Backlog
---
**TES-16** — Replace dashboard catalog with intent-driven flow: AI asks what document the user needs, dynamically loads the template, shows a placeholder until selected

**TES-17** — Replace SSE streaming with single JSON response + frontend typewriter animation (two-phase: pulsing cursor while waiting → character-by-character reveal on response; adaptive speed formula; fields applied at start of reveal)

**TES-18** — Extract prompts from `main.py` into `backend/prompts.py` (`CHAT_SYSTEM_PROMPT`, `EXTRACTION_SYSTEM_PROMPT`, `GENERIC_EXTRACTION_PROMPT`, `build_chat_prompt`)

**TES-19** — Extract utility functions from `main.py` into `backend/utils.py` (`_sanitize_field_name`, `build_extraction_model`); update test imports

**TES-20** — Restructure backend into proper layered architecture: `app/routes/`, `app/services/`, `app/models/`, `app/data/`, `app/config.py`; fix `init_db` data-destruction bug; depends on TES-18 + TES-19
