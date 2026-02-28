from fastapi import APIRouter, Depends, HTTPException

from app.catalog import extract_template_variables, load_catalog, load_template
from app.models.templates import TemplateResponse
from app.services.auth import get_current_user

router = APIRouter()


@router.get("/api/templates/{slug}")
def get_template(slug: str, _user_id: int = Depends(get_current_user)) -> TemplateResponse:
    catalog = load_catalog()
    entry = next((e for e in catalog if e["filename"].removesuffix(".md") == slug), None)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Template '{slug}' not found")

    try:
        template_markdown = load_template(entry["filename"])
    except RuntimeError:
        raise HTTPException(status_code=500, detail="Template file unavailable")
    variables = extract_template_variables(template_markdown)

    return TemplateResponse(
        name=entry["name"],
        description=entry["description"],
        filename=entry["filename"],
        template_markdown=template_markdown,
        variables=variables,
    )
