"use client";

import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import { NdaFormData } from "@/lib/types";
import { generateFullMarkdown } from "@/lib/nda-template";

interface NdaPreviewProps {
  standardTermsTemplate: string;
  data: NdaFormData;
  previewRef: React.RefObject<HTMLDivElement | null>;
}

export default function NdaPreview({
  standardTermsTemplate,
  data,
  previewRef,
}: NdaPreviewProps) {
  const html = useMemo(() => {
    const fullMarkdown = generateFullMarkdown(standardTermsTemplate, data);
    const rawHtml = marked.parse(fullMarkdown, { async: false }) as string;
    return DOMPurify.sanitize(rawHtml);
  }, [standardTermsTemplate, data]);

  return (
    <div
      ref={previewRef}
      className="nda-document bg-white text-gray-900 p-8 lg:p-12 rounded-lg border border-gray-200 shadow-sm"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
