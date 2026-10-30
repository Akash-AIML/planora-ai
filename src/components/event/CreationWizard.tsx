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
import { Input, Textarea } from "@/components/ui/input";
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
  const [suggestedIdeas, setSuggestedIdeas] = useState<EventIdea[]>([]);
  const [sourceBadge, setSourceBadge] = useState("heuristic");

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<EventType>("wedding");
  const [formCity, setFormCity] = useState("Jaipur");
  const [formDate, setFormDate] = useState("2026-11-20");
  const [formGuests, setFormGuests] = useState(150);
  const [formBudget, setFormBudget] = useState(1000000);
  const [formPreferences, setFormPreferences] = useState<string[]>([]);
  const [prefInput, setPrefInput] = useState("");

  const handleExtractBrief = async () => {
    if (!briefInput.trim()) return;
    setIsExtracting(true);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: briefInput }),
      });
      if (!res.ok) throw new Error("Server extraction error");
      const data = await res.json();
      const result: ExtractionResult = data.extraction;
      setExtractionResult(result);
      setSuggestedIdeas(data.ideas || []);
      setSourceBadge(data.source || "heuristic");

      setFormTitle(result.requirements.title);
      setFormType(result.requirements.eventType);
      setFormCity(result.requirements.city);
      setFormDate(result.requirements.eventDate);
      setFormGuests(result.requirements.guestCount);
      setFormBudget(result.requirements.budgetInr);
      setFormPreferences(result.requirements.preferences);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirm = () => {
    onSubmitPlan({
      title: formTitle.trim() || `${EVENT_TYPE_LABELS[formType]} in ${formCity}`,
      eventType: formType,
      city: formCity,
      eventDate: formDate,
      guestCount: formGuests,
      budgetInr: formBudget,
      preferences: formPreferences,
      notes: briefInput,
      ideas: suggestedIdeas,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="text-center space-y-3 pt-4">
        <Badge variant="indigo" className="px-3 py-1 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Prompt-Driven Event Synthesis
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Describe Your Dream Celebration
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Enter your vision in plain English. Planora extracts dates, guest counts, budgets, and
          preferences, generating balanced financial allocations, vendor matchings, and milestone
          schedules.
        </p>
      </div>

      {/* Prompt Input Card */}
      <Card className="p-6 relative">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label
              htmlFor="event-brief-input"
              className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              Event Brief or Requirements
            </label>
            {isExtracting && (
              <span className="text-xs text-amber-400 flex items-center gap-2 animate-pulse">
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
          />

          {/* Sample Prompt Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-medium text-slate-400">Try sample scenarios:</span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setBriefInput(sample.text)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            {hasExistingEvents && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                ← Back to current plan
              </Button>
            )}
            <Button
              id="extract-brief-btn"
              variant="amber"
              onClick={handleExtractBrief}
              disabled={isExtracting || !briefInput.trim()}
              className="ml-auto"
            >
              <span>Extract & Synthesize Plan</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Extracted Requirements Review Card */}
      {extractionResult && (
        <Card className="p-6 sm:p-8 space-y-6 border-amber-500/30 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">Review Extracted Plan</h2>
                <Badge variant="emerald">
                  {Math.round(extractionResult.confidence * 100)}% Confidence
                </Badge>
                <Badge variant="indigo">Source: {sourceBadge}</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Check and refine parameters before generating the full budget and timeline.
              </p>
            </div>
          </div>

          {extractionResult.assumptions.length > 0 && (
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 space-y-1">
              <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Inferred Assumptions:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-indigo-300/80">
                {extractionResult.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="form-title" className="text-xs font-medium text-slate-300">
                Event Title
              </label>
              <Input
                id="form-title"
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="form-type" className="text-xs font-medium text-slate-300">
                Event Type
              </label>
              <select
                id="form-type"
                value={formType}
                onChange={(e) => setFormType(e.target.value as EventType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {EVENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="form-city" className="text-xs font-medium text-slate-300">
                Host City
              </label>
              <Input
                id="form-city"
                type="text"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="form-date" className="text-xs font-medium text-slate-300">
                Target Date
              </label>
              <Input
                id="form-date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="form-guests" className="text-xs font-medium text-slate-300">
                Guest Count
              </label>
              <Input
                id="form-guests"
                type="number"
                min={5}
                max={10000}
                value={formGuests}
                onChange={(e) => setFormGuests(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="form-budget" className="text-xs font-medium text-slate-300">
                Total Budget (INR ₹)
              </label>
              <div className="relative">
                <Input
                  id="form-budget"
                  type="number"
                  min={10000}
                  step={10000}
                  value={formBudget}
                  onChange={(e) => setFormBudget(Number(e.target.value))}
                />
                <span className="absolute right-3 top-2.5 text-xs font-semibold text-amber-400">
                  ₹{(formBudget / 100000).toFixed(2)} Lakhs
                </span>
              </div>
            </div>

            <div className="space-y-1 sm:col-span-3">
              <label htmlFor="form-pref-input" className="text-xs font-medium text-slate-300">
                Preferences & Themes
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formPreferences.map((pref, i) => (
                  <Badge key={i} variant="default" className="text-xs">
                    {pref}
                    <button
                      type="button"
                      onClick={() =>
                        setFormPreferences(formPreferences.filter((_, idx) => idx !== i))
                      }
                      className="hover:text-amber-400 ml-1"
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
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setExtractionResult(null)}>
              Cancel
            </Button>
            <Button
              id="confirm-create-plan-btn"
              variant="emerald"
              size="lg"
              onClick={handleConfirm}
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
