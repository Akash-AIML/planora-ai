"use client";

import React from "react";
import { formatInr } from "@/lib/utils";
import type { BudgetChange } from "@/lib/domain/types";

interface ProposalDiffTableProps {
  changes: BudgetChange[];
}

export function ProposalDiffTable({ changes }: ProposalDiffTableProps) {
  if (changes.length === 0) {
    return (
      <p className="text-xs text-slate-400">
        No cuts are required. Target budget is sufficient to cover current planned spend.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold text-slate-200">
        Proposed Adjustments by Line Item:
      </span>
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
              <th className="py-2.5 px-4">Line Item</th>
              <th className="py-2.5 px-4">Category</th>
              <th className="py-2.5 px-4">Current Spend</th>
              <th className="py-2.5 px-4">Proposed Spend</th>
              <th className="py-2.5 px-4">Adjustment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {changes.map((change) => {
              const cut = change.fromInr - change.toInr;
              return (
                <tr key={change.itemId} className="hover:bg-slate-850/40">
                  <td className="py-2.5 px-4 font-medium text-white">{change.label}</td>
                  <td className="py-2.5 px-4 text-slate-400">{change.category}</td>
                  <td className="py-2.5 px-4 text-slate-300">{formatInr(change.fromInr)}</td>
                  <td className="py-2.5 px-4 font-bold text-amber-300">{formatInr(change.toInr)}</td>
                  <td className="py-2.5 px-4 font-bold text-rose-400">-{formatInr(cut)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
