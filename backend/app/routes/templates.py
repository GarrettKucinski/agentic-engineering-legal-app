from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.catalog import extract_template_variables, load_catalog, load_template
from app.services.auth import get_current_user

router = APIRouter()


class TemplateResponse(BaseModel):
    name: str
    description: str
    filename: str
    template_markdown: str
    variables: list[str]


@router.get("/api/templates/{slug}")
def get_template(slug: str, _user_id: int = Depends(get_current_user)) -> TemplateResponse:
    catalog = load_catalog()
    entry = next((e for e in catalog if e["filename"].removesuffix(".md") == slug), None)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Template '{slug}' not found")

    template_markdown = load_template(entry["filename"])
    variables = extract_template_variables(template_markdown)

    return TemplateResponse(
        name=entry["name"],
        description=entry["description"],
        filename=entry["filename"],
        template_markdown=template_markdown,
        variables=variables,
    )
