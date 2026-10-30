"use client";

import React, { useState, useMemo } from "react";
import { Filter, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VENDOR_CATEGORY_LABELS, DEMO_VENDORS } from "@/lib/data/demo-vendors";
import { rankVendors, compareVendors } from "@/lib/domain/vendors";
import type { EventDetail, ShortlistStatus, VendorCategory } from "@/lib/domain/types";
import { ComparisonHighlights } from "./ComparisonHighlights";
import { VendorCard } from "./VendorCard";

interface VendorDirectoryProps {
  currentEvent: EventDetail;
  onToggleShortlist: (vendorId: string, status?: ShortlistStatus) => void;
}

const CATEGORIES: Array<VendorCategory | "all"> = [
  "all",
  "venue",
  "catering",
  "photography",
  "decor",
  "music",
  "beauty",
  "activities",
];

const CITIES = [
  "all",
  "Jaipur",
  "Udaipur",
  "Bengaluru",
  "Delhi NCR",
  "Mumbai",
  "Goa",
  "Chennai",
];

export function VendorDirectory({
  currentEvent,
  onToggleShortlist,
}: VendorDirectoryProps) {
  const [categoryFilter, setCategoryFilter] = useState<VendorCategory | "all">("all");
  const [cityFilter, setCityFilter] = useState("all");

  const rankedVendorsList = useMemo(() => {
    const filtered = DEMO_VENDORS.filter((v) => {
      if (cityFilter === "all") return true;
      return v.cities.some((c) => c.toLowerCase() === cityFilter.toLowerCase());
    });
    return rankVendors({
      vendors: filtered,
      event: currentEvent.event,
      budgetItems: currentEvent.budgetItems,
      category: categoryFilter,
    });
  }, [currentEvent, categoryFilter, cityFilter]);

  const comparisons = useMemo(() => {
    return compareVendors(rankedVendorsList);
  }, [rankedVendorsList]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Curated Vendor Directory</h2>
          <p className="text-xs text-muted-foreground">
            Scored against your city ({currentEvent.event.city}), category budget limits, and
            preferences.
          </p>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-medium">
          ⚠ Demo Listings: Verified for simulation; confirm commercial quotes.
        </div>
      </div>

      <ComparisonHighlights
        bestFit={comparisons.bestFit}
        highestRated={comparisons.highestRated}
        lowestEstimate={comparisons.lowestEstimate}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "amber" : "outline"}
              size="xs"
              onClick={() => setCategoryFilter(cat)}
              className="cursor-pointer font-medium text-xs shadow-2xs"
            >
              {cat === "all" ? "All Categories" : VENDOR_CATEGORY_LABELS[cat]}
            </Button>
          ))}
        </div>

        {/* City Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="vendor-city-select" className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
            <MapPin className="w-3.5 h-3.5" /> City:
          </label>
          <select
            id="vendor-city-select"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-background border border-input rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer transition shadow-2xs"
          >
            {CITIES.map((c) => (
              <option key={c} value={c} className="bg-popover text-popover-foreground">
                {c === "all" ? "All Cities" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rankedVendorsList.map((item) => {
          const isShortlisted = currentEvent.shortlist.some((s) => s.vendorId === item.vendor.id);
          const shortlistEntry = currentEvent.shortlist.find((s) => s.vendorId === item.vendor.id);

          return (
            <VendorCard
              key={item.vendor.id}
              item={item}
              isShortlisted={isShortlisted}
              shortlistEntry={shortlistEntry}
              onToggleShortlist={onToggleShortlist}
            />
          );
        })}
      </div>
    </div>
  );
}
