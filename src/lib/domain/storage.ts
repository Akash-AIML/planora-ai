import type {
  EventDetail,
  EventRecord,
  BudgetItem,
  Task,
  EventIdea,
  ShortlistEntry,
  PlanoraExport,
} from "./types";
import { allocateBudget, calculateBudgetTotals } from "./budget";
import { generateTimeline } from "./timeline";
import { generateIdeas } from "./ideas";
import { DEMO_VENDORS } from "@/lib/data/demo-vendors";

const STORAGE_KEY = "planora_ai_events_v1";
const ACTIVE_KEY = "planora_ai_active_id";

export function createNewEventDetail(params: {
  title: string;
  eventType: EventRecord["eventType"];
  city: string;
  eventDate: string;
  guestCount: number;
  budgetInr: number;
  preferences: string[];
  notes?: string;
  customIdeas?: EventIdea[];
}): EventDetail {
  const id = `event-${Date.now()}`;
  const now = new Date().toISOString();

  const eventRecord: EventRecord = {
    id,
    title: params.title,
    eventType: params.eventType,
    city: params.city,
    eventDate: params.eventDate,
    guestCount: params.guestCount,
    budgetInr: params.budgetInr,
    preferences: params.preferences,
    notes: params.notes ?? "",
    version: 1,
    createdAt: now,
    updatedAt: now,
  };

  const allocated = allocateBudget(params.budgetInr, params.eventType);
  const budgetItems: BudgetItem[] = allocated.map((line, index) => ({
    id: `item-${id}-${index + 1}`,
    eventId: id,
    category: line.category,
    label: line.label,
    plannedInr: line.plannedInr,
    actualInr: null,
    notes: `Calculated from ${params.eventType} budget allocation template.`,
    sortOrder: index,
  }));

  const timelineTasks = generateTimeline({
    eventType: params.eventType,
    eventDate: params.eventDate,
  });

  const tasks: Task[] = timelineTasks.map((t, index) => ({
    id: `task-${id}-${index + 1}`,
    eventId: id,
    title: t.title,
    phase: t.phase,
    dueDate: t.dueDate,
    status: "todo",
    priority: t.priority,
    category: t.category,
    sortOrder: index,
  }));

  const ideas: EventIdea[] =
    params.customIdeas && params.customIdeas.length > 0
      ? params.customIdeas.map((idea, index) => ({
          ...idea,
          id: idea.id || `idea-${id}-${index + 1}`,
          eventId: id,
        }))
      : generateIdeas({ eventType: params.eventType, preferences: params.preferences }, id);

  const shortlist: ShortlistEntry[] = [];
  const totals = calculateBudgetTotals(budgetItems, params.budgetInr);

  return {
    event: eventRecord,
    budgetItems,
    tasks,
    ideas,
    shortlist,
    totals,
  };
}

function sanitizeEventDetail(detail: unknown): EventDetail | null {
  if (!detail || typeof detail !== "object") return null;
  const d = detail as Partial<EventDetail>;
  if (!d.event || !d.event.id || !d.event.title) return null;

  const budgetItems = Array.isArray(d.budgetItems) ? d.budgetItems : [];
  const totals =
    d.totals && typeof d.totals === "object"
      ? d.totals
      : calculateBudgetTotals(budgetItems, d.event.budgetInr ?? 0);

  return {
    event: d.event,
    budgetItems,
    tasks: Array.isArray(d.tasks) ? d.tasks : [],
    ideas: Array.isArray(d.ideas) ? d.ideas : [],
    shortlist: Array.isArray(d.shortlist) ? d.shortlist : [],
    totals,
  };
}

export function loadAllEvents(): EventDetail[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with sample initial plan if empty
      const initial = getSampleInitialEvent();
      saveAllEvents([initial]);
      return [initial];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid = parsed
      .map(sanitizeEventDetail)
      .filter((item): item is EventDetail => item !== null);
    return valid.length > 0 ? valid : [getSampleInitialEvent()];
  } catch (err) {
    console.error("Failed to load events from localStorage:", err);
    return [];
  }
}

export function saveAllEvents(events: EventDetail[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (err) {
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      console.error("Planora AI: LocalStorage quota exceeded while saving events.");
    } else {
      console.error("Failed to save events to localStorage:", err);
    }
  }
}

export function getActiveEventId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveEventId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch (err) {
    console.error("Failed to set active event ID in localStorage:", err);
  }
}

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
