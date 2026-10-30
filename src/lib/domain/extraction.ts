import type { EventType, ExtractionResult } from "./types";
import { addDays, formatDateOnly } from "./timeline";
import {
  CITY_ALIASES,
  CITY_KEYS,
  TYPE_PATTERNS,
  PREFERENCE_PATTERNS,
  MONTHS,
  MONTH_PATTERN,
  EXTRACTION_DEFAULTS,
} from "./extraction-rules";

export function parseEventBrief(text: string, now = new Date()): ExtractionResult {
  const clean = text.replace(/\s+/g, " ").trim().slice(0, 4000);
  const lower = clean.toLowerCase();
  const missingFields: string[] = [];
  const assumptions: string[] = [];

  let eventType: EventType | null = null;
  for (const [type, pattern] of TYPE_PATTERNS) {
    if (pattern.test(lower)) {
      eventType = type;
      break;
    }
  }
  if (!eventType) {
    eventType = "wedding";
    missingFields.push("event type");
    assumptions.push("Assumed a wedding because no event type was mentioned.");
  }

  const city = findCity(lower);
  if (!city) {
    missingFields.push("city");
    assumptions.push("No city found. Defaulted to Jaipur — edit this before saving.");
  }

  const eventDate = findDate(lower, now);
  const defaultDate = addDays(formatDateOnly(now), EXTRACTION_DEFAULTS.daysAhead);
  if (!eventDate) {
    missingFields.push("event date");
    assumptions.push(
      `No date found. Defaulted to ${defaultDate} (about four months out).`,
    );
  }

  const guestCount = findGuests(lower);
  if (!guestCount) {
    missingFields.push("guest count");
    assumptions.push(`No guest count found. Defaulted to ${EXTRACTION_DEFAULTS.guestCount} guests.`);
  }

  const budgetInr = findBudget(lower);
  if (!budgetInr) {
    missingFields.push("budget");
    assumptions.push(
      `No budget found. Defaulted to ₹${EXTRACTION_DEFAULTS.budgetInr.toLocaleString("en-IN")}.`,
    );
  }

  const preferences = PREFERENCE_PATTERNS.filter(([, pattern]) => pattern.test(lower)).map(
    ([label]) => label,
  );

  const found = 5 - missingFields.length;
  const confidence = Math.round((found / 5) * 100) / 100;

  return {
    requirements: {
      title: findTitle(clean, eventType, city),
      eventType,
      city: city ?? "Jaipur",
      eventDate: eventDate ?? defaultDate,
      guestCount: guestCount ?? EXTRACTION_DEFAULTS.guestCount,
      budgetInr: budgetInr ?? EXTRACTION_DEFAULTS.budgetInr,
      preferences,
      notes: clean ? `Original brief: ${clean}` : "",
    },
    confidence,
    assumptions,
    missingFields,
    source: "heuristic",
  };
}

export function normalizeCity(value: string): string | null {
  const lower = value.toLowerCase().trim();
  if (CITY_ALIASES[lower]) return CITY_ALIASES[lower];
  for (const key of CITY_KEYS) {
    if (lower === key || lower.includes(key)) return CITY_ALIASES[key];
  }
  return null;
}

function findCity(lower: string): string | null {
  for (const key of CITY_KEYS) {
    if (new RegExp(`\\b${escapeRegExp(key)}\\b`, "i").test(lower)) {
      return CITY_ALIASES[key];
    }
  }
  return null;
}

function findGuests(lower: string): number | null {
  const patterns = [
    /\b(\d[0-9,]*)\s+(?:guests?|people|persons?|pax|attendees|headcount|kids|children|members)\b/i,
    /\b(\d[0-9,]*)[- ](?:guest|kid|child)\b/i,
    /\bguests?(?:\s+(?:of|around|about)|[:=])?\s+(\d[0-9,]*)\b/i,
    /\bfor\s+(\d[0-9,]*)\s+(?:people|guests?|kids|children)\b/i,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(lower);
    if (match) {
      const value = Number(match[1].replace(/,/g, ""));
      if (Number.isFinite(value) && value > 0 && value <= 200_000) return Math.round(value);
    }
  }
  return null;
}

function findBudget(lower: string): number | null {
  const unit = "(lakh|lakhs|lac|lacs|crore|crores|cr|k|thousand)?";
  const patterns = [
    new RegExp(`(?:₹|rs\\.?|inr)\\s*(\\d[\\d,.]*)\\s*${unit}\\b`, "i"),
    new RegExp(`\\bbudget(?:\\s+(?:of|is|around|about)|[:=])?\\s*(?:₹|rs\\.?|inr)?\\s*(\\d[\\d,.]*)\\s*${unit}\\b`, "i"),
    new RegExp(`\\b(?:under|within|upto|up to|max(?:imum)?)\\s+(?:₹|rs\\.?|inr)?\\s*(\\d[\\d,.]*)\\s*${unit}\\b`, "i"),
    new RegExp(`\\b(\\d[\\d,.]*)\\s*(lakh|lakhs|lac|lacs|crore|crores|cr|k|thousand)\\s+(?:budget|max|maximum|spend|to spend)\\b`, "i"),
    new RegExp(`\\b(?:(?:with|around|about|of)\\s+)?(\\d[\\d,.]*)\\s*(k|thousand|lakh|lakhs|lac|lacs|crore|crores|cr)\\s+budget\\b`, "i"),
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(lower);
    if (!match) continue;
    const raw = Number(match[1].replace(/,/g, ""));
    if (!Number.isFinite(raw) || raw <= 0) continue;
    const suffix = (match[2] ?? "").toLowerCase();
    let multiplier = 1;
    if (["lakh", "lakhs", "lac", "lacs"].includes(suffix)) multiplier = 100_000;
    else if (["crore", "crores", "cr"].includes(suffix)) multiplier = 10_000_000;
    else if (["k", "thousand"].includes(suffix)) multiplier = 1_000;
    const value = Math.round(raw * multiplier);
    if (value >= 1_000 && value <= 1_000_000_000) return value;
  }
  return null;
}

function findDate(lower: string, now: Date): string | null {
  const iso = /\b(20\d{2})-(\d{2})-(\d{2})\b/.exec(lower);
  if (iso) return validDate(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const dmy = /\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/.exec(lower);
  if (dmy) return validDate(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));

  const dayMonthYear = new RegExp(
    `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_PATTERN})[,\\s]+(20\\d{2})\\b`,
    "i",
  ).exec(lower);
  if (dayMonthYear) {
    return validDate(
      Number(dayMonthYear[3]),
      MONTHS[dayMonthYear[2].toLowerCase()],
      Number(dayMonthYear[1]),
    );
  }

  const monthDayYear = new RegExp(
    `\\b(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?[,\\s]+(20\\d{2})\\b`,
    "i",
  ).exec(lower);
  if (monthDayYear) {
    return validDate(
      Number(monthDayYear[3]),
      MONTHS[monthDayYear[1].toLowerCase()],
      Number(monthDayYear[2]),
    );
  }

  const monthYear = new RegExp(`\\b(${MONTH_PATTERN})[,\\s]+(20\\d{2})\\b`, "i").exec(lower);
  if (monthYear) {
    return validDate(Number(monthYear[2]), MONTHS[monthYear[1].toLowerCase()], 1);
  }

  const monthOnly = new RegExp(`\\b(?:in|on|during)\\s+(${MONTH_PATTERN})\\b`, "i").exec(lower);
  if (monthOnly) {
    const month = MONTHS[monthOnly[1].toLowerCase()];
    const year = month < now.getUTCMonth() ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
    return validDate(year, month, 1);
  }

  const inMonths = /\bin\s+(\d{1,2})\s+months?\b/i.exec(lower);
  if (inMonths) {
    return addDays(formatDateOnly(now), Math.max(1, Number(inMonths[1])) * 30);
  }

  const nextMonth = /\bnext month\b/i.exec(lower);
  if (nextMonth) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return formatDateOnly(date);
  }

  return null;
}

function findTitle(text: string, eventType: EventType, city: string | null): string {
  const explicit = /\b(?:title|named|called)\s*[:\-]\s*([^.;\n]{3,80})/i.exec(text);
  if (explicit) return titleCase(explicit[1].trim());
  const labels: Record<EventType, string> = {
    wedding: "Wedding",
    birthday: "Birthday celebration",
    anniversary: "Anniversary celebration",
    corporate: "Corporate event",
    community: "Community event",
  };
  return city ? `${labels[eventType]} in ${city}` : labels[eventType];
}

function titleCase(value: string): string {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

function validDate(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month, day));
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return formatDateOnly(date);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
