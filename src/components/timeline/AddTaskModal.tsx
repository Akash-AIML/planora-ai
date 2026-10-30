"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-popover text-popover-foreground border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Add Preparation Milestone
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-xs font-semibold text-foreground">
              Milestone Task Description
            </Label>
            <Input
              id="task-title"
              type="text"
              placeholder="e.g. Schedule final audio check with sound engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-phase" className="text-xs font-semibold text-foreground">
                Phase
              </Label>
              <select
                id="task-phase"
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
              >
                {PHASES.map((p) => (
                  <option key={p} value={p} className="bg-popover text-popover-foreground">
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-priority" className="text-xs font-semibold text-foreground">
                Priority
              </Label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
              >
                <option value="high" className="bg-popover text-popover-foreground">High</option>
                <option value="medium" className="bg-popover text-popover-foreground">Medium</option>
                <option value="low" className="bg-popover text-popover-foreground">Low</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-due-date" className="text-xs font-semibold text-foreground">
              Due Date
            </Label>
            <Input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" className="cursor-pointer shadow-xs font-semibold">
              Add Milestone
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
