"use client";

import React from "react";
import { Sparkles, Building, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryDistributionBar } from "./CategoryDistributionBar";
import { VENDOR_CATEGORY_LABELS } from "@/lib/data/demo-vendors";
import { formatInr } from "@/lib/utils";
import type { EventDetail, RankedVendor, Task, VendorCategory } from "@/lib/domain/types";

interface OverviewTabPanelProps {
  currentEvent: EventDetail;
  topVendors: RankedVendor[];
  totalVendorsCount: number;
  onCycleTaskStatus: (taskId: string) => void;
  onToggleShortlist: (vendorId: string) => void;
  onNavigateTab: (tab: "budget" | "timeline" | "vendors" | "replan" | "ideas" | "export") => void;
}

export function OverviewTabPanel({
  currentEvent,
  topVendors,
  totalVendorsCount,
  onCycleTaskStatus,
  onToggleShortlist,
  onNavigateTab,
}: OverviewTabPanelProps) {
  const priorityTasks = currentEvent.tasks.slice(0, 5);

  return (
    <div
      role="tabpanel"
      id="panel-overview"
      aria-labelledby="tab-overview"
      className="space-y-6"
    >
      {/* Category Allocation Distribution Bar */}
      <CategoryDistributionBar
        totals={currentEvent.totals}
        onViewBudgetTab={() => onNavigateTab("budget")}
      />

      {/* Two Column Layout: Upcoming Milestones + Top Vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Milestones */}
        <Card className="p-6 space-y-4 border-border/80 bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Upcoming Priority Milestones
            </h3>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onNavigateTab("timeline")}
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 cursor-pointer font-semibold"
            >
              All Tasks ({currentEvent.tasks.length}) →
            </Button>
          </div>

          <div className="space-y-2.5">
            {priorityTasks.map((task: Task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => onCycleTaskStatus(task.id)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/80 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      task.status === "done"
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-muted-foreground/40 bg-background text-transparent"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <div>
                    <p
                      className={`text-xs font-semibold ${
                        task.status === "done"
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {task.phase} · Due {task.dueDate}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={task.priority === "high" ? "rose" : "amber"}
                  className="text-[10px] uppercase font-bold"
                >
                  {task.priority}
                </Badge>
              </button>
            ))}
          </div>
        </Card>

        {/* Top Matched Vendors */}
        <Card className="p-6 space-y-4 border-border/80 bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              Top Matched Vendors
            </h3>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onNavigateTab("vendors")}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 cursor-pointer font-semibold"
            >
              Explore Vendors ({totalVendorsCount}) →
            </Button>
          </div>

          <div className="space-y-3">
            {topVendors.map((item) => {
              const isShortlisted = currentEvent.shortlist.some(
                (s) => s.vendorId === item.vendor.id
              );
              return (
                <div
                  key={item.vendor.id}
                  className="p-3.5 rounded-xl bg-muted/40 border border-border/80 hover:border-border transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{item.vendor.name}</h4>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        {VENDOR_CATEGORY_LABELS[item.vendor.category as VendorCategory]} · {item.vendor.cities.join(", ")}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-foreground">
                        {formatInr(item.estimateInr)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Score: {item.score} pts
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {item.reasons[0] ?? "Recommended match"}
                    </span>
                    <Button
                      type="button"
                      variant={isShortlisted ? "amber" : "outline"}
                      size="xs"
                      onClick={() => onToggleShortlist(item.vendor.id)}
                      className="cursor-pointer font-semibold"
                    >
                      {isShortlisted ? "✓ Shortlisted" : "+ Shortlist"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Replanner Callout Banner */}
      <div className="p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-amber-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>Need to Adjust Your Budget or Scope?</span>
          </h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Simulate reductions or increases. Planora AI enforces category floors (e.g. Venue & Catering ~70%)
            while intelligently reducing flexible lines. See exact before-and-after diffs before approving changes.
          </p>
        </div>
        <Button
          type="button"
          variant="default"
          onClick={() => onNavigateTab("replan")}
          className="shrink-0 cursor-pointer shadow-sm font-semibold"
        >
          Open Replanner →
        </Button>
      </div>
    </div>
  );
}
