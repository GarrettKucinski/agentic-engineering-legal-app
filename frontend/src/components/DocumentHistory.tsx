"use client";

import { useCallback, useEffect, useState } from "react";
import { DocumentSummary, fetchDocuments } from "@/lib/api";

interface DocumentHistoryProps {
  onOpen: (doc: DocumentSummary) => void;
  refreshTrigger?: number;
}

export default function DocumentHistory({ onOpen, refreshTrigger }: DocumentHistoryProps) {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">My Documents</h3>
        <button
          onClick={load}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
          <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading…
        </div>
      )}

      {error && !loading && (
        <p className="text-xs text-red-600 py-2">{error}</p>
      )}

      {!loading && !error && documents.length === 0 && (
        <div className="py-4 text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-xs text-gray-400">No saved documents yet</p>
        </div>
      )}

      {!loading && !error && documents.length > 0 && (
        <ul className="space-y-1.5">
          {documents.map((doc) => (
            <li key={doc.id}>
              <button
                onClick={() => onOpen(doc)}
                className="w-full text-left rounded-md px-3 py-2.5 hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 group"
              >
                <div className="flex items-start gap-2">
                  <svg className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                      {doc.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
