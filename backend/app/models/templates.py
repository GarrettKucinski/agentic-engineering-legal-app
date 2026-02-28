from pydantic import BaseModel


class TemplateResponse(BaseModel):
    name: str
    description: str
    filename: str
    template_markdown: str
    variables: list[str]
