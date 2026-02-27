# Agentic Engineering Legal App
---

## Overview
---
This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory. The user will use AI chat to establish what document they want and how to fill in the fields. The available documents are covered in catalog.json as the project root, included here:

@catalog.json

Before we start: the initial implementation is a front-end only prototype that only supports the Mutual NDA document with no AI chat.

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

Consider statically building the frontend and service it via FastAPI, if that will work.

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