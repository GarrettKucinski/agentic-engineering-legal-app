import json
import re
from pathlib import Path

from app.config import CATALOG_PATH, TEMPLATES_DIR


def load_catalog() -> list[dict]:
    """Load all catalog entries from catalog.json."""
    path = Path(CATALOG_PATH)
    if not path.exists():
        raise RuntimeError(f"Catalog not found at '{path}'. Set the CATALOG_PATH env var.")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_template(filename: str) -> str:
    """Load a template's markdown content by filename (e.g. 'BAA.md')."""
    path = Path(TEMPLATES_DIR) / filename
    if not path.exists():
        raise RuntimeError(f"Template '{filename}' not found in '{Path(TEMPLATES_DIR)}'. Set the TEMPLATES_DIR env var.")
    with path.open("r", encoding="utf-8") as f:
        return f.read()


def extract_template_variables(markdown: str) -> list[str]:
    """
    Extract unique variable names from Common Paper template markdown.
    Handles coverpage_link, keyterms_link, and orderform_link span classes.
    Normalizes possessives so "Provider's" deduplicates with "Provider".
    Returns sorted list of unique variable names.
    """
    pattern = r'<span class="(?:coverpage_link|keyterms_link|orderform_link)">([^<]+)<\/span>'
    seen = set()
    for match in re.finditer(pattern, markdown):
        name = re.sub(r"'s$|'$", "", match.group(1)).strip()
        if name:
            seen.add(name)
    return sorted(seen)
