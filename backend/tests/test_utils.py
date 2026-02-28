"""
Unit tests for pure utility functions.
These tests have no external dependencies (no DB, no LLM calls).
"""
import pytest
from app.utils import _sanitize_field_name, build_extraction_model
from app.prompts import build_chat_prompt, _ADDENDUM_TYPES
from app.services.auth import verify_password
from argon2 import PasswordHasher

ph = PasswordHasher()


# ---------------------------------------------------------------------------
# _sanitize_field_name
# ---------------------------------------------------------------------------

class TestSanitizeFieldName:
    def test_simple_lowercase(self):
        assert _sanitize_field_name("Provider") == "provider"

    def test_spaces_become_underscores(self):
        assert _sanitize_field_name("BAA Effective Date") == "baa_effective_date"

    def test_possessive_s_stripped(self):
        assert _sanitize_field_name("Provider's") == "provider"

    def test_possessive_apostrophe_stripped(self):
        assert _sanitize_field_name("Providers'") == "providers"

    def test_mixed_case_and_spaces(self):
        assert _sanitize_field_name("Party 1 Address") == "party_1_address"

    def test_special_chars_replaced(self):
        assert _sanitize_field_name("Foo-Bar.Baz") == "foo_bar_baz"

    def test_leading_trailing_underscores_stripped(self):
        # e.g. a name that starts/ends with a non-alphanumeric char
        result = _sanitize_field_name(" Leading")
        assert not result.startswith("_")

    def test_empty_string(self):
        assert _sanitize_field_name("") == ""

    def test_only_special_chars(self):
        # All non-alphanumeric -> all underscores -> strip -> empty
        assert _sanitize_field_name("---") == ""

    def test_numbers_preserved(self):
        assert _sanitize_field_name("Party 2 Name") == "party_2_name"


# ---------------------------------------------------------------------------
# build_chat_prompt
# ---------------------------------------------------------------------------

class TestBuildChatPrompt:
    def test_contains_document_type(self):
        prompt = build_chat_prompt("Business Associate Agreement", ["Effective Date"])
        assert "Business Associate Agreement" in prompt

    def test_contains_variable_list(self):
        prompt = build_chat_prompt("DPA", ["Controller", "Processor", "Effective Date"])
        assert "- Controller" in prompt
        assert "- Processor" in prompt
        assert "- Effective Date" in prompt

    def test_empty_variables_shows_placeholder(self):
        prompt = build_chat_prompt("Pilot Agreement", [])
        assert "(no specific fields required)" in prompt

    def test_non_addendum_has_no_addendum_note(self):
        prompt = build_chat_prompt("Cloud Service Agreement", ["Provider", "Customer"])
        assert "addendum" not in prompt.lower()

    def test_addendum_type_includes_addendum_note(self):
        for doc_type in _ADDENDUM_TYPES:
            prompt = build_chat_prompt(doc_type, ["Effective Date"])
            assert "addendum" in prompt.lower(), f"Expected addendum note for {doc_type}"

    def test_addendum_note_mentions_primary_agreement(self):
        prompt = build_chat_prompt("AI Addendum", ["Provider"])
        assert "primary agreement" in prompt.lower()

    def test_returns_string(self):
        assert isinstance(build_chat_prompt("SLA", ["Uptime Target"]), str)


# ---------------------------------------------------------------------------
# build_extraction_model
# ---------------------------------------------------------------------------

class TestBuildExtractionModel:
    def test_basic_fields_created(self):
        model_cls, key_map = build_extraction_model(["Effective Date", "Provider"])
        instance = model_cls()
        assert hasattr(instance, "effective_date")
        assert hasattr(instance, "provider")

    def test_key_map_maps_sanitized_to_original(self):
        _, key_map = build_extraction_model(["BAA Effective Date", "Provider Name"])
        assert key_map["baa_effective_date"] == "BAA Effective Date"
        assert key_map["provider_name"] == "Provider Name"

    def test_possessives_deduplicated(self):
        # "Provider's" sanitizes to "provider" -- same as "Provider"
        model_cls, key_map = build_extraction_model(["Provider", "Provider's"])
        # Only one "provider" field; the second is silently skipped
        assert "provider" in key_map
        fields = model_cls.model_fields
        assert len([k for k in fields if k == "provider"]) == 1

    def test_all_fields_optional_none_default(self):
        model_cls, _ = build_extraction_model(["Effective Date"])
        instance = model_cls()
        assert instance.effective_date is None  # type: ignore[attr-defined]

    def test_fields_accept_string_values(self):
        model_cls, _ = build_extraction_model(["Effective Date"])
        instance = model_cls(effective_date="2024-01-01")
        assert instance.effective_date == "2024-01-01"  # type: ignore[attr-defined]

    def test_empty_variables_creates_empty_model(self):
        model_cls, key_map = build_extraction_model([])
        assert key_map == {}
        assert model_cls().model_dump() == {}

    def test_model_dump_only_non_null(self):
        model_cls, key_map = build_extraction_model(["Provider", "Customer"])
        instance = model_cls(provider="Acme Corp")
        dumped = {k: v for k, v in instance.model_dump().items() if v is not None}
        assert dumped == {"provider": "Acme Corp"}
        assert key_map["provider"] == "Provider"


# ---------------------------------------------------------------------------
# verify_password
# ---------------------------------------------------------------------------

class TestVerifyPassword:
    def test_correct_password_returns_true(self):
        hashed = ph.hash("mysecretpass")
        assert verify_password("mysecretpass", hashed) is True

    def test_wrong_password_returns_false(self):
        hashed = ph.hash("mysecretpass")
        assert verify_password("wrongpass", hashed) is False

    def test_empty_password_wrong_returns_false(self):
        hashed = ph.hash("notempty")
        assert verify_password("", hashed) is False

    def test_special_chars_in_password(self):
        pw = "P@ss!w0rd#$%^&*()"
        hashed = ph.hash(pw)
        assert verify_password(pw, hashed) is True
