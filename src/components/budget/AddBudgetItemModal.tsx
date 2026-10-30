"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <Modal isOpen={isOpen} onClose={onClose} title="Add Budget Line Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="budget-category" className="text-xs text-slate-300">
            Category
          </label>
          <select
            id="budget-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="budget-label" className="text-xs text-slate-300">
            Item Label
          </label>
          <Input
            id="budget-label"
            type="text"
            placeholder="e.g. Drone Videography or Midnight Snack Bar"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="budget-amount" className="text-xs text-slate-300">
            Planned Amount (INR ₹)
          </label>
          <Input
            id="budget-amount"
            type="number"
            min={0}
            step={5000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
          />
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="amber" size="sm">
            Add Line Item
          </Button>
        </div>
      </form>
    </Modal>
  );
}
