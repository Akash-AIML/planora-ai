"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddBudgetItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (category: string, label: string, amount: number) => void;
}

const CATEGORIES = [
  "Venue",
  "Catering",
  "Decor",
  "Photography",
  "Entertainment",
  "Attire",
  "Gifting",
  "Contingency",
  "Logistics",
  "Other",
];

export function AddBudgetItemModal({
  isOpen,
  onClose,
  onAddItem,
}: AddBudgetItemModalProps) {
  const [category, setCategory] = useState("Decor");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState(50000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    onAddItem(category, label.trim(), amount);
    setLabel("");
    setAmount(50000);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-popover text-popover-foreground border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Add Budget Line Item
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="budget-category" className="text-xs font-semibold text-foreground">
              Category
            </Label>
            <select
              id="budget-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-popover text-popover-foreground">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="budget-label" className="text-xs font-semibold text-foreground">
              Item Label
            </Label>
            <Input
              id="budget-label"
              type="text"
              placeholder="e.g. Drone Videography or Midnight Snack Bar"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="budget-amount" className="text-xs font-semibold text-foreground">
              Planned Amount (INR ₹)
            </Label>
            <Input
              id="budget-amount"
              type="number"
              min={0}
              step={5000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" variant="amber" size="sm" className="cursor-pointer shadow-xs font-semibold">
              Add Line Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
