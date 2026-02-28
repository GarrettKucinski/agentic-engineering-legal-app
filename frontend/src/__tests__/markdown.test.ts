import { describe, it, expect } from "vitest";
import { renderMarkdown } from "@/lib/markdown";

describe("renderMarkdown", () => {
  it("renders bold markdown as strong HTML", () => {
    const result = renderMarkdown("**bold text**");
    expect(result).toContain("<strong>bold text</strong>");
  });

  it("renders italic markdown as em HTML", () => {
    const result = renderMarkdown("_italic text_");
    expect(result).toContain("<em>italic text</em>");
  });

  it("converts a heading to an <h1> tag", () => {
    const html = renderMarkdown("# Heading");
    expect(html).toContain("<h1>Heading</h1>");
  });

  it("converts an unordered list item to <li>", () => {
    const html = renderMarkdown("- item one");
    expect(html).toContain("<li>item one</li>");
  });

  it("renders bullet list as ul/li HTML", () => {
    const result = renderMarkdown("- item one\n- item two");
    expect(result).toContain("<li>item one</li>");
    expect(result).toContain("<li>item two</li>");
  });

  it("wraps a plain paragraph in <p> tags", () => {
    const html = renderMarkdown("just some text");
    expect(html).toContain("<p>just some text</p>");
  });

  it("returns a string", () => {
    expect(typeof renderMarkdown("hello")).toBe("string");
  });

  it("sanitizes XSS in markdown output", () => {
    const result = renderMarkdown('<script>alert("xss")</script>');
    expect(result).not.toContain("<script>");
  });

  it("strips dangerous script tags (DOMPurify sanitization)", () => {
    const html = renderMarkdown('plain text <script>alert("xss")</script>');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("alert");
  });

  it("strips onclick attributes (DOMPurify sanitization)", () => {
    const html = renderMarkdown('<a onclick="evil()">click me</a>');
    expect(html).not.toContain("onclick");
  });

  it("returns empty string for empty input", () => {
    const html = renderMarkdown("");
    expect(html.trim()).toBe("");
  });

  it("converts a markdown link to an <a> tag so AI-provided links are clickable", () => {
    const html = renderMarkdown(
      "[Download your document](https://example.com/doc.pdf)"
    );
    expect(html).toContain('<a href="https://example.com/doc.pdf"');
    expect(html).toContain("Download your document");
  });

  it("preserves inline text without wrapping unneeded tags", () => {
    const html = renderMarkdown("Your document is ready to download.");
    expect(html).toContain("Your document is ready to download.");
  });
});
