"use client";

import React from "react";
import { Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { VENDOR_CATEGORY_LABELS } from "@/lib/data/demo-vendors";
import { formatInr } from "@/lib/utils";
import type { RankedVendor, ShortlistStatus, ShortlistEntry } from "@/lib/domain/types";

interface VendorCardProps {
  item: RankedVendor;
  isShortlisted: boolean;
  shortlistEntry?: ShortlistEntry;
  onToggleShortlist: (vendorId: string, status?: ShortlistStatus) => void;
}

export function VendorCard({
  item,
  isShortlisted,
  shortlistEntry,
  onToggleShortlist,
}: VendorCardProps) {
  const { vendor } = item;

  return (
    <Card
      className={`p-5 flex flex-col justify-between space-y-4 transition-all duration-200 ${
        isShortlisted
          ? "border-amber-500/50 bg-amber-500/5 dark:bg-amber-950/10 shadow-sm"
          : "border-border/80 bg-card hover:border-border"
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge variant="amber" className="text-[10px] uppercase font-bold tracking-wider">
              {VENDOR_CATEGORY_LABELS[vendor.category]}
            </Badge>
            <h3 className="text-base font-bold text-foreground mt-1.5">{vendor.name}</h3>
            <p className="text-xs text-muted-foreground">{vendor.cities.join(", ")}</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/20">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{vendor.rating.toFixed(1)}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{vendor.description}</p>

        {/* Pricing block */}
        <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-muted-foreground">Estimated Cost:</span>
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatInr(item.estimateInr)}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground/80">{vendor.priceNote}</p>
        </div>

        {/* Reasons & Tags */}
        <div className="space-y-1 pt-1">
          {item.reasons.slice(0, 2).map((r, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
              <Check className="w-3 h-3 shrink-0" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-border/80 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          Fit Score: <strong className="text-foreground">{item.score}</strong>
        </span>
        <Button
          variant={isShortlisted ? "amber" : "outline"}
          size="sm"
          onClick={() => onToggleShortlist(vendor.id, "shortlisted")}
          className="cursor-pointer font-semibold shadow-xs"
        >
          {isShortlisted ? `★ ${shortlistEntry?.status ?? "Shortlisted"}` : "+ Shortlist"}
        </Button>
      </div>
    </Card>
  );
}
