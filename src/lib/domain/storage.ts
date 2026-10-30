import type {
  EventDetail,
  EventRecord,
  BudgetItem,
  Task,
  EventIdea,
  ShortlistEntry,
} from "./types";
import { allocateBudget, calculateBudgetTotals } from "./budget";
import { generateTimeline } from "./timeline";
import { generateIdeas } from "./ideas";
import { sanitizeString } from "@/lib/security/sanitization";
import { getSampleInitialEvent } from "./seeds";

// Re-export domain helpers for seamless module integration
export { getSampleInitialEvent } from "./seeds";
export { buildPlanoraExport, generateEventMarkdown } from "./export";

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

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

function sanitizeEventDetail(detail: unknown): EventDetail | null {
  if (!isRecord(detail)) return null;

  const rawEvent = detail.event;
  if (!isRecord(rawEvent) || typeof rawEvent.id !== "string" || typeof rawEvent.title !== "string") {
    return null;
  }

  const safeEvent: EventRecord = {
    id: rawEvent.id,
    title: sanitizeString(rawEvent.title, 200),
    eventType: (typeof rawEvent.eventType === "string" ? rawEvent.eventType : "wedding") as EventRecord["eventType"],
    city: sanitizeString(typeof rawEvent.city === "string" ? rawEvent.city : "Jaipur", 100),
    eventDate: typeof rawEvent.eventDate === "string" ? rawEvent.eventDate : "2026-11-20",
    guestCount: typeof rawEvent.guestCount === "number" ? Math.max(1, rawEvent.guestCount) : 100,
    budgetInr: typeof rawEvent.budgetInr === "number" ? Math.max(1000, rawEvent.budgetInr) : 500000,
    preferences: Array.isArray(rawEvent.preferences)
      ? rawEvent.preferences.filter((p): p is string => typeof p === "string").map((p) => sanitizeString(p, 100))
      : [],
    notes: sanitizeString(typeof rawEvent.notes === "string" ? rawEvent.notes : "", 2000),
    version: typeof rawEvent.version === "number" ? rawEvent.version : 1,
    createdAt: typeof rawEvent.createdAt === "string" ? rawEvent.createdAt : new Date().toISOString(),
    updatedAt: typeof rawEvent.updatedAt === "string" ? rawEvent.updatedAt : new Date().toISOString(),
  };

  const rawBudgetItems = Array.isArray(detail.budgetItems) ? detail.budgetItems : [];
  const budgetItems: BudgetItem[] = rawBudgetItems.map((item) => ({
    ...item,
    label: sanitizeString(item.label, 150),
    notes: sanitizeString(item.notes || "", 500),
  }));

  const rawTasks = Array.isArray(detail.tasks) ? detail.tasks : [];
  const tasks: Task[] = rawTasks.map((task) => ({
    ...task,
    title: sanitizeString(task.title, 200),
  }));

  const rawIdeas = Array.isArray(detail.ideas) ? detail.ideas : [];
  const ideas: EventIdea[] = rawIdeas.map((idea) => ({
    ...idea,
    title: sanitizeString(idea.title, 200),
    description: sanitizeString(idea.description, 1000),
  }));

  const rawShortlist = Array.isArray(detail.shortlist) ? detail.shortlist : [];

  const totals =
    isRecord(detail.totals) && typeof detail.totals.plannedInr === "number"
      ? (detail.totals as unknown as EventDetail["totals"])
      : calculateBudgetTotals(budgetItems, safeEvent.budgetInr ?? 0);

  return {
    event: safeEvent,
    budgetItems,
    tasks,
    ideas,
    shortlist: rawShortlist,
    totals,
  };
}

export function loadAllEvents(): EventDetail[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
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
