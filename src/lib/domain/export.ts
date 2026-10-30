import type { EventDetail, PlanoraExport, ShortlistEntry } from "./types";
import { DEMO_VENDORS } from "@/lib/data/demo-vendors";

/**
 * Serializes a complete EventDetail into the Planora JSON exchange format
 */
export function buildPlanoraExport(detail: EventDetail): PlanoraExport {
  const vendorMap = new Map(DEMO_VENDORS.map((v) => [v.id, v]));
  const shortlistedVendors = (detail.shortlist ?? [])
    .map((entry) => {
      const vendor = vendorMap.get(entry.vendorId);
      return vendor ? { entry, vendor } : null;
    })
    .filter((item): item is { entry: ShortlistEntry; vendor: typeof DEMO_VENDORS[0] } => item !== null);

  return {
    exportedAt: new Date().toISOString(),
    app: "Planora AI",
    event: detail.event,
    budget: {
      items: detail.budgetItems ?? [],
      totals: detail.totals,
    },
    tasks: detail.tasks ?? [],
    ideas: detail.ideas ?? [],
    vendors: shortlistedVendors,
    disclaimer:
      "All vendor listings and price estimates are illustrative demo figures. Verify live availability and commercial quotes before signing contracts.",
  };
}

/**
 * Builds a clean Markdown document summary from an EventDetail for copying or documentation
 */
export function generateEventMarkdown(detail: EventDetail): string {
  const completedTasks = (detail.tasks ?? []).filter((t) => t.status === "done").length;
  const totalTasks = (detail.tasks ?? []).length;

  return `# ${detail.event.title}
**Event Type:** ${detail.event.eventType}
**Date:** ${detail.event.eventDate} | **City:** ${detail.event.city} | **Guests:** ${detail.event.guestCount}
**Total Budget:** ₹${detail.event.budgetInr.toLocaleString("en-IN")}
**Planned Spend:** ₹${detail.totals.plannedInr.toLocaleString("en-IN")}

## Budget Allocations
${(detail.budgetItems ?? []).map((b) => `- ${b.category} (${b.label}): Planned ₹${b.plannedInr.toLocaleString("en-IN")}`).join("\n")}

## Key Milestones (${completedTasks}/${totalTasks} Completed)
${(detail.tasks ?? []).map((t) => `- [${t.status === "done" ? "x" : " "}] ${t.title} (${t.phase})`).join("\n")}`;
}
