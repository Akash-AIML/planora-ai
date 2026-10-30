import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createNewEventDetail,
  getActiveEventId,
  getSampleInitialEvent,
  loadAllEvents,
  saveAllEvents,
  setActiveEventId,
  sanitizeEventDetail,
} from "../storage";
import { DEMO_VENDORS } from "@/lib/data/demo-vendors";
import type { EventDetail, EventIdea } from "../types";

type RawEvent = { event: Record<string, unknown>; totals?: unknown } & Record<string, unknown>;

interface FakeStorageOptions {
  getItem?: (key: string) => string | null;
  setItem?: (key: string, value: string) => void;
}

/** Installs a browser-like window and in-memory localStorage; returns the backing store. */
function installBrowser(options: FakeStorageOptions = {}) {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", {
    getItem: options.getItem ?? ((key: string) => store.get(key) ?? null),
    setItem:
      options.setItem ??
      ((key: string, value: string) => {
        store.set(key, value);
      }),
  });
  return store;
}

function makeEvent(title = "Storage Test Gala"): EventDetail {
  return createNewEventDetail({
    title,
    eventType: "anniversary",
    city: "Mumbai",
    eventDate: "2026-10-15",
    guestCount: 80,
    budgetInr: 600_000,
    preferences: ["jazz"],
  });
}

/** Writes arbitrary raw text under the events key (discovered via a normal save). */
function seedRaw(store: Map<string, string>, raw: string) {
  saveAllEvents([makeEvent()]);
  const [key] = [...store.keys()];
  store.set(key, raw);
}

function rawCopyOf(detail: EventDetail): RawEvent {
  return JSON.parse(JSON.stringify(detail)) as RawEvent;
}

describe("Event storage", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("server-side execution (no browser storage)", () => {
    it("is a safe no-op when window is unavailable", () => {
      expect(loadAllEvents()).toEqual([]);
      expect(() => saveAllEvents([makeEvent()])).not.toThrow();
      expect(getActiveEventId()).toBeNull();
      expect(() => setActiveEventId("event-1")).not.toThrow();
    });
  });

  describe("loading and persistence", () => {
    it("seeds a sample event on empty storage and persists it", () => {
      installBrowser();

      const first = loadAllEvents();
      expect(first).toHaveLength(1);
      expect(first[0].event.eventType).toBe("wedding");

      const second = loadAllEvents();
      expect(second).toHaveLength(1);
      expect(second[0].event.id).toBe(first[0].event.id);
    });

    it("round-trips valid persisted events", () => {
      installBrowser();
      const original = makeEvent();

      saveAllEvents([original]);
      const loaded = loadAllEvents();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].event.id).toBe(original.event.id);
      expect(loaded[0].event.title).toBe("Storage Test Gala");
      expect(loaded[0].budgetItems).toHaveLength(original.budgetItems.length);
      expect(loaded[0].tasks).toHaveLength(original.tasks.length);
      expect(loaded[0].totals.plannedInr).toBe(original.totals.plannedInr);
    });

    it("keeps valid records and drops invalid ones from a mixed array", () => {
      const store = installBrowser();
      const valid = makeEvent("Valid One");
      seedRaw(store, JSON.stringify([null, 42, {}, { event: { id: 1 } }, valid]));

      const loaded = loadAllEvents();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].event.id).toBe(valid.event.id);
    });

    it("falls back to the sample event when no stored record is valid", () => {
      const store = installBrowser();
      seedRaw(store, JSON.stringify([{}, null]));

      const loaded = loadAllEvents();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].tasks.length).toBeGreaterThan(0);
    });

    it("does not throw on malformed JSON and logs the failure", () => {
      const store = installBrowser();
      seedRaw(store, "{not valid json");

      let result: EventDetail[] = [];
      expect(() => {
        result = loadAllEvents();
      }).not.toThrow();

      expect(Array.isArray(result)).toBe(true);
      expect(errorSpy).toHaveBeenCalled();
    });

    it("does not throw when the stored JSON is not an array", () => {
      const store = installBrowser();
      seedRaw(store, JSON.stringify({ not: "an array" }));

      expect(() => loadAllEvents()).not.toThrow();
      expect(Array.isArray(loadAllEvents())).toBe(true);
    });

    it("does not throw when reading from storage fails", () => {
      installBrowser({
        getItem: () => {
          throw new Error("storage unavailable");
        },
      });

      let result: EventDetail[] = [];
      expect(() => {
        result = loadAllEvents();
      }).not.toThrow();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("sanitization of untrusted stored data", () => {
    it("strips script tags and clamps out-of-range numeric fields", () => {
      const store = installBrowser();
      const raw = rawCopyOf(makeEvent());
      raw.event.title = "<script>alert(1)</script>Safe Title";
      raw.event.guestCount = 0;
      raw.event.budgetInr = 5;
      seedRaw(store, JSON.stringify([raw]));

      const [loaded] = loadAllEvents();

      expect(loaded.event.title).not.toContain("<script");
      expect(loaded.event.title).toContain("Safe Title");
      expect(loaded.event.guestCount).toBe(1);
      expect(loaded.event.budgetInr).toBe(1000);
    });

    it("truncates overlong titles", () => {
      const store = installBrowser();
      const raw = rawCopyOf(makeEvent());
      raw.event.title = "A".repeat(500);
      seedRaw(store, JSON.stringify([raw]));

      const [loaded] = loadAllEvents();

      expect(loaded.event.title.length).toBeLessThanOrEqual(200);
    });

    it("recomputes totals from budget items when stored totals are missing", () => {
      const store = installBrowser();
      const raw = rawCopyOf(makeEvent());
      delete raw.totals;
      seedRaw(store, JSON.stringify([raw]));

      const [loaded] = loadAllEvents();
      const plannedSum = loaded.budgetItems.reduce((sum, item) => sum + item.plannedInr, 0);

      expect(loaded.totals.plannedInr).toBe(plannedSum);
    });
  });

  describe("write failures", () => {
    it("does not throw when writing fails", () => {
      installBrowser({
        setItem: () => {
          throw new Error("disk error");
        },
      });

      expect(() => saveAllEvents([makeEvent()])).not.toThrow();
      expect(errorSpy).toHaveBeenCalled();
    });

    it("reports a quota-exceeded failure distinctly and does not throw", () => {
      installBrowser({
        setItem: () => {
          throw new DOMException("full", "QuotaExceededError");
        },
      });

      expect(() => saveAllEvents([makeEvent()])).not.toThrow();
      expect(String(errorSpy.mock.calls[0][0]).toLowerCase()).toContain("quota");
    });
  });

  describe("active event id", () => {
    it("round-trips the active event id", () => {
      installBrowser();

      setActiveEventId("event-abc");

      expect(getActiveEventId()).toBe("event-abc");
    });

    it("does not throw when persisting the active id fails", () => {
      installBrowser({
        setItem: () => {
          throw new Error("blocked");
        },
      });

      expect(() => setActiveEventId("event-abc")).not.toThrow();
    });
  });
});

describe("createNewEventDetail with custom ideas", () => {
  const baseIdea: EventIdea = {
    id: "keep-me",
    eventId: "placeholder",
    title: "Lantern release",
    description: "Evening lantern release at the venue.",
    category: "Decor",
    estimatedInr: 10_000,
    source: "ai",
  };

  it("keeps provided idea ids, generates missing ones and rebinds eventId", () => {
    const detail = createNewEventDetail({
      title: "Custom Ideas Event",
      eventType: "wedding",
      city: "Jaipur",
      eventDate: "2026-11-28",
      guestCount: 100,
      budgetInr: 500_000,
      preferences: [],
      customIdeas: [baseIdea, { ...baseIdea, id: "", title: "Second idea" }],
    });

    expect(detail.ideas).toHaveLength(2);
    expect(detail.ideas[0].id).toBe("keep-me");
    expect(detail.ideas[1].id).toBeTruthy();
    expect(detail.ideas.every((idea) => idea.eventId === detail.event.id)).toBe(true);
  });
});

describe("getSampleInitialEvent (seed data)", () => {
  it("builds a consistent sample wedding with realistic initial progress", () => {
    const sample = getSampleInitialEvent();

    expect(sample.event.eventType).toBe("wedding");
    expect(sample.tasks[0].status).toBe("done");
    expect(sample.tasks[1].status).toBe("doing");
    expect(sample.tasks.slice(2).every((task) => task.status === "todo")).toBe(true);
    expect(sample.totals.plannedInr).toBe(sample.event.budgetInr);
  });

  it("only shortlists vendors that exist in the demo catalog", () => {
    const sample = getSampleInitialEvent();

    expect(sample.shortlist.length).toBeGreaterThan(0);
    for (const entry of sample.shortlist) {
      expect(DEMO_VENDORS.some((vendor) => vendor.id === entry.vendorId)).toBe(true);
      expect(entry.eventId).toBe(sample.event.id);
    }
  });
});

describe("sanitizeEventDetail runtime validation", () => {
  it("preserves meaning and structure of a fully valid event", () => {
    const valid = makeEvent("Anniversary Gala");
    const sanitized = sanitizeEventDetail(valid);

    expect(sanitized).not.toBeNull();
    expect(sanitized?.event.id).toBe(valid.event.id);
    expect(sanitized?.event.title).toBe("Anniversary Gala");
    expect(sanitized?.event.eventType).toBe("anniversary");
    expect(sanitized?.budgetItems.length).toBe(valid.budgetItems.length);
    expect(sanitized?.tasks.length).toBe(valid.tasks.length);
    expect(sanitized?.totals.plannedInr).toBe(valid.totals.plannedInr);
  });

  it("populates appropriate defaults for missing optional fields", () => {
    const minimal = {
      event: {
        id: "ev-minimal-1",
        title: "Minimal Event",
      },
    };

    const sanitized = sanitizeEventDetail(minimal);

    expect(sanitized).not.toBeNull();
    expect(sanitized?.event.eventType).toBe("wedding");
    expect(sanitized?.event.city).toBe("Jaipur");
    expect(sanitized?.event.guestCount).toBe(100);
    expect(sanitized?.event.budgetInr).toBe(500000);
    expect(sanitized?.event.preferences).toEqual([]);
    expect(sanitized?.event.notes).toBe("");
    expect(sanitized?.event.version).toBe(1);
    expect(sanitized?.budgetItems).toEqual([]);
    expect(sanitized?.tasks).toEqual([]);
    expect(sanitized?.ideas).toEqual([]);
    expect(sanitized?.shortlist).toEqual([]);
  });

  it("safely normalizes invalid event types to wedding", () => {
    const raw = rawCopyOf(makeEvent());
    raw.event.eventType = "extraterrestrial_celebration";

    const sanitized = sanitizeEventDetail(raw);

    expect(sanitized).not.toBeNull();
    expect(sanitized?.event.eventType).toBe("wedding");
  });

  it("safely handles NaN, Infinity, -Infinity, and negative numbers without leaking them", () => {
    const raw = rawCopyOf(makeEvent());
    raw.event.guestCount = NaN;
    raw.event.budgetInr = Infinity;
    raw.event.version = -Infinity;

    raw.budgetItems = [
      {
        id: "b-1",
        label: "Catering",
        plannedInr: NaN,
        actualInr: Infinity,
        sortOrder: -5,
      },
    ];

    raw.ideas = [
      {
        id: "i-1",
        title: "Fireworks",
        estimatedInr: NaN,
      },
    ];

    raw.shortlist = [
      {
        vendorId: "v-1",
        quotedInr: NaN,
      },
    ];

    const sanitized = sanitizeEventDetail(raw);

    expect(sanitized).not.toBeNull();
    expect(Number.isFinite(sanitized?.event.guestCount)).toBe(true);
    expect(sanitized?.event.guestCount).toBe(100);
    expect(Number.isFinite(sanitized?.event.budgetInr)).toBe(true);
    expect(sanitized?.event.budgetInr).toBe(500000);
    expect(sanitized?.event.version).toBe(1);

    expect(sanitized?.budgetItems[0].plannedInr).toBe(0);
    expect(sanitized?.budgetItems[0].actualInr).toBeNull();
    expect(sanitized?.budgetItems[0].sortOrder).toBe(0);

    expect(sanitized?.ideas[0].estimatedInr).toBeNull();
    expect(sanitized?.shortlist[0].quotedInr).toBeNull();
  });

  it("handles malformed nested objects and arrays safely by filtering non-records", () => {
    const raw = rawCopyOf(makeEvent());
    raw.budgetItems = [null, "bad-string", 42, { id: "valid-item", label: "Valid Item", plannedInr: 10000 }];
    raw.tasks = [null, undefined, { title: "Valid Task", status: "not-a-status", priority: "urgent-now" }];
    raw.ideas = ["string-idea", null, { title: "Good Idea", source: "untrusted-source" }];
    raw.shortlist = [null, { vendorId: "" }, { vendorId: "valid-vendor-1", status: "unknown-status" }];

    const sanitized = sanitizeEventDetail(raw);

    expect(sanitized).not.toBeNull();
    expect(sanitized?.budgetItems).toHaveLength(1);
    expect(sanitized?.budgetItems[0].label).toBe("Valid Item");
    expect(sanitized?.budgetItems[0].plannedInr).toBe(10000);

    expect(sanitized?.tasks).toHaveLength(1);
    expect(sanitized?.tasks[0].title).toBe("Valid Task");
    expect(sanitized?.tasks[0].status).toBe("todo");
    expect(sanitized?.tasks[0].priority).toBe("medium");

    expect(sanitized?.ideas).toHaveLength(1);
    expect(sanitized?.ideas[0].title).toBe("Good Idea");
    expect(sanitized?.ideas[0].source).toBe("template");

    expect(sanitized?.shortlist).toHaveLength(1);
    expect(sanitized?.shortlist[0].vendorId).toBe("valid-vendor-1");
    expect(sanitized?.shortlist[0].status).toBe("shortlisted");
  });

  it("rejects events with invalid, whitespace, or missing id/title and recovers child IDs", () => {
    expect(sanitizeEventDetail(null)).toBeNull();
    expect(sanitizeEventDetail({})).toBeNull();
    expect(sanitizeEventDetail({ event: null })).toBeNull();
    expect(sanitizeEventDetail({ event: { id: "", title: "Event" } })).toBeNull();
    expect(sanitizeEventDetail({ event: { id: "   ", title: "Event" } })).toBeNull();
    expect(sanitizeEventDetail({ event: { id: "ev-1", title: 12345 } })).toBeNull();

    const withMissingChildIds = {
      event: { id: "ev-gen-ids", title: "Missing Child IDs" },
      budgetItems: [{ label: "Decor" }],
      tasks: [{ title: "Book Hall" }],
      ideas: [{ title: "Photo Booth" }],
    };

    const sanitized = sanitizeEventDetail(withMissingChildIds);

    expect(sanitized).not.toBeNull();
    expect(sanitized?.budgetItems[0].id).toContain("ev-gen-ids");
    expect(sanitized?.tasks[0].id).toContain("ev-gen-ids");
    expect(sanitized?.ideas[0].id).toContain("ev-gen-ids");
  });

  it("successfully parses valid legacy persisted events with older schema shapes", () => {
    const legacyEvent = {
      event: {
        id: "legacy-event-2025",
        title: "Legacy Diwali Celebration",
        eventType: "community",
        city: "Delhi",
        eventDate: "2025-11-01",
        guestCount: 150,
        budgetInr: 300000,
        preferences: ["cultural", "sweets"],
        notes: "Historical event data from v0 storage",
      },
      budgetItems: [
        { id: "legacy-b1", label: "Stage & Sound", plannedInr: 80000, actualInr: null },
      ],
      tasks: [
        { id: "legacy-t1", title: "Permission from authorities", status: "done" },
      ],
      ideas: [
        { id: "legacy-i1", title: "Diya Lighting", category: "Decor" },
      ],
      shortlist: [
        { vendorId: "vendor-light-sound", status: "booked", quotedInr: 75000 },
      ],
    };

    const sanitized = sanitizeEventDetail(legacyEvent);

    expect(sanitized).not.toBeNull();
    expect(sanitized?.event.id).toBe("legacy-event-2025");
    expect(sanitized?.event.eventType).toBe("community");
    expect(sanitized?.budgetItems[0].label).toBe("Stage & Sound");
    expect(sanitized?.tasks[0].status).toBe("done");
    expect(sanitized?.ideas[0].title).toBe("Diya Lighting");
    expect(sanitized?.shortlist[0].status).toBe("booked");
    expect(sanitized?.totals.plannedInr).toBe(80000);
  });

  it("sanitizes untrusted strings and script tags across all nested entities", () => {
    const untrusted = {
      event: {
        id: "ev-xss-test",
        title: "<b>Unsafe</b> <script>alert('xss')</script>Title",
        city: "<script>hack()</script>Kolkata",
        notes: "<script src='bad.js'></script>Cleaned Notes",
        preferences: ["<script>evil()</script>Vegetarian", "Organic"],
      },
      budgetItems: [
        {
          id: "item-xss",
          label: "<script>alert(1)</script>Sound System",
          category: "<script>alert(2)</script>Audio",
          notes: "<script>steal()</script>Vendor notes",
        },
      ],
      tasks: [
        {
          id: "task-xss",
          title: "<script>alert(3)</script>Finalize Catering",
          phase: "<script>alert(4)</script>Execution",
          category: "<script>alert(5)</script>Food",
        },
      ],
      ideas: [
        {
          id: "idea-xss",
          title: "<script>alert(6)</script>Ice Sculpture",
          description: "<script>alert(7)</script>A grand ice bar",
          category: "<script>alert(8)</script>Showpiece",
        },
      ],
      shortlist: [
        {
          vendorId: "v-safe-1",
          notes: "<script>alert(9)</script>Special discount noted",
        },
      ],
    };

    const sanitized = sanitizeEventDetail(untrusted);

    expect(sanitized).not.toBeNull();
    expect(sanitized?.event.title).not.toContain("<script");
    expect(sanitized?.event.city).not.toContain("<script");
    expect(sanitized?.event.notes).not.toContain("<script");
    expect(sanitized?.event.preferences[0]).not.toContain("<script");

    expect(sanitized?.budgetItems[0].label).not.toContain("<script");
    expect(sanitized?.budgetItems[0].category).not.toContain("<script");
    expect(sanitized?.budgetItems[0].notes).not.toContain("<script");

    expect(sanitized?.tasks[0].title).not.toContain("<script");
    expect(sanitized?.tasks[0].phase).not.toContain("<script");
    expect(sanitized?.tasks[0].category).not.toContain("<script");

    expect(sanitized?.ideas[0].title).not.toContain("<script");
    expect(sanitized?.ideas[0].description).not.toContain("<script");
    expect(sanitized?.ideas[0].category).not.toContain("<script");

    expect(sanitized?.shortlist[0].notes).not.toContain("<script");
  });

  it("ensures one malformed event in stored JSON does not destroy unrelated valid events", () => {
    const store = installBrowser();
    const valid1 = makeEvent("Alpha Event");
    const valid2 = makeEvent("Beta Event");
    const corruptedRecord = { event: { id: "corrupt-id", title: null, guestCount: "many" } };
    const totallyBroken = "not-even-an-object";

    seedRaw(store, JSON.stringify([valid1, corruptedRecord, totallyBroken, valid2]));

    const loaded = loadAllEvents();

    expect(loaded).toHaveLength(2);
    expect(loaded[0].event.title).toBe("Alpha Event");
    expect(loaded[1].event.title).toBe("Beta Event");
  });

  it("ensures storage recovery preserves valid user data when present", () => {
    const store = installBrowser();
    const userEvent = makeEvent("User Edited Birthday");
    userEvent.event.eventType = "birthday";
    userEvent.event.budgetInr = 120000;

    seedRaw(store, JSON.stringify([null, userEvent, {}]));

    const loaded = loadAllEvents();

    expect(loaded).toHaveLength(1);
    expect(loaded[0].event.id).toBe(userEvent.event.id);
    expect(loaded[0].event.title).toBe("User Edited Birthday");
    expect(loaded[0].event.budgetInr).toBe(120000);
  });
});
