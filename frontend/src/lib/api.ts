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

interface ChatStreamCallbacks {
  onToken: (token: string) => void;
  onFields: (fields: Record<string, string>) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export function mapFieldsToFormData(data: Record<string, unknown>): Partial<NdaFormData> {
  const fields: Partial<NdaFormData> = {};
  if (data.purpose != null) fields.purpose = data.purpose as string;
  if (data.effective_date != null) fields.effectiveDate = data.effective_date as string;
  if (data.mnda_term_type != null) fields.mndaTermType = data.mnda_term_type as "expires" | "untilTerminated";
  if (data.mnda_term_years != null) fields.mndaTermYears = data.mnda_term_years as number;
  if (data.confidentiality_term_type != null) fields.confidentialityTermType = data.confidentiality_term_type as "duration" | "perpetuity";
  if (data.confidentiality_term_years != null) fields.confidentialityTermYears = data.confidentiality_term_years as number;
  if (data.governing_law != null) fields.governingLaw = data.governing_law as string;
  if (data.jurisdiction != null) fields.jurisdiction = data.jurisdiction as string;
  if (data.modifications != null) fields.modifications = data.modifications as string;
  if (data.party1_name != null) fields.party1Name = data.party1_name as string;
  if (data.party1_title != null) fields.party1Title = data.party1_title as string;
  if (data.party1_company != null) fields.party1Company = data.party1_company as string;
  if (data.party1_address != null) fields.party1Address = data.party1_address as string;
  if (data.party2_name != null) fields.party2Name = data.party2_name as string;
  if (data.party2_title != null) fields.party2Title = data.party2_title as string;
  if (data.party2_company != null) fields.party2Company = data.party2_company as string;
  if (data.party2_address != null) fields.party2Address = data.party2_address as string;
  return fields;
}

export async function chatStream(
  messages: ChatMessage[],
  callbacks: ChatStreamCallbacks,
  documentType?: string,
  variables?: string[],
): Promise<void> {
  const token = getToken();
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messages, document_type: documentType, variables }),
    });
  } catch (err) {
    callbacks.onError(err instanceof Error ? err.message : "Network error");
    return;
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    callbacks.onError(body.detail ?? `HTTP ${response.status}`);
    return;
  }

  if (!response.body) {
    callbacks.onError("Response has no body");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let doneReceived = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === "token") {
            callbacks.onToken(event.content);
          } else if (event.type === "fields") {
            callbacks.onFields(event.data as Record<string, string>);
          } else if (event.type === "done") {
            doneReceived = true;
            callbacks.onDone();
          }
        } catch {
          // ignore malformed SSE lines
        }
      }
    }
    // If the stream closed without a "done" event, signal completion anyway
    if (!doneReceived) {
      callbacks.onDone();
    }
  } catch (err) {
    callbacks.onError(err instanceof Error ? err.message : "Stream error");
  }
}
