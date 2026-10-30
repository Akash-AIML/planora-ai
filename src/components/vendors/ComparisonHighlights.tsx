"use client";

import React from "react";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatInr } from "@/lib/utils";
import type { RankedVendor } from "@/lib/domain/types";

interface ComparisonHighlightsProps {
  bestFit: RankedVendor | null;
  highestRated: RankedVendor | null;
  lowestEstimate: number | null;
}

export function ComparisonHighlights({
  bestFit,
  highestRated,
  lowestEstimate,
}: ComparisonHighlightsProps) {
  if (!bestFit) return null;

  return (
    <Card className="p-4 bg-muted/40 border-border/80 shadow-xs">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <span className="text-muted-foreground">Best Overall Fit:</span>
          <div className="font-bold text-amber-600 dark:text-amber-300 mt-0.5">
            {bestFit.vendor.name} ({bestFit.score} pts)
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Highest Rated Provider:</span>
          <div className="font-bold text-foreground flex items-center gap-1 mt-0.5">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
            {highestRated?.vendor.name} ({highestRated?.vendor.rating.toFixed(1)}★)
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Lowest Estimated Starting:</span>
          <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {lowestEstimate !== null ? formatInr(lowestEstimate) : "—"}
          </div>
        </div>
      </div>
    </Card>
  );
}
