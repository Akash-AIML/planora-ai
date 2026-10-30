"use client";

import React from "react";
import { AlertTriangle, Check } from "lucide-react";
import { formatInr } from "@/lib/utils";
import { daysUntil } from "@/lib/domain/timeline";
import { Progress } from "@/components/ui/progress";
import type { EventDetail } from "@/lib/domain/types";

interface KPISummaryStripProps {
  eventDetail: EventDetail;
}

export function KPISummaryStrip({ eventDetail }: KPISummaryStripProps) {
  const { event, totals, tasks } = eventDetail;
  const daysLeft = daysUntil(event.eventDate);
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const progressPercent = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mt-6 pt-6 border-t border-border/80">
      <div className="space-y-1">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
          Total Budget
        </span>
        <div className="text-lg font-bold text-foreground">{formatInr(event.budgetInr)}</div>
        <div className="text-[11px] text-muted-foreground">
          ₹{(event.budgetInr / 100000).toFixed(2)} Lakhs target
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
          Planned Spend
        </span>
        <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
          {formatInr(totals.plannedInr)}
        </div>
        <div
          className={`text-[11px] font-semibold flex items-center gap-1 ${
            totals.overBudget ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {totals.overBudget ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{formatInr(Math.abs(totals.remainingInr))} over</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>{formatInr(totals.remainingInr)} buffer</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
          Actual Spent
        </span>
        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
          {formatInr(totals.actualInr)}
        </div>
        <div className="text-[11px] text-muted-foreground">From confirmed receipts</div>
      </div>

      <div className="space-y-1">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
          Days Remaining
        </span>
        <div className="text-lg font-bold text-foreground">{daysLeft ?? "—"} Days</div>
        <div className="text-[11px] text-muted-foreground">{event.eventDate}</div>
      </div>

      <div className="space-y-1 col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
            Milestones
          </span>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {completedTasks}/{tasks.length}
          </span>
        </div>
        <Progress value={Math.round(progressPercent)} className="h-2 w-full mt-1.5" />
        <div className="text-[11px] text-muted-foreground">
          {Math.round(progressPercent)}% tasks completed
        </div>
      </div>
    </div>
  );
}
