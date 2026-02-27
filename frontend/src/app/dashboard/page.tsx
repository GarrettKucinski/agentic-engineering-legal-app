import { readFileSync } from "fs";
import { join } from "path";
import DashboardClient from "./DashboardClient";
import ProtectedRoute from "@/components/ProtectedRoute";

interface CatalogEntry {
  name: string;
  description: string;
  filename: string;
}

function loadCatalog(): CatalogEntry[] {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), "..", "catalog.json"), "utf-8")
    );
  } catch {
    throw new Error(
      "Failed to load catalog.json. Ensure the file exists at the project root."
    );
  }
}

export default function DashboardPage() {
  const catalog = loadCatalog();
  return (
    <ProtectedRoute>
      <DashboardClient catalog={catalog} />
    </ProtectedRoute>
  );
}
