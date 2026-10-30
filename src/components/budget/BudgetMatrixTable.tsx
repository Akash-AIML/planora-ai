"use client";

import React from "react";
import { Plus, Trash2, Building, Utensils, Camera, Palette, Music, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { formatInr } from "@/lib/utils";
import type { BudgetItem, BudgetTotals } from "@/lib/domain/types";

interface BudgetMatrixTableProps {
  items: BudgetItem[];
  totals: BudgetTotals;
  onUpdateItem: (id: string, field: "plannedInr" | "actualInr" | "label", value: string) => void;
  onDeleteItem: (id: string) => void;
  onOpenAddModal: () => void;
}

export function BudgetMatrixTable({
  items,
  totals,
  onUpdateItem,
  onDeleteItem,
  onOpenAddModal,
}: BudgetMatrixTableProps) {
  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "venue":
        return <Building className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
      case "catering":
        return <Utensils className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
      case "photography":
        return <Camera className="w-4 h-4 text-purple-500 dark:text-purple-400" />;
      case "decor":
        return <Palette className="w-4 h-4 text-pink-500 dark:text-pink-400" />;
      case "entertainment":
      case "music":
        return <Music className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Interactive Budget Matrix</h2>
          <p className="text-xs text-muted-foreground">
            Edit planned values or record actual vendor invoices. Totals and category percentages
            recalculate deterministically.
          </p>
        </div>
        <Button variant="amber" size="sm" onClick={onOpenAddModal} className="cursor-pointer gap-1.5 shadow-xs">
          <Plus className="w-4 h-4" />
          <span>Add Custom Line Item</span>
        </Button>
      </div>

      <Card className="overflow-hidden border-border/80 shadow-xs bg-card">
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/60 hover:bg-muted/60">
              <TableHead className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] text-muted-foreground">Category</TableHead>
              <TableHead className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] text-muted-foreground">Line Item</TableHead>
              <TableHead className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] text-muted-foreground">Planned (INR)</TableHead>
              <TableHead className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] text-muted-foreground">Actual (INR)</TableHead>
              <TableHead className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] text-muted-foreground">Variance</TableHead>
              <TableHead className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] text-muted-foreground">Notes</TableHead>
              <TableHead className="py-3 px-4 text-right font-bold uppercase tracking-wider text-[11px] text-muted-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const diff = item.actualInr !== null ? item.plannedInr - item.actualInr : null;
              return (
                <TableRow key={item.id} className="hover:bg-muted/40 transition">
                  <TableCell className="py-3 px-4 font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(item.category)}
                      <span>{item.category}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <input
                      type="text"
                      value={item.label}
                      aria-label={`Label for ${item.category}`}
                      onChange={(e) => onUpdateItem(item.id, "label", e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-border focus:border-amber-500 focus:bg-background text-foreground px-1.5 py-0.5 rounded text-xs w-full focus:outline-none transition"
                    />
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <input
                      type="number"
                      step={1000}
                      value={item.plannedInr}
                      aria-label={`Planned amount for ${item.label}`}
                      onChange={(e) => onUpdateItem(item.id, "plannedInr", e.target.value)}
                      className="bg-background border border-input focus:border-amber-500 text-foreground font-medium px-2 py-1 rounded-md text-xs w-28 focus:outline-none transition"
                    />
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <input
                      type="number"
                      step={1000}
                      placeholder="0"
                      value={item.actualInr ?? ""}
                      aria-label={`Actual amount for ${item.label}`}
                      onChange={(e) => onUpdateItem(item.id, "actualInr", e.target.value)}
                      className="bg-background border border-input focus:border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium px-2 py-1 rounded-md text-xs w-28 focus:outline-none placeholder:text-muted-foreground transition"
                    />
                  </TableCell>
                  <TableCell className="py-3 px-4 font-semibold">
                    {diff === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : diff >= 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">+{formatInr(diff)}</span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400">{formatInr(diff)}</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-muted-foreground max-w-xs truncate">{item.notes}</TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onDeleteItem(item.id)}
                      className="text-muted-foreground hover:text-destructive transition cursor-pointer"
                      title="Delete item"
                      aria-label={`Delete ${item.label}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter className="bg-muted/70 font-bold text-foreground border-t-2 border-border">
            <TableRow>
              <TableCell className="py-3 px-4" colSpan={2}>
                Total Across All Lines
              </TableCell>
              <TableCell className="py-3 px-4 text-amber-600 dark:text-amber-400">{formatInr(totals.plannedInr)}</TableCell>
              <TableCell className="py-3 px-4 text-emerald-600 dark:text-emerald-400">{formatInr(totals.actualInr)}</TableCell>
              <TableCell
                className={`py-3 px-4 ${totals.overBudget ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}
              >
                {totals.remainingInr >= 0
                  ? `Buffer: +${formatInr(totals.remainingInr)}`
                  : `Deficit: ${formatInr(totals.remainingInr)}`}
              </TableCell>
              <TableCell className="py-3 px-4" colSpan={2} />
            </TableRow>
          </TableFooter>
        </Table>
      </Card>
    </div>
  );
}
