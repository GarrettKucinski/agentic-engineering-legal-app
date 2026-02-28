"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";
import { fetchTemplate, fetchDocument, saveDocument, TemplateData, DocumentSummary } from "@/lib/api";
import { resolveTemplate, filenameToSlug } from "@/lib/doc-template";
import AiChat from "@/components/AiChat";
import DocPreview from "@/components/DocPreview";
import DocPlaceholder from "@/components/DocPlaceholder";
import DocumentHistory from "@/components/DocumentHistory";

export default function DashboardClient() {
  const router = useRouter();
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleSaveDocument = useCallback(async () => {
    if (!templateData) return;
    setSaving(true);
    setSaveError(null);
    try {
      const slug = filenameToSlug(templateData.filename);
      const saved = await saveDocument(templateData.name, slug, fields);
      setSavedId(saved.id);
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save document");
    } finally {
      setSaving(false);
    }
  }, [templateData, fields]);

  const handleDocumentSelected = useCallback(async (_name: string, slug: string) => {
    setLoadingTemplate(true);
    setTemplateError(null);
    setSavedId(null);
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

  const handleOpenSavedDoc = useCallback(async (doc: DocumentSummary) => {
    setLoadingTemplate(true);
    setTemplateError(null);
    setSavedId(doc.id);
    setSidebarOpen(false);
    try {
      const detail = await fetchDocument(doc.id);
      const templateResult = await fetchTemplate(doc.slug);
      setTemplateData(templateResult);
      setFields(detail.fields);
    } catch (err) {
      setTemplateError(err instanceof Error ? err.message : "Failed to load document");
    } finally {
      setLoadingTemplate(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Mobile sidebar toggle */}
            <button
              className="lg:hidden p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle document history"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <span className="text-lg font-bold" style={{ color: "#032147" }}>LegalDraft</span>
              {templateData && (
                <span className="ml-3 text-sm text-gray-400 hidden sm:inline">{templateData.name}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {templateData && (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {savedId ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-2.5 py-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved
                  </span>
                ) : (
                  <button
                    onClick={handleSaveDocument}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving…
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Save
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={downloadMarkdown}
                  className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">Markdown</span>
                </button>
                <button
                  onClick={downloadPdf}
                  disabled={pdfLoading}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#209dd7" }}
                >
                  {pdfLoading ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="hidden sm:inline">Generating…</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="hidden sm:inline">Download PDF</span>
                      <span className="sm:hidden">PDF</span>
                    </>
                  )}
                </button>
              </div>
            )}
            {saveError && <p className="text-xs text-red-600">{saveError}</p>}
            {pdfError && <p className="text-xs text-red-600">{pdfError}</p>}
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-40 w-72 bg-white border-r border-gray-200 p-5 overflow-y-auto">
            <DocumentHistory onOpen={handleOpenSavedDoc} refreshTrigger={historyRefresh} />
          </div>
        </div>
      )}

      {/* Main content with sidebar */}
      <div className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 h-full">
          {/* Left sidebar: Document history (desktop) */}
          <div className="hidden lg:block w-56 xl:w-64 flex-shrink-0">
            <div className="sticky top-20 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <DocumentHistory onOpen={handleOpenSavedDoc} refreshTrigger={historyRefresh} />
            </div>
          </div>

          {/* Main two-column content */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: AI Chat */}
              <div className="lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2">
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
                    className="bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center"
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
      </div>
    </div>
  );
}
