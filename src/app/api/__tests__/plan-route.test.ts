import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/llm", () => ({ extractPlanWithLLM: vi.fn() }));

import { extractPlanWithLLM } from "@/lib/services/llm";
import { POST } from "../plan/route";
import { resetRateLimitStore } from "@/lib/security/rate-limit";
import type { EventIdea, ExtractionResult } from "@/lib/domain/types";

const llm = vi.mocked(extractPlanWithLLM);
const FAKE_KEY = "fake-test-key-should-never-appear";

function post(body: unknown) {
  return POST(
    new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.10" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );
}

const llmExtraction: ExtractionResult = {
  requirements: {
    title: "LLM Planned Wedding",
    eventType: "wedding",
    city: "Udaipur",
    eventDate: "2026-12-05",
    guestCount: 90,
    budgetInr: 900000,
    preferences: ["lakeside"],
    notes: "from llm",
  },
  confidence: 0.9,
  assumptions: [],
  missingFields: [],
  source: "llm+heuristic",
};

const llmIdea: EventIdea = {
  id: "ai-idea-1",
  eventId: "",
  title: "Lakeside lantern walk",
  description: "Guests walk a lantern-lit path.",
  category: "Decor",
  estimatedInr: 25000,
  source: "ai",
};

describe("POST /api/plan behavior", () => {
  beforeEach(() => {
    resetRateLimitStore();
    llm.mockReset();
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GOOGLE_API_KEY", "");
    vi.stubEnv("GEMINI_MODEL", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("without an API key (deterministic heuristic mode)", () => {
    it("extracts requirements and returns ideas without calling the LLM", async () => {
      const res = await post({ brief: "Birthday party in Pune for 40 guests with 50k budget" });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.source).toBe("heuristic");
      expect(data.extraction.requirements).toMatchObject({
        eventType: "birthday",
        city: "Pune",
        guestCount: 40,
        budgetInr: 50000,
      });
      expect(Array.isArray(data.ideas)).toBe(true);
      expect(data.ideas.length).toBeGreaterThan(0);
      expect(llm).not.toHaveBeenCalled();
    });

    it("accepts the 'prompt' field used by the client", async () => {
      const res = await post({ prompt: "Corporate summit in Delhi for 150 attendees" });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.extraction.requirements.eventType).toBe("corporate");
    });
  });

  describe("input validation", () => {
    it.each([
      ["no brief or prompt", {}],
      ["an empty brief", { brief: "" }],
      ["a whitespace-only brief", { brief: "   " }],
      ["a non-string brief", { brief: 123 }],
    ])("rejects %s with 400", async (_label, body) => {
      const res = await post(body);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid request body.");
      expect(llm).not.toHaveBeenCalled();
    });

    it("rejects malformed JSON with 400", async () => {
      const res = await post("{not valid json");

      expect(res.status).toBe(400);
    });
  });

  describe("with an API key (GenAI mode)", () => {
    beforeEach(() => {
      vi.stubEnv("GEMINI_API_KEY", FAKE_KEY);
    });

    it("returns the LLM extraction and ideas, using the trimmed brief", async () => {
      llm.mockResolvedValue({
        success: true,
        extraction: llmExtraction,
        ideas: [llmIdea],
        source: "llm (test-model)",
      });

      const res = await post({ brief: "  A wedding in Udaipur  " });
      const text = await res.text();
      const data = JSON.parse(text);

      expect(res.status).toBe(200);
      expect(data.source).toBe("llm (test-model)");
      expect(data.extraction.requirements.city).toBe("Udaipur");
      expect(data.ideas).toEqual([llmIdea]);
      expect(llm.mock.calls[0][0]).toBe("A wedding in Udaipur");
      expect(text).not.toContain(FAKE_KEY);
    });

    it("falls back to generated ideas when the LLM returns none", async () => {
      llm.mockResolvedValue({
        success: true,
        extraction: llmExtraction,
        ideas: [],
        source: "llm (test-model)",
      });

      const res = await post({ brief: "A wedding in Udaipur" });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ideas.length).toBeGreaterThan(0);
    });

    it("falls back to the deterministic parser when the LLM service fails", async () => {
      llm.mockResolvedValue({ success: false, error: "All candidate models failed or timed out." });

      const res = await post({ brief: "Birthday party in Pune for 40 guests with 50k budget" });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.source).toBe("heuristic");
      expect(data.extraction.requirements.city).toBe("Pune");
    });

    it("returns a generic 500 without leaking internal error details", async () => {
      llm.mockRejectedValue(new Error("db password=hunter2 at /srv/app/secret.ts"));

      const res = await post({ brief: "A wedding in Udaipur" });
      const text = await res.text();

      expect(res.status).toBe(500);
      expect(JSON.parse(text)).toEqual({ error: "Internal server error" });
      expect(text).not.toContain("hunter2");
      expect(text).not.toContain(FAKE_KEY);
    });
  });
});
