"use client";

import React from "react";
import {
  Sparkles,
  IndianRupee,
  Calendar,
  Building,
  Star,
  Sliders,
  FileText,
} from "lucide-react";
import type { DashboardTab } from "@/lib/hooks/usePlanoraApp";

export const DASHBOARD_TABS: Array<{ id: DashboardTab; label: string; icon: React.ElementType }> = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "budget", label: "Budget & Expenses", icon: IndianRupee },
  { id: "timeline", label: "Preparation Timeline", icon: Calendar },
  { id: "vendors", label: "Vendors", icon: Building },
  { id: "ideas", label: "Personalized Ideas", icon: Star },
  { id: "replan", label: "Budget Replanner", icon: Sliders },
  { id: "export", label: "Export & Print", icon: FileText },
];

interface DashboardTabsNavProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
}

export function DashboardTabsNav({ activeTab, onSelectTab }: DashboardTabsNavProps) {
  return (
    <div
      role="tablist"
      aria-label="Event Sections"
      className="flex overflow-x-auto border-b border-border/80 gap-1.5 pb-1 no-print"
    >
      {DASHBOARD_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
              isActive
                ? "bg-amber-500/15 text-amber-900 dark:text-amber-300 border-b-2 border-amber-500 shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Icon
              className={`w-4 h-4 ${isActive ? "text-amber-500 dark:text-amber-400" : "text-muted-foreground"}`}
            />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
