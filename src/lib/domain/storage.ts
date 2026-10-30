import type {
  EventDetail,
  EventRecord,
  BudgetItem,
  Task,
  EventIdea,
  ShortlistEntry,
  BudgetTotals,
  EventType,
  TaskStatus,
  TaskPriority,
  IdeaSource,
  ShortlistStatus,
} from "./types";
import { EVENT_TYPES } from "./types";
import { allocateBudget, calculateBudgetTotals } from "./budget";
import { generateTimeline } from "./timeline";
import { generateIdeas } from "./ideas";
import { sanitizeString } from "@/lib/security/sanitization";

// Re-export domain helpers for seamless module integration
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

const VALID_EVENT_TYPES = new Set<string>(EVENT_TYPES);
const VALID_TASK_STATUSES = new Set<string>(["todo", "doing", "done"]);
const VALID_TASK_PRIORITIES = new Set<string>(["low", "medium", "high"]);
const VALID_IDEA_SOURCES = new Set<string>(["ai", "template"]);
const VALID_SHORTLIST_STATUSES = new Set<string>(["shortlisted", "contacted", "booked", "rejected"]);

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function toSafeFiniteNumber(val: unknown, fallback: number, min?: number, max?: number): number {
  if (typeof val !== "number" || !Number.isFinite(val)) {
    return fallback;
  }
  let n = val;
  if (min !== undefined && n < min) n = min;
  if (max !== undefined && n > max) n = max;
  return n;
}

function toSafeNullableFiniteNumber(val: unknown, min?: number): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val !== "number" || !Number.isFinite(val)) return null;
  if (min !== undefined && val < min) return min;
  return val;
}

export function sanitizeEventDetail(detail: unknown): EventDetail | null {
  if (!isRecord(detail)) return null;

  const rawEvent = detail.event;
  if (
    !isRecord(rawEvent) ||
    typeof rawEvent.id !== "string" ||
    !rawEvent.id.trim() ||
    typeof rawEvent.title !== "string"
  ) {
    return null;
  }

  const rawTitle = sanitizeString(rawEvent.title, 200);
  const title = rawTitle.length > 0 ? rawTitle : "Untitled Event";
  const eventType: EventType =
    typeof rawEvent.eventType === "string" && VALID_EVENT_TYPES.has(rawEvent.eventType)
      ? (rawEvent.eventType as EventType)
      : "wedding";
  const city = sanitizeString(typeof rawEvent.city === "string" ? rawEvent.city : "Jaipur", 100);
  const eventDate =
    typeof rawEvent.eventDate === "string" && rawEvent.eventDate.trim().length > 0
      ? rawEvent.eventDate.trim()
      : "2026-11-20";
  const guestCount = toSafeFiniteNumber(rawEvent.guestCount, 100, 1);
  const budgetInr = toSafeFiniteNumber(rawEvent.budgetInr, 500000, 1000);
  const preferences = Array.isArray(rawEvent.preferences)
    ? rawEvent.preferences
        .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
        .map((p) => sanitizeString(p, 100))
    : [];
  const notes = sanitizeString(typeof rawEvent.notes === "string" ? rawEvent.notes : "", 2000);
  const version = toSafeFiniteNumber(rawEvent.version, 1, 1);
  const createdAt =
    typeof rawEvent.createdAt === "string" && rawEvent.createdAt.trim().length > 0
      ? rawEvent.createdAt.trim()
      : new Date().toISOString();
  const updatedAt =
    typeof rawEvent.updatedAt === "string" && rawEvent.updatedAt.trim().length > 0
      ? rawEvent.updatedAt.trim()
      : new Date().toISOString();

  const safeEvent: EventRecord = {
    id: rawEvent.id.trim(),
    title,
    eventType,
    city,
    eventDate,
    guestCount,
    budgetInr,
    preferences,
    notes,
    version,
    createdAt,
    updatedAt,
  };

  const rawBudgetItems = Array.isArray(detail.budgetItems) ? detail.budgetItems : [];
  const budgetItems: BudgetItem[] = rawBudgetItems
    .filter(isRecord)
    .map((item, index) => {
      const id = typeof item.id === "string" && item.id.trim() ? item.id.trim() : `item-${safeEvent.id}-${index + 1}`;
      const category = typeof item.category === "string" && item.category.trim() ? sanitizeString(item.category, 100) : "General";
      const rawLabel = typeof item.label === "string" ? item.label : "Item";
      const label = sanitizeString(rawLabel, 150);
      const plannedInr = toSafeFiniteNumber(item.plannedInr, 0, 0);
      const actualInr = toSafeNullableFiniteNumber(item.actualInr, 0);
      const rawNotes = typeof item.notes === "string" ? item.notes : "";
      const notes = sanitizeString(rawNotes, 500);
      const sortOrder = toSafeFiniteNumber(item.sortOrder, index, 0);

      return {
        id,
        eventId: safeEvent.id,
        category: category.length > 0 ? category : "General",
        label: label.length > 0 ? label : "Item",
        plannedInr,
        actualInr,
        notes,
        sortOrder,
      };
    });

  const rawTasks = Array.isArray(detail.tasks) ? detail.tasks : [];
  const tasks: Task[] = rawTasks
    .filter(isRecord)
    .map((task, index) => {
      const id = typeof task.id === "string" && task.id.trim() ? task.id.trim() : `task-${safeEvent.id}-${index + 1}`;
      const rawTitle = typeof task.title === "string" ? task.title : "Task";
      const title = sanitizeString(rawTitle, 200);
      const rawPhase = typeof task.phase === "string" ? task.phase : "Planning";
      const phase = sanitizeString(rawPhase, 100);
      const dueDate = typeof task.dueDate === "string" && task.dueDate.trim() ? task.dueDate.trim() : safeEvent.eventDate;
      const status: TaskStatus =
        typeof task.status === "string" && VALID_TASK_STATUSES.has(task.status)
          ? (task.status as TaskStatus)
          : "todo";
      const priority: TaskPriority =
        typeof task.priority === "string" && VALID_TASK_PRIORITIES.has(task.priority)
          ? (task.priority as TaskPriority)
          : "medium";
      const rawCategory = typeof task.category === "string" ? task.category : "General";
      const category = sanitizeString(rawCategory, 100);
      const sortOrder = toSafeFiniteNumber(task.sortOrder, index, 0);

      return {
        id,
        eventId: safeEvent.id,
        title: title.length > 0 ? title : "Task",
        phase: phase.length > 0 ? phase : "Planning",
        dueDate,
        status,
        priority,
        category: category.length > 0 ? category : "General",
        sortOrder,
      };
    });

  const rawIdeas = Array.isArray(detail.ideas) ? detail.ideas : [];
  const ideas: EventIdea[] = rawIdeas
    .filter(isRecord)
    .map((idea, index) => {
      const id = typeof idea.id === "string" && idea.id.trim() ? idea.id.trim() : `idea-${safeEvent.id}-${index + 1}`;
      const rawTitle = typeof idea.title === "string" ? idea.title : "Idea";
      const title = sanitizeString(rawTitle, 200);
      const rawDesc = typeof idea.description === "string" ? idea.description : "";
      const description = sanitizeString(rawDesc, 1000);
      const rawCategory = typeof idea.category === "string" ? idea.category : "General";
      const category = sanitizeString(rawCategory, 100);
      const estimatedInr = toSafeNullableFiniteNumber(idea.estimatedInr, 0);
      const source: IdeaSource =
        typeof idea.source === "string" && VALID_IDEA_SOURCES.has(idea.source)
          ? (idea.source as IdeaSource)
          : "template";

      return {
        id,
        eventId: safeEvent.id,
        title: title.length > 0 ? title : "Idea",
        description,
        category: category.length > 0 ? category : "General",
        estimatedInr,
        source,
      };
    });

  const rawShortlist = Array.isArray(detail.shortlist) ? detail.shortlist : [];
  const shortlist: ShortlistEntry[] = rawShortlist
    .filter(isRecord)
    .filter(
      (entry): entry is Record<string, unknown> & { vendorId: string } =>
        typeof entry.vendorId === "string" && entry.vendorId.trim().length > 0
    )
    .map((entry) => {
      const status: ShortlistStatus =
        typeof entry.status === "string" && VALID_SHORTLIST_STATUSES.has(entry.status)
          ? (entry.status as ShortlistStatus)
          : "shortlisted";
      const quotedInr = toSafeNullableFiniteNumber(entry.quotedInr, 0);
      const rawNotes = typeof entry.notes === "string" ? entry.notes : "";
      const notes = sanitizeString(rawNotes, 500);

      return {
        eventId: safeEvent.id,
        vendorId: entry.vendorId.trim(),
        status,
        quotedInr,
        notes,
      };
    });

  let totals: BudgetTotals;
  if (
    isRecord(detail.totals) &&
    typeof detail.totals.plannedInr === "number" &&
    Number.isFinite(detail.totals.plannedInr) &&
    typeof detail.totals.actualInr === "number" &&
    Number.isFinite(detail.totals.actualInr) &&
    typeof detail.totals.remainingInr === "number" &&
    Number.isFinite(detail.totals.remainingInr) &&
    typeof detail.totals.overBudget === "boolean" &&
    Array.isArray(detail.totals.byCategory)
  ) {
    const byCategory = detail.totals.byCategory
      .filter(isRecord)
      .map((cat) => ({
        category: sanitizeString(typeof cat.category === "string" ? cat.category : "General", 100),
        plannedInr: toSafeFiniteNumber(cat.plannedInr, 0, 0),
        share: toSafeFiniteNumber(cat.share, 0, 0, 1),
      }));

    totals = {
      plannedInr: detail.totals.plannedInr,
      actualInr: detail.totals.actualInr,
      remainingInr: detail.totals.remainingInr,
      overBudget: detail.totals.overBudget,
      byCategory,
    };
  } else {
    totals = calculateBudgetTotals(budgetItems, safeEvent.budgetInr);
  }

  return {
    event: safeEvent,
    budgetItems,
    tasks,
    ideas,
    shortlist,
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
