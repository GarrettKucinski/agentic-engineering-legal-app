/**
 * Unit tests for chatRequest function in api.ts.
 * Tests the single-response JSON API (replaces SSE chatStream).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { chatRequest } from "@/lib/api";

// Mock getToken so tests don't need localStorage
vi.mock("@/lib/auth", () => ({
  getToken: () => "test-token",
}));

function makeFetchResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

describe("chatRequest", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("calls POST /api/chat with messages and auth header", async () => {
    const mockFetch = vi.fn().mockReturnValue(
      makeFetchResponse({
        content: "Hello!",
        fields: {},
        document_selected: null,
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    await chatRequest([{ role: "user", content: "hi" }]);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/chat"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      })
    );
  });

  it("returns content, fields, and document_selected from response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        makeFetchResponse({
          content: "I can help you with that.",
          fields: { "Party 1 Name": "Acme Corp" },
          document_selected: { name: "Mutual NDA", slug: "mutual-nda" },
        })
      )
    );

    const result = await chatRequest([]);
    expect(result.content).toBe("I can help you with that.");
    expect(result.fields).toEqual({ "Party 1 Name": "Acme Corp" });
    expect(result.document_selected).toEqual({ name: "Mutual NDA", slug: "mutual-nda" });
  });

  it("passes document_type and variables to the API", async () => {
    const mockFetch = vi.fn().mockReturnValue(
      makeFetchResponse({ content: "ok", fields: {}, document_selected: null })
    );
    vi.stubGlobal("fetch", mockFetch);

    await chatRequest([], "Mutual NDA", ["Party 1 Name", "Party 2 Name"]);

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(callBody.document_type).toBe("Mutual NDA");
    expect(callBody.variables).toEqual(["Party 1 Name", "Party 2 Name"]);
  });

  it("throws an error on non-OK HTTP response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        makeFetchResponse({ detail: "Unauthorized" }, false, 401)
      )
    );

    await expect(chatRequest([])).rejects.toThrow("Unauthorized");
  });

  it("throws an error with HTTP status when no detail field present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(makeFetchResponse({}, false, 500))
    );

    await expect(chatRequest([])).rejects.toThrow("HTTP 500");
  });

  it("returns null document_selected when none selected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        makeFetchResponse({
          content: "What document do you need?",
          fields: {},
          document_selected: null,
        })
      )
    );

    const result = await chatRequest([]);
    expect(result.document_selected).toBeNull();
  });

  it("returns empty fields object in field-collection phase", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        makeFetchResponse({
          content: "What is the governing law?",
          fields: {},
          document_selected: null,
        })
      )
    );

    const result = await chatRequest([{ role: "user", content: "I need an NDA" }], "Mutual NDA");
    expect(result.fields).toEqual({});
  });
});
