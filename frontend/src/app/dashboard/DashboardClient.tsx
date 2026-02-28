"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";
import { fetchTemplate, TemplateData } from "@/lib/api";
import AiChat from "@/components/AiChat";
import DocPreview from "@/components/DocPreview";
import DocPlaceholder from "@/components/DocPlaceholder";

export default function DashboardClient() {
  const router = useRouter();
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  const handleFieldsUpdate = useCallback(
    (updated: Record<string, string>) =>
      setFields((prev) => ({ ...prev, ...updated })),
    [],
  );

  const handleDocumentSelected = useCallback(async (name: string, slug: string) => {
    setLoadingTemplate(true);
    try {
      const data = await fetchTemplate(slug);
      setTemplateData(data);
      setFields({});
    } catch (err) {
      console.error("Failed to load template:", err);
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
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Sign Out
          </button>
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
