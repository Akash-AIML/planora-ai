"use client";

import React, { useState } from "react";
import { Plus, Check, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Task, TaskStatus } from "@/lib/domain/types";

interface TimelineChecklistProps {
  tasks: Task[];
  onCycleStatus: (taskId: string) => void;
  onOpenAddModal: () => void;
}

export function TimelineChecklist({
  tasks,
  onCycleStatus,
  onOpenAddModal,
}: TimelineChecklistProps) {
  const [filter, setFilter] = useState<TaskStatus | "all">("all");

  const filteredTasks = tasks.filter((t) => filter === "all" || t.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Preparation Timeline & Checklist
          </h2>
          <p className="text-xs text-muted-foreground">
            Chronological countdown to your event. Click any task checkbox to advance: Todo → Doing
            → Done.
          </p>
        </div>
        <Button variant="default" size="sm" onClick={onOpenAddModal} className="cursor-pointer gap-1.5 shadow-xs">
          <Plus className="w-4 h-4" />
          <span>Add Milestone</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {(["all", "todo", "doing", "done"] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? "secondary" : "ghost"}
            size="xs"
            onClick={() => setFilter(status)}
            className={`uppercase tracking-wider font-semibold cursor-pointer ${
              filter === status
                ? "bg-muted text-foreground border border-border shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <Card
            key={task.id}
            className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border transition-colors ${
              task.status === "done"
                ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10"
                : task.status === "doing"
                  ? "border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/10"
                  : "border-border/80 bg-card"
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => onCycleStatus(task.id)}
                aria-label={`Mark task ${task.title} status`}
                className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition cursor-pointer shrink-0 ${
                  task.status === "done"
                    ? "bg-emerald-500 border-emerald-500 text-white dark:text-slate-950"
                    : task.status === "doing"
                      ? "bg-indigo-500/20 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-input hover:border-ring text-transparent bg-background"
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>
              <div>
                <p
                  className={`text-sm font-semibold transition ${
                    task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {task.title}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                    {task.phase}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Due {task.dueDate}
                  </span>
                  <span className="text-[11px] text-muted-foreground">· {task.category}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <Badge
                variant={
                  task.priority === "high"
                    ? "rose"
                    : task.priority === "medium"
                      ? "amber"
                      : "default"
                }
                className="uppercase font-semibold text-[10px]"
              >
                {task.priority} Priority
              </Badge>
              <button
                type="button"
                onClick={() => onCycleStatus(task.id)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer underline transition"
              >
                Status: <strong className="uppercase">{task.status}</strong>
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
