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
          <h2 className="text-lg font-bold text-white tracking-tight">
            Preparation Timeline & Checklist
          </h2>
          <p className="text-xs text-slate-400">
            Chronological countdown to your event. Click any task checkbox to advance: Todo → Doing
            → Done.
          </p>
        </div>
        <Button variant="default" size="sm" onClick={onOpenAddModal}>
          <Plus className="w-4 h-4" />
          <span>Add Milestone</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "todo", "doing", "done"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded-lg text-xs font-medium uppercase tracking-wider transition cursor-pointer ${
              filter === status
                ? "bg-slate-800 text-amber-300 border border-slate-700 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <Card
            key={task.id}
            className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border transition ${
              task.status === "done"
                ? "border-emerald-500/20 bg-emerald-950/10"
                : task.status === "doing"
                  ? "border-indigo-500/30 bg-indigo-950/10"
                  : "border-slate-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => onCycleStatus(task.id)}
                aria-label={`Mark task ${task.title} status`}
                className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition cursor-pointer ${
                  task.status === "done"
                    ? "bg-emerald-500 border-emerald-500 text-slate-950"
                    : task.status === "doing"
                      ? "bg-indigo-500/20 border-indigo-400 text-indigo-300"
                      : "border-slate-700 hover:border-slate-500 text-transparent"
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>
              <div>
                <p
                  className={`text-sm font-semibold ${task.status === "done" ? "line-through text-slate-500" : "text-white"}`}
                >
                  {task.title}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {task.phase}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Due {task.dueDate}
                  </span>
                  <span className="text-[11px] text-slate-400">· {task.category}</span>
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
                className="uppercase"
              >
                {task.priority} Priority
              </Badge>
              <button
                type="button"
                onClick={() => onCycleStatus(task.id)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer underline"
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
