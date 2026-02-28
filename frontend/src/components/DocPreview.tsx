"use client";

import { useMemo } from "react";
import { marked } from "marked";
// DOMPurify sanitizes all HTML before rendering — safe to use dangerouslySetInnerHTML
import DOMPurify from "isomorphic-dompurify";
import { resolveTemplate } from "@/lib/doc-template";

interface DocPreviewProps {
  templateMarkdown: string;
  fields: Record<string, string>;
}

export default function DocPreview({ templateMarkdown, fields }: DocPreviewProps) {
  const html = useMemo(() => {
    const resolved = resolveTemplate(templateMarkdown, fields);
    const rawHtml = marked.parse(resolved, { async: false }) as string;
    return DOMPurify.sanitize(rawHtml);
  }, [templateMarkdown, fields]);

  return (
    <div
      className="nda-document bg-white text-gray-900 p-8 lg:p-12 rounded-lg border border-gray-200 shadow-sm"
      // Content is sanitized by DOMPurify above
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
