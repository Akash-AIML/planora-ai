"use client";

import React from "react";
import { Sparkles, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatInr } from "@/lib/utils";
import { EVENT_TYPE_LABELS } from "@/lib/domain/types";
import type { EventDetail, EventIdea } from "@/lib/domain/types";

interface IdeasGridProps {
  currentEvent: EventDetail;
  onAddIdeaToPlan: (idea: EventIdea) => void;
}

export function IdeasGrid({ currentEvent, onAddIdeaToPlan }: IdeasGridProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground tracking-tight">
          Personalized Event Concepts & Ideas
        </h2>
        <p className="text-xs text-muted-foreground">
          Tailored specifically for {EVENT_TYPE_LABELS[currentEvent.event.eventType]} in{" "}
          {currentEvent.event.city}. Add any idea directly to your plan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentEvent.ideas.map((idea) => (
          <Card
            key={idea.id}
            className="p-6 flex flex-col justify-between space-y-4 border-border/80 bg-card hover:border-indigo-500/40 hover:shadow-md transition-all duration-200"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="indigo" className="text-[10px] uppercase font-bold tracking-wider">
                  {idea.category}
                </Badge>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                  {idea.source === "ai" ? "GenAI Crafted" : "Curated Theme"}
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground">{idea.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{idea.description}</p>
              {idea.estimatedInr && (
                <div className="text-xs font-semibold text-amber-600 dark:text-amber-300 pt-1">
                  Estimated Impact: ~{formatInr(idea.estimatedInr)}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border/80 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddIdeaToPlan(idea)}
                className="cursor-pointer gap-1.5 font-medium shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Tasks & Budget</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
