import { describe, expect, it } from "vitest";
import { DEMO_VENDORS, VENDOR_CATEGORY_LABELS } from "../demo-vendors";

describe("Demo vendor catalog integrity", () => {
  it("has unique vendor ids", () => {
    const ids = DEMO_VENDORS.map((vendor) => vendor.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses only known vendor categories", () => {
    const known = Object.keys(VENDOR_CATEGORY_LABELS);

    for (const vendor of DEMO_VENDORS) {
      expect(known).toContain(vendor.category);
    }
  });

  it("has plausible prices, ratings and city coverage", () => {
    for (const vendor of DEMO_VENDORS) {
      expect(vendor.basePriceInr).toBeGreaterThan(0);
      expect(vendor.rating).toBeGreaterThanOrEqual(0);
      expect(vendor.rating).toBeLessThanOrEqual(5);
      expect(vendor.cities.length).toBeGreaterThan(0);
      expect(vendor.demo).toBe(true);
    }
  });
});
