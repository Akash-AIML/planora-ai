"use client";

import { useCallback } from "react";
import type { EventDetail, EventIdea, ShortlistEntry, ShortlistStatus, Task } from "@/lib/domain/types";
import { getNextTaskStatus } from "@/lib/domain/timeline";

interface TimelineMutationProps {
  updateCurrentEvent: (updater: (prev: EventDetail) => EventDetail) => void;
  showToast: (msg: string) => void;
  setShowAddTaskModal: (open: boolean) => void;
}

export function useTimelineMutations({
  updateCurrentEvent,
  showToast,
  setShowAddTaskModal,
}: TimelineMutationProps) {
  const handleCycleTaskStatus = useCallback(
    (taskId: string) => {
      updateCurrentEvent((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: getNextTaskStatus(t.status) } : t)),
      }));
    },
    [updateCurrentEvent]
  );

  const handleAddNewTask = useCallback(
    (title: string, phase: string, priority: Task["priority"], dueDate: string) => {
      updateCurrentEvent((prev) => ({
        ...prev,
        tasks: [
          ...prev.tasks,
          {
            id: `task-${Date.now()}`,
            eventId: prev.event.id,
            title,
            phase,
            dueDate,
            status: "todo",
            priority,
            category: "General",
            sortOrder: prev.tasks.length,
          },
        ],
      }));
      setShowAddTaskModal(false);
      showToast("Milestone task added.");
    },
    [updateCurrentEvent, setShowAddTaskModal, showToast]
  );

  const handleToggleShortlist = useCallback(
    (vendorId: string, status: ShortlistStatus = "shortlisted") => {
      updateCurrentEvent((prev) => {
        const exists = prev.shortlist.some((s) => s.vendorId === vendorId);
        if (exists) {
          return {
            ...prev,
            shortlist: prev.shortlist.filter((s) => s.vendorId !== vendorId),
          };
        }
        const newEntry: ShortlistEntry = {
          eventId: prev.event.id,
          vendorId,
          status,
          quotedInr: null,
          notes: "",
        };
        return { ...prev, shortlist: [...prev.shortlist, newEntry] };
      });
      showToast("Vendor shortlist updated.");
    },
    [updateCurrentEvent, showToast]
  );

  const handleAddIdeaToPlan = useCallback(
    (idea: EventIdea) => {
      updateCurrentEvent((prev) => {
        const newTask: Task = {
          id: `idea-task-${Date.now()}`,
          eventId: prev.event.id,
          title: `Coordinate: ${idea.title}`,
          phase: "1 month out",
          dueDate: prev.event.eventDate,
          status: "todo",
          priority: "medium",
          category: idea.category,
          sortOrder: prev.tasks.length,
        };

        const newBudgetItems = idea.estimatedInr
          ? [
              ...prev.budgetItems,
              {
                id: `idea-budget-${Date.now()}`,
                eventId: prev.event.id,
                category: idea.category,
                label: idea.title,
                plannedInr: idea.estimatedInr,
                actualInr: null,
                notes: `Added from idea concept: ${idea.title}`,
                sortOrder: prev.budgetItems.length,
              },
            ]
          : prev.budgetItems;

        return {
          ...prev,
          tasks: [...prev.tasks, newTask],
          budgetItems: newBudgetItems,
        };
      });
      showToast(`Added "${idea.title}" concepts to tasks and budget!`);
    },
    [updateCurrentEvent, showToast]
  );

  return {
    handleCycleTaskStatus,
    handleAddNewTask,
    handleToggleShortlist,
    handleAddIdeaToPlan,
  };
}
