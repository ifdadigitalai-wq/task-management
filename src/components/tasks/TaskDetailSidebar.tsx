"use client";

import React from "react";
import { AlertCircle, UserCheck, Paperclip, Loader2, Trash2, Check, X, RefreshCw, Play } from "lucide-react";
import { Task, TaskStatus, User } from "@/types";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { StatusBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface TaskDetailSidebarProps {
  task: Task;
  subtasks: Task[];
  currentUser: User | null;
  employees: User[];
  canDelegate: boolean;
  handleProgressChange: (val: number) => void;
  handleDelegateAssignee: (val: string) => void;
  directAttachmentLoading: boolean;
  directAttachmentInputRef: React.RefObject<HTMLInputElement | null>;
  handleUploadDirectAttachments: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteTask: () => void;
  handleDelegationAction: (
    action: "request" | "cancel" | "resend" | "accept" | "decline" | "clear_declined",
    colleagueId?: string
  ) => Promise<void>;
  selectedColleagueId: string;
  setSelectedColleagueId: (id: string) => void;
  handleUpdateStatus: (status: TaskStatus) => void;
}

export function TaskDetailSidebar({
  task,
  subtasks,
  currentUser,
  employees,
  canDelegate,
  handleProgressChange,
  handleDelegateAssignee,
  directAttachmentLoading,
  directAttachmentInputRef,
  handleUploadDirectAttachments,
  handleDeleteTask,
  handleDelegationAction,
  selectedColleagueId,
  setSelectedColleagueId,
  handleUpdateStatus,
}: TaskDetailSidebarProps) {
  return (
    <div className="md:col-span-1 overflow-y-auto p-6 space-y-6 bg-bg/5 flex flex-col justify-between min-h-0 border-t md:border-t-0 border-border">
      <div className="space-y-6">
        {/* 1. Progress Slider Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Task Progress</span>
            <span className="text-xs font-bold text-brand">{task.progress || 0}%</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              value={task.progress || 0}
              onChange={(e) => handleProgressChange(parseInt(e.target.value))}
              disabled={subtasks.length > 0 || (!!task.checklistItems && Array.isArray(task.checklistItems) && task.checklistItems.length > 0)}
              className={cn(
                "w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none accent-brand",
                (subtasks.length > 0 || (!!task.checklistItems && Array.isArray(task.checklistItems) && task.checklistItems.length > 0))
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer"
              )}
            />
          </div>
        </div>

        {/* 2. Assignee & Team Member Delegator */}
        <div className="space-y-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary block">Assignee</span>
          <div className="flex items-center gap-3 p-2 bg-surface border border-border rounded-lg">
            {task.assignee ? (
              <>
                <UserAvatar src={task.assignee.avatarUrl} name={task.assignee.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">{task.assignee.name}</p>
                  <p className="text-[10px] text-text-tertiary truncate">{task.assignee.email}</p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-text-tertiary py-1 pl-1 text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>Unassigned</span>
              </div>
            )}
          </div>

          {/* Delegator Button / dropdown */}
          {canDelegate && (
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-medium text-text-secondary flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-brand" />
                Delegate / Reassign To:
              </label>
              <select
                value={task.assigneeId || ""}
                onChange={(e) => handleDelegateAssignee(e.target.value)}
                className="block w-full px-3 py-1.5 border border-border-strong rounded bg-surface text-text-primary text-xs cursor-pointer focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option value="" disabled>Select Team Member...</option>
                {(() => {
                  const targetDept = task.assignee?.department || task.department;
                  return employees
                    .filter(
                      (e) =>
                        e.isActive &&
                        e.id !== task.assigneeId &&
                        (targetDept === "General" || !targetDept || e.department === targetDept)
                    )
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.role})
                      </option>
                    ));
                })()}
              </select>
            </div>
          )}
        </div>

        {/* 3. Direct Task Attachments */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary block">Task Attachments</span>
          {task.attachments && Array.isArray(task.attachments) && task.attachments.length > 0 ? (
            <div className="grid grid-cols-1 gap-1.5">
              {task.attachments.map((file, i) => {
                const isAudio = file.filename.endsWith(".webm") || file.filename.startsWith("recording-");
                return (
                  <div key={file.id || i} className="flex flex-col gap-1 p-2 rounded bg-surface border border-border text-xs text-text-primary">
                    <div className="flex items-center justify-between">
                      <span className="truncate pr-4 font-medium" title={file.filename}>{file.filename}</span>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:underline font-bold text-[10px] shrink-0"
                      >
                        View
                      </a>
                    </div>
                    {isAudio && (
                      <audio controls src={file.url} className="w-full mt-1 h-7 rounded" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <span className="text-xs text-text-tertiary block pl-1">No attachments uploaded</span>
          )}

          {/* Add Attachment Button */}
          <div className="pt-1">
            <button
              type="button"
              disabled={directAttachmentLoading}
              onClick={() => directAttachmentInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded border border-dashed border-border hover:border-brand bg-transparent text-xs text-text-secondary hover:text-brand transition-colors cursor-pointer select-none font-medium disabled:opacity-50"
            >
              {directAttachmentLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Paperclip className="w-3.5 h-3.5" />
                  Add Attachment
                </>
              )}
            </button>
            <input
              ref={directAttachmentInputRef}
              type="file"
              className="hidden"
              onChange={handleUploadDirectAttachments}
            />
          </div>
        </div>
      </div>

      {/* 4. Action Controls Footer in Sidebar */}
      <div className="space-y-2 pt-6 border-t border-border mt-auto">
        {currentUser?.role === "ADMIN" ? (
          <button
            onClick={handleDeleteTask}
            className="w-full py-2 border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] text-xs font-semibold rounded transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Task
          </button>
        ) : (
          <div className="space-y-3">
            {/* CASE 1: Incoming pending delegation to current user (Employee Y) */}
            {task.delegationPending && task.delegationStatus === "PENDING" && task.delegationToId === currentUser?.id ? (
              <div className="space-y-2 p-3 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-200 dark:border-indigo-900/40 rounded-xl">
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-2 text-center">
                  Incoming Delegation Request
                </p>
                <button
                  onClick={() => handleDelegationAction("accept")}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accept the Task
                </button>
                <button
                  onClick={() => handleDelegationAction("decline")}
                  className="w-full py-2 border border-rose-200 hover:bg-rose-50/55 text-rose-600 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none"
                >
                  <X className="w-3.5 h-3.5" />
                  Decline the Request
                </button>
              </div>
            ) : null}

            {/* CASE 2: Pending delegation sent by current user (Employee X) */}
            {task.delegationPending && task.delegationStatus === "PENDING" && task.delegationFromId === currentUser?.id ? (
              <div className="space-y-2 p-3 bg-amber-50/55 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/40 rounded-xl">
                <div className="px-2.5 py-1 text-center bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-450 text-[10px] font-bold rounded-full uppercase tracking-wider whitespace-normal leading-snug">
                  Waiting for employee {employees.find(e => e.id === task.delegationToId)?.name || "colleague"}'s response
                </div>
                <button
                  onClick={() => handleDelegationAction("resend")}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resend Request
                </button>
                <button
                  onClick={() => handleDelegationAction("cancel")}
                  className="w-full py-2 border border-border hover:bg-bg text-text-secondary text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel Request
                </button>
              </div>
            ) : null}

            {/* CASE 3: Declined delegation sent by current user (Employee X) */}
            {task.delegationPending && task.delegationStatus === "DECLINED" && task.delegationFromId === currentUser?.id ? (
              <div className="space-y-2 p-3 bg-rose-50/55 dark:bg-rose-955/10 border border-rose-200 dark:border-rose-900/40 rounded-xl">
                <div className="px-2.5 py-1 text-center bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-450 text-[10px] font-bold rounded-full uppercase tracking-wider whitespace-normal leading-snug">
                  The task delegation request was cancelled by emp. {employees.find(e => e.id === task.delegationToId)?.name || "colleague"}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelegationAction("resend")}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Resend
                  </button>
                  <button
                    onClick={() => handleDelegationAction("clear_declined")}
                    className="flex-1 py-2 border border-border hover:bg-bg text-text-secondary text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none"
                  >
                    <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                    Ok
                  </button>
                </div>
              </div>
            ) : null}

            {/* CASE 4: Active task with no pending delegation */}
            {!task.delegationPending && task.assigneeId === currentUser?.id && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                  Delegate to Colleague
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedColleagueId}
                    onChange={(e) => setSelectedColleagueId(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-border-strong rounded-xl bg-surface text-text-primary text-xs cursor-pointer focus:outline-none focus:border-brand"
                  >
                    <option value="">Select Colleague...</option>
                    {employees
                      .filter((e) => e.isActive && e.id !== currentUser?.id && (!currentUser?.department || e.department === currentUser?.department))
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDelegationAction("request", selectedColleagueId)}
                    disabled={!selectedColleagueId}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* Standard progress buttons (only shown if not pending delegation to someone else) */}
            {(!task.delegationPending || task.delegationToId === currentUser?.id) && (
              <>
                {task.status === "TODO" && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleUpdateStatus("IN_PROGRESS")}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start Progress
                    </button>
                    <button
                      onClick={() => handleUpdateStatus("IN_REVIEW")}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Mark for Review
                    </button>
                  </div>
                )}
                {task.status === "IN_PROGRESS" && (
                  <button
                    onClick={() => handleUpdateStatus("IN_REVIEW")}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark for Review
                  </button>
                )}
                {task.status === "IN_REVIEW" && (
                  <div className="text-center py-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900/50">
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                      Awaiting Admin Review
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
