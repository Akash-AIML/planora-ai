import { NextResponse } from "next/server";
import { checkRateLimit, type RateLimitConfig } from "./rate-limit";
import { computeClientFingerprint, verifySessionToken, type SessionPayload } from "./session";
import { sanitizeObject, detectPromptInjection } from "./sanitization";

export interface GuardOptions {
  allowedMethods?: string[];
  maxPayloadBytes?: number;
  rateLimit?: RateLimitConfig;
  requireValidSession?: boolean;
}

export interface GuardResult<T = unknown> {
  success: boolean;
  response?: NextResponse;
  clientIp: string;
  fingerprint: string;
  session?: SessionPayload;
  sessionHijackAttempt?: boolean;
  sanitizedBody?: T;
  promptInjectionDetected?: boolean;
}

const DEFAULT_OPTIONS: GuardOptions = {
  allowedMethods: ["POST"],
  maxPayloadBytes: 64 * 1024, // 64 KB
  rateLimit: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 req/min
  requireValidSession: false,
};

/**
 * Extracts the true client IP from standard proxy headers
 */
export function getClientIp(req: Request): string {
  const headers = req.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Left-most IP is the original client
    const ip = forwardedFor.split(",")[0]?.trim();
    if (ip) return ip;
  }
  const realIp = headers.get("x-real-ip") || headers.get("cf-connecting-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

/**
 * Validates incoming API requests against DoS, abuse, malformed payloads, CSRF, and session hijacking.
 */
export async function guardApiRequest<T = unknown>(
  req: Request,
  customOptions?: Partial<GuardOptions>
): Promise<GuardResult<T>> {
  const options: GuardOptions = { ...DEFAULT_OPTIONS, ...customOptions };
  const clientIp = getClientIp(req);
  const fingerprint = computeClientFingerprint(req.headers, clientIp);

  // 1. Method Validation
  if (options.allowedMethods && !options.allowedMethods.includes(req.method)) {
    return {
      success: false,
      clientIp,
      fingerprint,
      response: NextResponse.json(
        { error: `Method ${req.method} not allowed. Supported: ${options.allowedMethods.join(", ")}` },
        { status: 405, headers: { Allow: options.allowedMethods.join(", ") } }
      ),
    };
  }

  // 2. Content-Length & Payload Size Limit (Anti-Memory Exhaustion)
  const contentLength = req.headers.get("content-length");
  if (contentLength && Number.parseInt(contentLength, 10) > (options.maxPayloadBytes || 64 * 1024)) {
    return {
      success: false,
      clientIp,
      fingerprint,
      response: NextResponse.json(
        { error: "Payload too large. Maximum allowed size is 64KB." },
        { status: 413 }
      ),
    };
  }

  // 3. Content-Type Header Enforcement for Mutation Requests
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return {
        success: false,
        clientIp,
        fingerprint,
        response: NextResponse.json(
          { error: "Invalid Content-Type. Expected application/json." },
          { status: 415 }
        ),
      };
    }
  }

  // 4. Rate Limiting (Anti-DoS / Brute Force)
  if (options.rateLimit) {
    const rateResult = checkRateLimit(clientIp, options.rateLimit);
    if (!rateResult.allowed) {
      return {
        success: false,
        clientIp,
        fingerprint,
        response: NextResponse.json(
          {
            error: "Too many requests. Please slow down and try again.",
            retryAfterSeconds: rateResult.retryAfterSeconds,
          },
          {
            status: 429,
            headers: {
              "Retry-After": rateResult.retryAfterSeconds.toString(),
              "X-RateLimit-Limit": options.rateLimit.maxRequests.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": rateResult.resetMs.toString(),
            },
          }
        ),
      };
    }
  }

  // 5. Anti-Session Hijacking Check
  let sessionPayload: SessionPayload | undefined;
  let sessionHijackAttempt = false;

  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/planora_session=([^;]+)/);
  const sessionToken = match?.[1];

  if (sessionToken) {
    const verification = verifySessionToken(sessionToken, fingerprint);
    if (verification.valid && verification.session) {
      sessionPayload = verification.session;
    } else if (verification.reason === "hijacked") {
      sessionHijackAttempt = true;
      console.warn(`[SECURITY ALERT] Session hijacking detected from IP ${clientIp}! Fingerprint mismatch.`);
      if (options.requireValidSession) {
        return {
          success: false,
          clientIp,
          fingerprint,
          sessionHijackAttempt: true,
          response: NextResponse.json(
            { error: "Security alert: Session validation failed due to client mismatch. Please re-authenticate." },
            { status: 401 }
          ),
        };
      }
    } else if (options.requireValidSession) {
      return {
        success: false,
        clientIp,
        fingerprint,
        response: NextResponse.json(
          { error: `Session invalid: ${verification.reason}` },
          { status: 401 }
        ),
      };
    }
  } else if (options.requireValidSession) {
    return {
      success: false,
      clientIp,
      fingerprint,
      response: NextResponse.json(
        { error: "Authentication session required." },
        { status: 401 }
      ),
    };
  }

  // 6. JSON Parse & Sanitization
  let sanitizedBody: T | undefined;
  let promptInjectionDetected = false;

  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    try {
      const rawJson = await req.json();
      sanitizedBody = sanitizeObject(rawJson) as T;

      // Check text fields for prompt injection
      const textSample = JSON.stringify(sanitizedBody);
      const injectionCheck = detectPromptInjection(textSample);
      if (injectionCheck.suspicious) {
        promptInjectionDetected = true;
      }
    } catch {
      return {
        success: false,
        clientIp,
        fingerprint,
        response: NextResponse.json(
          { error: "Malformed JSON body in request." },
          { status: 400 }
        ),
      };
    }
  }

  return {
    success: true,
    clientIp,
    fingerprint,
    session: sessionPayload,
    sessionHijackAttempt,
    sanitizedBody,
    promptInjectionDetected,
  };
}
