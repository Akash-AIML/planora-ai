"use client";

import React from "react";
import { IndianRupee, ArrowRight } from "lucide-react";
import { formatInr } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <Card className="p-6 space-y-4 border-border/80 shadow-xs bg-card transition-colors">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          Budget Allocation Distribution
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewBudgetTab}
          className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 p-0 h-auto font-medium gap-1 cursor-pointer"
        >
          <span>View & Edit Breakdown</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Multi-segmented Bar */}
      <div
        role="meter"
        aria-label="Category Budget Distribution"
        aria-valuenow={100}
        aria-valuemin={0}
        aria-valuemax={100}
        className="w-full h-4 rounded-full bg-muted overflow-hidden flex shadow-inner"
      >
        {totals.byCategory.map((cat, idx) => {
          const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
          return (
            <div
              key={cat.category}
              style={{ width: `${cat.share * 100}%` }}
              title={`${cat.category}: ${formatInr(cat.plannedInr)} (${Math.round(cat.share * 100)}%)`}
              className={`${color} h-full transition-all hover:opacity-85`}
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
              <span className="text-foreground font-medium">{cat.category}</span>
              <span className="text-muted-foreground">
                ({Math.round(cat.share * 100)}% · {formatInr(cat.plannedInr)})
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
