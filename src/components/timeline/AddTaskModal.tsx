"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TaskPriority } from "@/lib/domain/types";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate: string;
  onAddTask: (title: string, phase: string, priority: TaskPriority, dueDate: string) => void;
}

const PHASES = [
  "12+ months out",
  "6 months out",
  "3 months out",
  "1 month out",
  "Final week",
  "Event day",
  "Follow-up",
];

export function AddTaskModal({
  isOpen,
  onClose,
  defaultDate,
  onAddTask,
}: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [phase, setPhase] = useState("1 month out");
  const [priority, setPriority] = useState<TaskPriority>("high");
  const [dueDate, setDueDate] = useState(defaultDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask(title.trim(), phase, priority, dueDate || defaultDate);
    setTitle("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Preparation Milestone">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="task-title" className="text-xs text-slate-300">
            Milestone Task Description
          </label>
          <Input
            id="task-title"
            type="text"
            placeholder="e.g. Schedule final audio check with sound engineer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="task-phase" className="text-xs text-slate-300">
              Phase
            </label>
            <select
              id="task-phase"
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
            >
              {PHASES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="task-priority" className="text-xs text-slate-300">
              Priority
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="task-due-date" className="text-xs text-slate-300">
            Due Date
          </label>
          <Input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="default" size="sm">
            Add Milestone
          </Button>
        </div>
      </form>
    </Modal>
  );
}
