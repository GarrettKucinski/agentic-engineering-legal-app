from datetime import datetime

from pydantic import BaseModel


class SaveDocumentRequest(BaseModel):
    title: str
    slug: str
    fields: dict[str, str] = {}


class DocumentSummary(BaseModel):
    id: int
    title: str
    slug: str
    created_at: str


class DocumentDetail(BaseModel):
    id: int
    title: str
    slug: str
    fields: dict[str, str]
    created_at: str
