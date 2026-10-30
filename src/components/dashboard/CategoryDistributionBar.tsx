"use client";

import React from "react";
import { IndianRupee } from "lucide-react";
import { formatInr } from "@/lib/utils";
import type { BudgetTotals } from "@/lib/domain/types";

interface CategoryDistributionBarProps {
  totals: BudgetTotals;
  onViewBudgetTab: () => void;
}

const CATEGORY_COLORS = [
  "bg-amber-500",
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-blue-500",
  "bg-teal-500",
  "bg-rose-500",
];

export function CategoryDistributionBar({
  totals,
  onViewBudgetTab,
}: CategoryDistributionBarProps) {
  return (
    <div className="glass-panel rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-amber-400" />
          Budget Allocation Distribution
        </h3>
        <button
          type="button"
          onClick={onViewBudgetTab}
          className="text-xs text-amber-400 hover:underline cursor-pointer"
        >
          View & Edit Breakdown →
        </button>
      </div>

      {/* Multi-segmented Bar */}
      <div
        role="meter"
        aria-label="Category Budget Distribution"
        aria-valuenow={100}
        aria-valuemin={0}
        aria-valuemax={100}
        className="w-full h-4 rounded-full bg-slate-800 overflow-hidden flex"
      >
        {totals.byCategory.map((cat, idx) => {
          const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
          return (
            <div
              key={cat.category}
              style={{ width: `${cat.share * 100}%` }}
              title={`${cat.category}: ${formatInr(cat.plannedInr)} (${Math.round(cat.share * 100)}%)`}
              className={`${color} h-full transition-all hover:opacity-80`}
            />
          );
        })}
      </div>

      {/* Category Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-xs">
        {totals.byCategory.map((cat, idx) => {
          const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
          return (
            <div key={cat.category} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
              <span className="text-slate-300 font-medium">{cat.category}</span>
              <span className="text-slate-400">
                ({Math.round(cat.share * 100)}% · {formatInr(cat.plannedInr)})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
