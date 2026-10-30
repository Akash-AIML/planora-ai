import type { EventDetail } from "./types";
import { createNewEventDetail } from "./storage";

/**
 * Creates the sample initial event used to seed the dashboard on first launch
 */
export function getSampleInitialEvent(): EventDetail {
  const detail = createNewEventDetail({
    title: "Royal Heritage Wedding in Jaipur",
    eventType: "wedding",
    city: "Jaipur",
    eventDate: "2026-11-28",
    guestCount: 200,
    budgetInr: 1500000,
    preferences: ["heritage", "traditional", "outdoor", "vegetarian", "luxury"],
    notes: "A grand 3-day royal celebration with intimate folk musical gatherings and sustainable decor.",
  });

  // Pre-mark a couple tasks as done/doing to show realistic progress
  if (detail.tasks.length > 2) {
    detail.tasks[0].status = "done";
    detail.tasks[1].status = "doing";
  }

  // Pre-seed a shortlist entry
  detail.shortlist.push({
    eventId: detail.event.id,
    vendorId: "venue-amber-courtyard",
    status: "shortlisted",
    quotedInr: 180000,
    notes: "Contacted for sandstone archway setup and courtyard dinner.",
  });

  return detail;
}
