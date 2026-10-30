"use client";

import React, { useState } from "react";
import {
  Sparkles,
  FileText,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { EventType, ExtractionResult, EventIdea } from "@/lib/domain/types";
import { EVENT_TYPES, EVENT_TYPE_LABELS } from "@/lib/domain/types";

const SAMPLE_PROMPTS = [
  {
    label: "👑 Royal Jaipur Wedding",
    text: "Planning a luxury 3-day royal heritage wedding in Jaipur for 200 guests with ₹15 Lakhs budget in November 2026. Need outdoor venue, traditional decor, vegetarian catering, live music.",
  },
  {
    label: "🎂 Bangalore Kids Birthday",
    text: "Organizing a fun 10th birthday party in Bangalore for 40 kids with ₹75,000 budget in two months. Prefer outdoor games, theme decor, and vegetarian snacks.",
  },
  {
    label: "🏢 Delhi Tech Summit",
    text: "Hosting a corporate AI summit in Delhi NCR for 150 attendees with ₹6 Lakhs budget in December 2026. Need AV equipment, conference venue, and business catering.",
  },
  {
    label: "💖 Udaipur Silver Anniversary",
    text: "Planning an intimate 25th wedding anniversary celebration in Udaipur for 80 guests with ₹5 Lakhs budget. Lakefront venue, romantic acoustic music, and evening banquet.",
  },
  {
    label: "🌿 Community Green Fair",
    text: "Organizing a sustainable neighborhood community festival in Bengaluru for 300 guests with ₹2.5 Lakhs budget in four months. Zero-waste, local food stalls, and workshops.",
  },
];

interface CreationWizardProps {
  hasExistingEvents: boolean;
  onCancel: () => void;
  onSubmitPlan: (params: {
    title: string;
    eventType: EventType;
    city: string;
    eventDate: string;
    guestCount: number;
    budgetInr: number;
    preferences: string[];
    notes: string;
    ideas: EventIdea[];
  }) => void;
}

export function CreationWizard({
  hasExistingEvents,
  onCancel,
  onSubmitPlan,
}: CreationWizardProps) {
  const [briefInput, setBriefInput] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [sourceBadge, setSourceBadge] = useState<"genai" | "fallback">("genai");

  // Editable Form State
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<EventType>("wedding");
  const [formCity, setFormCity] = useState("Jaipur");
  const [formDate, setFormDate] = useState("2026-11-20");
  const [formGuests, setFormGuests] = useState(150);
  const [formBudget, setFormBudget] = useState(1200000);
  const [formPreferences, setFormPreferences] = useState<string[]>([]);
  const [prefInput, setPrefInput] = useState("");
  const [extractedIdeas, setExtractedIdeas] = useState<EventIdea[]>([]);

  const handleExtractBrief = async () => {
    if (!briefInput.trim()) return;
    setIsExtracting(true);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: briefInput }),
      });

      if (!res.ok) throw new Error("API extract failed");
      const data = await res.json();

      setExtractionResult(data.extraction);
      setSourceBadge(data.source ?? "genai");
      setFormTitle(data.extraction.requirements.title);
      setFormType(data.extraction.requirements.eventType);
      setFormCity(data.extraction.requirements.city);
      setFormDate(data.extraction.requirements.eventDate);
      setFormGuests(data.extraction.requirements.guestCount);
      setFormBudget(data.extraction.requirements.budgetInr);
      setFormPreferences(data.extraction.requirements.preferences);

      if (data.ideas && Array.isArray(data.ideas)) {
        setExtractedIdeas(data.ideas);
      }
    } catch (err) {
      console.warn("GenAI extraction network failure; using client fallback", err);
      const fallbackResult: ExtractionResult = {
        requirements: {
          title: "Intimate Event Celebration",
          eventType: "wedding",
          city: "Mumbai",
          eventDate: "2026-11-15",
          guestCount: 100,
          budgetInr: 800000,
          preferences: ["celebration", "custom"],
          notes: "",
        },
        assumptions: ["Standard vendor package assumed from brief"],
        confidence: 0.7,
        missingFields: [],
        source: "heuristic",
      };
      setExtractionResult(fallbackResult);
      setSourceBadge("fallback");
      setFormTitle(fallbackResult.requirements.title);
      setFormType(fallbackResult.requirements.eventType);
      setFormCity(fallbackResult.requirements.city);
      setFormDate(fallbackResult.requirements.eventDate);
      setFormGuests(fallbackResult.requirements.guestCount);
      setFormBudget(fallbackResult.requirements.budgetInr);
      setFormPreferences(fallbackResult.requirements.preferences);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirm = () => {
    onSubmitPlan({
      title: formTitle.trim() || "Untitled Event Celebration",
      eventType: formType,
      city: formCity.trim() || "Bengaluru",
      eventDate: formDate || "2026-12-01",
      guestCount: Math.max(5, formGuests),
      budgetInr: Math.max(10000, formBudget),
      preferences: formPreferences,
      notes: briefInput,
      ideas: extractedIdeas,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="text-center space-y-3 pt-4">
        <Badge variant="indigo" className="px-3 py-1 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Prompt-Driven Event Synthesis
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Describe Your Dream Celebration
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
          Enter your vision in plain English. Planora extracts dates, guest counts, budgets, and
          preferences, generating balanced financial allocations, vendor matchings, and milestone
          schedules.
        </p>
      </div>

      {/* Prompt Input Card */}
      <Card className="p-6 relative bg-card border-border/80 shadow-md">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="event-brief-input"
              className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-amber-500" />
              Event Brief or Requirements
            </Label>
            {isExtracting && (
              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2 animate-pulse font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Analyzing brief with GenAI...
              </span>
            )}
          </div>

          <Textarea
            id="event-brief-input"
            value={briefInput}
            onChange={(e) => setBriefInput(e.target.value)}
            placeholder="e.g. Planning a royal heritage wedding in Jaipur for 250 guests with ₹18 Lakhs budget in December 2026. Need outdoor venue, traditional decor, pure veg catering, live shehnai & photography..."
            rows={4}
            className="text-sm bg-background text-foreground"
          />

          {/* Sample Prompt Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground">Try sample scenarios:</span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setBriefInput(sample.text)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-muted/70 hover:bg-muted border border-border text-foreground hover:text-foreground transition cursor-pointer font-medium shadow-2xs"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-border">
            {hasExistingEvents && (
              <Button variant="ghost" size="sm" onClick={onCancel} className="cursor-pointer">
                ← Back to current plan
              </Button>
            )}
            <Button
              id="extract-brief-btn"
              variant="amber"
              onClick={handleExtractBrief}
              disabled={isExtracting || !briefInput.trim()}
              className="ml-auto cursor-pointer gap-1.5 font-semibold shadow-xs"
            >
              <span>Extract & Synthesize Plan</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Extracted Requirements Review Card */}
      {extractionResult && (
        <Card className="p-6 sm:p-8 space-y-6 border-amber-500/40 bg-card shadow-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-foreground">Review Extracted Plan</h2>
                <Badge variant="emerald" className="font-bold">
                  {Math.round(extractionResult.confidence * 100)}% Confidence
                </Badge>
                <Badge variant="indigo" className="font-bold">Source: {sourceBadge}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Check and refine parameters before generating the full budget and timeline.
              </p>
            </div>
          </div>

          {extractionResult.assumptions.length > 0 && (
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
              <span className="font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Inferred Assumptions:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-indigo-800/90 dark:text-indigo-300/80">
                {extractionResult.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="form-title" className="text-xs font-semibold text-foreground">
                Event Title
              </Label>
              <Input
                id="form-title"
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="form-type" className="text-xs font-semibold text-foreground">
                Event Type
              </Label>
              <select
                id="form-type"
                value={formType}
                onChange={(e) => setFormType(e.target.value as EventType)}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-popover text-popover-foreground">
                    {EVENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="form-city" className="text-xs font-semibold text-foreground">
                Host City
              </Label>
              <Input
                id="form-city"
                type="text"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="form-date" className="text-xs font-semibold text-foreground">
                Target Date
              </Label>
              <Input
                id="form-date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="form-guests" className="text-xs font-semibold text-foreground">
                Guest Count
              </Label>
              <Input
                id="form-guests"
                type="number"
                min={5}
                max={10000}
                value={formGuests}
                onChange={(e) => setFormGuests(Number(e.target.value))}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="form-budget" className="text-xs font-semibold text-foreground">
                Total Budget (INR ₹)
              </Label>
              <div className="relative">
                <Input
                  id="form-budget"
                  type="number"
                  min={10000}
                  step={10000}
                  value={formBudget}
                  onChange={(e) => setFormBudget(Number(e.target.value))}
                  className="text-xs pr-24"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                  ₹{(formBudget / 100000).toFixed(2)} Lakhs
                </span>
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-3">
              <Label htmlFor="form-pref-input" className="text-xs font-semibold text-foreground">
                Preferences & Themes
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formPreferences.map((pref, i) => (
                  <Badge key={i} variant="secondary" className="text-xs font-medium gap-1">
                    {pref}
                    <button
                      type="button"
                      onClick={() =>
                        setFormPreferences(formPreferences.filter((_, idx) => idx !== i))
                      }
                      className="hover:text-destructive cursor-pointer ml-0.5"
                      aria-label={`Remove preference ${pref}`}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                id="form-pref-input"
                type="text"
                value={prefInput}
                onChange={(e) => setPrefInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && prefInput.trim()) {
                    e.preventDefault();
                    if (!formPreferences.includes(prefInput.trim().toLowerCase())) {
                      setFormPreferences([...formPreferences, prefInput.trim().toLowerCase()]);
                    }
                    setPrefInput("");
                  }
                }}
                placeholder="Type preference and press Enter (e.g. outdoor, pure veg, live music)..."
                className="text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setExtractionResult(null)} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              id="confirm-create-plan-btn"
              variant="emerald"
              size="lg"
              onClick={handleConfirm}
              className="cursor-pointer gap-2 font-semibold shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Launch Plan Dashboard</span>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
