"use client";

import { useCallback } from "react";
import type { EventDetail, ReplanProposal } from "@/lib/domain/types";
import { parseRupeeInputValue, sanitizeRupees } from "@/lib/domain/budget";

interface BudgetMutationProps {
  updateCurrentEvent: (updater: (prev: EventDetail) => EventDetail) => void;
  showToast: (msg: string) => void;
  setActiveTab: (tab: "overview" | "budget" | "timeline" | "vendors" | "ideas" | "replan" | "export") => void;
  setShowAddBudgetModal: (open: boolean) => void;
}

export function useBudgetMutations({
  updateCurrentEvent,
  showToast,
  setActiveTab,
  setShowAddBudgetModal,
}: BudgetMutationProps) {
  const handleApplyReplan = useCallback(
    (proposal: ReplanProposal) => {
      const changeMap = new Map(proposal.changes.map((c) => [c.itemId, c.toInr]));
      updateCurrentEvent((prev) => ({
        ...prev,
        event: {
          ...prev.event,
          budgetInr: proposal.targetBudgetInr,
          version: prev.event.version + 1,
        },
        budgetItems: prev.budgetItems.map((item) => {
          const nextPlanned = changeMap.get(item.id);
          return nextPlanned !== undefined ? { ...item, plannedInr: nextPlanned } : item;
        }),
      }));
      showToast("Replan proposal applied: Budget lines updated proportionally.");
      setActiveTab("budget");
    },
    [updateCurrentEvent, showToast, setActiveTab]
  );

  const handleUpdateBudgetItem = useCallback(
    (id: string, field: "plannedInr" | "actualInr" | "label", value: string) => {
      updateCurrentEvent((prev) => ({
        ...prev,
        budgetItems: prev.budgetItems.map((item) => {
          if (item.id !== id) return item;
          if (field === "plannedInr") {
            return { ...item, plannedInr: parseRupeeInputValue(value) };
          }
          if (field === "actualInr") {
            return { ...item, actualInr: value.trim() ? parseRupeeInputValue(value) : null };
          }
          return { ...item, label: value };
        }),
      }));
      showToast("Budget entry updated.");
    },
    [updateCurrentEvent, showToast]
  );

  const handleDeleteBudgetItem = useCallback(
    (id: string) => {
      updateCurrentEvent((prev) => ({
        ...prev,
        budgetItems: prev.budgetItems.filter((i) => i.id !== id),
      }));
      showToast("Budget item removed.");
    },
    [updateCurrentEvent, showToast]
  );

  const handleAddCustomBudgetItem = useCallback(
    (category: string, label: string, amount: number) => {
      updateCurrentEvent((prev) => ({
        ...prev,
        budgetItems: [
          ...prev.budgetItems,
          {
            id: `custom-item-${Date.now()}`,
            eventId: prev.event.id,
            category,
            label,
            plannedInr: sanitizeRupees(amount),
            actualInr: null,
            notes: `Custom added line for ${category}`,
            sortOrder: prev.budgetItems.length,
          },
        ],
      }));
      setShowAddBudgetModal(false);
      showToast(`Added "${label}" to budget.`);
    },
    [updateCurrentEvent, setShowAddBudgetModal, showToast]
  );

  return {
    handleApplyReplan,
    handleUpdateBudgetItem,
    handleDeleteBudgetItem,
    handleAddCustomBudgetItem,
  };
}
