"use client";

import React from "react";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatInr } from "@/lib/utils";
import type { EventDetail } from "@/lib/domain/types";

interface ExportPrintViewProps {
  currentEvent: EventDetail;
  onDownloadExport: () => void;
}

export function ExportPrintView({
  currentEvent,
  onDownloadExport,
}: ExportPrintViewProps) {
  const { event, totals, budgetItems, tasks } = currentEvent;
  const completedTasks = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Export & Documentation</h2>
          <p className="text-xs text-muted-foreground">
            Standardized Planora format for clients, families, or vendors.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="cursor-pointer gap-1.5 shadow-xs">
            <FileText className="w-4 h-4" />
            <span>Print Document / Save PDF</span>
          </Button>
          <Button variant="amber" size="sm" onClick={onDownloadExport} className="cursor-pointer gap-1.5 shadow-xs font-semibold">
            <Download className="w-4 h-4" />
            <span>Download JSON</span>
          </Button>
        </div>
      </div>

      {/* Printable Document View */}
      <Card className="p-8 space-y-8 bg-card text-foreground border-border/80 shadow-md">
        <div className="border-b border-border pb-6 flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              PLANORA AI · EVENT BRIEF SPECIFICATION
            </span>
            <h1 className="text-3xl font-extrabold text-foreground mt-1">{event.title}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Generated on {new Date().toLocaleDateString("en-IN")} · Version {event.version}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Event Date</div>
            <div className="text-lg font-bold text-foreground">{event.eventDate}</div>
            <div className="text-xs text-muted-foreground">
              {event.city} · {event.guestCount} Guests
            </div>
          </div>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/40 border border-border text-xs">
          <div>
            <span className="text-muted-foreground">Total Budget:</span>
            <div className="font-bold text-foreground text-sm">{formatInr(event.budgetInr)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Planned Spend:</span>
            <div className="font-bold text-amber-600 dark:text-amber-300 text-sm">{formatInr(totals.plannedInr)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Actual Confirmed:</span>
            <div className="font-bold text-emerald-600 dark:text-emerald-300 text-sm">{formatInr(totals.actualInr)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Tasks Completed:</span>
            <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
              {completedTasks} of {tasks.length}
            </div>
          </div>
        </div>

        {/* Budget breakdown */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            1. Financial Allocation Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-semibold">
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-right">Planned (INR)</th>
                  <th className="py-2.5 text-right">Actual (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {budgetItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 font-medium text-foreground">{item.category}</td>
                    <td className="py-2.5 text-muted-foreground">{item.label}</td>
                    <td className="py-2.5 text-right font-semibold text-foreground">
                      {formatInr(item.plannedInr)}
                    </td>
                    <td className="py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                      {item.actualInr !== null ? formatInr(item.actualInr) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tasks breakdown */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            2. Milestone Preparation Schedule
          </h3>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between py-2 border-b border-border/40 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-mono">
                    [{task.status === "done" ? "x" : " "}]
                  </span>
                  <span
                    className={
                      task.status === "done" ? "line-through text-muted-foreground" : "text-foreground font-medium"
                    }
                  >
                    {task.title}
                  </span>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  {task.phase} · Due {task.dueDate}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer notice */}
        <div className="pt-6 border-t border-border text-[11px] text-muted-foreground leading-relaxed">
          Disclaimer: Generated by Planora AI Copilot. Budget line items and timelines are computed
          deterministically based on event parameters. Vendor listings and prices are illustrative
          and should be verified directly with providers before entering into commercial
          contracts.
        </div>
      </Card>
    </div>
  );
}
