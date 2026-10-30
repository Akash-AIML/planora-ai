"use client";

import React from "react";
import { MapPin, Calendar, Users, Sliders, Download, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EVENT_TYPE_LABELS } from "@/lib/domain/types";
import type { EventDetail } from "@/lib/domain/types";
import { KPISummaryStrip } from "./KPISummaryStrip";

interface EventRibbonProps {
  eventDetail: EventDetail;
  onOpenReplan: () => void;
  onDownloadExport: () => void;
  onCopyMarkdown: () => void;
}

export function EventRibbon({
  eventDetail,
  onOpenReplan,
  onDownloadExport,
  onCopyMarkdown,
}: EventRibbonProps) {
  const { event } = eventDetail;

  return (
    <Card className="p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="amber" className="uppercase tracking-wider">
              {EVENT_TYPE_LABELS[event.eventType]}
            </Badge>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {event.city}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {event.eventDate}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              {event.guestCount} Guests
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {event.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="default" size="sm" onClick={onOpenReplan} aria-label="Open What-If Replan">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>What-If Replan</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={onDownloadExport} aria-label="Download JSON Export">
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={onCopyMarkdown} aria-label="Share Markdown Plan">
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </Button>
        </div>
      </div>

      <KPISummaryStrip eventDetail={eventDetail} />
    </Card>
  );
}
