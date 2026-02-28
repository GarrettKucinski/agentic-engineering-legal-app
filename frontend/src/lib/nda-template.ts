import { NdaFormData } from "./types";

/**
 * The URL slug for the Mutual NDA Cover Page template.
 * Derived from catalog.json entry filename "Mutual-NDA-coverpage.md".
 * Used by NdaCreator to offer the cover page addendum after NDA completion.
 */
export const ndaCoverPageSlug = "Mutual-NDA-coverpage";

export function formatDate(dateStr: string): string {
  if (!dateStr) return "________";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getMndaTermText(data: NdaFormData): string {
  if (data.mndaTermType === "expires") {
    const unit = data.mndaTermYears === 1 ? "year" : "years";
    return `${data.mndaTermYears} ${unit} from the Effective Date`;
  }
  return "until terminated in accordance with the terms of the MNDA";
}

function getConfidentialityTermText(data: NdaFormData): string {
  if (data.confidentialityTermType === "duration") {
    const unit = data.confidentialityTermYears === 1 ? "year" : "years";
    return `${data.confidentialityTermYears} ${unit} from the Effective Date`;
  }
  return "perpetuity";
}

export function resolveStandardTerms(
  rawMarkdown: string,
  data: NdaFormData,
): string {
  let md = rawMarkdown;

  // Remove the title line
  md = md.replace(/^# Standard Terms\n+/, "");

  // Remove the footer attribution line
  md = md.replace(/\n*Common Paper Mutual Non-Disclosure[^\n]*\n*$/g, "");

  const replacements: Record<string, string> = {
    Purpose: data.purpose,
    "Effective Date": formatDate(data.effectiveDate),
    "MNDA Term": getMndaTermText(data),
    "Term of Confidentiality": getConfidentialityTermText(data),
    "Governing Law": data.governingLaw || "________",
    Jurisdiction: data.jurisdiction || "________",
  };

  for (const [key, value] of Object.entries(replacements)) {
    md = md.replaceAll(
      `<span class="coverpage_link">${key}</span>`,
      `**${value}**`,
    );
  }

  // Remove any remaining HTML tags
  md = md.replace(/<[^>]+>/g, "");

  return md;
}

export function generateCoverPageMarkdown(data: NdaFormData): string {
  const expiresChecked = data.mndaTermType === "expires" ? "x" : " ";
  const untilTerminatedChecked =
    data.mndaTermType === "untilTerminated" ? "x" : " ";
  const mndaYearUnit = data.mndaTermYears === 1 ? "year" : "years";

  const durationChecked =
    data.confidentialityTermType === "duration" ? "x" : " ";
  const perpetuityChecked =
    data.confidentialityTermType === "perpetuity" ? "x" : " ";
  const confYearUnit =
    data.confidentialityTermYears === 1 ? "year" : "years";

  const p1 = {
    name: data.party1Name || "________",
    title: data.party1Title || "________",
    company: data.party1Company || "________",
    address: data.party1Address || "________",
  };

  const p2 = {
    name: data.party2Name || "________",
    title: data.party2Title || "________",
    company: data.party2Company || "________",
    address: data.party2Address || "________",
  };

  return `# Mutual Non-Disclosure Agreement

This Mutual Non-Disclosure Agreement (the "MNDA") consists of: (1) this Cover Page ("**Cover Page**") and (2) the Common Paper Mutual NDA Standard Terms Version 1.0 ("**Standard Terms**"). Any modifications of the Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.

### Purpose

${data.purpose}

### Effective Date

${formatDate(data.effectiveDate)}

### MNDA Term

- [${expiresChecked}] Expires ${data.mndaTermYears} ${mndaYearUnit} from Effective Date.
- [${untilTerminatedChecked}] Continues until terminated in accordance with the terms of the MNDA.

### Term of Confidentiality

- [${durationChecked}] ${data.confidentialityTermYears} ${confYearUnit} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.
- [${perpetuityChecked}] In perpetuity.

### Governing Law & Jurisdiction

Governing Law: ${data.governingLaw || "________"}

Jurisdiction: ${data.jurisdiction || "________"}

### MNDA Modifications

${data.modifications || "None."}

By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.

| | PARTY 1 | PARTY 2 |
|:---|:---:|:---:|
| Signature | | |
| Print Name | ${p1.name} | ${p2.name} |
| Title | ${p1.title} | ${p2.title} |
| Company | ${p1.company} | ${p2.company} |
| Notice Address | ${p1.address} | ${p2.address} |
| Date | | |`;
}

export function generateFullMarkdown(
  rawStandardTerms: string,
  data: NdaFormData,
): string {
  const coverPage = generateCoverPageMarkdown(data);
  const standardTerms = resolveStandardTerms(rawStandardTerms, data);

  return `${coverPage}

---

## Standard Terms

${standardTerms}

---

*Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).*`;
}
