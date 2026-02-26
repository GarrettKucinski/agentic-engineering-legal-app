"use client";

import { useCallback, useRef, useState } from "react";
import { NdaFormData, defaultFormData } from "@/lib/types";
import { generateFullMarkdown } from "@/lib/nda-template";
import NdaForm from "./NdaForm";
import NdaPreview from "./NdaPreview";

interface NdaCreatorProps {
  standardTermsTemplate: string;
}

export default function NdaCreator({
  standardTermsTemplate,
}: NdaCreatorProps) {
  const [formData, setFormData] = useState<NdaFormData>(defaultFormData);
  const previewRef = useRef<HTMLDivElement>(null);

  const downloadMarkdown = useCallback(() => {
    const markdown = generateFullMarkdown(standardTermsTemplate, formData);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Mutual-NDA.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [standardTermsTemplate, formData]);

  const downloadPdf = useCallback(async () => {
    const el = previewRef.current;
    if (!el) return;

    const html2pdf = (await import("html2pdf.js")).default;
    const savedPadding = el.style.padding;
    el.style.padding = "0";
    try {
      await html2pdf()
        .set({
          margin: [0.75, 0.75, 0.75, 0.75],
          filename: "Mutual-NDA.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        })
        .from(el)
        .save();
    } finally {
      el.style.padding = savedPadding;
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Mutual NDA Creator
            </h1>
            <p className="text-sm text-gray-500">
              Based on Common Paper Mutual NDA Standard Terms v1.0
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={downloadMarkdown}
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Markdown
            </button>
            <button
              onClick={downloadPdf}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              PDF
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-4">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <NdaForm data={formData} onChange={setFormData} />
            </div>
          </div>

          <div className="lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <NdaPreview
              standardTermsTemplate={standardTermsTemplate}
              data={formData}
              previewRef={previewRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
