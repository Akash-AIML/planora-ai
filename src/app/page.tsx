"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  IndianRupee,
  Calendar,
  Building,
  Star,
  Sliders,
  FileText,
  Clock,
  Check,
} from "lucide-react";

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
import { DEMO_VENDORS, VENDOR_CATEGORY_LABELS } from "@/lib/data/demo-vendors";
import {
  loadAllEvents,
  saveAllEvents,
  getActiveEventId,
  setActiveEventId,
  createNewEventDetail,
  buildPlanoraExport,
  getSampleInitialEvent,
} from "@/lib/domain/storage";
import { formatInr } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Layout & Modular Dashboard Components
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CreationWizard } from "@/components/event/CreationWizard";
import { EventRibbon } from "@/components/dashboard/EventRibbon";
import { CategoryDistributionBar } from "@/components/dashboard/CategoryDistributionBar";
import { BudgetMatrixTable } from "@/components/budget/BudgetMatrixTable";
import { AddBudgetItemModal } from "@/components/budget/AddBudgetItemModal";
import { TimelineChecklist } from "@/components/timeline/TimelineChecklist";
import { AddTaskModal } from "@/components/timeline/AddTaskModal";
import { VendorDirectory } from "@/components/vendors/VendorDirectory";
import { IdeasGrid } from "@/components/ideas/IdeasGrid";
import { BudgetReplanner } from "@/components/replan/BudgetReplanner";
import { ExportPrintView } from "@/components/export/ExportPrintView";

export default function PlanoraApp() {
  const [events, setEvents] = useState<EventDetail[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "budget" | "timeline" | "vendors" | "ideas" | "replan" | "export"
  >("overview");

  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // Load events on mount
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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const updateCurrentEvent = (updater: (prev: EventDetail) => EventDetail) => {
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
  };

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

  // Handle Event Creation
  const handleCreateEvent = (params: {
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
  };

  // Replan Application
  const handleApplyReplan = (proposal: ReplanProposal) => {
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

    showToast("Replan proposal applied! Budget lines updated proportionally.");
    setActiveTab("budget");
  };

  // Budget Item Actions
  const handleUpdateBudgetItem = (
    id: string,
    field: "plannedInr" | "actualInr" | "label",
    value: string,
  ) => {
    updateCurrentEvent((prev) => {
      const updated = prev.budgetItems.map((item) => {
        if (item.id !== id) return item;
        if (field === "label") return { ...item, label: value };
        const num = value === "" ? (field === "actualInr" ? null : 0) : sanitizeRupees(value);
        return { ...item, [field]: num };
      });
      return { ...prev, budgetItems: updated };
    });
  };

  const handleDeleteBudgetItem = (id: string) => {
    updateCurrentEvent((prev) => ({
      ...prev,
      budgetItems: prev.budgetItems.filter((item) => item.id !== id),
    }));
    showToast("Budget line item removed.");
  };

  const handleAddBudgetItem = (category: string, label: string, amount: number) => {
    updateCurrentEvent((prev) => {
      const newItem = {
        id: `custom-item-${Date.now()}`,
        eventId: prev.event.id,
        category,
        label,
        plannedInr: amount,
        actualInr: null,
        notes: "Manually added item",
        sortOrder: prev.budgetItems.length,
      };
      return { ...prev, budgetItems: [...prev.budgetItems, newItem] };
    });
    showToast("Budget line item added.");
  };

  // Task Actions
  const handleCycleTaskStatus = (taskId: string) => {
    updateCurrentEvent((prev) => {
      const updated = prev.tasks.map((task) => {
        if (task.id !== taskId) return task;
        const nextStatus: TaskStatus =
          task.status === "todo" ? "doing" : task.status === "doing" ? "done" : "todo";
        return { ...task, status: nextStatus };
      });
      return { ...prev, tasks: updated };
    });
  };

  const handleAddTask = (
    title: string,
    phase: string,
    priority: Task["priority"],
    dueDate: string,
  ) => {
    updateCurrentEvent((prev) => {
      const newTask: Task = {
        id: `custom-task-${Date.now()}`,
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
    showToast("Milestone task added.");
  };

  // Vendor Shortlist Actions
  const handleToggleShortlist = (vendorId: string, status: ShortlistStatus = "shortlisted") => {
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
  };

  // Personalized Idea Actions
  const handleAddIdeaToPlan = (idea: EventIdea) => {
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
  };

  // Export Document & JSON Actions
  const handleDownloadExport = () => {
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
  };

  const handleCopyMarkdown = async () => {
    if (!currentEvent) return;
    const text = `# ${currentEvent.event.title}
**Event Type:** ${currentEvent.event.eventType}
**Date:** ${currentEvent.event.eventDate} | **City:** ${currentEvent.event.city} | **Guests:** ${currentEvent.event.guestCount}
**Total Budget:** ₹${currentEvent.event.budgetInr.toLocaleString("en-IN")}
**Planned Spend:** ₹${currentEvent.totals.plannedInr.toLocaleString("en-IN")} (${currentEvent.totals.remainingInr >= 0 ? `Buffer: ₹${currentEvent.totals.remainingInr.toLocaleString("en-IN")}` : `Over Budget: ₹${Math.abs(currentEvent.totals.remainingInr).toLocaleString("en-IN")}`})

## Budget Allocations
${currentEvent.budgetItems.map((b) => `- ${b.category} (${b.label}): Planned ₹${b.plannedInr.toLocaleString("en-IN")}${b.actualInr ? ` | Actual ₹${b.actualInr.toLocaleString("en-IN")}` : ""}`).join("\n")}

## Key Milestones (${currentEvent.tasks.filter((t) => t.status === "done").length}/${currentEvent.tasks.length} Completed)
${currentEvent.tasks.map((t) => `- [${t.status === "done" ? "x" : " "}] ${t.title} (${t.phase}, Due: ${t.dueDate})`).join("\n")}

---
*Generated by Planora AI Copilot*`;

    try {
      await navigator.clipboard.writeText(text);
      showToast("Summary copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy markdown to clipboard:", err);
      showToast("Failed to copy summary to clipboard.");
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Sparkles },
    { id: "budget", label: "Budget & Expenses", icon: IndianRupee },
    { id: "timeline", label: "Preparation Timeline", icon: Calendar },
    {
      id: "vendors",
      label: `Vendors (${currentEvent?.shortlist.length ?? 0})`,
      icon: Building,
    },
    { id: "ideas", label: "Personalized Ideas", icon: Star },
    { id: "replan", label: "⚡ Budget Replanner", icon: Sliders },
    { id: "export", label: "Export & Print", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500/25 selection:text-foreground transition-colors duration-200">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-popover text-popover-foreground border border-border shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 animate-spin" />
          <span className="text-sm font-semibold">{toast}</span>
        </div>
      )}

      <Navbar
        events={events}
        activeId={activeId}
        isCreating={isCreating}
        onSelectEvent={(id) => {
          setActiveId(id);
          setActiveEventId(id);
        }}
        onStartNewPlan={() => setIsCreating(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isCreating ? (
          <CreationWizard
            hasExistingEvents={events.length > 0}
            onCancel={() => setIsCreating(false)}
            onSubmitPlan={handleCreateEvent}
          />
        ) : currentEvent ? (
          <div className="space-y-6 animate-in fade-in duration-200">
            <EventRibbon
              eventDetail={currentEvent}
              onOpenReplan={() => setActiveTab("replan")}
              onDownloadExport={handleDownloadExport}
              onCopyMarkdown={handleCopyMarkdown}
            />

            {/* Dashboard Tabs Bar */}
            <div
              role="tablist"
              aria-label="Event Sections"
              className="flex overflow-x-auto border-b border-border/80 gap-1.5 pb-1 no-print"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    id={`tab-${tab.id}`}
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.id}`}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      isActive
                        ? "bg-muted text-foreground border border-border shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-amber-500 dark:text-amber-400" : "text-muted-foreground"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Panels */}
            {activeTab === "overview" && (
              <div
                role="tabpanel"
                id="panel-overview"
                aria-labelledby="tab-overview"
                className="space-y-6"
              >
                <CategoryDistributionBar
                  totals={currentEvent.totals}
                  onViewBudgetTab={() => setActiveTab("budget")}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Immediate Action Tasks */}
                  <Card className="p-6 space-y-4 border-border/80 bg-card shadow-xs">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                        Upcoming Priority Milestones
                      </h3>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setActiveTab("timeline")}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 cursor-pointer font-semibold"
                      >
                        All Tasks ({currentEvent.tasks.length}) →
                      </Button>
                    </div>

                    <div className="space-y-2.5">
                      {currentEvent.tasks.slice(0, 5).map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => handleCycleTaskStatus(task.id)}
                          aria-label={`Cycle status for ${task.title}. Currently ${task.status}`}
                          className="w-full text-left flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/80 border border-border/80 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              aria-hidden="true"
                              className={`w-5 h-5 rounded-md flex items-center justify-center border transition shrink-0 ${
                                task.status === "done"
                                  ? "bg-emerald-500 border-emerald-500 text-white dark:text-slate-950"
                                  : task.status === "doing"
                                    ? "bg-indigo-500/20 border-indigo-400 text-indigo-600 dark:text-indigo-300"
                                    : "border-input bg-background text-transparent"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                            <div>
                              <p
                                className={`text-xs font-semibold ${
                                  task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"
                                }`}
                              >
                                {task.title}
                              </p>
                              <span className="text-[10px] text-muted-foreground">
                                {task.phase} · Due {task.dueDate}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant={task.priority === "high" ? "rose" : "amber"}
                            className="text-[10px] uppercase font-bold"
                          >
                            {task.priority}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </Card>

                  {/* Top Matched Vendors */}
                  <Card className="p-6 space-y-4 border-border/80 bg-card shadow-xs">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                        <Building className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        Top Matched Vendors
                      </h3>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setActiveTab("vendors")}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 cursor-pointer font-semibold"
                      >
                        Explore Vendors ({DEMO_VENDORS.length}) →
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {topVendorsForOverview.map((item) => {
                        const isShortlisted = currentEvent.shortlist.some(
                          (s) => s.vendorId === item.vendor.id,
                        );
                        return (
                          <div
                            key={item.vendor.id}
                            className="p-3.5 rounded-xl bg-muted/40 border border-border/80 hover:border-border transition space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-bold text-foreground">{item.vendor.name}</h4>
                                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                  {VENDOR_CATEGORY_LABELS[item.vendor.category]} ·{" "}
                                  {item.vendor.cities.join(", ")}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-foreground">
                                  {formatInr(item.estimateInr)}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  Score: {item.score} pts
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                {item.reasons[0] ?? "Recommended match"}
                              </span>
                              <Button
                                type="button"
                                variant={isShortlisted ? "amber" : "outline"}
                                size="xs"
                                onClick={() => handleToggleShortlist(item.vendor.id)}
                                className="cursor-pointer font-semibold"
                              >
                                {isShortlisted ? "★ Shortlisted" : "+ Shortlist"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>

                {/* Replanner Banner */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/5 dark:from-indigo-950/60 dark:via-purple-950/40 dark:to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                      Need to Adjust Your Budget or Scope?
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-xl">
                      Planora&apos;s deterministic replanning engine protects essential category floors
                      while intelligently reducing flexible lines. See exact before-and-after diffs
                      before approving changes.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => setActiveTab("replan")}
                    className="shrink-0 cursor-pointer shadow-sm font-semibold"
                  >
                    Open Replanner →
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "budget" && (
              <div role="tabpanel" id="panel-budget" aria-labelledby="tab-budget">
                <BudgetMatrixTable
                  items={currentEvent.budgetItems}
                  totals={currentEvent.totals}
                  onUpdateItem={handleUpdateBudgetItem}
                  onDeleteItem={handleDeleteBudgetItem}
                  onOpenAddModal={() => setShowAddBudgetModal(true)}
                />
              </div>
            )}

            {activeTab === "timeline" && (
              <div role="tabpanel" id="panel-timeline" aria-labelledby="tab-timeline">
                <TimelineChecklist
                  tasks={currentEvent.tasks}
                  onCycleStatus={handleCycleTaskStatus}
                  onOpenAddModal={() => setShowAddTaskModal(true)}
                />
              </div>
            )}

            {activeTab === "vendors" && (
              <div role="tabpanel" id="panel-vendors" aria-labelledby="tab-vendors">
                <VendorDirectory
                  currentEvent={currentEvent}
                  onToggleShortlist={handleToggleShortlist}
                />
              </div>
            )}

            {activeTab === "ideas" && (
              <div role="tabpanel" id="panel-ideas" aria-labelledby="tab-ideas">
                <IdeasGrid currentEvent={currentEvent} onAddIdeaToPlan={handleAddIdeaToPlan} />
              </div>
            )}

            {activeTab === "replan" && (
              <div role="tabpanel" id="panel-replan" aria-labelledby="tab-replan">
                <BudgetReplanner currentEvent={currentEvent} onApplyReplan={handleApplyReplan} />
              </div>
            )}

            {activeTab === "export" && (
              <div role="tabpanel" id="panel-export" aria-labelledby="tab-export">
                <ExportPrintView
                  currentEvent={currentEvent}
                  onDownloadExport={handleDownloadExport}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-lg font-bold text-foreground">No Active Plan</h2>
            <p className="text-xs text-muted-foreground mt-1">Create a new event brief to get started.</p>
            <Button
              type="button"
              variant="amber"
              onClick={() => setIsCreating(true)}
              className="mt-4 cursor-pointer font-bold"
            >
              Plan an Event Now
            </Button>
          </div>
        )}
      </main>

      {/* Add Modals */}
      <AddBudgetItemModal
        isOpen={showAddBudgetModal}
        onClose={() => setShowAddBudgetModal(false)}
        onAddItem={handleAddBudgetItem}
      />

      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        defaultDate={currentEvent?.event.eventDate || "2026-12-01"}
        onAddTask={handleAddTask}
      />

      <Footer />
    </div>
  );
}
