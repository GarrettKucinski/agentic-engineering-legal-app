import { readFileSync } from "fs";
import { join } from "path";
import { notFound } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import DocCreator from "@/components/DocCreator";
import { extractTemplateVariables, filenameToSlug } from "@/lib/doc-template";
import { CatalogEntry } from "@/lib/types";

function loadCatalog(): CatalogEntry[] {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), "..", "catalog.json"), "utf-8"),
    );
  } catch {
    throw new Error(
      "Failed to load catalog.json. Ensure the file exists at the project root.",
    );
  }
}

// Mutual NDA has its own dedicated /nda route with custom UI
const EXCLUDED_SLUGS = new Set(["Mutual-NDA"]);

export function generateStaticParams() {
  return loadCatalog()
    .filter((entry) => !EXCLUDED_SLUGS.has(filenameToSlug(entry.filename)))
    .map((entry) => ({ slug: filenameToSlug(entry.filename) }));
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = loadCatalog();
  const entry = catalog.find((e) => filenameToSlug(e.filename) === slug);

  if (!entry) notFound();

  let templateMarkdown: string;
  try {
    templateMarkdown = readFileSync(
      join(process.cwd(), "..", "templates", entry.filename),
      "utf-8",
    );
  } catch {
    throw new Error(`Failed to load template: ${entry.filename}`);
  }

  const variables = extractTemplateVariables(templateMarkdown);

  return (
    <ProtectedRoute>
      <DocCreator
        templateMarkdown={templateMarkdown}
        variables={variables}
        catalogEntry={entry}
      />
    </ProtectedRoute>
  );
}
