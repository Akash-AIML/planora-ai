import crypto from "crypto";
import { SECURITY_CONFIG } from "@/lib/constants/config";

export interface SessionPayload {
  sessionId: string;
  clientId: string;
  fingerprintHash: string;
  issuedAt: number;
  expiresAt: number;
  lastActiveAt: number;
}

export interface SessionVerificationResult {
  valid: boolean;
  reason?: "tampered" | "expired" | "hijacked" | "invalid_format";
  session?: SessionPayload;
}

// In-memory or fallback secret when SESSION_SECRET env is not explicitly set
const DEFAULT_SECRET = process.env.SESSION_SECRET || "planora-ai-secure-salt-h4ck2sk1ll-2026-fallback-secret-key-32b";
const SESSION_TTL_MS = SECURITY_CONFIG.SESSION_TTL_MS;
const INACTIVITY_TIMEOUT_MS = SECURITY_CONFIG.SESSION_INACTIVITY_MS;

/**
 * Computes a privacy-preserving fingerprint from client headers and IP.
 * Used to bind the session token to the client device/network, preventing session hijacking.
 */
export function computeClientFingerprint(headers: Headers | Record<string, string | string[] | undefined>, clientIp: string): string {
  const getHeader = (name: string): string => {
    if (typeof (headers as Headers).get === "function") {
      return (headers as Headers).get(name) || "";
    }
    const val = (headers as Record<string, string | string[] | undefined>)[name.toLowerCase()];
    if (Array.isArray(val)) return val[0] || "";
    return typeof val === "string" ? val : "";
  };

  const userAgent = getHeader("user-agent").trim();
  const acceptLang = getHeader("accept-language").split(",")[0] || "";
  
  // Truncate IP to /24 subnet or hash prefix for IPv6 to tolerate minor mobile IP shifts while catching cross-region hijacking
  const ipPrefix = clientIp.includes(":") ? clientIp.split(":").slice(0, 3).join(":") : clientIp.split(".").slice(0, 3).join(".");

  const raw = `${userAgent}|${acceptLang}|${ipPrefix}`;
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

/**
 * Generates a cryptographically signed session token bound to the client fingerprint.
 */
export function generateSessionToken(
  clientId: string,
  fingerprint: string,
  secret = DEFAULT_SECRET
): { token: string; session: SessionPayload } {
  const now = Date.now();
  const session: SessionPayload = {
    sessionId: crypto.randomBytes(24).toString("hex"),
    clientId,
    fingerprintHash: fingerprint,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_MS,
    lastActiveAt: now,
  };

  const payloadStr = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payloadStr).digest("base64url");
  const token = `${payloadStr}.${signature}`;

  return { token, session };
}

/**
 * Verifies a session token, checking cryptographic HMAC signature, expiration, and fingerprint.
 * Employs constant-time timing-safe comparison to prevent timing attacks.
 */
export function verifySessionToken(
  token: string,
  currentFingerprint?: string,
  secret = DEFAULT_SECRET
): SessionVerificationResult {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false, reason: "invalid_format" };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, reason: "invalid_format" };
  }

  const [payloadStr, signature] = parts;

  // 1. Verify HMAC signature using constant-time comparison
  const expectedSig = crypto.createHmac("sha256", secret).update(payloadStr).digest("base64url");
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, reason: "tampered" };
  }

  // 2. Decode and parse session payload
  let session: SessionPayload;
  try {
    const jsonStr = Buffer.from(payloadStr, "base64url").toString("utf-8");
    session = JSON.parse(jsonStr);
  } catch {
    return { valid: false, reason: "invalid_format" };
  }

  const now = Date.now();

  // 3. Check expiration & inactivity
  if (now > session.expiresAt || (session.lastActiveAt && now - session.lastActiveAt > INACTIVITY_TIMEOUT_MS)) {
    return { valid: false, reason: "expired", session };
  }

  // 4. Anti-Session Hijacking: Fingerprint binding validation
  if (currentFingerprint) {
    const currentBuf = Buffer.from(currentFingerprint);
    const expectedBuf = Buffer.from(session.fingerprintHash);
    if (currentBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(currentBuf, expectedBuf)) {
      return { valid: false, reason: "hijacked", session };
    }
  }

  return { valid: true, session };
}

/**
 * Builds the standard Set-Cookie header value for the secure session cookie.
 */
export function buildSessionCookieHeader(token: string, maxAgeSeconds = 86400, isProduction = process.env.NODE_ENV === "production"): string {
  const secureFlag = isProduction ? "; Secure" : "";
  return `planora_session=${token}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly${secureFlag}; SameSite=Lax`;
}
