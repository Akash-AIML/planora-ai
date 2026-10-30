import { NextResponse } from "next/server";
import { z } from "zod";
import { parseEventBrief } from "@/lib/domain/extraction";
import { generateIdeas } from "@/lib/domain/ideas";
import { guardApiRequest } from "@/lib/security/middleware-guard";
import { extractPlanWithLLM } from "@/lib/services/llm";
import { SECURITY_CONFIG, UI_CONFIG } from "@/lib/constants/config";

const RequestSchema = z
  .object({
    brief: z.string().min(1).max(UI_CONFIG.MAX_BRIEF_LENGTH).optional(),
    prompt: z.string().min(1).max(UI_CONFIG.MAX_BRIEF_LENGTH).optional(),
  })
  .refine((data) => Boolean(data.brief?.trim() || data.prompt?.trim()), {
    message: "Either brief or prompt is required.",
  });

/**
 * POST /api/plan
 * Robust event requirement extraction and personalized concept generator.
 * Protected by sliding-window rate limiting, anti-session hijacking, and input sanitization.
 */
export async function POST(req: Request) {
  try {
    // 1. Enforce API security guard (Method, Payload Size, Rate Limit, Anti-Hijacking)
    const guard = await guardApiRequest(req, {
      allowedMethods: ["POST"],
      maxPayloadBytes: SECURITY_CONFIG.MAX_PAYLOAD_BYTES,
      rateLimit: {
        maxRequests: SECURITY_CONFIG.RATE_LIMIT_REQUESTS_PER_MIN,
        windowMs: SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS,
      },
    });

    if (!guard.success) {
      return guard.response!;
    }

    if (guard.sessionHijackAttempt) {
      console.warn(`[SECURITY ALERT] Session hijacking detected from IP: ${guard.clientIp}`);
    }

    // 2. Validate sanitized payload
    const parsedInput = RequestSchema.safeParse(guard.sanitizedBody);
    if (!parsedInput.success) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const brief = (parsedInput.data.brief || parsedInput.data.prompt)!.trim();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // 3. Delegate to GenAI Service if API Key is configured
    if (apiKey) {
      const llmResult = await extractPlanWithLLM(brief, apiKey, process.env.GEMINI_MODEL);
      if (llmResult.success && llmResult.extraction) {
        const ideas =
          llmResult.ideas && llmResult.ideas.length > 0
            ? llmResult.ideas
            : generateIdeas(llmResult.extraction.requirements, "event");

        return NextResponse.json({
          extraction: llmResult.extraction,
          ideas,
          source: llmResult.source,
        });
      }
    }

    // 4. Deterministic fallback (offline, keyless mode, or when all LLM models fail)
    const fallbackExtraction = parseEventBrief(brief);
    const fallbackIdeas = generateIdeas(fallbackExtraction.requirements, "event");

    return NextResponse.json({
      extraction: fallbackExtraction,
      ideas: fallbackIdeas,
      source: "heuristic",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
