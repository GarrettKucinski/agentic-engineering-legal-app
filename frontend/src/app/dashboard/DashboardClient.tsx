"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";
import { fetchTemplate, TemplateData } from "@/lib/api";
import { resolveTemplate, filenameToSlug } from "@/lib/doc-template";
import AiChat from "@/components/AiChat";
import DocPreview from "@/components/DocPreview";
import DocPlaceholder from "@/components/DocPlaceholder";

export default function DashboardClient() {
  const router = useRouter();
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  const handleFieldsUpdate = useCallback(
    (updated: Record<string, string>) =>
      setFields((prev) => ({ ...prev, ...updated })),
    [],
  );

  const downloadMarkdown = useCallback(() => {
    if (!templateData) return;
    const slug = filenameToSlug(templateData.filename);
    const resolved = resolveTemplate(templateData.template_markdown, fields);
    const blob = new Blob([resolved], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [templateData, fields]);

  const downloadPdf = useCallback(async () => {
    if (!templateData) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      const [{ pdf, Document, Page, StyleSheet }, { markdownToPdfElements }] =
        await Promise.all([
          import("@react-pdf/renderer"),
          import("@/lib/markdown-to-pdf"),
        ]);
      const slug = filenameToSlug(templateData.filename);
      const resolved = resolveTemplate(templateData.template_markdown, fields);
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
        <Document title={templateData.name}>
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
  }, [templateData, fields]);

  const handleDocumentSelected = useCallback(async (_name: string, slug: string) => {
    setLoadingTemplate(true);
    setTemplateError(null);
    try {
      const data = await fetchTemplate(slug);
      setTemplateData(data);
      setFields({});
    } catch (err) {
      setTemplateError(err instanceof Error ? err.message : "Failed to load template");
    } finally {
      setLoadingTemplate(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#032147" }}>
              LegalDraft
            </h1>
            {templateData && (
              <p className="text-sm text-gray-500">{templateData.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {templateData && (
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
                {pdfError && <p className="text-xs text-red-600">{pdfError}</p>}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Two-column layout */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: AI Chat */}
          <div className="lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-4">
            <div
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex flex-col"
              style={{ minHeight: "calc(100vh - 10rem)" }}
            >
              <AiChat
                onFieldsUpdate={handleFieldsUpdate}
                onDocumentSelected={handleDocumentSelected}
                documentType={templateData?.name}
                variables={templateData?.variables}
              />
            </div>
          </div>

          {/* Right: Document preview or placeholder */}
          <div className="lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            {templateError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
                {templateError}
              </div>
            )}
            {loadingTemplate ? (
              <div
                className="nda-document flex items-center justify-center"
                style={{ minHeight: "calc(100vh - 10rem)" }}
              >
                <div className="flex flex-col items-center gap-3 text-gray-400">
                  <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm">Loading template…</span>
                </div>
              </div>
            ) : templateData ? (
              <DocPreview
                templateMarkdown={templateData.template_markdown}
                fields={fields}
              />
            ) : (
              <DocPlaceholder />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
