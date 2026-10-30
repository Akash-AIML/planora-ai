import type { EventType } from "./types";

export const CITY_ALIASES: Record<string, string> = {
  bengaluru: "Bengaluru",
  bangalore: "Bengaluru",
  mumbai: "Mumbai",
  bombay: "Mumbai",
  delhi: "Delhi NCR",
  "new delhi": "Delhi NCR",
  gurgaon: "Delhi NCR",
  gurugram: "Delhi NCR",
  noida: "Delhi NCR",
  faridabad: "Delhi NCR",
  ghaziabad: "Delhi NCR",
  jaipur: "Jaipur",
  udaipur: "Udaipur",
  pune: "Pune",
  hyderabad: "Hyderabad",
  goa: "Goa",
  panaji: "Goa",
  chennai: "Chennai",
  madras: "Chennai",
  kolkata: "Kolkata",
  calcutta: "Kolkata",
  ahmedabad: "Ahmedabad",
  surat: "Surat",
  lucknow: "Lucknow",
  kochi: "Kochi",
  cochin: "Kochi",
  chandigarh: "Chandigarh",
  indore: "Indore",
  bhopal: "Bhopal",
};

export const CITY_KEYS = Object.keys(CITY_ALIASES).sort((a, b) => b.length - a.length);

export const TYPE_PATTERNS: Array<[EventType, RegExp]> = [
  ["wedding", /\b(wedding|shaadi|shadi|vivah|marriage|bridal|baraat|sangeet|mehendi)\b/i],
  ["birthday", /\b(birthday|bday|b'day|birth day)\b/i],
  ["anniversary", /\b(anniversary|vow renewal|renewal)\b/i],
  ["corporate", /\b(corporate|office|conference|summit|offsite|product launch|townhall|town hall|team building|seminar)\b/i],
  ["community", /\b(community|festival|mela|charity|fundraiser|fund-raiser|neighbou?rhood|puja|school fair|public event|street fair)\b/i],
];

export const PREFERENCE_PATTERNS: Array<[string, RegExp]> = [
  ["vegetarian", /\b(vegetarian|veg only|pure veg|jain)\b/i],
  ["vegan", /\b(vegan|plant[- ]based)\b/i],
  ["halal", /\bhalal\b/i],
  ["outdoor", /\b(outdoor|garden|lawn|open[- ]air|beachside)\b/i],
  ["indoor", /\b(indoor|banquet hall|air[- ]conditioned)\b/i],
  ["luxury", /\b(luxury|premium|high[- ]end|five[- ]star)\b/i],
  ["budget", /\b(budget|affordable|low[- ]cost|cheap|value)\b/i],
  ["sustainable", /\b(sustainable|eco[- ]friendly|zero[- ]waste|green)\b/i],
  ["live music", /\b(live music|live band|band|singer)\b/i],
  ["dj", /\b(dj|dance floor)\b/i],
  ["intimate", /\b(intimate|small|cosy|cozy|simple)\b/i],
  ["grand", /\b(grand|big|large|lavish|200\+)\b/i],
  ["destination", /\b(destination|weekend away|outstation)\b/i],
  ["accessible", /\b(accessible|wheelchair|step[- ]free)\b/i],
  ["kids", /\b(kids|children|family[- ]friendly|all ages)\b/i],
  ["evening", /\b(evening|night|sunset|dinner)\b/i],
  ["traditional", /\b(traditional|cultural|vedic|classic|regional)\b/i],
  ["modern", /\b(modern|minimal|minimalist|contemporary)\b/i],
  ["corporate", /\b(professional|branded|business)\b/i],
  ["heritage", /\b(heritage|haveli|palace|fort|colonial)\b/i],
  ["beach", /\bbeach\b/i],
  ["no alcohol", /\b(no alcohol|dry event|alcohol[- ]free)\b/i],
  ["pet friendly", /\b(pet[- ]friendly|dogs welcome)\b/i],
];

export const MONTHS: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

export const MONTH_PATTERN = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join("|");

export const EXTRACTION_DEFAULTS = {
  budgetInr: 300_000,
  guestCount: 100,
  daysAhead: 120,
};
