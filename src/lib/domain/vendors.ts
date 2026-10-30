import { BUDGET_CATEGORY_FOR_VENDOR } from "@/lib/data/demo-vendors";
import type {
  BudgetItem,
  EventRecord,
  RankedVendor,
  Vendor,
  VendorCategory,
} from "./types";

export interface RankVendorsInput {
  vendors: Vendor[];
  event: Pick<EventRecord, "city" | "guestCount" | "preferences" | "budgetInr">;
  budgetItems: BudgetItem[];
  category?: VendorCategory | "all";
}

const BUDGET_MATCH_POINTS = 30;
const CITY_MATCH_POINTS = 25;
const PAN_INDIA_POINTS = 12;

export function estimateVendorCost(
  vendor: Vendor,
  input: Pick<RankVendorsInput, "event">,
): number {
  if (vendor.priceUnit === "plate") {
    return Math.round(vendor.basePriceInr * input.event.guestCount);
  }
  return vendor.basePriceInr;
}

export function rankVendors(input: RankVendorsInput): RankedVendor[] {
  const categoryBudget = getCategoryBudget(input.budgetItems);

  return input.vendors
    .filter((vendor) => !input.category || input.category === "all" || vendor.category === input.category)
    .map((vendor) => {
      const estimateInr = estimateVendorCost(vendor, input);
      const reasons: string[] = [];
      const warnings: string[] = ["Demo listing — availability and final price are not verified."];
      let score = 0;

      const servesCity = vendor.cities.some(
        (city) => city.toLowerCase() === input.event.city.toLowerCase(),
      );
      const panIndia = vendor.cities.some((city) =>
        ["pan-india", "all india", "india"].includes(city.toLowerCase()),
      );

      if (servesCity) {
        score += CITY_MATCH_POINTS;
        reasons.push(`Serves ${input.event.city}`);
      } else if (panIndia) {
        score += PAN_INDIA_POINTS;
        reasons.push("Works across India");
      } else {
        warnings.push(`Listed for ${vendor.cities.join(", ")}, not ${input.event.city}.`);
      }

      const budgetKey = BUDGET_CATEGORY_FOR_VENDOR[vendor.category];
      const cap = budgetKey ? categoryBudget.get(budgetKey) : undefined;
      if (cap && cap > 0) {
        if (estimateInr <= cap) {
          score += BUDGET_MATCH_POINTS;
          reasons.push(`Fits the ${budgetKey} budget (${formatInr(estimateInr)} estimate)`);
        } else if (estimateInr <= cap * 1.2) {
          score += BUDGET_MATCH_POINTS / 2;
          warnings.push(`${formatInr(estimateInr - cap)} above the ${budgetKey} budget.`);
        } else {
          warnings.push(`${formatInr(estimateInr)} is well above the ${budgetKey} budget.`);
        }
      } else {
        score += 10;
        reasons.push("No matching category budget set");
      }

      score += Math.min(25, vendor.rating * 5);
      reasons.push(`${vendor.rating.toFixed(1)}★ from ${vendor.reviewCount} demo reviews`);

      const matchedTags = vendor.tags.filter((tag) =>
        input.event.preferences.some(
          (preference) =>
            preference.toLowerCase().includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(preference.toLowerCase()),
        ),
      );
      score += Math.min(15, matchedTags.length * 5);
      if (matchedTags.length > 0) {
        reasons.push(`Matches ${matchedTags.map((tag) => `“${tag}”`).join(", ")}`);
      }

      if (vendor.reviewCount >= 100) score += 5;

      return {
        vendor,
        estimateInr,
        score: Math.round(score * 10) / 10,
        reasons,
        warnings,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.estimateInr - b.estimateInr ||
        a.vendor.name.localeCompare(b.vendor.name),
    );
}

export function getCategoryBudget(items: BudgetItem[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.category, (map.get(item.category) ?? 0) + item.plannedInr);
  }
  return map;
}

export function compareVendors(ranked: RankedVendor[]): {
  lowestEstimate: number | null;
  highestRated: RankedVendor | null;
  bestFit: RankedVendor | null;
} {
  if (ranked.length === 0) {
    return { lowestEstimate: null, highestRated: null, bestFit: null };
  }
  return {
    lowestEstimate: Math.min(...ranked.map((entry) => entry.estimateInr)),
    highestRated: [...ranked].sort((a, b) => b.vendor.rating - a.vendor.rating)[0],
    bestFit: ranked[0],
  };
}

function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
