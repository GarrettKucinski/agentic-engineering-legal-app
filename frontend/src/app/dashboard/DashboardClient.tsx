"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearToken } from "@/lib/auth";
import { filenameToSlug } from "@/lib/doc-template";
import { CatalogEntry } from "@/lib/types";

const ADDENDUM_TYPES = new Set(["AI Addendum", "Mutual NDA Cover Page"]);

interface Props {
  catalog: CatalogEntry[];
}

export default function DashboardClient({ catalog }: Props) {
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ color: "#032147" }}>
            LegalDraft
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold" style={{ color: "#032147" }}>
            Document Templates
          </h2>
          <p className="mt-1 text-sm" style={{ color: "#888888" }}>
            Choose a legal document to get started
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalog.map((entry) => {
            const isAddendum = ADDENDUM_TYPES.has(entry.name);
            const slug = filenameToSlug(entry.filename);
            const href = entry.name === "Mutual NDA" ? "/nda" : `/doc/${slug}`;
            return (
              <div
                key={entry.filename}
                className="bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-3"
                style={{ borderColor: "#209dd7" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold" style={{ color: "#032147" }}>
                    {entry.name}
                  </h3>
                  {isAddendum && (
                    <span
                      className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "#e8f4fb", color: "#0d6e9e" }}
                    >
                      Addendum
                    </span>
                  )}
                </div>

                <p className="text-xs leading-relaxed flex-1" style={{ color: "#888888" }}>
                  {entry.description}
                </p>

                <Link
                  href={href}
                  className="mt-auto inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#209dd7" }}
                >
                  Create →
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
