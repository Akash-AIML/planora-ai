import { NextResponse } from "next/server";
import {
  generateSessionToken,
  verifySessionToken,
  computeClientFingerprint,
  buildSessionCookieHeader,
} from "@/lib/security/session";
import { getClientIp } from "@/lib/security/middleware-guard";

/**
 * GET /api/auth/session
 * Returns current session status or issues a fresh cryptographically signed session cookie
 */
export async function GET(req: Request) {
  const clientIp = getClientIp(req);
  const fingerprint = computeClientFingerprint(req.headers, clientIp);
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/planora_session=([^;]+)/);
  const existingToken = match?.[1];

  if (existingToken) {
    const result = verifySessionToken(existingToken, fingerprint);
    if (result.valid && result.session) {
      return NextResponse.json({
        authenticated: true,
        sessionId: result.session.sessionId,
        clientId: result.session.clientId,
        issuedAt: new Date(result.session.issuedAt).toISOString(),
        expiresAt: new Date(result.session.expiresAt).toISOString(),
        securityStatus: "verified",
      });
    }

    if (result.reason === "hijacked") {
      return NextResponse.json(
        {
          authenticated: false,
          securityStatus: "hijacking_attempt_detected",
          message: "Session fingerprint mismatch. Possible session hijacking detected.",
        },
        { status: 403 }
      );
    }
  }

  // Issue new session
  const clientId = `client_${Date.now()}`;
  const { token, session } = generateSessionToken(clientId, fingerprint);
  const cookieVal = buildSessionCookieHeader(token);

  return NextResponse.json(
    {
      authenticated: true,
      sessionId: session.sessionId,
      clientId: session.clientId,
      issuedAt: new Date(session.issuedAt).toISOString(),
      expiresAt: new Date(session.expiresAt).toISOString(),
      securityStatus: "new_session_issued",
    },
    {
      headers: {
        "Set-Cookie": cookieVal,
      },
    }
  );
}

/**
 * POST /api/auth/session
 * Rotate session token (Anti-Session Fixation)
 */
export async function POST(req: Request) {
  const clientIp = getClientIp(req);
  const fingerprint = computeClientFingerprint(req.headers, clientIp);
  const clientId = `client_${Date.now()}`;
  const { token, session } = generateSessionToken(clientId, fingerprint);
  const cookieVal = buildSessionCookieHeader(token);

  return NextResponse.json(
    {
      success: true,
      message: "Session rotated securely",
      sessionId: session.sessionId,
    },
    {
      headers: {
        "Set-Cookie": cookieVal,
      },
    }
  );
}
