/**
 * Unit tests for pure utility functions in api.ts.
 * Only mapFieldsToFormData is a pure function testable without network/auth mocks.
 */
import { describe, it, expect } from "vitest";
import { mapFieldsToFormData } from "@/lib/api";

describe("mapFieldsToFormData", () => {
  it("returns empty object when given an empty record", () => {
    expect(mapFieldsToFormData({})).toEqual({});
  });

  it("maps purpose directly", () => {
    expect(mapFieldsToFormData({ purpose: "Evaluate partnership" })).toEqual({
      purpose: "Evaluate partnership",
    });
  });

  it("maps effective_date → effectiveDate", () => {
    expect(mapFieldsToFormData({ effective_date: "2024-01-01" })).toEqual({
      effectiveDate: "2024-01-01",
    });
  });

  it("maps mnda_term_type → mndaTermType", () => {
    expect(mapFieldsToFormData({ mnda_term_type: "expires" })).toEqual({
      mndaTermType: "expires",
    });
  });

  it("maps mnda_term_years → mndaTermYears as number", () => {
    expect(mapFieldsToFormData({ mnda_term_years: 2 })).toEqual({
      mndaTermYears: 2,
    });
  });

  it("maps confidentiality_term_type → confidentialityTermType", () => {
    expect(
      mapFieldsToFormData({ confidentiality_term_type: "perpetuity" })
    ).toEqual({ confidentialityTermType: "perpetuity" });
  });

  it("maps confidentiality_term_years → confidentialityTermYears", () => {
    expect(mapFieldsToFormData({ confidentiality_term_years: 5 })).toEqual({
      confidentialityTermYears: 5,
    });
  });

  it("maps governing_law → governingLaw", () => {
    expect(mapFieldsToFormData({ governing_law: "Delaware" })).toEqual({
      governingLaw: "Delaware",
    });
  });

  it("maps jurisdiction → jurisdiction", () => {
    expect(mapFieldsToFormData({ jurisdiction: "New York" })).toEqual({
      jurisdiction: "New York",
    });
  });

  it("maps modifications → modifications", () => {
    expect(mapFieldsToFormData({ modifications: "mutual written consent" })).toEqual({
      modifications: "mutual written consent",
    });
  });

  it("maps party1_name → party1Name", () => {
    expect(mapFieldsToFormData({ party1_name: "Alice" })).toEqual({
      party1Name: "Alice",
    });
  });

  it("maps party1_title → party1Title", () => {
    expect(mapFieldsToFormData({ party1_title: "CEO" })).toEqual({
      party1Title: "CEO",
    });
  });

  it("maps party1_company → party1Company", () => {
    expect(mapFieldsToFormData({ party1_company: "Acme Corp" })).toEqual({
      party1Company: "Acme Corp",
    });
  });

  it("maps party1_address → party1Address", () => {
    expect(mapFieldsToFormData({ party1_address: "123 Main St" })).toEqual({
      party1Address: "123 Main St",
    });
  });

  it("maps party2_name → party2Name", () => {
    expect(mapFieldsToFormData({ party2_name: "Bob" })).toEqual({
      party2Name: "Bob",
    });
  });

  it("maps party2_title → party2Title", () => {
    expect(mapFieldsToFormData({ party2_title: "CTO" })).toEqual({
      party2Title: "CTO",
    });
  });

  it("maps party2_company → party2Company", () => {
    expect(mapFieldsToFormData({ party2_company: "Beta LLC" })).toEqual({
      party2Company: "Beta LLC",
    });
  });

  it("maps party2_address → party2Address", () => {
    expect(mapFieldsToFormData({ party2_address: "456 Oak Ave" })).toEqual({
      party2Address: "456 Oak Ave",
    });
  });

  it("maps multiple fields in one call", () => {
    const result = mapFieldsToFormData({
      party1_name: "Alice",
      party2_name: "Bob",
      governing_law: "California",
    });
    expect(result).toEqual({
      party1Name: "Alice",
      party2Name: "Bob",
      governingLaw: "California",
    });
  });

  it("omits fields where the value is null", () => {
    const result = mapFieldsToFormData({ party1_name: null, governing_law: "Texas" });
    expect(result).toEqual({ governingLaw: "Texas" });
    expect("party1Name" in result).toBe(false);
  });

  it("omits fields where the value is undefined", () => {
    const result = mapFieldsToFormData({ party1_name: undefined, governing_law: "Texas" });
    expect(result).toEqual({ governingLaw: "Texas" });
  });

  it("ignores unknown keys without throwing", () => {
    const result = mapFieldsToFormData({ unknown_field: "value", party1_name: "Alice" });
    expect(result).toEqual({ party1Name: "Alice" });
  });
});
