"use client";

import React from "react";
import { Plus, Trash2, Building, Utensils, Camera, Palette, Music, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
        return <Building className="w-4 h-4 text-amber-400" />;
      case "catering":
        return <Utensils className="w-4 h-4 text-emerald-400" />;
      case "photography":
        return <Camera className="w-4 h-4 text-purple-400" />;
      case "decor":
        return <Palette className="w-4 h-4 text-pink-400" />;
      case "entertainment":
      case "music":
        return <Music className="w-4 h-4 text-blue-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Interactive Budget Matrix</h2>
          <p className="text-xs text-slate-400">
            Edit planned values or record actual vendor invoices. Totals and category percentages
            recalculate deterministically.
          </p>
        </div>
        <Button variant="amber" size="sm" onClick={onOpenAddModal}>
          <Plus className="w-4 h-4" />
          <span>Add Custom Line Item</span>
        </Button>
      </div>

      <Card className="overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Line Item</th>
                <th className="py-3 px-4">Planned (INR)</th>
                <th className="py-3 px-4">Actual (INR)</th>
                <th className="py-3 px-4">Variance</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.map((item) => {
                const diff = item.actualInr !== null ? item.plannedInr - item.actualInr : null;
                return (
                  <tr key={item.id} className="hover:bg-slate-850/50 transition duration-150">
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(item.category)}
                        <span>{item.category}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.label}
                        aria-label={`Label for ${item.category}`}
                        onChange={(e) => onUpdateItem(item.id, "label", e.target.value)}
                        className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-amber-400 focus:bg-slate-900 text-slate-200 px-1 py-0.5 rounded text-xs w-full focus:outline-none"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        step={1000}
                        value={item.plannedInr}
                        aria-label={`Planned amount for ${item.label}`}
                        onChange={(e) => onUpdateItem(item.id, "plannedInr", e.target.value)}
                        className="bg-slate-900/80 border border-slate-700/80 focus:border-amber-400 text-slate-100 font-medium px-2 py-1 rounded text-xs w-28 focus:outline-none"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        step={1000}
                        placeholder="0"
                        value={item.actualInr ?? ""}
                        aria-label={`Actual amount for ${item.label}`}
                        onChange={(e) => onUpdateItem(item.id, "actualInr", e.target.value)}
                        className="bg-slate-900/80 border border-slate-700/80 focus:border-emerald-400 text-emerald-300 font-medium px-2 py-1 rounded text-xs w-28 focus:outline-none placeholder-slate-600"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {diff === null ? (
                        <span className="text-slate-500">—</span>
                      ) : diff >= 0 ? (
                        <span className="text-emerald-400">+{formatInr(diff)}</span>
                      ) : (
                        <span className="text-rose-400">{formatInr(diff)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{item.notes}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="text-slate-500 hover:text-rose-400 transition p-1 cursor-pointer"
                        title="Delete item"
                        aria-label={`Delete ${item.label}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900/90 font-bold text-white border-t-2 border-slate-700">
                <td className="py-3 px-4" colSpan={2}>
                  Total Across All Lines
                </td>
                <td className="py-3 px-4 text-amber-300">{formatInr(totals.plannedInr)}</td>
                <td className="py-3 px-4 text-emerald-300">{formatInr(totals.actualInr)}</td>
                <td
                  className={`py-3 px-4 ${totals.overBudget ? "text-rose-400" : "text-emerald-400"}`}
                >
                  {totals.remainingInr >= 0
                    ? `Buffer: +${formatInr(totals.remainingInr)}`
                    : `Deficit: ${formatInr(totals.remainingInr)}`}
                </td>
                <td className="py-3 px-4" colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
