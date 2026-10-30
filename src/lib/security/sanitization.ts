/**
 * Input sanitization and prompt injection defense utilities.
 * Defends against XSS, prototype pollution, and LLM prompt extraction/manipulation.
 */

const DANGEROUS_HTML_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:[^"']*/gi,
  /data:text\/html[^"']*/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /on\w+\s*=\s*[^>\s]+/gi,
];

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous|prior)\s+(?:instructions|prompts|rules)/i,
  /disregard\s+(?:all\s+)?(?:previous|prior)\s+(?:instructions|guidelines)/i,
  /you\s+are\s+now\s+(?:unrestricted|in\s+developer\s+mode|dan)/i,
  /reveal\s+(?:the\s+)?(?:system\s+prompt|developer\s+instructions|hidden\s+rules)/i,
  /override\s+system\s+instructions/i,
  /bypass\s+(?:safety|content\s+filter)/i,
];

/**
 * Strips dangerous HTML tags, inline event handlers, and javascript: protocols.
 */
export function sanitizeString(input: unknown, maxLength = 5000): string {
  if (typeof input !== "string") return "";
  
  // Truncate to maximum allowed length to prevent memory buffer exhaustion
  let sanitized = input.slice(0, maxLength);

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  // Strip dangerous HTML/JS vectors
  for (const pattern of DANGEROUS_HTML_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }

  // Basic HTML entity encoding for remaining brackets to prevent DOM injection
  sanitized = sanitized
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return sanitized.trim();
}

/**
 * Checks if a user prompt contains known LLM jailbreak or prompt injection attempts.
 */
export function detectPromptInjection(input: string): { suspicious: boolean; matchedPatterns: string[] } {
  if (!input || typeof input !== "string") {
    return { suspicious: false, matchedPatterns: [] };
  }

  const matchedPatterns: string[] = [];
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      matchedPatterns.push(pattern.source);
    }
  }

  return {
    suspicious: matchedPatterns.length > 0,
    matchedPatterns,
  };
}

/**
 * Recursively sanitizes an object, stripping prototype pollution keys (__proto__, constructor, prototype)
 * and sanitizing any nested string values.
 */
export function sanitizeObject<T>(input: T, depth = 0, maxDepth = 6): T {
  if (depth > maxDepth || input === null || typeof input !== "object") {
    if (typeof input === "string") {
      return sanitizeString(input) as unknown as T;
    }
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeObject(item, depth + 1, maxDepth)) as unknown as T;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    // Defend against prototype pollution
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }

    sanitized[key] = sanitizeObject(value, depth + 1, maxDepth);
  }

  return sanitized as T;
}
