"use client";

import { useCallback, useState } from "react";
import { resolveTemplate, filenameToSlug } from "@/lib/doc-template";
import { CatalogEntry } from "@/lib/types";
import AiChat from "./AiChat";
import DocPreview from "./DocPreview";

interface DocCreatorProps {
  templateMarkdown: string;
  variables: string[];
  catalogEntry: CatalogEntry;
}

export default function DocCreator({
  templateMarkdown,
  variables,
  catalogEntry,
}: DocCreatorProps) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleFieldsUpdate = useCallback(
    (updated: Record<string, string>) =>
      setFields((prev) => ({ ...prev, ...updated })),
    [],
  );

  const slug = filenameToSlug(catalogEntry.filename);

  const downloadMarkdown = useCallback(() => {
    const resolved = resolveTemplate(templateMarkdown, fields);
    const blob = new Blob([resolved], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [templateMarkdown, fields, slug]);

  const downloadPdf = useCallback(async () => {
    setPdfLoading(true);
    setPdfError(null);
    try {
      const [{ pdf, Document, Page, StyleSheet }, { markdownToPdfElements }] =
        await Promise.all([
          import("@react-pdf/renderer"),
          import("@/lib/markdown-to-pdf"),
        ]);

      const resolved = resolveTemplate(templateMarkdown, fields);

      const styles = StyleSheet.create({
        page: {
          fontFamily: "Times-Roman",
          fontSize: 10,
          paddingTop: 72,
          paddingBottom: 72,
          paddingHorizontal: 72,
          color: "#111111",
          backgroundColor: "#FFFFFF",
        },
      });

      const doc = (
        <Document title={catalogEntry.name}>
          <Page size="LETTER" style={styles.page}>
            {markdownToPdfElements(resolved)}
          </Page>
        </Document>
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}.pdf`;
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
  }, [templateMarkdown, fields, catalogEntry.name, slug]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <a href="/dashboard" className="text-lg font-bold hover:opacity-80 transition-opacity" style={{ color: "#032147" }}>LegalDraft</a>
              <span className="text-gray-300">/</span>
              <h1 className="text-base font-semibold text-gray-700">{catalogEntry.name}</h1>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">{catalogEntry.description}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
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
                disabled={pdfLoading}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {pdfLoading ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Generating PDF...
                  </>
                ) : (
                  <>
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
                    Download PDF
                  </>
                )}
              </button>
            </div>
            {pdfError && <p className="text-xs text-red-600">{pdfError}</p>}
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-4">
            <div
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex flex-col"
              style={{ minHeight: "calc(100vh - 10rem)" }}
            >
              <AiChat
                onFieldsUpdate={handleFieldsUpdate}
                documentType={catalogEntry.name}
                variables={variables}
              />
            </div>
          </div>

          <div className="lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <DocPreview templateMarkdown={templateMarkdown} fields={fields} />
          </div>
        </div>
      </div>
    </div>
  );
}
