// In Docker, the frontend is served by FastAPI on port 8000, so relative paths work.
// For local dev (next dev on port 3000), set NEXT_PUBLIC_API_URL=http://localhost:8000
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

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
