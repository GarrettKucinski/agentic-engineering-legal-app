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
    <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border-b border-amber-200">
        <svg className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-xs text-amber-800 leading-relaxed">
          <span className="font-semibold">Draft document.</span> This document should be reviewed by a qualified legal professional before use.
        </p>
      </div>
      {/* Content is sanitized by DOMPurify above — safe to render */}
      <div
        className="nda-document bg-white text-gray-900 p-8 lg:p-12"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
