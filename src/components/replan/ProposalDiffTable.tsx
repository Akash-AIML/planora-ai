"use client";

import React from "react";
import { formatInr } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { BudgetChange } from "@/lib/domain/types";

interface ProposalDiffTableProps {
  changes: BudgetChange[];
}

export function ProposalDiffTable({ changes }: ProposalDiffTableProps) {
  if (changes.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No cuts are required. Target budget is sufficient to cover current planned spend.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold text-foreground">
        Proposed Adjustments by Line Item:
      </span>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
              <TableHead className="py-2.5 px-4 font-bold text-muted-foreground">Line Item</TableHead>
              <TableHead className="py-2.5 px-4 font-bold text-muted-foreground">Category</TableHead>
              <TableHead className="py-2.5 px-4 font-bold text-muted-foreground">Current Spend</TableHead>
              <TableHead className="py-2.5 px-4 font-bold text-muted-foreground">Proposed Spend</TableHead>
              <TableHead className="py-2.5 px-4 font-bold text-muted-foreground">Adjustment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {changes.map((change) => {
              const cut = change.fromInr - change.toInr;
              return (
                <TableRow key={change.itemId} className="hover:bg-muted/40 transition">
                  <TableCell className="py-2.5 px-4 font-medium text-foreground">{change.label}</TableCell>
                  <TableCell className="py-2.5 px-4 text-muted-foreground">{change.category}</TableCell>
                  <TableCell className="py-2.5 px-4 text-muted-foreground">{formatInr(change.fromInr)}</TableCell>
                  <TableCell className="py-2.5 px-4 font-bold text-amber-600 dark:text-amber-300">{formatInr(change.toInr)}</TableCell>
                  <TableCell className="py-2.5 px-4 font-bold text-rose-600 dark:text-rose-400">-{formatInr(cut)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
