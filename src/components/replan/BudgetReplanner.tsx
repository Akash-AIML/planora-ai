"use client";

import React, { useState } from "react";
import { Sliders, ShieldAlert, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
          <h2 className="text-xl font-bold text-white tracking-tight">
            Intelligent Budget Replanner
          </h2>
          <Badge variant="indigo" className="text-[10px] uppercase">
            Approval Gated
          </Badge>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Simulate budget cuts or expansions. Protected category floors (e.g. Venue & Catering
          floors at ~70%) are strictly preserved. Proposed changes require your explicit approval
          before overwriting the active plan.
        </p>
      </div>

      {/* Target Budget Slider & Inputs */}
      <Card className="p-6 space-y-6 border-indigo-500/30">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label
              htmlFor="replan-slider"
              className="text-xs font-bold text-white uppercase tracking-wider"
            >
              Target Budget Simulation
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Current Spend:</span>
              <span className="text-xs font-bold text-amber-400">
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
              className="flex-1 accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="relative w-44">
              <input
                id="replan-number-input"
                type="number"
                step={10000}
                value={effectiveTarget}
                aria-label="Target Budget Number Input"
                onChange={(e) => setReplanTarget(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
              />
              <span className="absolute right-2 top-2 text-[10px] text-amber-400">INR ₹</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[11px] text-slate-400 self-center">Presets:</span>
            <button
              type="button"
              onClick={() => setReplanTarget(Math.round(currentEvent.totals.plannedInr * 0.9))}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
            >
              -10% (Save {formatInr(currentEvent.totals.plannedInr * 0.1)})
            </button>
            <button
              type="button"
              onClick={() => setReplanTarget(Math.round(currentEvent.totals.plannedInr * 0.8))}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
            >
              -20% (Save {formatInr(currentEvent.totals.plannedInr * 0.2)})
            </button>
            <button
              type="button"
              onClick={() =>
                setReplanTarget(Math.max(50000, currentEvent.totals.plannedInr - 100000))
              }
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
            >
              -₹1.0 Lakh
            </button>
            <button
              type="button"
              onClick={() => setReplanTarget(currentEvent.event.budgetInr)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
            >
              Reset to Original
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <Button
            id="generate-replan-btn"
            variant="default"
            size="sm"
            onClick={handlePropose}
          >
            <Sliders className="w-4 h-4" />
            <span>Compute Replan Proposal</span>
          </Button>
        </div>
      </Card>

      {/* Proposal Result Assessment */}
      {currentProposal && (
        <Card className="p-6 sm:p-8 space-y-6 border-amber-500/40 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Proposed Replan Assessment</h3>
                <Badge
                  variant={currentProposal.feasible ? "emerald" : "rose"}
                  className="font-bold uppercase"
                >
                  {currentProposal.feasible ? "✓ Feasible Within Floors" : "⚠ Infeasible"}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Generated on {new Date(currentProposal.createdAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">Proposed Plan Total:</div>
              <div className="text-lg font-extrabold text-amber-300">
                {formatInr(currentProposal.proposedTotalInr)}
              </div>
            </div>
          </div>

          {/* Explanatory Notes */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs text-slate-300">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Replanning Engine Notes:
            </span>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              {currentProposal.notes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>

          <ProposalDiffTable changes={currentProposal.changes} />

          {/* Approval Buttons */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setCurrentProposal(null)}>
              Discard Proposal
            </Button>
            <Button
              id="apply-replan-proposal-btn"
              variant="emerald"
              size="lg"
              onClick={handleApply}
              disabled={!currentProposal.feasible && currentProposal.changes.length === 0}
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
