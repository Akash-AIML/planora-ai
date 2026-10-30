import { describe, expect, it } from "vitest";
import { buildPlanoraExport, generateEventMarkdown } from "../export";
import { createNewEventDetail } from "../storage";
import { DEMO_VENDORS } from "@/lib/data/demo-vendors";
import type { EventDetail } from "../types";

function makeDetail(): EventDetail {
  return createNewEventDetail({
    title: "Test Gala",
    eventType: "wedding",
    city: "Jaipur",
    eventDate: "2026-11-28",
    guestCount: 150,
    budgetInr: 1_500_000,
    preferences: ["outdoor"],
  });
}

describe("buildPlanoraExport", () => {
  it("exports the event structure with an empty vendor list when nothing is shortlisted", () => {
    const detail = makeDetail();

    const exported = buildPlanoraExport(detail);

    expect(exported.app).toBe("Planora AI");
    expect(exported.event.id).toBe(detail.event.id);
    expect(exported.budget.items).toHaveLength(detail.budgetItems.length);
    expect(exported.tasks).toHaveLength(detail.tasks.length);
    expect(exported.vendors).toEqual([]);
    expect(Number.isNaN(Date.parse(exported.exportedAt))).toBe(false);
  });

  it("includes shortlisted vendors and drops entries whose vendor is unknown", () => {
    const detail = makeDetail();
    const knownVendor = DEMO_VENDORS[0];
    detail.shortlist.push(
      {
        eventId: detail.event.id,
        vendorId: knownVendor.id,
        status: "shortlisted",
        quotedInr: null,
        notes: "",
      },
      {
        eventId: detail.event.id,
        vendorId: "vendor-that-does-not-exist",
        status: "contacted",
        quotedInr: null,
        notes: "",
      }
    );

    const exported = buildPlanoraExport(detail);

    expect(exported.vendors).toHaveLength(1);
    expect(exported.vendors[0].vendor.id).toBe(knownVendor.id);
    expect(exported.vendors[0].entry.vendorId).toBe(knownVendor.id);
  });
});

describe("generateEventMarkdown", () => {
  it("renders the title, Indian-grouped amounts and budget allocations", () => {
    const detail = makeDetail();
    const firstItem = detail.budgetItems[0];

    const markdown = generateEventMarkdown(detail);

    expect(markdown.startsWith("# Test Gala")).toBe(true);
    expect(markdown).toContain("₹15,00,000");
    expect(markdown).toContain("## Budget Allocations");
    expect(markdown).toContain(`- ${firstItem.category} (${firstItem.label}): Planned ₹`);
  });

  it("marks completed and pending tasks and reports the completion count", () => {
    const detail = makeDetail();
    detail.tasks[0].status = "done";
    detail.tasks[1].status = "todo";

    const markdown = generateEventMarkdown(detail);

    expect(markdown).toContain(`(1/${detail.tasks.length} Completed)`);
    expect(markdown).toContain(`- [x] ${detail.tasks[0].title}`);
    expect(markdown).toContain(`- [ ] ${detail.tasks[1].title}`);
  });

  it("renders without error when there are no tasks or budget items", () => {
    const detail = makeDetail();
    detail.tasks = [];
    detail.budgetItems = [];

    const markdown = generateEventMarkdown(detail);

    expect(markdown).toContain("(0/0 Completed)");
  });
});
