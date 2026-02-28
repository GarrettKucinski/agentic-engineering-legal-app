import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

/** Converts markdown to sanitized HTML. Output is safe to inject into the DOM. */
export function renderMarkdown(content: string): string {
  const rawHtml = marked.parse(content, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml);
}
