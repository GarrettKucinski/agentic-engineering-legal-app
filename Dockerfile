# ---- Stage 1: Build Next.js static site ----
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Install dependencies
COPY frontend/package.json ./
RUN npm install

# Copy source files
COPY frontend/ ./

# Copy project-root files needed at build time (RSC reads these at next build)
COPY templates/ /app/templates/
COPY catalog.json /app/catalog.json

# Build static export (outputs to /app/frontend/out)
RUN npm run build

# ---- Stage 2: FastAPI application ----
FROM python:3.12-slim

WORKDIR /app

# Install uv for fast dependency installation
RUN pip install uv --no-cache-dir

# Install Python dependencies
RUN uv pip install --system \
    "fastapi>=0.115.0" \
    "uvicorn[standard]>=0.32.0" \
    "python-jose[cryptography]>=3.3.0" \
    "passlib[bcrypt]>=1.7.4" \
    "python-dotenv>=1.0.0"

# Copy backend source
COPY backend/ ./

# Copy static frontend from build stage
COPY --from=frontend-build /app/frontend/out ./frontend/out

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
