/**
 * Planora AI — Centralized Configuration & Constants
 * Defines business logic thresholds, model cascade priorities, and API security parameters.
 */

export const SECURITY_CONFIG = {
  MAX_PAYLOAD_BYTES: 64 * 1024, // 64 KB
  RATE_LIMIT_REQUESTS_PER_MIN: 25,
  RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute
  SESSION_TTL_MS: 24 * 60 * 60 * 1000, // 24 hours
  SESSION_INACTIVITY_MS: 2 * 60 * 60 * 1000, // 2 hours
} as const;

export const LLM_CONFIG = {
  DEFAULT_MODEL: "gemma-4-26b-a4b-it",
  REQUEST_TIMEOUT_MS: 15000, // 15 seconds
  CANDIDATE_MODELS: [
    "gemma-4-26b-a4b-it",
    "gemini-flash-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemma-4-31b-it",
  ] as const,
} as const;

export const UI_CONFIG = {
  TOAST_DURATION_MS: 3500,
  MAX_BRIEF_LENGTH: 5000,
} as const;
