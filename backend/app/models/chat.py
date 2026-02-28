from typing import Literal, Optional

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    document_type: Optional[str] = None
    variables: list[str] = []


class DocumentSelectionExtraction(BaseModel):
    selected_document_name: Optional[str] = None


class NdaFieldExtraction(BaseModel):
    purpose: Optional[str] = None
    effective_date: Optional[str] = None
    mnda_term_type: Optional[Literal["expires", "untilTerminated"]] = None
    mnda_term_years: Optional[int] = None
    confidentiality_term_type: Optional[Literal["duration", "perpetuity"]] = None
    confidentiality_term_years: Optional[int] = None
    governing_law: Optional[str] = None
    jurisdiction: Optional[str] = None
    modifications: Optional[str] = None
    party1_name: Optional[str] = None
    party1_title: Optional[str] = None
    party1_company: Optional[str] = None
    party1_address: Optional[str] = None
    party2_name: Optional[str] = None
    party2_title: Optional[str] = None
    party2_company: Optional[str] = None
    party2_address: Optional[str] = None
