import { BUDGET_TEMPLATES } from "./budget";
import type {
  BudgetChange,
  BudgetItem,
  EventType,
  ReplanProposal,
} from "./types";

export interface ReplanInput {
  eventId: string;
  eventVersion: number;
  eventType: EventType;
  items: BudgetItem[];
  targetBudgetInr: number;
  now?: Date;
}

/**
 * Deterministic, approval-gated replanning.
 * Every line has a protected floor; the remaining flexible room is reduced
 * in proportion to its capacity. The model never performs this arithmetic.
 */
export function proposeReplan(input: ReplanInput): ReplanProposal {
  const target = Math.max(0, Math.round(input.targetBudgetInr));
  const currentTotalInr = input.items.reduce((sum, item) => sum + Math.max(0, item.plannedInr), 0);
  const floors = floorRatiosFor(input.eventType);
  const notes: string[] = [];

  if (target >= currentTotalInr) {
    return {
      eventId: input.eventId,
      eventVersion: input.eventVersion,
      targetBudgetInr: target,
      currentTotalInr,
      proposedTotalInr: currentTotalInr,
      feasible: true,
      changes: [],
      notes: [
        "Your target is at or above current planned spend, so no cuts are needed.",
        "You can still edit individual lines manually.",
      ],
      createdAt: (input.now ?? new Date()).toISOString(),
    };
  }

  const deficit = currentTotalInr - target;
  const capacity = input.items.map((item) => {
    const ratio = floors.get(item.category) ?? 0.35;
    const floor = Math.round(Math.max(0, item.plannedInr) * ratio);
    return Math.max(0, Math.max(0, item.plannedInr) - floor);
  });
  const totalCapacity = capacity.reduce((sum, value) => sum + value, 0);
  const cutNeeded = Math.min(deficit, totalCapacity);

  const cuts = totalCapacity === 0 ? capacity.map(() => 0) : distribute(capacity, cutNeeded, totalCapacity);
  const changes: BudgetChange[] = [];

  input.items.forEach((item, index) => {
    const from = Math.max(0, item.plannedInr);
    const to = from - cuts[index];
    if (to !== from) {
      changes.push({
        itemId: item.id,
        label: item.label,
        category: item.category,
        fromInr: from,
        toInr: to,
      });
    }
  });

  const totalCut = changes.reduce((sum, change) => sum + (change.fromInr - change.toInr), 0);
  const proposedTotalInr = currentTotalInr - totalCut;
  const feasible = proposedTotalInr <= target;

  if (!feasible) {
    notes.push(
      `Even after reducing flexible lines to their protected floors, the plan totals ${formatInr(proposedTotalInr)} — ${formatInr(proposedTotalInr - target)} above target.`,
    );
    notes.push("Reduce the scope (guest count, category or add-ons) before applying this proposal.");
  } else {
    notes.push("Cuts are proportional to the flexible room above each line's protected floor.");
    notes.push("Nothing is saved until you review and approve this proposal.");
  }

  return {
    eventId: input.eventId,
    eventVersion: input.eventVersion,
    targetBudgetInr: target,
    currentTotalInr,
    proposedTotalInr,
    feasible,
    changes,
    notes,
    createdAt: (input.now ?? new Date()).toISOString(),
  };
}

export function floorRatiosFor(eventType: EventType): Map<string, number> {
  return new Map(
    BUDGET_TEMPLATES[eventType].map((line) => [line.category, line.floorRatio]),
  );
}

/**
 * Integer largest-remainder split of `amount` across weights.
 */
export function distribute(weights: number[], amount: number, weightTotal: number): number[] {
  if (amount <= 0 || weightTotal <= 0) return weights.map(() => 0);
  const raw = weights.map((weight) => (amount * weight) / weightTotal);
  const result = raw.map((value) => Math.floor(value));
  let remainder = Math.round(amount) - result.reduce((sum, value) => sum + value, 0);

  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (let i = 0; i < order.length && remainder > 0; i += 1) {
    const index = order[i].index;
    if (result[index] < weights[index]) {
      result[index] += 1;
      remainder -= 1;
    }
  }

  // Guard against floating point leftovers without infinite loop risk
  let cursor = 0;
  let stagnantPasses = 0;
  while (remainder > 0 && weights.length > 0 && stagnantPasses < weights.length) {
    const index = cursor % weights.length;
    if (result[index] < weights[index]) {
      result[index] += 1;
      remainder -= 1;
      stagnantPasses = 0;
    } else {
      stagnantPasses += 1;
    }
    cursor += 1;
  }

  return result;
}

function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
