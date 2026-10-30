"use client";

import React, { useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EventType, ExtractionResult } from "@/lib/domain/types";
import { EVENT_TYPES, EVENT_TYPE_LABELS } from "@/lib/domain/types";

interface ExtractionReviewCardProps {
  extractionResult: ExtractionResult;
  sourceBadge: "genai" | "fallback";
  formTitle: string;
  setFormTitle: (v: string) => void;
  formType: EventType;
  setFormType: (v: EventType) => void;
  formCity: string;
  setFormCity: (v: string) => void;
  formDate: string;
  setFormDate: (v: string) => void;
  formGuests: number;
  setFormGuests: (v: number) => void;
  formBudget: number;
  setFormBudget: (v: number) => void;
  formPreferences: string[];
  setFormPreferences: (v: string[]) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ExtractionReviewCard({
  extractionResult,
  sourceBadge,
  formTitle,
  setFormTitle,
  formType,
  setFormType,
  formCity,
  setFormCity,
  formDate,
  setFormDate,
  formGuests,
  setFormGuests,
  formBudget,
  setFormBudget,
  formPreferences,
  setFormPreferences,
  onCancel,
  onConfirm,
}: ExtractionReviewCardProps) {
  const [prefInput, setPrefInput] = useState("");

  const handleAddPreference = () => {
    const trimmed = prefInput.trim().toLowerCase();
    if (trimmed && !formPreferences.includes(trimmed)) {
      setFormPreferences([...formPreferences, trimmed]);
      setPrefInput("");
    }
  };

  return (
    <Card className="p-6 sm:p-8 space-y-6 border-amber-500/40 bg-card shadow-md animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">Review Extracted Plan</h2>
            <Badge variant="emerald" className="font-bold">
              {Math.round(extractionResult.confidence * 100)}% Confidence
            </Badge>
            <Badge variant="indigo" className="font-bold">
              Source: {sourceBadge}
            </Badge>
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
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddPreference();
              }
            }}
            placeholder="Type preference and press Enter (e.g. outdoor, pure veg, live music)..."
            className="text-xs"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-border flex justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel} className="cursor-pointer">
          Cancel
        </Button>
        <Button
          id="confirm-create-plan-btn"
          variant="emerald"
          size="lg"
          onClick={onConfirm}
          className="cursor-pointer gap-2 font-semibold shadow-xs"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Confirm & Launch Plan Dashboard</span>
        </Button>
      </div>
    </Card>
  );
}
