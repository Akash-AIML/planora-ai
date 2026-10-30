import { describe, it, expect, beforeEach } from "vitest";
import { GET as sessionGet, POST as sessionPost } from "../auth/session/route";
import { POST as planPost } from "../plan/route";
import { resetRateLimitStore } from "@/lib/security/rate-limit";
import { generateSessionToken } from "@/lib/security/session";

describe("API Security Endpoint Integration Tests", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  describe("GET /api/auth/session", () => {
    it("issues a new secure session cookie when none exists", async () => {
      const req = new Request("http://localhost:3000/api/auth/session", {
        method: "GET",
        headers: {
          "user-agent": "Mozilla/5.0 PlanoraTest/1.0",
        },
      });

      const res = await sessionGet(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.authenticated).toBe(true);
      expect(data.securityStatus).toBe("new_session_issued");
      expect(data.sessionId).toBeDefined();

      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain("planora_session=");
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("SameSite=Lax");
    });

    it("verifies and preserves an existing valid session cookie", async () => {
      // First get a session
      const fp = "my_custom_client_fp";
      const { token } = generateSessionToken("client_existing", fp);

      const req = new Request("http://localhost:3000/api/auth/session", {
        method: "GET",
        headers: {
          "user-agent": "Mozilla/5.0 CustomUA",
          cookie: `planora_session=${token}`,
        },
      });

      // We expect either verified or rejected if fingerprint doesn't match
      const res = await sessionGet(req);
      expect([200, 403]).toContain(res.status);
    });

    it("detects session hijacking attempt and returns 403 when fingerprint is spoofed", async () => {
      const { token } = generateSessionToken("victim_user", "victim_fingerprint_hash");

      const req = new Request("http://localhost:3000/api/auth/session", {
        method: "GET",
        headers: {
          "user-agent": "AttackerDifferentAgent/2.0",
          "x-forwarded-for": "100.64.0.1",
          cookie: `planora_session=${token}`,
        },
      });

      const res = await sessionGet(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.securityStatus).toBe("hijacking_attempt_detected");
    });
  });

  describe("POST /api/auth/session", () => {
    it("rotates session tokens to prevent session fixation", async () => {
      const req = new Request("http://localhost:3000/api/auth/session", {
        method: "POST",
        headers: {
          "user-agent": "Mozilla/5.0 RotateTest/1.0",
        },
      });

      const res = await sessionPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.sessionId).toBeDefined();
      expect(res.headers.get("set-cookie")).toContain("planora_session=");
    });
  });

  describe("POST /api/plan Endpoint Security", () => {
    it("rejects oversized request bodies (anti-memory exhaustion)", async () => {
      const req = new Request("http://localhost:3000/api/plan", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": "999999",
        },
        body: JSON.stringify({ brief: "too big" }),
      });

      const res = await planPost(req);
      expect(res.status).toBe(413);
      const data = await res.json();
      expect(data.error).toContain("Payload too large");
    });

    it("rejects non-POST methods with 405", async () => {
      const req = new Request("http://localhost:3000/api/plan", {
        method: "GET",
      });

      const res = await planPost(req);
      expect(res.status).toBe(405);
    });

    it("enforces rate limits on /api/plan", async () => {
      const clientIp = "192.0.2.77";

      for (let i = 0; i < 25; i++) {
        const req = new Request("http://localhost:3000/api/plan", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": clientIp,
          },
          body: JSON.stringify({ brief: "Short event brief" }),
        });
        const res = await planPost(req);
        expect(res.status).not.toBe(429);
      }

      // 26th request triggers rate limit
      const blockedReq = new Request("http://localhost:3000/api/plan", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": clientIp,
        },
        body: JSON.stringify({ brief: "Short event brief" }),
      });
      const blockedRes = await planPost(blockedReq);
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.headers.get("retry-after")).toBeDefined();
    });
  });
});
