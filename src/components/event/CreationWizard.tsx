"use client";

import React, { useState } from "react";
import { Sparkles, FileText, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { EventType, ExtractionResult, EventIdea } from "@/lib/domain/types";
import { SAMPLE_PROMPTS } from "@/lib/data/sample-prompts";
import { ExtractionReviewCard } from "./ExtractionReviewCard";

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
        <ExtractionReviewCard
          extractionResult={extractionResult}
          sourceBadge={sourceBadge}
          formTitle={formTitle}
          setFormTitle={setFormTitle}
          formType={formType}
          setFormType={setFormType}
          formCity={formCity}
          setFormCity={setFormCity}
          formDate={formDate}
          setFormDate={setFormDate}
          formGuests={formGuests}
          setFormGuests={setFormGuests}
          formBudget={formBudget}
          setFormBudget={setFormBudget}
          formPreferences={formPreferences}
          setFormPreferences={setFormPreferences}
          onCancel={() => setExtractionResult(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
