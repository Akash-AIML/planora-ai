"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { usePlanoraApp } from "@/lib/hooks/usePlanoraApp";

// Modular Layout Components
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CreationWizard } from "@/components/event/CreationWizard";
import { EventRibbon } from "@/components/dashboard/EventRibbon";
import { DashboardTabsNav } from "@/components/dashboard/DashboardTabsNav";
import { OverviewTabPanel } from "@/components/dashboard/OverviewTabPanel";
import { BudgetMatrixTable } from "@/components/budget/BudgetMatrixTable";
import { AddBudgetItemModal } from "@/components/budget/AddBudgetItemModal";
import { TimelineChecklist } from "@/components/timeline/TimelineChecklist";
import { AddTaskModal } from "@/components/timeline/AddTaskModal";
import { VendorDirectory } from "@/components/vendors/VendorDirectory";
import { IdeasGrid } from "@/components/ideas/IdeasGrid";
import { BudgetReplanner } from "@/components/replan/BudgetReplanner";
import { ExportPrintView } from "@/components/export/ExportPrintView";
import { Button } from "@/components/ui/button";

/**
 * PlanoraApp — Main Application Orchestrator
 * Declarative, single-responsibility layout coordinating navigation, tabs, and modals.
 */
export default function PlanoraApp() {
  const {
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
    totalVendorsCount,
    modals,
    handlers,
  } = usePlanoraApp();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500/25 selection:text-foreground transition-colors duration-200">
      {/* Toast Notification */}
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

      {/* Navigation Header */}
      <Navbar
        events={events}
        activeId={activeId}
        isCreating={isCreating}
        onSelectEvent={setActiveId}
        onStartNewPlan={() => setIsCreating(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isCreating ? (
          <CreationWizard
            hasExistingEvents={events.length > 0}
            onCancel={() => setIsCreating(false)}
            onSubmitPlan={handlers.handleCreateEvent}
          />
        ) : currentEvent ? (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Event Context Ribbon */}
            <EventRibbon
              eventDetail={currentEvent}
              onOpenReplan={() => setActiveTab("replan")}
              onDownloadExport={handlers.handleDownloadExport}
              onCopyMarkdown={handlers.handleCopyMarkdown}
            />

            {/* Dashboard Tabs Bar */}
            <DashboardTabsNav
              activeTab={activeTab}
              onSelectTab={setActiveTab}
            />

            {/* Tab Panels */}
            {activeTab === "overview" && (
              <OverviewTabPanel
                currentEvent={currentEvent}
                topVendors={topVendorsForOverview}
                totalVendorsCount={totalVendorsCount}
                onCycleTaskStatus={handlers.handleCycleTaskStatus}
                onToggleShortlist={handlers.handleToggleShortlist}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === "budget" && (
              <div role="tabpanel" id="panel-budget" aria-labelledby="tab-budget">
                <BudgetMatrixTable
                  items={currentEvent.budgetItems}
                  totals={currentEvent.totals}
                  onUpdateItem={handlers.handleUpdateBudgetItem}
                  onDeleteItem={handlers.handleDeleteBudgetItem}
                  onOpenAddModal={() => modals.setShowAddBudgetModal(true)}
                />
              </div>
            )}

            {activeTab === "timeline" && (
              <div role="tabpanel" id="panel-timeline" aria-labelledby="tab-timeline">
                <TimelineChecklist
                  tasks={currentEvent.tasks}
                  onCycleStatus={handlers.handleCycleTaskStatus}
                  onOpenAddModal={() => modals.setShowAddTaskModal(true)}
                />
              </div>
            )}

            {activeTab === "vendors" && (
              <div role="tabpanel" id="panel-vendors" aria-labelledby="tab-vendors">
                <VendorDirectory
                  currentEvent={currentEvent}
                  onToggleShortlist={handlers.handleToggleShortlist}
                />
              </div>
            )}

            {activeTab === "ideas" && (
              <div role="tabpanel" id="panel-ideas" aria-labelledby="tab-ideas">
                <IdeasGrid
                  currentEvent={currentEvent}
                  onAddIdeaToPlan={handlers.handleAddIdeaToPlan}
                />
              </div>
            )}

            {activeTab === "replan" && (
              <div role="tabpanel" id="panel-replan" aria-labelledby="tab-replan">
                <BudgetReplanner
                  currentEvent={currentEvent}
                  onApplyReplan={handlers.handleApplyReplan}
                />
              </div>
            )}

            {activeTab === "export" && (
              <div role="tabpanel" id="panel-export" aria-labelledby="tab-export">
                <ExportPrintView
                  currentEvent={currentEvent}
                  onDownloadExport={handlers.handleDownloadExport}
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

      {/* Footer */}
      <Footer />

      {/* Modal Dialogs */}
      {currentEvent && (
        <>
          <AddBudgetItemModal
            isOpen={modals.showAddBudgetModal}
            onClose={() => modals.setShowAddBudgetModal(false)}
            onAddItem={handlers.handleAddCustomBudgetItem}
          />
          <AddTaskModal
            isOpen={modals.showAddTaskModal}
            defaultDate={currentEvent.event.eventDate}
            onClose={() => modals.setShowAddTaskModal(false)}
            onAddTask={handlers.handleAddNewTask}
          />
        </>
      )}
    </div>
  );
}
