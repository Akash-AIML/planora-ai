"use client";

import { useCallback } from "react";
import type { EventDetail, EventIdea, EventType } from "@/lib/domain/types";
import { createNewEventDetail } from "@/lib/domain/storage";
import { useBudgetMutations } from "./useBudgetMutations";
import { useTimelineMutations } from "./useTimelineMutations";
import { useExportActions } from "./useExportActions";

interface MutationProps {
  currentEvent: EventDetail | null;
  updateCurrentEvent: (updater: (prev: EventDetail) => EventDetail) => void;
  saveNewEvent: (detail: EventDetail) => void;
  showToast: (msg: string) => void;
  setActiveTab: (tab: "overview" | "budget" | "timeline" | "vendors" | "ideas" | "replan" | "export") => void;
  setIsCreating: (creating: boolean) => void;
  setShowAddBudgetModal: (open: boolean) => void;
  setShowAddTaskModal: (open: boolean) => void;
}

/**
 * Composite mutations hook delegating to budget, timeline, and export micro-hooks
 */
export function useEventMutations({
  currentEvent,
  updateCurrentEvent,
  saveNewEvent,
  showToast,
  setActiveTab,
  setIsCreating,
  setShowAddBudgetModal,
  setShowAddTaskModal,
}: MutationProps) {
  const handleCreateEvent = useCallback(
    (params: {
      title: string;
      eventType: EventType;
      city: string;
      eventDate: string;
      guestCount: number;
      budgetInr: number;
      preferences: string[];
      notes: string;
      ideas: EventIdea[];
    }) => {
      const detail = createNewEventDetail({
        ...params,
        customIdeas: params.ideas,
      });
      saveNewEvent(detail);
      setIsCreating(false);
      setActiveTab("overview");
      showToast(`Event "${detail.event.title}" created successfully!`);
    },
    [saveNewEvent, setIsCreating, setActiveTab, showToast]
  );

  const budgetActions = useBudgetMutations({
    updateCurrentEvent,
    showToast,
    setActiveTab,
    setShowAddBudgetModal,
  });

  const timelineActions = useTimelineMutations({
    updateCurrentEvent,
    showToast,
    setShowAddTaskModal,
  });

  const exportActions = useExportActions({
    currentEvent,
    showToast,
  });

  return {
    handleCreateEvent,
    ...budgetActions,
    ...timelineActions,
    ...exportActions,
  };
}
