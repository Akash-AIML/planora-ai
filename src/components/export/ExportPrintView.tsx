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
          <h2 className="text-lg font-bold text-white tracking-tight">Export & Documentation</h2>
          <p className="text-xs text-slate-400">
            Standardized Planora format for clients, families, or vendors.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <FileText className="w-4 h-4" />
            <span>Print Document / Save PDF</span>
          </Button>
          <Button variant="amber" size="sm" onClick={onDownloadExport}>
            <Download className="w-4 h-4" />
            <span>Download JSON</span>
          </Button>
        </div>
      </div>

      {/* Printable Document View */}
      <Card className="p-8 space-y-8 bg-slate-950/90 text-slate-100 border-slate-800">
        <div className="border-b border-slate-800 pb-6 flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              PLANORA AI · EVENT BRIEF SPECIFICATION
            </span>
            <h1 className="text-3xl font-extrabold text-white mt-1">{event.title}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Generated on {new Date().toLocaleDateString("en-IN")} · Version {event.version}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Event Date</div>
            <div className="text-lg font-bold text-white">{event.eventDate}</div>
            <div className="text-xs text-slate-400">
              {event.city} · {event.guestCount} Guests
            </div>
          </div>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400">Total Budget:</span>
            <div className="font-bold text-white text-sm">{formatInr(event.budgetInr)}</div>
          </div>
          <div>
            <span className="text-slate-400">Planned Spend:</span>
            <div className="font-bold text-amber-300 text-sm">{formatInr(totals.plannedInr)}</div>
          </div>
          <div>
            <span className="text-slate-400">Actual Confirmed:</span>
            <div className="font-bold text-emerald-300 text-sm">{formatInr(totals.actualInr)}</div>
          </div>
          <div>
            <span className="text-slate-400">Tasks Completed:</span>
            <div className="font-bold text-indigo-300 text-sm">
              {completedTasks} of {tasks.length}
            </div>
          </div>
        </div>

        {/* Budget breakdown */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            1. Financial Allocation Breakdown
          </h3>
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2">Category</th>
                <th className="py-2">Item Description</th>
                <th className="py-2 text-right">Planned (INR)</th>
                <th className="py-2 text-right">Actual (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {budgetItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 font-medium text-slate-300">{item.category}</td>
                  <td className="py-2 text-slate-400">{item.label}</td>
                  <td className="py-2 text-right font-semibold text-white">
                    {formatInr(item.plannedInr)}
                  </td>
                  <td className="py-2 text-right text-emerald-400 font-semibold">
                    {formatInr(item.actualInr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tasks breakdown */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            2. Milestone Preparation Schedule
          </h3>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between py-1.5 border-b border-slate-800/40 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono">
                    [{task.status === "done" ? "x" : " "}]
                  </span>
                  <span
                    className={
                      task.status === "done" ? "line-through text-slate-500" : "text-white"
                    }
                  >
                    {task.title}
                  </span>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  {task.phase} · Due {task.dueDate}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer notice */}
        <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-500 leading-relaxed">
          Disclaimer: Generated by Planora AI Copilot. Budget line items and timelines are computed
          deterministically based on event parameters. Vendor listings and prices are illustrative
          and should be verified directly with providers before entering into commercial
          contracts.
        </div>
      </Card>
    </div>
  );
}
