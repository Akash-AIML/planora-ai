import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanJsonOutput, extractPlanWithLLM, normalizeModelName } from "../llm";
import { LLM_CONFIG } from "@/lib/constants/config";

const FAKE_KEY = "test-key-not-a-real-secret-123";

// Unique candidate models in the order the service tries them (default model first).
const MODELS = Array.from(
  new Set<string>([LLM_CONFIG.DEFAULT_MODEL, ...LLM_CONFIG.CANDIDATE_MODELS])
);

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: "Royal Heritage Wedding",
    eventType: "wedding",
    city: "Jaipur",
    eventDate: "2026-11-28",
    guestCount: 120,
    budgetInr: 1500000,
    preferences: ["outdoor", "heritage"],
    assumptions: ["Assumed three-day celebration"],
    missingFields: [],
    ideas: [
      {
        title: "Sunset baraat",
        description: "Procession with dhol and a decorated horse.",
        category: "Entertainment",
        estimatedInr: 50000,
      },
      {
        title: "Heritage photo wall",
        description: "Vintage frames at the venue entrance.",
        category: "Decor",
      },
    ],
    ...overrides,
  };
}

function envelope(text: string, extraParts: object[] = []) {
  return { candidates: [{ content: { parts: [...extraParts, { text }] } }] };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("LLM extraction service", () => {
  const fetchMock = vi.fn();
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("cleanJsonOutput", () => {
    it("strips ```json fences", () => {
      expect(cleanJsonOutput('```json\n{"a":1}\n```')).toBe('{"a":1}');
    });

    it("strips plain ``` fences", () => {
      expect(cleanJsonOutput('```\n{"a":1}\n```')).toBe('{"a":1}');
    });

    it("leaves unfenced JSON unchanged apart from surrounding whitespace", () => {
      expect(cleanJsonOutput('  {"a":1}  ')).toBe('{"a":1}');
    });
  });

  describe("normalizeModelName", () => {
    it("uses the default model when none is provided", () => {
      expect(normalizeModelName()).toBe(LLM_CONFIG.DEFAULT_MODEL);
    });

    it("maps a legacy alias to the current model name", () => {
      expect(normalizeModelName("flash")).toBe("gemini-flash-latest");
    });

    it("passes unknown model names through, trimmed", () => {
      expect(normalizeModelName("  my-custom-model  ")).toBe("my-custom-model");
    });
  });

  describe("extractPlanWithLLM: successful responses", () => {
    it("maps a valid JSON response to an extraction and AI ideas", async () => {
      fetchMock.mockImplementation(async () =>
        jsonResponse(envelope(JSON.stringify(validPayload())))
      );

      const result = await extractPlanWithLLM("A royal wedding in Jaipur", FAKE_KEY);

      expect(result.success).toBe(true);
      expect(result.source).toBe(`llm (${MODELS[0]})`);
      expect(result.extraction?.requirements).toMatchObject({
        title: "Royal Heritage Wedding",
        eventType: "wedding",
        city: "Jaipur",
        eventDate: "2026-11-28",
        guestCount: 120,
        budgetInr: 1500000,
      });
      expect(result.extraction?.source).toBe("llm+heuristic");
      expect(result.ideas).toHaveLength(2);
      expect(result.ideas?.every((idea) => idea.source === "ai")).toBe(true);
      expect(result.ideas?.[0].estimatedInr).toBe(50000);
      expect(result.ideas?.[1].estimatedInr).toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("accepts JSON wrapped in a Markdown code fence", async () => {
      const fenced = "```json\n" + JSON.stringify(validPayload()) + "\n```";
      fetchMock.mockImplementation(async () => jsonResponse(envelope(fenced)));

      const result = await extractPlanWithLLM("brief", FAKE_KEY);

      expect(result.success).toBe(true);
      expect(result.extraction?.requirements.city).toBe("Jaipur");
    });

    it("ignores reasoning ('thought') parts and reads the final JSON part", async () => {
      fetchMock.mockImplementation(async () =>
        jsonResponse(
          envelope(JSON.stringify(validPayload()), [
            { text: "Let me think about the dates first...", thought: true },
          ])
        )
      );

      const result = await extractPlanWithLLM("brief", FAKE_KEY);

      expect(result.success).toBe(true);
      expect(result.extraction?.requirements.eventType).toBe("wedding");
    });

    it("derives confidence from missing fields with a floor of 0.7", async () => {
      fetchMock.mockImplementation(async () =>
        jsonResponse(envelope(JSON.stringify(validPayload({ missingFields: [] }))))
      );
      const complete = await extractPlanWithLLM("brief", FAKE_KEY);
      expect(complete.extraction?.confidence).toBeCloseTo(1, 5);

      fetchMock.mockImplementation(async () =>
        jsonResponse(
          envelope(JSON.stringify(validPayload({ missingFields: ["city", "date", "guests"] })))
        )
      );
      const sparse = await extractPlanWithLLM("brief", FAKE_KEY);
      expect(sparse.extraction?.confidence).toBeCloseTo(0.7, 5);
    });
  });

  describe("extractPlanWithLLM: model cascade and failures", () => {
    it("falls through to the next model after a non-success HTTP status", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ error: "overloaded" }, 500))
        .mockResolvedValueOnce(jsonResponse(envelope(JSON.stringify(validPayload()))));

      const result = await extractPlanWithLLM("brief", FAKE_KEY);

      expect(result.success).toBe(true);
      expect(result.source).toBe(`llm (${MODELS[1]})`);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(String(fetchMock.mock.calls[1][0])).toContain(`models/${MODELS[1]}:`);
    });

    it("falls through after a rejected fetch (network error or timeout)", async () => {
      fetchMock
        .mockRejectedValueOnce(new DOMException("The operation timed out", "TimeoutError"))
        .mockResolvedValueOnce(jsonResponse(envelope(JSON.stringify(validPayload()))));

      const result = await extractPlanWithLLM("brief", FAKE_KEY);

      expect(result.success).toBe(true);
      expect(result.source).toBe(`llm (${MODELS[1]})`);
    });

    it("returns a failure (without throwing) when every model returns an error status", async () => {
      fetchMock.mockImplementation(async () => jsonResponse({ error: "down" }, 503));

      const result = await extractPlanWithLLM("brief", FAKE_KEY);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.extraction).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledTimes(MODELS.length);
    });

    it("returns a failure when every fetch rejects, without leaking the API key", async () => {
      fetchMock.mockRejectedValue(new Error("network down"));

      const result = await extractPlanWithLLM("brief", FAKE_KEY);

      expect(result.success).toBe(false);
      expect(JSON.stringify(result)).not.toContain(FAKE_KEY);
      expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(FAKE_KEY);
    });

    it("skips responses that are not valid JSON", async () => {
      fetchMock.mockImplementation(async () => jsonResponse(envelope("this is { not json")));

      const result = await extractPlanWithLLM("brief", FAKE_KEY);

      expect(result.success).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(MODELS.length);
    });

    it("skips responses that violate the extraction schema", async () => {
      const invalid = validPayload({ eventDate: "28-11-2026", guestCount: -5 });
      fetchMock.mockImplementation(async () => jsonResponse(envelope(JSON.stringify(invalid))));

      const result = await extractPlanWithLLM("brief", FAKE_KEY);

      expect(result.success).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(MODELS.length);
    });

    it("skips responses with no candidates", async () => {
      fetchMock.mockImplementation(async () => jsonResponse({ candidates: [] }));

      const result = await extractPlanWithLLM("brief", FAKE_KEY);

      expect(result.success).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(MODELS.length);
    });
  });
});
