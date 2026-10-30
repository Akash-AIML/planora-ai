import type { Vendor, VendorCategory } from "@/lib/domain/types";
import rawVendors from "./demo-vendors.json";

/**
 * DEMO DATA ONLY.
 * These are fictional businesses with indicative prices for product
 * demonstration. They are not live listings and no availability has been
 * verified. The UI and exports surface this disclaimer.
 */
export const DEMO_VENDORS: Vendor[] = rawVendors as Vendor[];

export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  venue: "Venues",
  catering: "Catering",
  photography: "Photography",
  decor: "Decor",
  music: "Music",
  beauty: "Beauty",
  planning: "Planning",
  activities: "Activities",
};

export const BUDGET_CATEGORY_FOR_VENDOR: Record<VendorCategory, string | null> = {
  venue: "Venue",
  catering: "Catering",
  photography: "Photography",
  decor: "Decor",
  music: "Entertainment",
  beauty: "Attire",
  planning: null,
  activities: "Activities",
};
