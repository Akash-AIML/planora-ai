"use client";

import { useCallback } from "react";
import type {
  EventDetail,
  EventIdea,
  EventType,
  ReplanProposal,
  ShortlistEntry,
  ShortlistStatus,
  Task,
} from "@/lib/domain/types";
import { parseRupeeInputValue, sanitizeRupees } from "@/lib/domain/budget";
import { getNextTaskStatus } from "@/lib/domain/timeline";
import {
  createNewEventDetail,
  buildPlanoraExport,
  generateEventMarkdown,
} from "@/lib/domain/storage";

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
 * Focused hook containing user-triggered event mutation operations
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

  const handleDownloadExport = useCallback(() => {
    if (!currentEvent) return;
    const exportData = buildPlanoraExport(currentEvent);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planora-${currentEvent.event.title.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Planora JSON specification downloaded!");
  }, [currentEvent, showToast]);

  const handleCopyMarkdown = useCallback(async () => {
    if (!currentEvent) return;
    try {
      await navigator.clipboard.writeText(generateEventMarkdown(currentEvent));
      showToast("Markdown brief copied to clipboard!");
    } catch {
      showToast("Failed to copy clipboard.");
    }
  }, [currentEvent, showToast]);

  return {
    handleCreateEvent,
    handleApplyReplan,
    handleUpdateBudgetItem,
    handleDeleteBudgetItem,
    handleAddCustomBudgetItem,
    handleCycleTaskStatus,
    handleAddNewTask,
    handleToggleShortlist,
    handleAddIdeaToPlan,
    handleDownloadExport,
    handleCopyMarkdown,
  };
}
