export const EVENT_TYPES = [
  "wedding",
  "birthday",
  "anniversary",
  "corporate",
  "community",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: "Wedding",
  birthday: "Birthday",
  anniversary: "Anniversary",
  corporate: "Corporate event",
  community: "Community event",
};

export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type IdeaSource = "ai" | "template";
export type ShortlistStatus = "shortlisted" | "contacted" | "booked" | "rejected";

export interface EventRequirements {
  title: string;
  eventType: EventType;
  city: string;
  eventDate: string;
  guestCount: number;
  budgetInr: number;
  preferences: string[];
  notes: string;
}

export interface EventRecord extends EventRequirements {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItem {
  id: string;
  eventId: string;
  category: string;
  label: string;
  plannedInr: number;
  actualInr: number | null;
  notes: string;
  sortOrder: number;
}

export interface Task {
  id: string;
  eventId: string;
  title: string;
  phase: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  sortOrder: number;
}

export interface EventIdea {
  id: string;
  eventId: string;
  title: string;
  description: string;
  category: string;
  estimatedInr: number | null;
  source: IdeaSource;
}

export interface ShortlistEntry {
  eventId: string;
  vendorId: string;
  status: ShortlistStatus;
  quotedInr: number | null;
  notes: string;
}

export type VendorCategory =
  | "venue"
  | "catering"
  | "photography"
  | "decor"
  | "music"
  | "beauty"
  | "planning"
  | "activities";

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  cities: string[];
  basePriceInr: number;
  priceUnit: "event" | "plate" | "day";
  priceNote: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  description: string;
  demo: true;
  availabilityNote: string;
}

export interface RankedVendor {
  vendor: Vendor;
  estimateInr: number;
  score: number;
  reasons: string[];
  warnings: string[];
}

export interface BudgetTotals {
  plannedInr: number;
  actualInr: number;
  remainingInr: number;
  overBudget: boolean;
  byCategory: Array<{ category: string; plannedInr: number; share: number }>;
}

export interface EventSummary extends EventRecord {
  plannedInr: number;
  taskCount: number;
  doneTaskCount: number;
  ideaCount: number;
  shortlistCount: number;
}

export interface EventDetail {
  event: EventRecord;
  budgetItems: BudgetItem[];
  tasks: Task[];
  ideas: EventIdea[];
  shortlist: ShortlistEntry[];
  totals: BudgetTotals;
}

export interface ExtractionResult {
  requirements: EventRequirements;
  confidence: number;
  assumptions: string[];
  missingFields: string[];
  source: "llm+heuristic" | "heuristic";
}

export interface BudgetChange {
  itemId: string;
  label: string;
  category: string;
  fromInr: number;
  toInr: number;
}

export interface ReplanProposal {
  eventId: string;
  eventVersion: number;
  targetBudgetInr: number;
  currentTotalInr: number;
  proposedTotalInr: number;
  feasible: boolean;
  changes: BudgetChange[];
  notes: string[];
  createdAt: string;
}

export interface PlanoraExport {
  exportedAt: string;
  app: "Planora AI";
  event: EventRecord;
  budget: { items: BudgetItem[]; totals: BudgetTotals };
  tasks: Task[];
  ideas: EventIdea[];
  vendors: Array<{ entry: ShortlistEntry; vendor: Vendor }>;
  disclaimer: string;
}
