"use client";

import React, { useState } from "react";
import { ListTodo, Check, X } from "lucide-react";
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
  handleSaveSubtaskRemark: (subtaskId: string, remark: string) => Promise<void>;
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
  handleSaveSubtaskRemark,
}: TaskSubtasksTabProps) {
  const [editingRemarkId, setEditingRemarkId] = useState<string | null>(null);
  const [tempRemark, setTempRemark] = useState("");

  const handleSaveRemark = async (subtaskId: string) => {
    await handleSaveSubtaskRemark(subtaskId, tempRemark.trim());
    setEditingRemarkId(null);
  };

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
              <div key={sub.id} className="flex flex-col gap-1.5 p-2.5 bg-bg/30 border border-border rounded">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                    onClick={() => handleToggleSubtaskStatus(sub)}
                  >
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

                {editingRemarkId === sub.id ? (
                  <div className="ml-6 mt-1 flex items-center gap-1.5 w-full max-w-md">
                    <input
                      type="text"
                      value={tempRemark}
                      onChange={(e) => setTempRemark(e.target.value)}
                      placeholder="Type a remark..."
                      className="flex-1 px-2 py-1 border border-border-strong rounded bg-bg text-text-primary text-[11px] focus:outline-none focus:border-brand"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveRemark(sub.id)}
                      className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded cursor-pointer transition-colors"
                      title="Save Remark"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingRemarkId(null)}
                      className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded cursor-pointer transition-colors"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="ml-6 flex items-center gap-2">
                    {sub.remark ? (
                      <div className="flex items-center gap-2 text-[11px] text-text-secondary bg-slate-50 dark:bg-slate-900/50 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800 w-fit max-w-full">
                        <span className="italic truncate">{sub.remark}</span>
                        <button
                          onClick={() => {
                            setEditingRemarkId(sub.id);
                            setTempRemark(sub.remark || "");
                          }}
                          className="text-[10px] text-brand hover:underline cursor-pointer font-medium ml-1 shrink-0"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingRemarkId(sub.id);
                          setTempRemark("");
                        }}
                        className="text-[10px] text-brand hover:underline cursor-pointer font-medium w-fit text-left"
                      >
                        + Add Remark
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
