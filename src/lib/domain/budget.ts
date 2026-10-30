import type {
  BudgetItem,
  BudgetTotals,
  EventType,
} from "./types";

interface BudgetTemplateLine {
  category: string;
  label: string;
  share: number;
  floorRatio: number;
}

/**
 * Category shares are deliberately simple and deterministic. The LLM never
 * decides how rupees are allocated: it may only describe preferences.
 */
export const BUDGET_TEMPLATES: Record<EventType, BudgetTemplateLine[]> = {
  wedding: [
    { category: "Venue", label: "Venue & rentals", share: 0.24, floorRatio: 0.72 },
    { category: "Catering", label: "Food & beverages", share: 0.3, floorRatio: 0.75 },
    { category: "Decor", label: "Decor & flowers", share: 0.12, floorRatio: 0.45 },
    { category: "Photography", label: "Photo & video", share: 0.1, floorRatio: 0.5 },
    { category: "Attire", label: "Attire & beauty", share: 0.08, floorRatio: 0.25 },
    { category: "Entertainment", label: "Music & entertainment", share: 0.07, floorRatio: 0.2 },
    { category: "Invitations", label: "Invitations & gifting", share: 0.04, floorRatio: 0.1 },
    { category: "Contingency", label: "Contingency buffer", share: 0.05, floorRatio: 0 },
  ],
  birthday: [
    { category: "Venue", label: "Venue & rentals", share: 0.2, floorRatio: 0.65 },
    { category: "Catering", label: "Food, cake & drinks", share: 0.27, floorRatio: 0.7 },
    { category: "Decor", label: "Theme decor", share: 0.16, floorRatio: 0.35 },
    { category: "Entertainment", label: "Games & entertainment", share: 0.12, floorRatio: 0.2 },
    { category: "Photography", label: "Photos & keepsakes", share: 0.08, floorRatio: 0.25 },
    { category: "Gifting", label: "Return gifts", share: 0.07, floorRatio: 0.1 },
    { category: "Contingency", label: "Contingency buffer", share: 0.1, floorRatio: 0 },
  ],
  anniversary: [
    { category: "Venue", label: "Venue & rentals", share: 0.22, floorRatio: 0.7 },
    { category: "Catering", label: "Food & beverages", share: 0.28, floorRatio: 0.72 },
    { category: "Decor", label: "Decor & flowers", share: 0.13, floorRatio: 0.4 },
    { category: "Photography", label: "Photo & video", share: 0.11, floorRatio: 0.5 },
    { category: "Entertainment", label: "Music & entertainment", share: 0.1, floorRatio: 0.2 },
    { category: "Gifting", label: "Gifts & favours", share: 0.06, floorRatio: 0.1 },
    { category: "Contingency", label: "Contingency buffer", share: 0.1, floorRatio: 0 },
  ],
  corporate: [
    { category: "Venue", label: "Venue & facilities", share: 0.25, floorRatio: 0.75 },
    { category: "Catering", label: "Catering", share: 0.22, floorRatio: 0.75 },
    { category: "Production", label: "AV & production", share: 0.18, floorRatio: 0.55 },
    { category: "Speaker", label: "Speaker & host", share: 0.1, floorRatio: 0.2 },
    { category: "Branding", label: "Branding & print", share: 0.09, floorRatio: 0.3 },
    { category: "Photography", label: "Photo & video", share: 0.06, floorRatio: 0.4 },
    { category: "Contingency", label: "Contingency buffer", share: 0.1, floorRatio: 0 },
  ],
  community: [
    { category: "Venue", label: "Venue & permissions", share: 0.16, floorRatio: 0.7 },
    { category: "Catering", label: "Food & water", share: 0.25, floorRatio: 0.75 },
    { category: "Production", label: "Stage, sound & power", share: 0.15, floorRatio: 0.55 },
    { category: "Activities", label: "Activities & workshops", share: 0.12, floorRatio: 0.25 },
    { category: "Marketing", label: "Outreach & printing", share: 0.1, floorRatio: 0.3 },
    { category: "Safety", label: "Volunteers, safety & first aid", share: 0.1, floorRatio: 0.6 },
    { category: "Contingency", label: "Contingency buffer", share: 0.12, floorRatio: 0 },
  ],
};

/**
 * Split an integer total across shares using the largest-remainder method.
 * The returned amounts always sum to `totalInr` exactly.
 */
export function allocateBudget(
  totalInr: number,
  eventType: EventType,
): Array<{ category: string; label: string; plannedInr: number; floorRatio: number }> {
  if (!Number.isFinite(totalInr) || totalInr < 0) {
    throw new Error("Budget must be a non-negative number.");
  }
  const total = Math.round(totalInr);
  const lines = BUDGET_TEMPLATES[eventType];
  const shareSum = lines.reduce((sum, line) => sum + line.share, 0);

  const raw = lines.map((line) => (total * line.share) / shareSum);
  const base = raw.map((value) => Math.floor(value));
  let remainder = total - base.reduce((sum, value) => sum + value, 0);

  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (let i = 0; i < order.length && remainder > 0; i += 1) {
    base[order[i].index] += 1;
    remainder -= 1;
  }

  return lines.map((line, index) => ({
    category: line.category,
    label: line.label,
    plannedInr: base[index],
    floorRatio: line.floorRatio,
  }));
}

export function calculateBudgetTotals(
  items: BudgetItem[],
  budgetInr: number,
): BudgetTotals {
  const plannedInr = items.reduce((sum, item) => sum + safeAmount(item.plannedInr), 0);
  const actualInr = items.reduce(
    (sum, item) => sum + (item.actualInr === null ? 0 : safeAmount(item.actualInr)),
    0,
  );

  const categoryMap = new Map<string, number>();
  for (const item of items) {
    categoryMap.set(
      item.category,
      (categoryMap.get(item.category) ?? 0) + safeAmount(item.plannedInr),
    );
  }

  return {
    plannedInr,
    actualInr,
    remainingInr: safeAmount(budgetInr) - plannedInr,
    overBudget: plannedInr > safeAmount(budgetInr),
    byCategory: [...categoryMap.entries()]
      .map(([category, planned]) => ({
        category,
        plannedInr: planned,
        share: plannedInr === 0 ? 0 : planned / plannedInr,
      }))
      .sort((a, b) => b.plannedInr - a.plannedInr),
  };
}

/** Clamp edits so a single line cannot silently become negative or NaN. */
export function sanitizeRupees(value: unknown, max = 1_000_000_000): number {
  const numeric = typeof value === "string" ? Number(value.replace(/[^\d.-]/g, "")) : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(max, Math.max(0, Math.round(numeric)));
}

/**
 * Safely parses string inputs with commas, symbols, or currency prefixes into non-negative integers.
 */
export function parseRupeeInputValue(value: string): number {
  if (!value || typeof value !== "string") return 0;
  const digits = value.replace(/[^0-9]/g, "");
  return digits ? Math.max(0, parseInt(digits, 10)) : 0;
}

function safeAmount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}
