"use client";

import { useState, useMemo } from "react";
import { rankVendors } from "@/lib/domain/vendors";
import { DEMO_VENDORS } from "@/lib/data/demo-vendors";
import { useEventStorage } from "./useEventStorage";
import { useToast } from "./useToast";
import { useEventMutations } from "./useEventMutations";

export type DashboardTab =
  | "overview"
  | "budget"
  | "timeline"
  | "vendors"
  | "ideas"
  | "replan"
  | "export";

/**
 * Composite application hook coordinating storage, notifications, and event domain mutations.
 * Adheres strictly to the Single Responsibility Principle by composing specialized micro-hooks.
 */
export function usePlanoraApp() {
  const {
    events,
    activeId,
    setActiveId,
    currentEvent,
    updateCurrentEvent,
    saveNewEvent,
  } = useEventStorage();

  const { toast, showToast } = useToast();

  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [isCreating, setIsCreating] = useState(false);
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  const topVendorsForOverview = useMemo(() => {
    if (!currentEvent) return [];
    return rankVendors({
      vendors: DEMO_VENDORS,
      event: currentEvent.event,
      budgetItems: currentEvent.budgetItems,
      category: "all",
    }).slice(0, 3);
  }, [currentEvent]);

  const handlers = useEventMutations({
    currentEvent,
    updateCurrentEvent,
    saveNewEvent,
    showToast,
    setActiveTab,
    setIsCreating,
    setShowAddBudgetModal,
    setShowAddTaskModal,
  });

  return {
    events,
    activeId,
    setActiveId,
    activeTab,
    setActiveTab,
    isCreating,
    setIsCreating,
    toast,
    currentEvent,
    topVendorsForOverview,
    totalVendorsCount: DEMO_VENDORS.length,
    modals: {
      showAddBudgetModal,
      setShowAddBudgetModal,
      showAddTaskModal,
      setShowAddTaskModal,
    },
    handlers,
  };
}
