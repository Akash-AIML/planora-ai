"use client";

import React from "react";
import { AlertTriangle, Check } from "lucide-react";
import { formatInr } from "@/lib/utils";
import { daysUntil } from "@/lib/domain/timeline";
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
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800/80">
      <div className="space-y-0.5">
        <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
          Total Budget
        </span>
        <div className="text-lg font-bold text-white">{formatInr(event.budgetInr)}</div>
        <div className="text-[11px] text-slate-400">
          ₹{(event.budgetInr / 100000).toFixed(2)} Lakhs target
        </div>
      </div>

      <div className="space-y-0.5">
        <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
          Planned Spend
        </span>
        <div className="text-lg font-bold text-amber-300">{formatInr(totals.plannedInr)}</div>
        <div
          className={`text-[11px] font-medium flex items-center gap-1 ${
            totals.overBudget ? "text-rose-400" : "text-emerald-400"
          }`}
        >
          {totals.overBudget ? (
            <>
              <AlertTriangle className="w-3 h-3" />
              <span>{formatInr(Math.abs(totals.remainingInr))} over</span>
            </>
          ) : (
            <>
              <Check className="w-3 h-3" />
              <span>{formatInr(totals.remainingInr)} buffer</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-0.5">
        <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
          Actual Spent
        </span>
        <div className="text-lg font-bold text-emerald-400">{formatInr(totals.actualInr)}</div>
        <div className="text-[11px] text-slate-400">From confirmed receipts</div>
      </div>

      <div className="space-y-0.5">
        <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
          Days Remaining
        </span>
        <div className="text-lg font-bold text-white">{daysLeft ?? "—"} Days</div>
        <div className="text-[11px] text-slate-400">{event.eventDate}</div>
      </div>

      <div className="space-y-0.5 col-span-2 sm:col-span-1">
        <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
          Milestone Progress
        </span>
        <div className="text-lg font-bold text-indigo-300">
          {completedTasks} / {tasks.length}
        </div>
        <div
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden"
        >
          <div
            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
