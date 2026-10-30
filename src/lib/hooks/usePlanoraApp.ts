"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type {
  EventDetail,
  EventIdea,
  EventType,
  ReplanProposal,
  ShortlistEntry,
  ShortlistStatus,
  Task,
  TaskStatus,
} from "@/lib/domain/types";
import { calculateBudgetTotals, sanitizeRupees } from "@/lib/domain/budget";
import { rankVendors } from "@/lib/domain/vendors";
import { DEMO_VENDORS } from "@/lib/data/demo-vendors";
import {
  loadAllEvents,
  saveAllEvents,
  getActiveEventId,
  setActiveEventId,
  createNewEventDetail,
  buildPlanoraExport,
  getSampleInitialEvent,
} from "@/lib/domain/storage";
import { UI_CONFIG } from "@/lib/constants/config";

export type DashboardTab =
  | "overview"
  | "budget"
  | "timeline"
  | "vendors"
  | "ideas"
  | "replan"
  | "export";

export function usePlanoraApp() {
  const [events, setEvents] = useState<EventDetail[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // Initialize and load persisted events on client mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const loaded = loadAllEvents();
      if (loaded.length === 0) {
        const initial = getSampleInitialEvent();
        setEvents([initial]);
        setActiveId(initial.event.id);
        saveAllEvents([initial]);
      } else {
        setEvents(loaded);
        const savedActiveId = getActiveEventId();
        if (savedActiveId && loaded.some((e) => e.event.id === savedActiveId)) {
          setActiveId(savedActiveId);
        } else {
          setActiveId(loaded[0].event.id);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), UI_CONFIG.TOAST_DURATION_MS);
  }, []);

  const updateCurrentEvent = useCallback(
    (updater: (prev: EventDetail) => EventDetail) => {
      setEvents((prev) => {
        const next = prev.map((item) => {
          if (item.event.id !== activeId) return item;
          const updated = updater(item);
          updated.totals = calculateBudgetTotals(updated.budgetItems, updated.event.budgetInr);
          updated.event.updatedAt = new Date().toISOString();
          return updated;
        });
        saveAllEvents(next);
        return next;
      });
    },
    [activeId]
  );

  const currentEvent = useMemo(() => {
    return events.find((e) => e.event.id === activeId) ?? events[0] ?? null;
  }, [events, activeId]);

  const topVendorsForOverview = useMemo(() => {
    if (!currentEvent) return [];
    return rankVendors({
      vendors: DEMO_VENDORS,
      event: currentEvent.event,
      budgetItems: currentEvent.budgetItems,
      category: "all",
    }).slice(0, 3);
  }, [currentEvent]);

  // Event Creation
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
      const nextEvents = [detail, ...events];
      setEvents(nextEvents);
      setActiveId(detail.event.id);
      setActiveEventId(detail.event.id);
      saveAllEvents(nextEvents);

      setIsCreating(false);
      setActiveTab("overview");
      showToast(`Event "${detail.event.title}" created successfully!`);
    },
    [events, showToast]
  );

  // Replan Application
  const handleApplyReplan = useCallback(
    (proposal: ReplanProposal) => {
      const changeMap = new Map(proposal.changes.map((c) => [c.itemId, c.toInr]));

      updateCurrentEvent((prev) => {
        const updatedItems = prev.budgetItems.map((item) => {
          const nextPlanned = changeMap.get(item.id);
          return nextPlanned !== undefined ? { ...item, plannedInr: nextPlanned } : item;
        });
        return {
          ...prev,
          event: {
            ...prev.event,
            budgetInr: proposal.targetBudgetInr,
            version: prev.event.version + 1,
          },
          budgetItems: updatedItems,
        };
      });

      showToast("Replan proposal applied: Budget lines updated proportionally.");
      setActiveTab("budget");
    },
    [updateCurrentEvent, showToast]
  );

  // Budget Item Actions
  const handleUpdateBudgetItem = useCallback(
    (id: string, field: "plannedInr" | "actualInr" | "label", value: string) => {
      updateCurrentEvent((prev) => ({
        ...prev,
        budgetItems: prev.budgetItems.map((item) => {
          if (item.id !== id) return item;
          if (field === "plannedInr") {
            const num = parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
            return { ...item, plannedInr: num };
          }
          if (field === "actualInr") {
            const num = value.trim() ? parseInt(value.replace(/[^0-9]/g, ""), 10) || 0 : null;
            return { ...item, actualInr: num };
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
      updateCurrentEvent((prev) => {
        const newItem = {
          id: `custom-item-${Date.now()}`,
          eventId: prev.event.id,
          category,
          label,
          plannedInr: sanitizeRupees(amount),
          actualInr: null,
          notes: `Custom added line for ${category}`,
          sortOrder: prev.budgetItems.length,
        };
        return {
          ...prev,
          budgetItems: [...prev.budgetItems, newItem],
        };
      });
      setShowAddBudgetModal(false);
      showToast(`Added "${label}" to budget.`);
    },
    [updateCurrentEvent, showToast]
  );

  // Task / Timeline Actions
  const handleCycleTaskStatus = useCallback(
    (taskId: string) => {
      updateCurrentEvent((prev) => {
        const nextStatusOrder: Record<TaskStatus, TaskStatus> = {
          todo: "doing",
          doing: "done",
          done: "todo",
        };
        return {
          ...prev,
          tasks: prev.tasks.map((t) => {
            if (t.id !== taskId) return t;
            return { ...t, status: nextStatusOrder[t.status] };
          }),
        };
      });
    },
    [updateCurrentEvent]
  );

  const handleAddNewTask = useCallback(
    (title: string, phase: string, priority: Task["priority"], dueDate: string) => {
      updateCurrentEvent((prev) => {
        const newTask: Task = {
          id: `task-${Date.now()}`,
          eventId: prev.event.id,
          title,
          phase,
          dueDate,
          status: "todo",
          priority,
          category: "General",
          sortOrder: prev.tasks.length,
        };
        return { ...prev, tasks: [...prev.tasks, newTask] };
      });
      setShowAddTaskModal(false);
      showToast("Milestone task added.");
    },
    [updateCurrentEvent, showToast]
  );

  // Vendor Shortlist Actions
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
        return {
          ...prev,
          shortlist: [...prev.shortlist, newEntry],
        };
      });
      showToast("Vendor shortlist updated.");
    },
    [updateCurrentEvent, showToast]
  );

  // Personalized Idea Actions
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

        let newBudgetItems = prev.budgetItems;
        if (idea.estimatedInr) {
          newBudgetItems = [
            ...newBudgetItems,
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
          ];
        }

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

  // Export Actions
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
    const text = `# ${currentEvent.event.title}
**Event Type:** ${currentEvent.event.eventType}
**Date:** ${currentEvent.event.eventDate} | **City:** ${currentEvent.event.city} | **Guests:** ${currentEvent.event.guestCount}
**Total Budget:** ₹${currentEvent.event.budgetInr.toLocaleString("en-IN")}
**Planned Spend:** ₹${currentEvent.totals.plannedInr.toLocaleString("en-IN")}

## Budget Allocations
${currentEvent.budgetItems.map((b) => `- ${b.category} (${b.label}): Planned ₹${b.plannedInr.toLocaleString("en-IN")}`).join("\n")}

## Key Milestones (${currentEvent.tasks.filter((t) => t.status === "done").length}/${currentEvent.tasks.length} Completed)
${currentEvent.tasks.map((t) => `- [${t.status === "done" ? "x" : " "}] ${t.title} (${t.phase})`).join("\n")}`;

    try {
      await navigator.clipboard.writeText(text);
      showToast("Markdown brief copied to clipboard!");
    } catch {
      showToast("Failed to copy clipboard.");
    }
  }, [currentEvent, showToast]);

  return {
    events,
    activeId,
    setActiveId: (id: string) => {
      setActiveId(id);
      setActiveEventId(id);
    },
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
    handlers: {
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
    },
  };
}
