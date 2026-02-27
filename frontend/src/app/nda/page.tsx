import { readFileSync } from "fs";
import { join } from "path";
import NdaCreator from "@/components/NdaCreator";
import ProtectedRoute from "@/components/ProtectedRoute";

function loadTemplate(): string {
  try {
    const templatesDir = join(process.cwd(), "..", "templates");
    return readFileSync(join(templatesDir, "Mutual-NDA.md"), "utf-8");
  } catch {
    throw new Error(
      "Failed to load Mutual-NDA.md template. Ensure the templates/ directory exists at the project root."
    );
  }
}

export default function NdaPage() {
  const standardTerms = loadTemplate();
  return (
    <ProtectedRoute>
      <NdaCreator standardTermsTemplate={standardTerms} />
    </ProtectedRoute>
  );
}
