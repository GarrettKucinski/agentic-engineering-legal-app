/**
 * Unit tests for doc-template utilities.
 * No external dependencies — pure functions only.
 */
import { describe, it, expect } from "vitest";
import {
  extractTemplateVariables,
  resolveTemplate,
  filenameToSlug,
} from "@/lib/doc-template";

// ---------------------------------------------------------------------------
// extractTemplateVariables
// ---------------------------------------------------------------------------

describe("extractTemplateVariables", () => {
  it("extracts a single coverpage_link variable", () => {
    const md = `<span class="coverpage_link">Provider</span>`;
    expect(extractTemplateVariables(md)).toEqual(["Provider"]);
  });

  it("extracts keyterms_link variables", () => {
    const md = `<span class="keyterms_link">Customer</span>`;
    expect(extractTemplateVariables(md)).toEqual(["Customer"]);
  });

  it("extracts orderform_link variables", () => {
    const md = `<span class="orderform_link">Effective Date</span>`;
    expect(extractTemplateVariables(md)).toEqual(["Effective Date"]);
  });

  it("deduplicates repeated variable names", () => {
    const md = [
      `<span class="coverpage_link">Provider</span>`,
      `<span class="keyterms_link">Provider</span>`,
      `<span class="coverpage_link">Provider</span>`,
    ].join("\n");
    expect(extractTemplateVariables(md)).toEqual(["Provider"]);
  });

  it("normalises possessives: strips trailing 's", () => {
    const md = `<span class="coverpage_link">Provider's</span>`;
    expect(extractTemplateVariables(md)).toEqual(["Provider"]);
  });

  it("normalises possessives: strips trailing plain apostrophe", () => {
    const md = `<span class="coverpage_link">Providers'</span>`;
    expect(extractTemplateVariables(md)).toEqual(["Providers"]);
  });

  it("deduplicates possessive and non-possessive forms", () => {
    const md = [
      `<span class="coverpage_link">Provider</span>`,
      `<span class="keyterms_link">Provider's</span>`,
    ].join("\n");
    expect(extractTemplateVariables(md)).toEqual(["Provider"]);
  });

  it("returns results sorted alphabetically", () => {
    const md = [
      `<span class="coverpage_link">Provider</span>`,
      `<span class="keyterms_link">Customer</span>`,
      `<span class="orderform_link">Effective Date</span>`,
    ].join("\n");
    expect(extractTemplateVariables(md)).toEqual([
      "Customer",
      "Effective Date",
      "Provider",
    ]);
  });

  it("returns empty array for markdown with no span variables", () => {
    expect(extractTemplateVariables("# Just a heading\n\nSome text.")).toEqual([]);
  });

  it("ignores spans with unrecognised class names", () => {
    const md = `<span class="unknown_class">Ignored</span>`;
    expect(extractTemplateVariables(md)).toEqual([]);
  });

  it("extracts multiple unique variables across all span classes", () => {
    const md = [
      `<span class="coverpage_link">Provider</span>`,
      `<span class="keyterms_link">Customer</span>`,
      `<span class="orderform_link">Provider</span>`,
    ].join(" ");
    expect(extractTemplateVariables(md)).toEqual(["Customer", "Provider"]);
  });
});

// ---------------------------------------------------------------------------
// resolveTemplate
// ---------------------------------------------------------------------------

describe("resolveTemplate", () => {
  it("replaces a coverpage_link variable with bold value", () => {
    const md = `<span class="coverpage_link">Provider</span>`;
    expect(resolveTemplate(md, { Provider: "Acme Corp" })).toBe("**Acme Corp**");
  });

  it("replaces a keyterms_link variable", () => {
    const md = `<span class="keyterms_link">Customer</span>`;
    expect(resolveTemplate(md, { Customer: "Beta LLC" })).toBe("**Beta LLC**");
  });

  it("replaces an orderform_link variable", () => {
    const md = `<span class="orderform_link">Effective Date</span>`;
    expect(resolveTemplate(md, { "Effective Date": "2024-01-01" })).toBe(
      "**2024-01-01**"
    );
  });

  it("replaces possessive 's form", () => {
    const md = `<span class="coverpage_link">Provider's</span>`;
    expect(resolveTemplate(md, { Provider: "Acme Corp" })).toBe(
      "**Acme Corp's**"
    );
  });

  it("replaces plain possessive apostrophe form", () => {
    const md = `<span class="coverpage_link">Providers'</span>`;
    expect(resolveTemplate(md, { Providers: "Acme Corp" })).toBe(
      "**Acme Corp'**"
    );
  });

  it("skips keys with empty/falsy values, leaving the variable name as plain text", () => {
    // Empty value → replacement skipped → HTML cleanup strips tags but keeps inner text
    const md = `<span class="coverpage_link">Provider</span>`;
    expect(resolveTemplate(md, { Provider: "" })).toBe("Provider");
  });

  it("strips unreplaced span tags (variables not in fields)", () => {
    const md = `<span class="coverpage_link">Unknown</span>`;
    // No "Unknown" key in fields → span gets stripped by the cleanup pass
    expect(resolveTemplate(md, {})).toBe("Unknown");
  });

  it("handles multiple fields in a single template", () => {
    const md = [
      `<span class="coverpage_link">Provider</span>`,
      " and ",
      `<span class="keyterms_link">Customer</span>`,
    ].join("");
    const result = resolveTemplate(md, {
      Provider: "Acme Corp",
      Customer: "Beta LLC",
    });
    expect(result).toBe("**Acme Corp** and **Beta LLC**");
  });

  it("returns plain text when there are no spans", () => {
    const md = "Just some plain text.";
    expect(resolveTemplate(md, { Provider: "Acme" })).toBe(
      "Just some plain text."
    );
  });

  it("replaces the same variable across all three span classes", () => {
    const md = [
      `<span class="coverpage_link">Provider</span>`,
      `<span class="keyterms_link">Provider</span>`,
      `<span class="orderform_link">Provider</span>`,
    ].join(", ");
    expect(resolveTemplate(md, { Provider: "Acme" })).toBe(
      "**Acme**, **Acme**, **Acme**"
    );
  });
});

// ---------------------------------------------------------------------------
// filenameToSlug
// ---------------------------------------------------------------------------

describe("filenameToSlug", () => {
  it("strips a lowercase .md extension", () => {
    expect(filenameToSlug("BAA.md")).toBe("BAA");
  });

  it("strips an uppercase .MD extension", () => {
    expect(filenameToSlug("BAA.MD")).toBe("BAA");
  });

  it("strips a mixed-case .Md extension", () => {
    expect(filenameToSlug("agreement.Md")).toBe("agreement");
  });

  it("preserves hyphens in the base name", () => {
    expect(filenameToSlug("design-partner-agreement.md")).toBe(
      "design-partner-agreement"
    );
  });

  it("preserves spaces if present in the filename", () => {
    expect(filenameToSlug("Mutual NDA.md")).toBe("Mutual NDA");
  });

  it("returns the filename unchanged when there is no .md extension", () => {
    expect(filenameToSlug("noextension")).toBe("noextension");
  });

  it("only strips the trailing .md, not an embedded one", () => {
    // "file.md.md" → only the trailing one is stripped
    expect(filenameToSlug("file.md.md")).toBe("file.md");
  });
});
