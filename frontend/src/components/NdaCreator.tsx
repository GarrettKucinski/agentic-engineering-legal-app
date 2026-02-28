"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { NdaFormData, defaultFormData } from "@/lib/types";
import { generateFullMarkdown, resolveStandardTerms, ndaCoverPageSlug } from "@/lib/nda-template";
import { mapFieldsToFormData } from "@/lib/api";
import AiChat from "./AiChat";
import NdaPreview from "./NdaPreview";

interface NdaCreatorProps {
  standardTermsTemplate: string;
}

export default function NdaCreator({ standardTermsTemplate }: NdaCreatorProps) {
  const [formData, setFormData] = useState<NdaFormData>(defaultFormData);
  const [coverPageDismissed, setCoverPageDismissed] = useState(false);
  const handleFieldsUpdate = useCallback(
    (fields: Record<string, string>) =>
      setFormData((prev) => ({ ...prev, ...mapFieldsToFormData(fields) })),
    []
  );
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Show the cover page offer once at least one party name has been populated
  const showCoverPageOffer =
    !coverPageDismissed &&
    (!!formData.party1Company || !!formData.party2Company);

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
    setPdfLoading(true);
    setPdfError(null);
    try {
      const [{ pdf }, { NdaDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/nda-pdf"),
      ]);

      const resolvedTerms = resolveStandardTerms(standardTermsTemplate, formData);
      const blob = await pdf(
        <NdaDocument data={formData} resolvedTerms={resolvedTerms} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const p1 = (formData.party1Company || "party1")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");
      const p2 = (formData.party2Company || "party2")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");
      a.download = `mutual-nda-${p1}-${p2}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setPdfError("Failed to generate PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  }, [standardTermsTemplate, formData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <a href="/dashboard" className="text-lg font-bold hover:opacity-80 transition-opacity" style={{ color: "#032147" }}>LegalDraft</a>
              <span className="text-gray-300">/</span>
              <h1 className="text-base font-semibold text-gray-700">Mutual NDA</h1>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              Based on Common Paper Mutual NDA Standard Terms v1.0
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-3">
              <button
                onClick={downloadMarkdown}
                className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Markdown
              </button>
              <button
                onClick={downloadPdf}
                disabled={pdfLoading}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {pdfLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            </div>
            {pdfError && (
              <p className="text-xs text-red-600">{pdfError}</p>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-4">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 h-full flex flex-col" style={{ minHeight: "calc(100vh - 10rem)" }}>
              <AiChat onFieldsUpdate={handleFieldsUpdate} documentType="Mutual NDA" />
            </div>
          </div>

          <div className="lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto space-y-4">
            <NdaPreview
              standardTermsTemplate={standardTermsTemplate}
              data={formData}
            />
            {showCoverPageOffer && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-amber-600 mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-900">
                    Need a standalone Cover Page?
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    The PDF above includes the cover page. You can also generate a
                    standalone cover page that references the Common Paper Standard
                    Terms by URL — ideal for signing separately.
                  </p>
                  <Link
                    href={`/doc/${ndaCoverPageSlug}`}
                    className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-amber-800 hover:text-amber-900 underline underline-offset-2"
                  >
                    Create standalone MNDA Cover Page
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                <button
                  onClick={() => setCoverPageDismissed(true)}
                  aria-label="Dismiss cover page offer"
                  className="text-amber-400 hover:text-amber-600 shrink-0"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
