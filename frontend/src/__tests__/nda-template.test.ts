/**
 * Unit tests for nda-template utilities.
 * No external dependencies — pure functions only.
 */
import { describe, it, expect } from "vitest";
import {
  generateCoverPageMarkdown,
  generateFullMarkdown,
  resolveStandardTerms,
  formatDate,
  ndaCoverPageSlug,
} from "@/lib/nda-template";
import { defaultFormData } from "@/lib/types";

// ---------------------------------------------------------------------------
// ndaCoverPageSlug — constant export for the cover page template slug
// ---------------------------------------------------------------------------

describe("ndaCoverPageSlug", () => {
  it("is a non-empty string", () => {
    expect(typeof ndaCoverPageSlug).toBe("string");
    expect(ndaCoverPageSlug.length).toBeGreaterThan(0);
  });

  it("matches the catalog filename without .md extension", () => {
    // catalog.json entry: "filename": "Mutual-NDA-coverpage.md"
    expect(ndaCoverPageSlug).toBe("Mutual-NDA-coverpage");
  });
});

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe("formatDate", () => {
  it("formats a valid date string to human-readable form", () => {
    const result = formatDate("2024-01-15");
    expect(result).toContain("2024");
    expect(result).toContain("January");
    expect(result).toContain("15");
  });

  it("returns placeholder for empty string", () => {
    expect(formatDate("")).toBe("________");
  });
});

// ---------------------------------------------------------------------------
// generateCoverPageMarkdown
// ---------------------------------------------------------------------------

describe("generateCoverPageMarkdown", () => {
  it("includes the party names", () => {
    const data = { ...defaultFormData, party1Company: "Acme Corp", party2Company: "Beta LLC" };
    const md = generateCoverPageMarkdown(data);
    expect(md).toContain("Acme Corp");
    expect(md).toContain("Beta LLC");
  });

  it("uses placeholders when party fields are empty", () => {
    const md = generateCoverPageMarkdown(defaultFormData);
    expect(md).toContain("________");
  });

  it("marks the expires checkbox when mndaTermType is 'expires'", () => {
    const data = { ...defaultFormData, mndaTermType: "expires" as const };
    const md = generateCoverPageMarkdown(data);
    expect(md).toContain("[x]");
  });

  it("marks the untilTerminated checkbox when mndaTermType is 'untilTerminated'", () => {
    const data = { ...defaultFormData, mndaTermType: "untilTerminated" as const };
    const md = generateCoverPageMarkdown(data);
    // The second checkbox should be checked
    expect(md).toMatch(/\[x\].*terminated/i);
  });

  it("includes the governing law", () => {
    const data = { ...defaultFormData, governingLaw: "Delaware" };
    const md = generateCoverPageMarkdown(data);
    expect(md).toContain("Delaware");
  });

  it("includes modifications or defaults to None", () => {
    const data = { ...defaultFormData, modifications: "" };
    const md = generateCoverPageMarkdown(data);
    expect(md).toContain("None.");
  });
});

// ---------------------------------------------------------------------------
// generateFullMarkdown
// ---------------------------------------------------------------------------

describe("generateFullMarkdown", () => {
  const rawTerms = "# Standard Terms\n\nSome standard terms text.\n\nCommon Paper Mutual Non-Disclosure v1.0";

  it("includes the cover page content", () => {
    const md = generateFullMarkdown(rawTerms, defaultFormData);
    expect(md).toContain("Mutual Non-Disclosure Agreement");
  });

  it("includes the standard terms (after stripping the title)", () => {
    const md = generateFullMarkdown(rawTerms, defaultFormData);
    expect(md).toContain("Some standard terms text.");
  });

  it("separates sections with a horizontal rule", () => {
    const md = generateFullMarkdown(rawTerms, defaultFormData);
    expect(md).toContain("---");
  });

  it("includes the CC BY 4.0 attribution footer", () => {
    const md = generateFullMarkdown(rawTerms, defaultFormData);
    expect(md).toContain("CC BY 4.0");
  });
});
