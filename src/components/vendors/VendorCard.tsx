"use client";

import React from "react";
import { Star, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatInr } from "@/lib/utils";
import { VENDOR_CATEGORY_LABELS } from "@/lib/data/demo-vendors";
import type { RankedVendor, ShortlistEntry, ShortlistStatus } from "@/lib/domain/types";

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
      className={`p-5 flex flex-col justify-between space-y-4 border transition ${
        isShortlisted ? "border-amber-400/50 bg-amber-950/10" : "border-slate-800"
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge variant="amber" className="text-[10px] uppercase tracking-wider">
              {VENDOR_CATEGORY_LABELS[vendor.category]}
            </Badge>
            <h3 className="text-base font-bold text-white mt-1">{vendor.name}</h3>
            <p className="text-xs text-slate-400">{vendor.cities.join(", ")}</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{vendor.rating.toFixed(1)}</span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{vendor.description}</p>

        {/* Pricing block */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-slate-400">Estimated Cost:</span>
            <span className="text-sm font-extrabold text-emerald-400">
              {formatInr(item.estimateInr)}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">{vendor.priceNote}</p>
        </div>

        {/* Reasons & Tags */}
        <div className="space-y-1 pt-1">
          {item.reasons.slice(0, 2).map((r, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px] text-emerald-400/90">
              <Check className="w-3 h-3 shrink-0" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          Fit Score: <strong>{item.score}</strong>
        </span>
        <Button
          variant={isShortlisted ? "amber" : "secondary"}
          size="sm"
          onClick={() => onToggleShortlist(vendor.id, "shortlisted")}
        >
          {isShortlisted ? `★ ${shortlistEntry?.status ?? "Shortlisted"}` : "+ Shortlist"}
        </Button>
      </div>
    </Card>
  );
}
