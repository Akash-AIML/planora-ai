# Planora AI — GenAI-Powered Event Planning Assistant

> **Hack2Skill Prompt Wars Submission**  
> An intelligent planning assistant that helps users organize **weddings, birthdays, anniversaries, corporate summits, and community festivals** with deterministic budgets, phase-based timelines, ranked vendor checklists, personalized ideas, and interactive budget-aware replanning.

---

## 🌟 Key Features

1. **Natural Language Requirement Extraction:**
   - Type conversational briefs (e.g. *"Royal destination wedding in Jaipur for 200 guests with 15 lakhs budget"*).
   - Extracts event type, city, date, guest count, budget, and cultural preferences via server-side Gemini GenAI with instantaneous heuristic fallback.
2. **Zero-Rounding Deterministic Budget Matrix:**
   - Allocates budgets with exact integer distribution (no penny/paise rounding drift).
   - Category breakdowns (Venue, Catering, Decor, Photography, Entertainment, Contingency) with inline actual-spend tracking and variance warnings.
3. **Phase-Based Preparation Timeline:**
   - Milestone checklist grouped by phases: *Pre-Planning*, *Core Bookings*, *Logistics*, *Final Preparations*, and *Event Week*.
   - Interactive status toggles (`To Do` → `In Progress` → `Done`) and custom milestone addition.
4. **Ranked Vendor Directory & Matching:**
   - Multi-factor vendor ranking algorithm based on city relevance, budget tier suitability, and user ratings.
   - Comparative highlights (*Best Fit*, *Highest Rated*, *Lowest Starting Price*) and direct shortlist management.
5. **Personalized Creative Ideas:**
   - Curated ideas grid tailored to cultural and thematic preferences.
   - One-click **"Add to Tasks & Budget"** automatically converts ideas into active checklist milestones.
6. **Budget-Aware Interactive Replanning ("What-If" Simulator):**
   - The core differentiator: simulate budget drops (e.g. -10%, -20%, -30%) with proportional cuts that protect essential category floors.
   - Approval-gated side-by-side proposal diff table before applying changes.
7. **Offline Persistence & Printable Export:**
   - Client-side localStorage persistence across browser sessions.
   - Print-optimized executive briefing and verified structured JSON export.

---

## 🚀 Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Variables (Optional)

Planora AI includes an instantaneous local deterministic heuristic engine that functions out-of-the-box without external keys. To enable live Gemini AI generation:

```bash
cp .env.example .env.local  # If .env.example exists, or create .env.local:
# Add:
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🧪 Testing & Verification

Run the comprehensive unit test suite:

```bash
npm test
```

Run unit tests with code coverage:

```bash
npm run test:coverage
```

Run lint checks:

```bash
npm run lint
```

Run production build:

```bash
npm run build
```

---

## 🛡️ Continuous Integration & Quality Gates

Automated testing and quality gate scanning are configured via GitHub Actions in [`.github/workflows/sonarqube.yml`](.github/workflows/sonarqube.yml) and [`sonar-project.properties`](sonar-project.properties):
- **Triggers:** Push to `main`, Pull Requests, and manual workflow dispatch.
- **Pipeline:** Code linting (`eslint`), unit testing with V8 coverage (`vitest --coverage`), production compilation (`next build`), and SonarQube / SonarCloud security and code quality analysis.

---

## 📚 Technical Documentation & Evaluation Reports

For detailed architecture reviews and evaluation parameters:

- [CodeRabbit Review Remediation Report](docs/coderabbit-remediation.md) — Comprehensive log of audit findings, root-cause fixes, and verification.
- [Six-Parameter Quality Audit](docs/quality-audit.md) — In-depth evaluation across Code Quality, Security, Efficiency, Testing, Accessibility, and Problem Alignment.
- [Problem Statement Traceability Matrix](docs/problem-statement-traceability.md) — Exact mapping of hackathon requirements to implementation files.
- [Project Recovery Report](docs/recovery-report.md) — Original state recovery and bug fixes log.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 16 (App Router with Turbopack)
- **UI & Styling:** React 19, Tailwind CSS, Lucide Icons
- **Design System:** shadcn/ui pattern (`Button`, `Card`, `Badge`, `Input`, `Dialog`)
- **Validation:** Zod
- **Testing:** Vitest
- **AI Integration:** Google Gemini API (`@google/genai`) with server-side validation
