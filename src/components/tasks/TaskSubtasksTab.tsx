"use client";

import React from "react";
import { ListTodo } from "lucide-react";
import { Task } from "@/types";
import { StatusBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface TaskSubtasksTabProps {
  task: Task;
  canCreateSubtask: boolean;
  newSubtaskTitle: string;
  setNewSubtaskTitle: (val: string) => void;
  handleAddSubtask: (e: React.FormEvent) => void;
  handleChecklistToggle: (idx: number) => void;
  subtasks: Task[];
  handleToggleSubtaskStatus: (subtask: Task) => void;
}

export function TaskSubtasksTab({
  task,
  canCreateSubtask,
  newSubtaskTitle,
  setNewSubtaskTitle,
  handleAddSubtask,
  handleChecklistToggle,
  subtasks,
  handleToggleSubtaskStatus,
}: TaskSubtasksTabProps) {
  return (
    <div className="space-y-4">
      {/* Add inline subtask form */}
      {canCreateSubtask && (
        <form onSubmit={handleAddSubtask} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter subtask title..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            className="block w-full px-3 py-1.5 border border-border-strong rounded bg-bg text-text-primary text-[12px] focus:outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={!newSubtaskTitle.trim()}
            className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded font-medium text-[12px] disabled:opacity-50 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            Add Subtask
          </button>
        </form>
      )}

      {/* Checklist Items */}
      {task.checklistItems && Array.isArray(task.checklistItems) && task.checklistItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Checklist</h3>
          <div className="space-y-1.5">
            {task.checklistItems.map((item: any, idx: number) => (
              <div
                key={idx}
                onClick={() => handleChecklistToggle(idx)}
                className="flex items-center gap-2.5 p-2.5 bg-bg/30 border border-border rounded cursor-pointer hover:opacity-85 transition-opacity"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => {}} // handled by parent onClick
                  className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
                />
                <span className={cn("text-[12px] font-medium text-text-primary truncate", item.completed && "line-through text-text-tertiary")}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtasks List */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Subtasks List</h3>
        {subtasks.length === 0 ? (
          <div className="text-center py-4 text-text-tertiary text-[12px]">No subtasks created.</div>
        ) : (
          <div className="space-y-1.5">
            {subtasks.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-2.5 bg-bg/30 border border-border rounded">
                <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleToggleSubtaskStatus(sub)}>
                  <input
                    type="checkbox"
                    checked={sub.status === "DONE"}
                    onChange={() => {}} // handled by parent onClick
                    className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span className={cn("text-[12px] font-medium text-text-primary truncate max-w-[220px]", sub.status === "DONE" && "line-through text-text-tertiary")}>
                    {sub.title}
                  </span>
                </div>
                <StatusBadge status={sub.status} showDot={false} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
