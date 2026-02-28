const SPAN_CLASSES = ["coverpage_link", "keyterms_link", "orderform_link"];

/**
 * Extracts unique variable names from Common Paper template markdown.
 * Handles coverpage_link, keyterms_link, and orderform_link span classes.
 * Normalizes possessives so "Provider's" deduplicates with "Provider".
 */
export function extractTemplateVariables(markdown: string): string[] {
  const pattern = /<span class="(?:coverpage_link|keyterms_link|orderform_link)">([^<]+)<\/span>/g;
  const seen = new Set<string>();
  for (const match of markdown.matchAll(pattern)) {
    const name = match[1].replace(/'s$/, "").replace(/'$/, "").trim();
    if (name) seen.add(name);
  }
  return Array.from(seen).sort();
}

/**
 * Replaces all span-based template variables with their values.
 * Handles all three Common Paper span classes and possessive forms.
 * Strips any remaining HTML tags afterward.
 */
export function resolveTemplate(
  markdown: string,
  fields: Record<string, string>,
): string {
  let md = markdown;
  for (const [key, value] of Object.entries(fields)) {
    if (!value) continue;
    for (const cls of SPAN_CLASSES) {
      md = md.replaceAll(`<span class="${cls}">${key}</span>`, `**${value}**`);
      md = md.replaceAll(`<span class="${cls}">${key}'s</span>`, `**${value}'s**`);
      md = md.replaceAll(`<span class="${cls}">${key}'</span>`, `**${value}'**`);
    }
  }
  // Strip remaining HTML tags (unreplaced variables, header spans, etc.)
  md = md.replace(/<[^>]+>/g, "");
  return md;
}

/**
 * Converts a template filename to a URL slug.
 * "BAA.md" → "BAA", "design-partner-agreement.md" → "design-partner-agreement"
 */
export function filenameToSlug(filename: string): string {
  return filename.replace(/\.md$/i, "");
}
