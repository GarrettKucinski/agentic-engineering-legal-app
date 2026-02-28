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

  it("renders bullet list as ul/li HTML", () => {
    const result = renderMarkdown("- item one\n- item two");
    expect(result).toContain("<li>item one</li>");
    expect(result).toContain("<li>item two</li>");
  });

  it("sanitizes XSS in markdown output", () => {
    const result = renderMarkdown('<script>alert("xss")</script>');
    expect(result).not.toContain("<script>");
  });
});
