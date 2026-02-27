import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import { NdaFormData } from "./types";
import { markdownToPdfElements } from "./markdown-to-pdf";

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
  coverTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    marginBottom: 4,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  coverSubtitle: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#555555",
    marginBottom: 20,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    marginVertical: 16,
  },
  label: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#555555",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  value: {
    fontSize: 10,
    fontFamily: "Times-Roman",
    color: "#111111",
    marginBottom: 12,
  },
  twoCol: {
    flexDirection: "row" as const,
    gap: 24,
    marginBottom: 12,
  },
  col: {
    flex: 1,
  },
  checkRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    marginBottom: 4,
  },
  checkBox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: "#333333",
    borderStyle: "solid" as const,
    marginRight: 6,
    marginTop: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  checkMark: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
  },
  checkLabel: {
    fontSize: 9,
    fontFamily: "Times-Roman",
    color: "#111111",
    flex: 1,
    lineHeight: 1.4,
  },
  sigTable: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  sigHeaderRow: {
    flexDirection: "row" as const,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  sigRow: {
    flexDirection: "row" as const,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  sigRowLast: {
    flexDirection: "row" as const,
  },
  sigLabelCell: {
    width: 90,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: "#E5E5E5",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#555555",
    textTransform: "uppercase" as const,
  },
  sigHeaderCell: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: "#E5E5E5",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
  },
  sigHeaderCellLast: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
  },
  sigCell: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: "#E5E5E5",
    fontSize: 9,
    fontFamily: "Times-Roman",
    color: "#111111",
    minHeight: 24,
  },
  sigCellLast: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    fontFamily: "Times-Roman",
    color: "#111111",
    minHeight: 24,
  },
  footer: {
    position: "absolute" as const,
    bottom: 36,
    left: 72,
    right: 72,
    textAlign: "center" as const,
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#555555",
  },
  introParagraph: {
    fontSize: 9,
    fontFamily: "Times-Roman",
    color: "#555555",
    lineHeight: 1.5,
    marginBottom: 16,
    fontStyle: "italic" as const,
  },
});

function formatDate(dateStr: string): string {
  if (!dateStr) return "________";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function CheckBox({ checked, label }: { checked: boolean; label: string }) {
  return (
    <View style={styles.checkRow}>
      <View style={styles.checkBox}>
        {checked && <Text style={styles.checkMark}>✓</Text>}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </View>
  );
}

function CoverPage({ data }: { data: NdaFormData }) {
  const mndaYearUnit = data.mndaTermYears === 1 ? "year" : "years";
  const confYearUnit = data.confidentialityTermYears === 1 ? "year" : "years";

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

  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.coverTitle}>Mutual Non-Disclosure Agreement</Text>
      <Text style={styles.coverSubtitle}>
        Common Paper Mutual NDA Standard Terms Version 1.0
      </Text>

      <Text style={styles.introParagraph}>
        This Mutual Non-Disclosure Agreement (the "MNDA") consists of: (1) this
        Cover Page and (2) the Common Paper Mutual NDA Standard Terms Version
        1.0. Any modifications of the Standard Terms should be made on the Cover
        Page, which will control over conflicts with the Standard Terms.
      </Text>

      <View style={styles.divider} />

      <Text style={styles.label}>Purpose</Text>
      <Text style={styles.value}>{data.purpose || "________"}</Text>

      <View style={styles.twoCol}>
        <View style={styles.col}>
          <Text style={styles.label}>Effective Date</Text>
          <Text style={styles.value}>{formatDate(data.effectiveDate)}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>MNDA Term</Text>
          <CheckBox
            checked={data.mndaTermType === "expires"}
            label={`Expires ${data.mndaTermYears} ${mndaYearUnit} from Effective Date.`}
          />
          <CheckBox
            checked={data.mndaTermType === "untilTerminated"}
            label="Continues until terminated in accordance with the terms of the MNDA."
          />
        </View>
      </View>

      <Text style={styles.label}>Term of Confidentiality</Text>
      <CheckBox
        checked={data.confidentialityTermType === "duration"}
        label={`${data.confidentialityTermYears} ${confYearUnit} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`}
      />
      <CheckBox
        checked={data.confidentialityTermType === "perpetuity"}
        label="In perpetuity."
      />

      <View style={{ marginBottom: 12 }} />

      <View style={styles.twoCol}>
        <View style={styles.col}>
          <Text style={styles.label}>Governing Law</Text>
          <Text style={styles.value}>{data.governingLaw || "________"}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Jurisdiction</Text>
          <Text style={styles.value}>{data.jurisdiction || "________"}</Text>
        </View>
      </View>

      <Text style={styles.label}>MNDA Modifications</Text>
      <Text style={styles.value}>{data.modifications || "None."}</Text>

      <View style={styles.divider} />

      <Text style={[styles.label, { marginBottom: 8 }]}>
        By signing this Cover Page, each party agrees to enter into this MNDA as
        of the Effective Date.
      </Text>

      <View style={styles.sigTable}>
        <View style={styles.sigHeaderRow}>
          <Text style={[styles.sigLabelCell, { backgroundColor: "#F9FAFB" }]} />
          <Text style={styles.sigHeaderCell}>Party 1</Text>
          <Text style={styles.sigHeaderCellLast}>Party 2</Text>
        </View>
        <View style={styles.sigRow}>
          <Text style={styles.sigLabelCell}>Signature</Text>
          <Text style={styles.sigCell} />
          <Text style={styles.sigCellLast} />
        </View>
        <View style={styles.sigRow}>
          <Text style={styles.sigLabelCell}>Print Name</Text>
          <Text style={styles.sigCell}>{p1.name}</Text>
          <Text style={styles.sigCellLast}>{p2.name}</Text>
        </View>
        <View style={styles.sigRow}>
          <Text style={styles.sigLabelCell}>Title</Text>
          <Text style={styles.sigCell}>{p1.title}</Text>
          <Text style={styles.sigCellLast}>{p2.title}</Text>
        </View>
        <View style={styles.sigRow}>
          <Text style={styles.sigLabelCell}>Company</Text>
          <Text style={styles.sigCell}>{p1.company}</Text>
          <Text style={styles.sigCellLast}>{p2.company}</Text>
        </View>
        <View style={styles.sigRow}>
          <Text style={styles.sigLabelCell}>Notice Address</Text>
          <Text style={styles.sigCell}>{p1.address}</Text>
          <Text style={styles.sigCellLast}>{p2.address}</Text>
        </View>
        <View style={styles.sigRowLast}>
          <Text style={styles.sigLabelCell}>Date</Text>
          <Text style={styles.sigCell} />
          <Text style={styles.sigCellLast} />
        </View>
      </View>
    </Page>
  );
}

function StandardTermsPages({ resolvedTerms }: { resolvedTerms: string }) {
  const elements = markdownToPdfElements(resolvedTerms);

  return (
    <Page size="LETTER" style={styles.page}>
      {elements}
      <Text
        style={styles.footer}
        fixed
        render={({ pageNumber, totalPages }) =>
          `Common Paper Mutual NDA v1.0  |  Page ${pageNumber} of ${totalPages}`
        }
      />
    </Page>
  );
}

export function NdaDocument({
  data,
  resolvedTerms,
}: {
  data: NdaFormData;
  resolvedTerms: string;
}) {
  return (
    <Document
      title="Mutual Non-Disclosure Agreement"
      author="Common Paper"
      subject="Mutual NDA"
    >
      <CoverPage data={data} />
      <StandardTermsPages resolvedTerms={resolvedTerms} />
    </Document>
  );
}
