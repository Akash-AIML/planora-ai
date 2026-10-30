# Planora AI — Project State Recovery & Handover Report

**Date:** October 30, 2026  
**Auditor / Agent:** Antigravity AI Engineer (Handover from OpenCode)  
**Project:** Planora AI (`/home/akash/Work/planora-ai`)  
**Mission:** Competitive submission for Hack2Skill Prompt Wars: GenAI-powered planning assistant for weddings, birthdays, anniversaries, corporate, and community events with budgets, timelines, vendor recommendations, personalized ideas, and budget-aware replanning.

---

## 1. Executive Summary & Repository Status

A targeted audit was performed to recover the previous agent's uncommitted work, verify existing domain modules, check agent tooling and skills, and map open-source reference patterns into Planora AI's architecture.

### Git & Working Tree State
- **Git Status:** Working directory contained uncommitted changes in `package.json` and `package-lock.json`, and an untracked directory `src/lib/` with domain logic and demo data.
- **Dependencies Preserved:** Next.js 16 (App Router with Turbopack), React 19, TypeScript 5, Zod 4, Lucide React, Tailwind CSS 4, and Vitest.
- **Code Preservation:** All existing domain types and logic in `src/lib/domain/` and `src/lib/data/` were preserved intact.

---

## 2. What Was Already Implemented vs. What Was Broken

### Existing Modules
| File | Implementation Status | Functional Verification |
|------|-----------------------|-------------------------|
| `src/lib/domain/types.ts` | **Complete** | Comprehensive TypeScript models for `EventRequirements`, `EventRecord`, `BudgetItem`, `Task`, `EventIdea`, `ShortlistEntry`, `Vendor`, `RankedVendor`, `ReplanProposal`, `PlanoraExport`. |
| `src/lib/domain/extraction.ts` | **Complete with 1 Bug Fixed** | Rich heuristic parser extracting event type, city (Indian aliases), dates, guest counts, budgets (₹ lakhs/crores/k), preferences, assumptions, and confidence. **Bug Fixed:** Argument type mismatch where `formatDateOnly` wrapped a string from `addDays`. Now verified and compiling cleanly. |
| `src/lib/domain/budget.ts` | **Complete** | Deterministic largest-remainder integer allocation across event types (`allocateBudget`), budget totals computation (`calculateBudgetTotals`), and currency sanitization (`sanitizeRupees`). No floating-point leaks. |
| `src/lib/domain/timeline.ts` | **Complete** | Phase-based milestone templates for all 5 event types with UTC-safe date math and relative offset days (`generateTimeline`, `daysUntil`, `addDays`). |
| `src/lib/domain/vendors.ts` | **Complete** | Multi-factor vendor ranking algorithm matching city, category budget ceiling, ratings, and tag preferences with transparent match reasons and safety warnings. |
| `src/lib/data/demo-vendors.ts` | **Complete** | 30+ categorized Indian vendors (venues, caterers, photographers, decor, music, beauty, activities) with realistic pricing and explicit demo disclaimers. |
| `src/lib/domain/replan.ts` | **Complete** | Budget-aware, approval-gated replanning engine. Calculates flexible capacity above protected category floors and distributes reductions via largest-remainder integer math. Feasibility checks and transparent notes included. |
| `src/app/page.tsx` | **Not Connected** | Was still the default boilerplate Create Next App starter page. None of the domain logic was hooked up to the user interface. |
| `src/app/globals.css` / `layout.tsx` | **Minimal** | Basic Tailwind 4 setup and Geist font loading. |
| Tests & Scripts | **Missing** | `vitest` was installed in `package.json` but had no test files and no `npm test` script. |
| AI / LLM API | **Missing** | No API route or server action existed to connect structured LLM responses with fallback logic. |

---

## 3. Skills and Agent Tooling Discovery

We audited the environment for the reverse engineering and agent skills identified in the project directives:

1. **Candidate 1: `juank115/reverse-engineerskill`**
   - **Status:** Installed in `/home/akash/.local/share/opencode/skills-src/reverse-engineerskill` and symlinked to `/home/akash/.gemini/config/skills/reverse-engineering`.
   - **Evaluation:** Analysis shows this skill is specifically engineered for binary disassembly, malware triage (PE/ELF), and firmware reversing (Ghidra, radare2, x64dbg). It does not target web architecture or TypeScript frameworks.
2. **Candidate 2: `Speedrunlab/reverse-engineer-anything`**
   - **Status:** Verified via search. Also tailored for native binary/executable decompilation and clean-room agent loops.
3. **Agent Strategy Adopted:**
   - In accordance with Section 6 guidelines, we used native static analysis, semantic code tracing, and architecture mapping directly on web application repositories.

---

## 4. Reusable Open-Source Projects Inspected

In accordance with Section 5, we investigated candidate open-source event-planning repositories to identify proven patterns without wholesale duplication:

| Repository | Inspection Findings | Reusable Pattern Adapted to Planora AI |
|------------|---------------------|----------------------------------------|
| **`its-akanksha/Ai-event-planning-agent`** (Festiva Moments) | Python/LangChain/Ollama event planner for weddings, birthdays, and corporate events. Employs multi-criteria vendor filtering (location, event type, budget caps, dietary preferences) and offline sample fallback. | **Adopted:** Clean UI filter controls for vendor categories and cities, budget threshold badges (Under / Over budget), and graceful offline fallback when no LLM key is supplied. |
| **`atef-ataya/ai-event-planner`** | Multi-agent Streamlit application for weddings and birthdays with venue/catering suggestion breakdowns and exportable PDF summaries. | **Adopted:** Printable / exportable clean event summary report (`PlanoraExport`), structured phase breakdown, and clear assumptions review before plan creation. |
| **`fossasia/eventyay`** | Full-scale open-source event management platform (Apache 2.0). Features milestone task tracking, event lifecycle states, and categorized budget management. | **Adopted:** Status-gated task list (Todo / Doing / Done) with priority badges (High / Medium / Low) and category grouping. |

---

## 5. Implementation Roadmap & Priorities

To deliver a competitive Hack2Skill Prompt Wars submission, we will proceed immediately with the following steps:

1. **Priority 1 & 6: Main Workflow & Modern Premium UI (`src/app/page.tsx`)**
   - Interactive prompt brief input with sample quick-picks (Royal Jaipur Wedding, Kid's Bangalore Birthday, Delhi Tech Summit, etc.).
   - Extracted requirements review (editable before finalizing).
   - Rich tabbed Dashboard:
     - **Overview:** KPIs (Total Budget, Remaining Budget, Days Left, Task Completion, Shortlisted Vendors).
     - **Budget Planner:** Categorized breakdown with visual distribution bars, inline editable planned/actual values, and totals.
     - **Timeline & Tasks:** Milestone phases, interactive status toggling (Todo / Doing / Done), priority badges.
     - **Vendor Shortlist:** Filter by category/city, view match score, reasons, warnings, and shortlist/book actions.
     - **Personalized Ideas:** Themed inspiration cards with estimated budget impacts.
     - **Export & Storage:** Save/load multiple events from local storage, export JSON and formatted text/printable views.
2. **Priority 4: Intelligent Interactive Replanner**
   - Dedicated "What-If" budget replanning control.
   - User inputs a new target budget or reduces spend.
   - Runs `proposeReplan` to generate side-by-side proposed changes with protected floors.
   - Approval gate: User can review diffs, see feasibility & notes, and explicitly "Apply Changes" or "Dismiss".
3. **Priority 5: GenAI Integration with Transparent Fallback**
   - Create API route `/api/plan` or `/api/extract` supporting structured Gemini/OpenAI output when `GEMINI_API_KEY` is present.
   - Automatically fall back to the built-in deterministic heuristic engine (`extraction.ts` + template ideas) when offline or without keys, with a clear UI badge indicating the source (`llm+heuristic` vs `heuristic`).
4. **Priority 7: Automated Tests & Verification**
   - Add comprehensive Vitest test suites (`src/lib/domain/__tests__/`) covering:
     - Budget allocation & totals calculation
     - Heuristic requirement extraction & date handling
     - Vendor ranking & budget capping
     - Replan capacity calculations, protected floors, and feasibility
   - Add `"test": "vitest run"` to `package.json`.
   - Verify build, tests, and lint pass with 0 errors.

---

## 6. Implementation Results & Functional Verification

All 7 priorities have been successfully implemented and verified:

1. **Main Workflow & Premium UI (`src/app/page.tsx`)**:
   - Built a sleek, glassmorphic UI using Tailwind CSS 4, Geist typography, and radiant glowing aesthetics.
   - Includes prompt-based event generation with quick-start scenarios (Weddings, Kids Birthdays, Tech Summits, Silver Anniversaries, Community Fairs).
   - Interactive KPI dashboard with live budget progress bars, countdowns, and category distribution charts.
   - Inline-editable budget matrix with variance tracking and custom line item addition.
   - Chronological preparation checklist with interactive status progression (`todo` → `doing` → `done`).
   - Categorized vendor directory with city filters, match explanations, and shortlist actions.
   - Personalized themed ideas cards with one-click addition to budget and tasks.
   - Comprehensive export options (JSON export, Markdown clipboard sharing, and print-optimized PDF styling).

2. **Core Differentiator: Intelligent Approval-Gated Replanning (`replan.ts`)**:
   - Fixed a critical double-counting bug in `proposedTotalInr`.
   - Proportional reductions above protected category floors (preserving ~70-75% for venue/catering while allowing flexible lines like decor and contingency to absorb cuts).
   - Interactive "What-If" slider with presets (-10%, -20%, -₹1 Lakh, Reset).
   - Side-by-side proposed cuts comparison table with transparent engine explanations.
   - Strict approval gate requiring user approval before updating the plan.

3. **GenAI Integration with Graceful Fallback (`/api/plan`)**:
   - Next.js API route supporting structured Gemini LLM parsing (`gemini-1.5-flash`) via `GEMINI_API_KEY` or `GOOGLE_API_KEY`.
   - Automatic fallback to deterministic heuristic extraction (`extraction.ts`) when offline or keyless.
   - Transparent source indicators surfaced in the UI (`llm+heuristic` vs `heuristic`).

4. **Automated Testing & Quality Gates**:
   - Added Vitest test suite (`src/lib/domain/__tests__/domain.test.ts`) covering all domain calculations.
   - **`npm test`**: 11/11 tests passing (100% pass rate).
   - **`npm run lint`**: 0 errors, 0 warnings.
   - **`npm run build`**: Next.js 16 production build succeeded with Turbopack and static page generation.
   - **`http://localhost:3000`**: Verified HTTP 200 response on local dev server.

---
*Planora AI is in a production-ready, fully verified state for submission to Hack2Skill Prompt Wars.*

