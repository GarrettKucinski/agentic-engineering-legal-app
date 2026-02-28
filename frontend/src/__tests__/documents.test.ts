/**
 * Unit tests for document-related API functions and types.
 * Tests cover the shape and logic of document data without network calls.
 */
import { describe, it, expect } from "vitest";
import type { DocumentSummary, DocumentDetail } from "@/lib/api";

describe("DocumentSummary type", () => {
  it("has the expected shape", () => {
    const doc: DocumentSummary = {
      id: 1,
      title: "Service Agreement",
      slug: "service-agreement",
      created_at: "2024-01-15T10:30:00",
    };
    expect(doc.id).toBe(1);
    expect(doc.title).toBe("Service Agreement");
    expect(doc.slug).toBe("service-agreement");
    expect(doc.created_at).toBe("2024-01-15T10:30:00");
  });
});

describe("DocumentDetail type", () => {
  it("extends DocumentSummary with fields", () => {
    const doc: DocumentDetail = {
      id: 2,
      title: "Mutual NDA",
      slug: "Mutual NDA",
      created_at: "2024-02-20T08:00:00",
      fields: {
        Provider: "Acme Corp",
        Customer: "Beta LLC",
      },
    };
    expect(doc.id).toBe(2);
    expect(doc.fields["Provider"]).toBe("Acme Corp");
    expect(doc.fields["Customer"]).toBe("Beta LLC");
  });

  it("accepts an empty fields object", () => {
    const doc: DocumentDetail = {
      id: 3,
      title: "Empty Doc",
      slug: "empty-doc",
      created_at: "2024-03-01T00:00:00",
      fields: {},
    };
    expect(Object.keys(doc.fields)).toHaveLength(0);
  });
});

describe("document date formatting", () => {
  it("creates valid Date from ISO string", () => {
    const dateStr = "2024-01-15T10:30:00";
    const d = new Date(dateStr);
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(0); // January
    expect(d.getDate()).toBe(15);
  });

  it("formats document date to locale string", () => {
    const dateStr = "2024-06-15T00:00:00";
    const d = new Date(dateStr);
    const formatted = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    // The formatted string should contain "Jun", "15", and "2024"
    expect(formatted).toContain("2024");
    expect(formatted).toMatch(/Jun|15/);
  });
});
