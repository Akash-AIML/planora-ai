import type { EventRequirements, EventType, TaskPriority } from "./types";

interface TimelineTemplate {
  phase: string;
  title: string;
  offsetDays: number;
  priority: TaskPriority;
  category: string;
}

const COMMON_TAIL: TimelineTemplate[] = [
  {
    phase: "Final week",
    title: "Confirm final guest count with venue and caterer",
    offsetDays: 7,
    priority: "high",
    category: "Logistics",
  },
  {
    phase: "Final week",
    title: "Share run-of-show with family, volunteers and vendors",
    offsetDays: 5,
    priority: "high",
    category: "Logistics",
  },
  {
    phase: "Final week",
    title: "Prepare final payments and tip envelopes",
    offsetDays: 3,
    priority: "high",
    category: "Budget",
  },
  {
    phase: "Event day",
    title: "Arrive early for a 20-minute walkthrough",
    offsetDays: 0,
    priority: "high",
    category: "Event day",
  },
  {
    phase: "After the event",
    title: "Send thank-you notes and settle remaining bills",
    offsetDays: -2,
    priority: "medium",
    category: "Follow-up",
  },
];

const TEMPLATES: Record<EventType, TimelineTemplate[]> = {
  wedding: [
    { phase: "12+ months out", title: "Agree the budget, guest range and must-have priorities", offsetDays: 365, priority: "high", category: "Planning" },
    { phase: "9 months out", title: "Shortlist and book the venue", offsetDays: 270, priority: "high", category: "Venue" },
    { phase: "7 months out", title: "Book caterer, photographer and decor team", offsetDays: 210, priority: "high", category: "Vendors" },
    { phase: "5 months out", title: "Finalise attire, jewellery and beauty trials", offsetDays: 150, priority: "medium", category: "Attire" },
    { phase: "4 months out", title: "Send save-the-dates and block hotel rooms", offsetDays: 120, priority: "medium", category: "Guests" },
    { phase: "3 months out", title: "Lock the menu, playlist and ceremony flow", offsetDays: 90, priority: "medium", category: "Programme" },
    { phase: "2 months out", title: "Send invitations and open RSVP tracking", offsetDays: 60, priority: "high", category: "Guests" },
    { phase: "1 month out", title: "Build the seating plan and confirm final vendor calls", offsetDays: 30, priority: "high", category: "Logistics" },
    ...COMMON_TAIL,
  ],
  birthday: [
    { phase: "2 months out", title: "Choose the theme, guest list and venue", offsetDays: 60, priority: "high", category: "Planning" },
    { phase: "6 weeks out", title: "Book food, cake and entertainment", offsetDays: 42, priority: "high", category: "Vendors" },
    { phase: "1 month out", title: "Send invites and collect RSVPs", offsetDays: 30, priority: "high", category: "Guests" },
    { phase: "3 weeks out", title: "Order decor, return gifts and party favours", offsetDays: 21, priority: "medium", category: "Decor" },
    { phase: "2 weeks out", title: "Confirm the playlist and activities for all ages", offsetDays: 14, priority: "medium", category: "Programme" },
    ...COMMON_TAIL,
  ],
  anniversary: [
    { phase: "3 months out", title: "Decide the guest list and the tone of the celebration", offsetDays: 90, priority: "high", category: "Planning" },
    { phase: "2 months out", title: "Book venue, catering and photography", offsetDays: 60, priority: "high", category: "Vendors" },
    { phase: "6 weeks out", title: "Plan the vow renewal, speeches or tribute video", offsetDays: 42, priority: "medium", category: "Programme" },
    { phase: "1 month out", title: "Send invites and confirm the menu", offsetDays: 30, priority: "high", category: "Guests" },
    { phase: "2 weeks out", title: "Finalise decor, music and seating", offsetDays: 14, priority: "medium", category: "Logistics" },
    ...COMMON_TAIL,
  ],
  corporate: [
    { phase: "3 months out", title: "Lock objectives, budget owner and success metrics", offsetDays: 90, priority: "high", category: "Planning" },
    { phase: "2 months out", title: "Book venue, AV partner and catering", offsetDays: 60, priority: "high", category: "Vendors" },
    { phase: "6 weeks out", title: "Confirm speakers, agenda and run-of-show", offsetDays: 42, priority: "high", category: "Programme" },
    { phase: "1 month out", title: "Open registration and share the internal invite", offsetDays: 30, priority: "high", category: "Guests" },
    { phase: "2 weeks out", title: "Print badges, signage and feedback forms", offsetDays: 14, priority: "medium", category: "Branding" },
    ...COMMON_TAIL,
  ],
  community: [
    { phase: "4 months out", title: "Form a volunteer core and agree the community goal", offsetDays: 120, priority: "high", category: "Planning" },
    { phase: "3 months out", title: "Apply for permissions and confirm the venue", offsetDays: 90, priority: "high", category: "Venue" },
    { phase: "2 months out", title: "Arrange food vendors, water and waste plan", offsetDays: 60, priority: "high", category: "Vendors" },
    { phase: "6 weeks out", title: "Launch outreach with local groups and schools", offsetDays: 42, priority: "high", category: "Marketing" },
    { phase: "1 month out", title: "Confirm safety, first aid and accessibility needs", offsetDays: 30, priority: "high", category: "Safety" },
    { phase: "2 weeks out", title: "Brief volunteers and publish the programme", offsetDays: 14, priority: "medium", category: "Programme" },
    ...COMMON_TAIL,
  ],
};

export interface GeneratedTask {
  title: string;
  phase: string;
  dueDate: string;
  priority: TaskPriority;
  category: string;
  sortOrder: number;
}

export function generateTimeline(event: Pick<EventRequirements, "eventType" | "eventDate">): GeneratedTask[] {
  const templates = TEMPLATES[event.eventType];
  return templates.map((template, index) => ({
    title: template.title,
    phase: template.phase,
    dueDate: addDays(event.eventDate, -template.offsetDays),
    priority: template.priority,
    category: template.category,
    sortOrder: index,
  }));
}

/** Parse a date-only string as UTC midnight so timezones cannot shift the day. */
export function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(Number.NaN);
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number): string {
  const date = parseDateOnly(value);
  if (Number.isNaN(date.getTime())) return value;
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateOnly(date);
}

export function daysUntil(value: string, now = new Date()): number | null {
  const target = parseDateOnly(value);
  if (Number.isNaN(target.getTime())) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target.getTime() - today) / 86_400_000);
}
