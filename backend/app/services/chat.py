import json
from typing import Optional

from litellm import acompletion

from app.catalog import load_catalog
from app.config import EXTRA_BODY, MODEL, OPENROUTER_API_KEY
from app.models.chat import DocumentSelectionExtraction, NdaFieldExtraction
from app.prompts import (
    CHAT_SYSTEM_PROMPT,
    EXTRACTION_SYSTEM_PROMPT,
    GENERIC_EXTRACTION_PROMPT,
    build_chat_prompt,
    build_selection_extraction_prompt,
    build_selection_prompt,
)
from app.utils import build_extraction_model


async def generate_chat_stream(
    messages: list[dict],
    document_type: Optional[str] = None,
    variables: list[str] | None = None,
):
    variables = variables or []
    # SELECTION PHASE: no document type set yet
    if document_type is None:
        catalog = load_catalog()
        system_prompt = build_selection_prompt(catalog)
        conversation = [{"role": "system", "content": system_prompt}] + messages

        # Stream the conversational response
        response = await acompletion(
            model=MODEL,
            messages=conversation,
            stream=True,
            reasoning_effort="low",
            extra_body=EXTRA_BODY,
            api_key=OPENROUTER_API_KEY,
        )
        full_response = ""
        async for chunk in response:
            content = chunk.choices[0].delta.content or ""
            if content:
                full_response += content
                yield f"data: {json.dumps({'type': 'token', 'content': content})}\n\n"

        # Extract which document was selected
        extraction_messages = [
            {"role": "system", "content": build_selection_extraction_prompt(catalog)},
            *messages,
            {"role": "assistant", "content": full_response},
        ]
        sel_response = await acompletion(
            model=MODEL,
            messages=extraction_messages,
            response_format=DocumentSelectionExtraction,
            reasoning_effort="low",
            extra_body=EXTRA_BODY,
            api_key=OPENROUTER_API_KEY,
        )
        selection = DocumentSelectionExtraction.model_validate_json(
            sel_response.choices[0].message.content
        )

        if selection.selected_document_name:
            # Find the catalog entry to get the slug
            catalog_entry = next(
                (e for e in catalog if e["name"] == selection.selected_document_name), None
            )
            if catalog_entry:
                slug = catalog_entry["filename"].removesuffix(".md")
                yield f"data: {json.dumps({'type': 'document_selected', 'name': selection.selected_document_name, 'slug': slug})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return

    # FIELD COLLECTION PHASE: document type is known (existing logic, unchanged)
    # Use the NDA-specific path only for the direct /nda route (no variables provided).
    # The intent-driven dashboard always supplies variables, so it uses the generic path
    # which maps field names back to template display names via key_map.
    is_nda = document_type == "Mutual NDA" and not variables

    if is_nda:
        system_prompt = CHAT_SYSTEM_PROMPT
        extraction_prompt = EXTRACTION_SYSTEM_PROMPT
        extraction_model = NdaFieldExtraction
        key_map: dict[str, str] = {}
    else:
        system_prompt = build_chat_prompt(document_type, variables)
        extraction_prompt = GENERIC_EXTRACTION_PROMPT
        extraction_model, key_map = build_extraction_model(variables)

    conversation = [{"role": "system", "content": system_prompt}] + messages

    # Stream the conversational response (async to avoid blocking the event loop)
    response = await acompletion(
        model=MODEL,
        messages=conversation,
        stream=True,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
        api_key=OPENROUTER_API_KEY,
    )

    full_response = ""
    async for chunk in response:
        content = chunk.choices[0].delta.content or ""
        if content:
            full_response += content
            yield f"data: {json.dumps({'type': 'token', 'content': content})}\n\n"

    # Extract fields from the completed conversation
    extraction_messages = [
        {"role": "system", "content": extraction_prompt},
        *messages,
        {"role": "assistant", "content": full_response},
    ]

    field_response = await acompletion(
        model=MODEL,
        messages=extraction_messages,
        response_format=extraction_model,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
        api_key=OPENROUTER_API_KEY,
    )

    fields = extraction_model.model_validate_json(
        field_response.choices[0].message.content
    )

    if is_nda:
        # NDA: emit snake_case keys; frontend maps them to camelCase NdaFormData
        fields_dict = {k: v for k, v in fields.model_dump().items() if v is not None}
    else:
        # Generic: remap sanitized keys back to original display names for template substitution
        fields_dict = {}
        for k, v in fields.model_dump().items():
            if v is not None:
                fields_dict[key_map.get(k, k)] = v

    yield f"data: {json.dumps({'type': 'fields', 'data': fields_dict})}\n\n"
    yield f"data: {json.dumps({'type': 'done'})}\n\n"
