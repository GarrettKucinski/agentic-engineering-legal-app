// In Docker, the frontend is served by FastAPI on port 8000, so relative paths work.
// For local dev (next dev on port 3000), set NEXT_PUBLIC_API_URL=http://localhost:8000
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

import { getToken } from "./auth";
import { NdaFormData } from "./types";

interface AuthPayload {
  token: string;
  user_id: number;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export function register(email: string, password: string): Promise<AuthPayload> {
  return apiFetch<AuthPayload>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string): Promise<AuthPayload> {
  return apiFetch<AuthPayload>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  content: string;
  fields: Record<string, string>;
  document_selected: { name: string; slug: string } | null;
}

export function mapFieldsToFormData(data: Record<string, unknown>): Partial<NdaFormData> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (!value) continue;
    const camelKey = key.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase());

    result[camelKey] = value;
  }

  return result;
}

export async function chatRequest(
  messages: ChatMessage[],
  documentType?: string,
  variables?: string[],
): Promise<ChatResponse> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages, document_type: documentType, variables }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export interface TemplateData {
  name: string;
  description: string;
  filename: string;
  template_markdown: string;
  variables: string[];
}

export async function fetchTemplate(slug: string): Promise<TemplateData> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/templates/${slug}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export interface DocumentSummary {
  id: number;
  title: string;
  slug: string;
  created_at: string;
}

export interface DocumentDetail extends DocumentSummary {
  fields: Record<string, string>;
}

function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  return apiFetch<T>(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options?.headers as Record<string, string> | undefined),
    },
  });
}

export function fetchDocuments(): Promise<DocumentSummary[]> {
  return authFetch<DocumentSummary[]>("/api/documents");
}

export function saveDocument(
  title: string,
  slug: string,
  fields: Record<string, string>,
): Promise<DocumentSummary> {
  return authFetch<DocumentSummary>("/api/documents", {
    method: "POST",
    body: JSON.stringify({ title, slug, fields }),
  });
}

export function fetchDocument(id: number): Promise<DocumentDetail> {
  return authFetch<DocumentDetail>(`/api/documents/${id}`);
}
