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

export interface ChatStreamCallbacks {
  onToken: (token: string) => void;
  onFields: (fields: Record<string, string>) => void;
  onDocumentSelected: (name: string, slug: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
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
          } else if (event.type === "document_selected") {
            callbacks.onDocumentSelected(event.name as string, event.slug as string);
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
