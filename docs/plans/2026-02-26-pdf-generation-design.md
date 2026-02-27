# PDF Generation Design — Mutual NDA Creator

**Date:** 2026-02-26
**Status:** Approved
**Feature:** Custom PDF download for the Mutual NDA Creator

---

## Problem

The original `html2pdf.js` / `html2canvas` approach broke with Tailwind v4 because `html2canvas` 1.4.1 does not support CSS Color Level 4 functions (`oklch()`, `lab()`). A `window.print()` fallback was in place temporarily but rejected as insufficient UX.

**Requirement:** A custom, delightful PDF download experience — no browser print dialog, polished output, real text (not a screenshot).

---

## Solution: `@react-pdf/renderer`

Client-side PDF generation using `@react-pdf/renderer`. The document is built from react-pdf primitives, not from the HTML DOM. This gives us:

- Real, copy/paste-able text (vector, not rasterized)
- No browser print dialog
- No server required
- Full control over typography, layout, and styling

---

## Architecture

### New files

**`frontend/src/lib/nda-pdf.tsx`**
The react-pdf Document component. Exports:
- `NdaDocument` — top-level `<Document>` wrapping cover page + standard terms pages
- `CoverPage` — structured cover page rendered from `NdaFormData` directly
- `StandardTermsPages` — renders converted markdown tokens as react-pdf elements
- `styles` — `StyleSheet.create()` object shared across components

**`frontend/src/lib/markdown-to-pdf.ts`**
Converts `marked.lexer()` token AST to react-pdf elements. Maps:
- `paragraph` → `<Text>`
- `heading` (depth 1–3) → `<Text style={h1|h2|h3Style}>`
- `list` → `<View>` with `<Text>` bullet/numbered children
- `hr` → `<View>` border (gray divider line)
- `space` → small `<View>` with margin

### Modified files

**`frontend/src/components/NdaCreator.tsx`**
- `downloadPdf` becomes async with loading state
- Dynamically imports `@react-pdf/renderer` (SSR-safe)
- Calls `pdf(<NdaDocument .../>).toBlob()` to generate the PDF
- Triggers download via programmatic `<a download>` click

---

## Visual Design

### Typography
- **Headings:** Helvetica Bold (bundled in react-pdf, no font embedding needed)
- **Body / standard terms:** Times-Roman 10pt (classic legal document feel)
- **Cover page labels:** Helvetica 8pt, color `#555`

### Color palette
- Black `#111` — headings and body text
- Mid-gray `#555` — cover page labels and footer text
- Light gray `#E5E5E5` — dividers and table borders
- White — page background

### Cover page layout
```
┌─────────────────────────────────────────┐
│  MUTUAL NON-DISCLOSURE AGREEMENT        │  ← large Helvetica Bold heading
│  Common Paper Standard Terms v1.0       │  ← small gray subheading
│─────────────────────────────────────────│
│  PURPOSE                                │
│  [value]                                │
│                                         │
│  EFFECTIVE DATE    MNDA TERM            │
│  [date]            ● 1 year / ongoing   │
│                                         │
│  TERM OF CONFIDENTIALITY                │
│  ● 1 year / perpetuity                  │
│                                         │
│  GOVERNING LAW & JURISDICTION           │
│  [law] / [jurisdiction]                 │
│                                         │
│  MODIFICATIONS                          │
│  [text or "None."]                      │
│─────────────────────────────────────────│
│  PARTY 1            PARTY 2             │
│  [name]             [name]              │
│  [title]            [title]             │
│  [company]          [company]           │
│  [address]          [address]           │
│                                         │
│  Signature: ___   Signature: ___        │
│  Date: ___        Date: ___             │
└─────────────────────────────────────────┘
```

### Standard terms pages
- Times-Roman 10pt body, 14pt line height
- Helvetica Bold for H2/H3 section headings
- `---` tokens rendered as a 1pt gray (`#E5E5E5`) horizontal rule
- Numbered lists and bullets preserved from markdown AST

### Footer (every standard terms page)
`Common Paper Mutual NDA v1.0 | Page X of Y` — Helvetica 8pt, color `#555`, centered

---

## UX — Download Button

### Button states
| State | Label | Behavior |
|-------|-------|----------|
| Default | `↓ Download PDF` | Enabled, clickable |
| Loading | `⟳ Generating PDF...` | Disabled, spinner |
| Done | `↓ Download PDF` | Auto-resets after file saves |

### Download flow
1. User clicks button → loading state immediately
2. `@react-pdf/renderer` dynamically imported (lazy, one-time)
3. PDF blob generated client-side
4. Programmatic `<a download="mutual-nda-[party1]-[party2].pdf">` click triggers save
5. Button resets to default — no dialog, no new tab

### Filename
`mutual-nda-[party1Company]-[party2Company].pdf`
Example: `mutual-nda-acme-globex.pdf`
(derived from `data.party1Company` and `data.party2Company`, lowercased, spaces replaced with hyphens)

### Error handling
- On failure: button resets, brief inline error message below button
- No unhandled promise rejections

---

## Cleanup

- Remove `html2pdf.js` from `package.json` (currently installed but broken)
- Remove `@page` and `@media print` CSS from `globals.css` (no longer needed)
- Remove `print:hidden` / `print:max-h-none` classes from `NdaCreator.tsx`
