import os

from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is required")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY environment variable is required")

ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 30
STATIC_DIR = os.getenv("STATIC_DIR", "frontend/out")

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["Cerebras"]}}

CATALOG_PATH = os.getenv("CATALOG_PATH", "../catalog.json")
TEMPLATES_DIR = os.getenv("TEMPLATES_DIR", "../templates")
