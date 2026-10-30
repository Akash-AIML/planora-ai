import { describe, expect, it } from "vitest";
import { allocateBudget, calculateBudgetTotals, sanitizeRupees } from "../budget";
import { addDays, daysUntil, formatDateOnly, generateTimeline, parseDateOnly } from "../timeline";
import { parseEventBrief } from "../extraction";
import { rankVendors, compareVendors } from "../vendors";
import { proposeReplan } from "../replan";
import { DEMO_VENDORS } from "@/lib/data/demo-vendors";
import type { BudgetItem, EventRequirements } from "../types";

describe("Domain Logic Unit Tests", () => {
  describe("Budget Engine", () => {
    it("allocates budget exactly matching total without penny rounding errors", () => {
      const total = 500_000;
      const lines = allocateBudget(total, "wedding");
      const sum = lines.reduce((acc, curr) => acc + curr.plannedInr, 0);
      expect(sum).toBe(total);
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.some((l) => l.category === "Venue")).toBe(true);
      expect(lines.some((l) => l.category === "Catering")).toBe(true);
    });

    it("calculates budget totals correctly with remaining and overBudget flags", () => {
      const items: BudgetItem[] = [
        { id: "1", eventId: "e1", category: "Venue", label: "Venue", plannedInr: 100_000, actualInr: 90_000, notes: "", sortOrder: 0 },
        { id: "2", eventId: "e1", category: "Catering", label: "Food", plannedInr: 150_000, actualInr: 160_000, notes: "", sortOrder: 1 },
      ];
      const totalsUnder = calculateBudgetTotals(items, 300_000);
      expect(totalsUnder.plannedInr).toBe(250_000);
      expect(totalsUnder.actualInr).toBe(250_000);
      expect(totalsUnder.remainingInr).toBe(50_000);
      expect(totalsUnder.overBudget).toBe(false);

      const totalsOver = calculateBudgetTotals(items, 200_000);
      expect(totalsOver.overBudget).toBe(true);
      expect(totalsOver.remainingInr).toBe(-50_000);
    });

    it("sanitizes rupee inputs safely", () => {
      expect(sanitizeRupees("₹1,50,000")).toBe(150_000);
      expect(sanitizeRupees("-5000")).toBe(0);
      expect(sanitizeRupees("invalid")).toBe(0);
    });
  });

  describe("Timeline & Date Calculations", () => {
    it("formats and parses date-only UTC strings consistently", () => {
      const dateStr = "2026-11-15";
      const parsed = parseDateOnly(dateStr);
      expect(formatDateOnly(parsed)).toBe(dateStr);
    });

    it("strictly rejects rollover dates like February 31 and safely formats invalid dates", () => {
      // 2026-02-31 is invalid and must not roll over to March
      const invalidFeb = parseDateOnly("2026-02-31");
      expect(Number.isNaN(invalidFeb.getTime())).toBe(true);
      expect(formatDateOnly(invalidFeb)).toBe("");

      // Valid leap year check or valid month
      const validDate = parseDateOnly("2026-02-28");
      expect(Number.isNaN(validDate.getTime())).toBe(false);
      expect(formatDateOnly(validDate)).toBe("2026-02-28");

      // Non-string or malformed inputs
      expect(Number.isNaN(parseDateOnly("" as unknown as string).getTime())).toBe(true);
      expect(Number.isNaN(parseDateOnly("not-a-date").getTime())).toBe(true);
    });

    it("calculates relative days and daysUntil correctly", () => {
      const base = "2026-11-01";
      expect(addDays(base, 10)).toBe("2026-11-11");
      expect(addDays(base, -5)).toBe("2026-10-27");
      const diff = daysUntil("2026-11-10", new Date("2026-11-01T00:00:00Z"));
      expect(diff).toBe(9);
    });

    it("generates structured timeline milestones for wedding", () => {
      const tasks = generateTimeline({ eventType: "wedding", eventDate: "2026-12-01" });
      expect(tasks.length).toBeGreaterThan(5);
      expect(tasks[0].dueDate <= "2026-12-01").toBe(true);
      expect(tasks.some((t) => t.category === "Venue")).toBe(true);
    });
  });

  describe("Requirement Extraction (Heuristic)", () => {
    it("extracts Indian city, event type, guests, and INR budget in lakhs", () => {
      const brief = "Planning a luxury wedding in Jaipur for 200 guests with budget of 15 lakhs in December 2026";
      const result = parseEventBrief(brief, new Date("2026-01-01"));
      expect(result.requirements.eventType).toBe("wedding");
      expect(result.requirements.city).toBe("Jaipur");
      expect(result.requirements.guestCount).toBe(200);
      expect(result.requirements.budgetInr).toBe(1_500_000);
      expect(result.requirements.preferences).toContain("luxury");
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it("extracts birthday with thousand/k budget", () => {
      const brief = "Need a 10th birthday party in Bangalore for 40 kids with 75k budget outdoor vegetarian";
      const result = parseEventBrief(brief, new Date("2026-01-01"));
      expect(result.requirements.eventType).toBe("birthday");
      expect(result.requirements.city).toBe("Bengaluru");
      expect(result.requirements.guestCount).toBe(40);
      expect(result.requirements.budgetInr).toBe(75_000);
      expect(result.requirements.preferences).toContain("outdoor");
      expect(result.requirements.preferences).toContain("vegetarian");
    });
  });

  describe("Vendor Ranking", () => {
    it("ranks vendors by city match, budget suitability, and rating", () => {
      const event: EventRequirements = {
        title: "Jaipur Wedding",
        eventType: "wedding",
        city: "Jaipur",
        eventDate: "2026-12-01",
        guestCount: 150,
        budgetInr: 1_000_000,
        preferences: ["heritage", "traditional"],
        notes: "",
      };
      const budgetItems: BudgetItem[] = [
        { id: "v1", eventId: "e1", category: "Venue", label: "Venue", plannedInr: 250_000, actualInr: null, notes: "", sortOrder: 0 },
      ];
      const ranked = rankVendors({
        vendors: DEMO_VENDORS,
        event,
        budgetItems,
        category: "venue",
      });
      expect(ranked.length).toBeGreaterThan(0);
      expect(ranked[0].vendor.cities).toContain("Jaipur");
      expect(ranked[0].score).toBeGreaterThan(40);

      const comparison = compareVendors(ranked);
      expect(comparison.bestFit).toBeDefined();
      expect(comparison.lowestEstimate).toBeGreaterThan(0);
    });
  });

  describe("Deterministic Replan Engine", () => {
    it("proposes proportional cuts respecting category floor ratios", () => {
      const items: BudgetItem[] = [
        { id: "1", eventId: "e1", category: "Venue", label: "Venue", plannedInr: 240_000, actualInr: null, notes: "", sortOrder: 0 },
        { id: "2", eventId: "e1", category: "Catering", label: "Food", plannedInr: 300_000, actualInr: null, notes: "", sortOrder: 1 },
        { id: "3", eventId: "e1", category: "Decor", label: "Decor", plannedInr: 120_000, actualInr: null, notes: "", sortOrder: 2 },
        { id: "4", eventId: "e1", category: "Photography", label: "Photo", plannedInr: 100_000, actualInr: null, notes: "", sortOrder: 3 },
      ];
      const currentTotal = 240_000 + 300_000 + 120_000 + 100_000; // 760,000
      const targetBudget = 600_000;

      const proposal = proposeReplan({
        eventId: "e1",
        eventVersion: 1,
        eventType: "wedding",
        items,
        targetBudgetInr: targetBudget,
      });

      expect(proposal.targetBudgetInr).toBe(targetBudget);
      expect(proposal.currentTotalInr).toBe(currentTotal);
      expect(proposal.proposedTotalInr).toBeLessThanOrEqual(targetBudget);
      expect(proposal.changes.length).toBeGreaterThan(0);
      expect(proposal.feasible).toBe(true);
      expect(proposal.notes.length).toBeGreaterThan(0);
    });

    it("flags infeasible replan when target is lower than protected floor capacity", () => {
      const items: BudgetItem[] = [
        { id: "1", eventId: "e1", category: "Venue", label: "Venue", plannedInr: 100_000, actualInr: null, notes: "", sortOrder: 0 },
        { id: "2", eventId: "e1", category: "Catering", label: "Food", plannedInr: 100_000, actualInr: null, notes: "", sortOrder: 1 },
      ];
      // Target is tiny (10,000 INR), below protected floors (which are ~50% and 40%)
      const proposal = proposeReplan({
        eventId: "e1",
        eventVersion: 1,
        eventType: "wedding",
        items,
        targetBudgetInr: 10_000,
      });

      expect(proposal.feasible).toBe(false);
      expect(proposal.proposedTotalInr).toBeGreaterThan(10_000);
      expect(proposal.notes[0]).toContain("above target");
    });
  });

  describe("Community Event Domain Logic", () => {
    it("extracts and budgets community events with relevant categories", () => {
      const brief = "Annual Durga Puja community mela in Kolkata for 500 members with 3 lakhs budget";
      const parsed = parseEventBrief(brief, new Date("2026-01-01"));
      expect(parsed.requirements.eventType).toBe("community");
      expect(parsed.requirements.city).toBe("Kolkata");
      expect(parsed.requirements.guestCount).toBe(500);
      expect(parsed.requirements.budgetInr).toBe(300_000);

      const budgetLines = allocateBudget(parsed.requirements.budgetInr, "community");
      expect(budgetLines.some((b) => b.category === "Production")).toBe(true);
      expect(budgetLines.some((b) => b.category === "Safety")).toBe(true);
      expect(budgetLines.reduce((s, b) => s + b.plannedInr, 0)).toBe(300_000);
    });
  });

  describe("Storage and Export Verification", () => {
    it("creates full event detail and builds a verified Planora export payload", async () => {
      const { createNewEventDetail, buildPlanoraExport } = await import("../storage");
      const detail = createNewEventDetail({
        title: "50th Anniversary Gala",
        eventType: "anniversary",
        city: "Mumbai",
        eventDate: "2026-10-15",
        guestCount: 80,
        budgetInr: 600_000,
        preferences: ["fine-dining", "jazz", "elegant"],
      });

      expect(detail.event.title).toBe("50th Anniversary Gala");
      expect(detail.budgetItems.length).toBeGreaterThan(0);
      expect(detail.tasks.length).toBeGreaterThan(0);
      expect(detail.ideas.length).toBeGreaterThan(0);
      expect(detail.totals.plannedInr).toBe(600_000);

      const exported = buildPlanoraExport(detail);
      expect(exported.app).toBe("Planora AI");
      expect(exported.disclaimer).toContain("illustrative demo figures");
      expect(exported.event.city).toBe("Mumbai");
      expect(exported.budget.totals.plannedInr).toBe(600_000);
    });
  });
});
