"use client";

import React from "react";
import { Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-600 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
                Planora AI
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 tracking-wide uppercase">
                GenAI Copilot
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Prompt-to-Plan with Mathematical Budget Replanning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {events.length > 0 && !isCreating && (
            <div className="relative">
              <label htmlFor="event-switcher" className="sr-only">
                Select Active Event Plan
              </label>
              <select
                id="event-switcher"
                value={activeId ?? ""}
                onChange={(e) => onSelectEvent(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-amber-400 max-w-[200px] truncate cursor-pointer"
              >
                {events.map((ev) => (
                  <option key={ev.event.id} value={ev.event.id}>
                    {ev.event.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            id="plan-new-event-btn"
            variant="amber"
            size="sm"
            onClick={onStartNewPlan}
            aria-label="Start new event plan"
          >
            <Plus className="w-4 h-4" />
            <span>New Plan</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
