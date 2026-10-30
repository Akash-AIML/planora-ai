"use client";

import React from "react";
import { Sparkles, Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import type { EventDetail } from "@/lib/domain/types";

interface NavbarProps {
  events: EventDetail[];
  activeId: string | null;
  isCreating: boolean;
  onSelectEvent: (id: string) => void;
  onStartNewPlan: () => void;
}

export function Navbar({
  events,
  activeId,
  isCreating,
  onSelectEvent,
  onStartNewPlan,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-xl no-print transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-600 p-[1.5px] shadow-md shadow-indigo-500/20 shrink-0">
            <div className="w-full h-full bg-background rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-amber-600 dark:to-amber-300 bg-clip-text text-transparent">
                Planora AI
              </span>
              <Badge variant="amber" className="text-[10px] uppercase font-bold tracking-wider hidden sm:inline-flex">
                GenAI Copilot
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground hidden md:block">
              Intelligent Prompt-to-Plan with Mathematical Budget Replanning
            </p>
          </div>
        </div>

        {/* Right Section: Event Switcher, Theme Toggle, New Plan */}
        <div className="flex items-center gap-2.5">
          {events.length > 0 && !isCreating && (
            <div className="relative flex items-center">
              <label htmlFor="event-switcher" className="sr-only">
                Select Active Event Plan
              </label>
              <div className="relative">
                <select
                  id="event-switcher"
                  value={activeId ?? ""}
                  onChange={(e) => onSelectEvent(e.target.value)}
                  className="appearance-none bg-muted/60 hover:bg-muted border border-border rounded-xl pl-8 pr-8 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring max-w-[160px] sm:max-w-[220px] truncate cursor-pointer transition shadow-xs"
                >
                  {events.map((ev) => (
                    <option key={ev.event.id} value={ev.event.id} className="bg-popover text-popover-foreground">
                      {ev.event.title}
                    </option>
                  ))}
                </select>
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <span className="text-[10px] text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  ▼
                </span>
              </div>
            </div>
          )}

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* New Plan Button */}
          <Button
            id="plan-new-event-btn"
            variant="amber"
            size="sm"
            onClick={onStartNewPlan}
            aria-label="Start new event plan"
            className="cursor-pointer gap-1.5 font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">New Plan</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
