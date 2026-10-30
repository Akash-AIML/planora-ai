"use client";

import React, { useState } from "react";
import { Sliders, ShieldAlert, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatInr } from "@/lib/utils";
import { proposeReplan } from "@/lib/domain/replan";
import type { EventDetail, ReplanProposal } from "@/lib/domain/types";
import { ProposalDiffTable } from "./ProposalDiffTable";

interface BudgetReplannerProps {
  currentEvent: EventDetail;
  onApplyReplan: (proposal: ReplanProposal) => void;
}

export function BudgetReplanner({
  currentEvent,
  onApplyReplan,
}: BudgetReplannerProps) {
  const [replanTarget, setReplanTarget] = useState<number>(0);
  const [currentProposal, setCurrentProposal] = useState<ReplanProposal | null>(null);

  const effectiveTarget = replanTarget > 0 ? replanTarget : currentEvent.event.budgetInr;

  const handlePropose = () => {
    const proposal = proposeReplan({
      eventId: currentEvent.event.id,
      eventVersion: currentEvent.event.version,
      eventType: currentEvent.event.eventType,
      items: currentEvent.budgetItems,
      targetBudgetInr: effectiveTarget,
    });
    setCurrentProposal(proposal);
  };

  const handleApply = () => {
    if (!currentProposal) return;
    onApplyReplan(currentProposal);
    setCurrentProposal(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Intelligent Budget Replanner
          </h2>
          <Badge variant="indigo" className="text-[10px] uppercase font-bold tracking-wider">
            Approval Gated
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
          Simulate budget cuts or expansions. Protected category floors (e.g. Venue & Catering
          floors at ~70%) are strictly preserved. Proposed changes require your explicit approval
          before overwriting the active plan.
        </p>
      </div>

      {/* Target Budget Slider & Inputs */}
      <Card className="p-6 space-y-6 border-indigo-500/30 bg-card shadow-xs">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label
              htmlFor="replan-slider"
              className="text-xs font-bold text-foreground uppercase tracking-wider"
            >
              Target Budget Simulation
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Current Spend:</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {formatInr(currentEvent.totals.plannedInr)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <input
              id="replan-slider"
              type="range"
              min={Math.round(currentEvent.event.budgetInr * 0.4)}
              max={Math.round(currentEvent.event.budgetInr * 1.5)}
              step={10000}
              value={effectiveTarget}
              onChange={(e) => setReplanTarget(Number(e.target.value))}
              aria-label="Target Budget Slider"
              className="flex-1 accent-amber-500 cursor-pointer h-2 bg-muted rounded-lg"
            />
            <div className="relative w-44">
              <Input
                id="replan-number-input"
                type="number"
                step={10000}
                value={effectiveTarget}
                aria-label="Target Budget Number Input"
                onChange={(e) => setReplanTarget(Number(e.target.value))}
                className="w-full font-bold text-foreground pr-10 text-sm"
              />
              <span className="absolute right-2.5 top-2.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">INR ₹</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-2 pt-1 items-center">
            <span className="text-[11px] text-muted-foreground font-medium">Presets:</span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setReplanTarget(Math.round(currentEvent.totals.plannedInr * 0.9))}
              className="cursor-pointer text-xs"
            >
              -10% (Save {formatInr(currentEvent.totals.plannedInr * 0.1)})
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setReplanTarget(Math.round(currentEvent.totals.plannedInr * 0.8))}
              className="cursor-pointer text-xs"
            >
              -20% (Save {formatInr(currentEvent.totals.plannedInr * 0.2)})
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() =>
                setReplanTarget(Math.max(50000, currentEvent.totals.plannedInr - 100000))
              }
              className="cursor-pointer text-xs"
            >
              -₹1.0 Lakh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setReplanTarget(currentEvent.event.budgetInr)}
              className="cursor-pointer text-xs"
            >
              Reset to Original
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <Button
            id="generate-replan-btn"
            variant="default"
            size="sm"
            onClick={handlePropose}
            className="cursor-pointer gap-1.5 shadow-xs font-semibold"
          >
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Compute Replan Proposal</span>
          </Button>
        </div>
      </Card>

      {/* Proposal Result Assessment */}
      {currentProposal && (
        <Card className="p-6 sm:p-8 space-y-6 border-amber-500/40 bg-card shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">Proposed Replan Assessment</h3>
                <Badge
                  variant={currentProposal.feasible ? "emerald" : "rose"}
                  className="font-bold uppercase text-[10px]"
                >
                  {currentProposal.feasible ? "✓ Feasible Within Floors" : "⚠ Infeasible"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Generated on {new Date(currentProposal.createdAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-muted-foreground font-medium">Proposed Plan Total:</div>
              <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
                {formatInr(currentProposal.proposedTotalInr)}
              </div>
            </div>
          </div>

          {/* Explanatory Notes */}
          <div className="p-4 rounded-xl bg-muted/60 border border-border space-y-1.5 text-xs text-foreground">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Replanning Engine Notes:
            </span>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {currentProposal.notes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>

          <ProposalDiffTable changes={currentProposal.changes} />

          {/* Approval Buttons */}
          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setCurrentProposal(null)} className="cursor-pointer">
              Discard Proposal
            </Button>
            <Button
              id="apply-replan-proposal-btn"
              variant="emerald"
              size="lg"
              onClick={handleApply}
              disabled={!currentProposal.feasible && currentProposal.changes.length === 0}
              className="cursor-pointer gap-2 font-semibold shadow-xs"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Approve & Apply Proposed Changes</span>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
