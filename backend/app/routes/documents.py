import json

from fastapi import APIRouter, Depends, HTTPException, status

from app.data.documents import create_document, get_document, list_documents
from app.models.documents import DocumentDetail, DocumentSummary, SaveDocumentRequest
from app.services.auth import get_current_user

router = APIRouter()


@router.get("/api/documents", response_model=list[DocumentSummary])
async def get_documents(user_id: int = Depends(get_current_user)):
    rows = list_documents(user_id)
    return [
        DocumentSummary(
            id=row["id"],
            title=row["title"],
            slug=row["slug"],
            created_at=row["created_at"],
        )
        for row in rows
    ]


@router.post("/api/documents", response_model=DocumentSummary, status_code=status.HTTP_201_CREATED)
async def save_document(req: SaveDocumentRequest, user_id: int = Depends(get_current_user)):
    doc_id = create_document(user_id, req.title, req.slug, req.fields)
    rows = list_documents(user_id)
    for row in rows:
        if row["id"] == doc_id:
            return DocumentSummary(
                id=row["id"],
                title=row["title"],
                slug=row["slug"],
                created_at=row["created_at"],
            )
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve saved document")


@router.get("/api/documents/{doc_id}", response_model=DocumentDetail)
async def get_document_by_id(doc_id: int, user_id: int = Depends(get_current_user)):
    row = get_document(doc_id, user_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return DocumentDetail(
        id=row["id"],
        title=row["title"],
        slug=row["slug"],
        fields=json.loads(row["fields"]),
        created_at=row["created_at"],
    )
