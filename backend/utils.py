"""
Pure utility functions with no dependency on FastAPI, the database, or any LLM client.
"""
import re
from typing import Optional

from pydantic import create_model


def _sanitize_field_name(name: str) -> str:
    """Convert a display name like 'BAA Effective Date' to a valid Python identifier."""
    name = re.sub(r"'s$|'$", "", name)  # strip possessives
    name = re.sub(r"[^a-zA-Z0-9]", "_", name)
    return name.strip("_").lower()


def build_extraction_model(variables: list[str]) -> tuple:
    """
    Returns (DynamicModel, key_map) where key_map maps sanitized field names
    back to the original display names (e.g. 'baa_effective_date' -> 'BAA Effective Date').
    """
    field_defs: dict = {}
    key_map: dict[str, str] = {}
    for v in variables:
        k = _sanitize_field_name(v)
        if k and k not in field_defs:
            field_defs[k] = (Optional[str], None)
            key_map[k] = v
    return create_model("FieldExtraction", **field_defs), key_map
