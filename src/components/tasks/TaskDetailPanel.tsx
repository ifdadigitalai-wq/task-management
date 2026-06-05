"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X, MessageSquare, Trash2, RefreshCw, Paperclip,
  Mic, ImageIcon, Send, ChevronRight, Play, Pause,
  CheckCircle2, Clock, ListTodo, Plus, Calendar, AlertCircle, Edit, Save, Check, StopCircle
} from "lucide-react";
import { Task, TaskStatus, Priority, TaskUpdate, User, ApiResponse } from "@/types";
import { useTaskStore } from "@/store/useTaskStore";
import { useToast } from "@/hooks/useToast";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { uploadFiles } from "@/lib/uploadthing-client";

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"];

const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string; dot: string }> = {
  TODO: { bg: "bg-slate-50 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-350", dot: "bg-slate-400" },
  IN_PROGRESS: { bg: "bg-blue-50 dark:bg-blue-950/20", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  IN_REVIEW: { bg: "bg-purple-50 dark:bg-purple-950/20", text: "text-purple-700 dark:text-purple-400", dot: "bg-purple-500" },
  DONE: { bg: "bg-emerald-50 dark:bg-emerald-950/20", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  CANCELLED: { bg: "bg-rose-50 dark:bg-rose-950/20", text: "text-rose-700 dark:text-rose-450", dot: "bg-rose-500" },
};

const PRIORITY_COLORS: Record<Priority, { bg: string; text: string }> = {
  LOW: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-400" },
  MEDIUM: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  HIGH: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400" },
  CRITICAL: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400" },
};

export function TaskDetailPanel({ onClose }: { onClose: () => void }) {
  const { selectedTask: initialTask, updateTask: storeUpdateTask, deleteTask: storeDeleteTask, currentUser } = useTaskStore();
  const toast = useToast();
  
  const [task, setTask] = useState<Task | null>(initialTask);
  const [activeTab, setActiveTab] = useState<"details" | "updates" | "subtasks">("details");
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit fields
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<Priority>("MEDIUM");
  const [editDueDate, setEditDueDate] = useState<Date | null>(null);
  const [editAssigneeId, setEditAssigneeId] = useState("");
  const [editEstimatedHours, setEditEstimatedHours] = useState(0);
  const [editEstimatedMins, setEditEstimatedMins] = useState(0);
  
  // Data lists
  // Data lists
  const [updates, setUpdates] = useState<TaskUpdate[]>([]);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  
  // Inputs
  const [newRemark, setNewRemark] = useState("");
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Update attachments states
  const [updateSelectedFiles, setUpdateSelectedFiles] = useState<File[]>([]);
  const [updateVoiceRecordings, setUpdateVoiceRecordings] = useState<{ name: string; blob: Blob }[]>([]);
  const [showUpdateVoiceModal, setShowUpdateVoiceModal] = useState(false);
  const updateFileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUpdateSelectedFiles([...updateSelectedFiles, ...Array.from(e.target.files)]);
    }
  };

  const handleUpdateVoiceSave = (blob: Blob, name: string) => {
    setUpdateVoiceRecordings([...updateVoiceRecordings, { blob, name }]);
  };

  // Sync state with selectedTask
  useEffect(() => {
    if (initialTask) {
      setTask(initialTask);
      setEditTitle(initialTask.title);
      setEditDescription(initialTask.description || "");
      setEditPriority(initialTask.priority);
      setEditDueDate(initialTask.dueDate ? new Date(initialTask.dueDate) : null);
      setEditAssigneeId(initialTask.assigneeId || "");
      
      const totalMinutes = initialTask.estimatedMinutes || 0;
      setEditEstimatedHours(Math.floor(totalMinutes / 60));
      setEditEstimatedMins(totalMinutes % 60);

      // Load updates, timers, subtasks
      fetchTaskRelations(initialTask.id);
    } else {
      setTask(null);
    }
  }, [initialTask]);

  // Fetch employees list
  useEffect(() => {
    if (currentUser?.role === "ADMIN") {
      fetch("/api/users")
        .then((res) => res.json())
        .then((payload) => {
          if (payload.success) setEmployees(payload.data);
        })
        .catch(console.error);
    }
  }, [currentUser]);



  const fetchTaskRelations = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const payload = await res.json();
        if (payload.success && payload.data) {
          const detail = payload.data;
          setUpdates(detail.updates || []);
          setSubtasks(detail.subTasks || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCycleStatus = async () => {
    if (!task) return;
    const currentIndex = STATUSES.indexOf(task.status);
    const nextStatus = STATUSES[(currentIndex + 1) % STATUSES.length];

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = await res.json();
      if (payload.success) {
        setTask(payload.data);
        storeUpdateTask(payload.data);
        toast.success(`Status updated to ${nextStatus}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    }
  };

  const handleChecklistToggle = async (index: number) => {
    if (!task) return;
    const checklist = Array.isArray(task.checklistItems) ? [...task.checklistItems] : [];
    checklist[index].completed = !checklist[index].completed;

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklistItems: checklist }),
      });
      const payload = await res.json();
      if (payload.success) {
        setTask(payload.data);
        storeUpdateTask(payload.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveChanges = async () => {
    if (!task) return;
    setLoading(true);
    const totalMinutes = editEstimatedHours * 60 + editEstimatedMins;

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          priority: editPriority,
          dueDate: editDueDate ? editDueDate.toISOString() : null,
          assigneeId: editAssigneeId || null,
          estimatedMinutes: totalMinutes,
        }),
      });
      const payload = await res.json();
      if (payload.success) {
        setTask(payload.data);
        storeUpdateTask(payload.data);
        setEditMode(false);
        toast.success("Task updated successfully!");
      } else {
        toast.error(payload.error || "Failed to update task.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newRemark.trim()) return;

    try {
      // 1. Prepare files list for UploadThing
      const filesToUpload: File[] = [];
      updateSelectedFiles.forEach((file) => {
        filesToUpload.push(file);
      });
      updateVoiceRecordings.forEach((v) => {
        const file = new File([v.blob], v.name, { type: v.blob.type });
        filesToUpload.push(file);
      });

      let uploadedAttachments: any[] = [];
      if (filesToUpload.length > 0) {
        toast.info("Uploading attachments...");
        const uploadRes = await uploadFiles("taskAttachment", {
          files: filesToUpload,
        });
        uploadedAttachments = uploadRes.map((res) => {
          const isAudio = res.name.endsWith(".webm") || res.name.startsWith("recording-");
          return {
            name: res.name,
            size: res.size,
            url: res.url,
            type: isAudio ? "audio" : "file",
          };
        });
      }

      const res = await fetch(`/api/tasks/${task.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remark: newRemark.trim(),
          attachments: uploadedAttachments,
        }),
      });
      const payload = await res.json();
      if (payload.success) {
        setUpdates([payload.data, ...updates]);
        setNewRemark("");
        setUpdateSelectedFiles([]);
        setUpdateVoiceRecordings([]);
        toast.success("Update posted successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to post update.");
    }
  };

  const handlePostComment = async (updateId: string) => {
    const text = newCommentText[updateId];
    if (!task || !text?.trim()) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}/updates/${updateId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const payload = await res.json();
      if (payload.success) {
        setUpdates((prev) =>
          prev.map((up) => {
            if (up.id === updateId) {
              return { ...up, comments: [...(up.comments || []), payload.data] };
            }
            return up;
          })
        );
        setNewCommentText({ ...newCommentText, [updateId]: "" });
        toast.success("Comment added.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newSubtaskTitle.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSubtaskTitle.trim(),
          parentTaskId: task.id,
          priority: task.priority,
          assigneeId: task.assigneeId,
        }),
      });
      const payload = await res.json();
      if (payload.success) {
        setSubtasks([...subtasks, payload.data]);
        setNewSubtaskTitle("");
        toast.success("Subtask added successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };



  const handleDeleteTask = async () => {
    if (!task) return;
    if (confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      try {
        const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
        if (res.ok) {
          storeDeleteTask(task.id);
          toast.success("Task deleted successfully.");
          onClose();
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete task.");
      }
    }
  };

  const handleMarkCompleted = async () => {
    if (!task) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      });
      const payload = await res.json();
      if (payload.success) {
        setTask(payload.data);
        storeUpdateTask(payload.data);
        toast.success("Task marked as completed!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark task as completed.");
    }
  };

  const handleToggleSubtaskStatus = async (sub: Task) => {
    const nextStatus = sub.status === "DONE" ? "TODO" : "DONE";
    try {
      const res = await fetch(`/api/tasks/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = await res.json();
      if (payload.success) {
        setSubtasks(subtasks.map((s) => (s.id === sub.id ? payload.data : s)));
        toast.success(`Subtask status updated to ${nextStatus}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update subtask status.");
    }
  };

  if (!task) return null;

  const statusStyle = STATUS_COLORS[task.status] || STATUS_COLORS.TODO;
  const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM;

  return (
    <>
      {/* Backdrop — z-panel - 1 = 59 */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-all duration-300"
        style={{ zIndex: "calc(var(--z-panel) - 1)" }}
      />

      {/* Slide-over panel — z-panel = 60 */}
      <div
        className={cn(
          "fixed right-0 bottom-0 bg-surface border-l border-border shadow-lg flex flex-col transition-all duration-200 ease-in-out top-0",
          "w-[min(480px,100vw)]",
          "max-md:top-auto max-md:left-0 max-md:right-0 max-md:w-full max-md:h-[85vh] max-md:border-t max-md:border-l-0 rounded-t-xl md:rounded-t-none",
          "animate-in slide-in-from-right max-md:slide-in-from-bottom"
        )}
        style={{ zIndex: "var(--z-panel)" }}
      >
        {/* Header */}
        <div className="p-4 px-5 border-b border-border flex items-start justify-between gap-4 shrink-0">
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <button
                onClick={handleCycleStatus}
                className="focus:outline-none select-none"
                title="Click to cycle status"
              >
                <StatusBadge status={task.status} />
              </button>
              
              <PriorityBadge priority={task.priority} />

              {task.dueDate && (
                <span className="flex items-center gap-1 text-text-tertiary" style={{ fontSize: "0.75rem" }}>
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Title / Edit Title */}
            {editMode ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-1.5 border border-border-strong rounded bg-bg text-text-primary text-[15px] font-medium focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none"
              />
            ) : (
              <h2 className="text-text-primary font-medium tracking-tight line-clamp-2" style={{ fontSize: "0.9375rem" }}>
                {task.title}
              </h2>
            )}
          </div>

          {/* Close & Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {currentUser?.role === "ADMIN" && (
              <button
                onClick={() => (editMode ? handleSaveChanges() : setEditMode(true))}
                className="w-7 h-7 rounded-full flex items-center justify-center text-text-secondary hover:bg-bg hover:text-text-primary transition-all focus:outline-none"
                title={editMode ? "Save Changes" : "Edit Fields"}
              >
                {editMode ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Edit className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-text-secondary hover:bg-bg hover:text-text-primary transition-all focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="h-9 flex border-b border-border px-5 shrink-0 bg-bg/20">
          {(["details", "updates", "subtasks"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "h-full flex items-center font-normal px-4 text-text-secondary border-b-2 border-transparent transition-all cursor-pointer hover:text-text-primary uppercase tracking-[0.05em]",
                activeTab === tab && "border-brand text-text-primary font-medium"
              )}
              style={{ fontSize: "0.75rem" }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Scrollable Contents */}
        <div className="flex-1 overflow-y-auto p-4 px-5 space-y-4">
          {/* 1. DETAILS TAB */}
          {activeTab === "details" && (
            <div className="space-y-1">
              {/* Description */}
              <div className="py-2.5 border-b border-border flex flex-col gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-tertiary">Description</span>
                {editMode ? (
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-border-strong rounded bg-bg text-text-primary text-[12px] focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none resize-none"
                  />
                ) : (
                  <p className="text-[13px] text-text-primary leading-relaxed">
                    {task.description || "No description provided for this task."}
                  </p>
                )}
              </div>

              {/* Assignee & Due Date Edit Fields */}
              {editMode ? (
                <>
                  <div className="py-2.5 border-b border-border flex flex-col gap-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-tertiary">Assignee</span>
                    <select
                      value={editAssigneeId}
                      onChange={(e) => setEditAssigneeId(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-border-strong rounded bg-bg text-text-primary text-[12px] cursor-pointer focus:outline-none focus:border-brand"
                    >
                      <option value="">Unassigned</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="py-2.5 border-b border-border flex flex-col gap-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-tertiary">Due Date</span>
                    <DateRangePicker value={editDueDate} onChange={setEditDueDate} showTime={true} />
                  </div>
                  <div className="py-2.5 border-b border-border flex flex-col gap-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-tertiary">Priority</span>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as Priority)}
                      className="block w-full px-3 py-1.5 border border-border-strong rounded bg-bg text-text-primary text-[12px] cursor-pointer focus:outline-none focus:border-brand"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="py-2.5 border-b border-border flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-tertiary">Assignee</span>
                    <div className="flex items-center gap-2">
                      {task.assignee ? (
                        <>
                          <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-brand-light text-brand-text text-[9px] font-medium border border-border">
                            {task.assignee.avatarUrl ? (
                              <img src={task.assignee.avatarUrl} alt={task.assignee.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{task.assignee.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <span className="text-[13px] text-text-primary">{task.assignee.name}</span>
                        </>
                      ) : (
                        <span className="text-[13px] text-text-tertiary">Unassigned</span>
                      )}
                    </div>
                  </div>
                  <div className="py-2.5 border-b border-border flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-tertiary">Created By</span>
                    <span className="text-[13px] text-text-primary font-medium">{task.creator?.name || "System"}</span>
                  </div>
                </>
              )}

              {/* Tags */}
              <div className="py-2.5 border-b border-border flex flex-col gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-tertiary">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {task.tags && task.tags.length > 0 ? (
                    task.tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-0.5 rounded-full bg-bg border border-border text-[10px] text-text-secondary font-medium">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-[13px] text-text-tertiary">No tags assigned</span>
                  )}
                </div>
              </div>

              {/* Checklist Items */}
              <div className="py-2.5 border-b border-border flex flex-col gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-tertiary">Subtask Checklist</span>
                {task.checklistItems && Array.isArray(task.checklistItems) && task.checklistItems.length > 0 ? (
                  <div className="space-y-2 mt-1">
                    {task.checklistItems.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => handleChecklistToggle(idx)}
                        className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity"
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => {}} // handled by click
                          className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className={cn("text-[13px] text-text-primary font-medium", item.completed && "line-through text-text-tertiary")}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[13px] text-text-tertiary">No checklist items defined</span>
                )}
              </div>

              {/* File Attachments */}
              <div className="py-2.5 border-b border-border flex flex-col gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-tertiary">Attached Materials</span>
                {task.attachments && Array.isArray(task.attachments) && task.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 mt-1">
                    {task.attachments.map((file: any, i: number) => {
                      const isAudio = file.type === "audio" || file.name.endsWith(".webm") || file.name.startsWith("recording-");
                      return (
                        <div key={i} className="flex flex-col gap-1.5 p-2 rounded bg-bg border border-border text-[13px] text-text-primary">
                          <div className="flex items-center justify-between">
                            <span className="truncate pr-4 font-medium">{file.name}</span>
                            <div className="flex items-center gap-2">
                              {file.size && <span className="text-[10px] text-text-tertiary">({(file.size / 1024).toFixed(1)} KB)</span>}
                              {file.url && (
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#6366F1] dark:text-[#818CF8] hover:underline font-bold text-[11px]"
                                >
                                  Open
                                </a>
                              )}
                            </div>
                          </div>
                          {isAudio && file.url && (
                            <audio controls src={file.url} className="w-full mt-1 h-8 rounded" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-[13px] text-text-tertiary">No attachments provided</span>
                )}
              </div>
            </div>
          )}

          {/* 2. UPDATES & COMMENTS TAB */}
          {activeTab === "updates" && (
            <div className="space-y-4">
              {/* Add Update Input */}
              <form onSubmit={handlePostUpdate} className="space-y-2.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Post progress update or comment..."
                    value={newRemark}
                    onChange={(e) => setNewRemark(e.target.value)}
                    className="block w-full px-3 py-1.5 border border-border-strong rounded bg-bg text-text-primary text-[12px] focus:outline-none focus:border-brand"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded font-medium text-[12px] active:scale-95 transition-all shrink-0 cursor-pointer"
                  >
                    Send
                  </button>
                </div>
                
                {/* File Attachment & Voice Note controls for Updates */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateFileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1 rounded border border-border bg-transparent text-[11px] text-text-secondary hover:bg-bg hover:text-text-primary transition-colors cursor-pointer select-none font-medium"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    Attach File
                  </button>
                  <input
                    ref={updateFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleUpdateFileChange}
                  />

                  <button
                    type="button"
                    onClick={() => setShowUpdateVoiceModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded border border-[#FECACA] bg-transparent text-[11px] text-[#EF4444] hover:bg-[#FEF2F2] transition-colors cursor-pointer select-none font-medium"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    Record audio
                  </button>
                </div>

                {/* Update Files Preview */}
                {updateSelectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {updateSelectedFiles.map((f, i) => (
                      <div key={i} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-bg border border-border text-[10.5px]">
                        <span className="truncate max-w-[100px] font-medium text-text-primary">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => setUpdateSelectedFiles(updateSelectedFiles.filter((_, idx) => idx !== i))}
                          className="hover:opacity-75 text-text-tertiary hover:text-text-primary"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Update Voice Notes Preview */}
                {updateVoiceRecordings.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {updateVoiceRecordings.map((v, i) => (
                      <div key={i} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] text-[10.5px] font-medium dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400">
                        <Mic className="w-3.5 h-3.5" />
                        <span>Voice note {i + 1}</span>
                        <button
                          type="button"
                          onClick={() => setUpdateVoiceRecordings(updateVoiceRecordings.filter((_, idx) => idx !== i))}
                          className="hover:opacity-75"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </form>

              {/* Updates Feed */}
              <div className="space-y-3.5">
                {updates.length === 0 ? (
                  <div className="text-center py-8 text-text-tertiary text-[12px]">
                    No status updates posted yet.
                  </div>
                ) : (
                  updates.map((up) => (
                    <div key={up.id} className="p-3.5 bg-bg/40 border border-border rounded-lg space-y-3">
                      {/* Author header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserAvatar src={up.user?.avatarUrl} name={up.user?.name} size="sm" />
                          <div>
                            <p className="text-[12px] font-medium text-text-primary">{up.user?.name || "System"}</p>
                            <p className="text-[10px] text-text-tertiary">{new Date(up.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        {up.type !== "COMMENT" && (
                          <span className="px-2 py-0.5 rounded bg-brand-light text-brand-text text-[9px] font-medium uppercase tracking-wider">
                            {up.type.replace("_", " ")}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <p className="text-[12px] text-text-primary leading-relaxed font-medium pl-1">
                        {up.content}
                      </p>

                      {/* Update Attachments */}
                      {up.attachments && Array.isArray(up.attachments) && up.attachments.length > 0 && (
                        <div className="grid grid-cols-1 gap-1.5 mt-1.5 pl-1">
                          {up.attachments.map((file: any, fileIdx: number) => {
                            const isAudio = file.type === "audio" || file.name.endsWith(".webm") || file.name.startsWith("recording-");
                            return (
                              <div key={fileIdx} className="flex flex-col gap-1 p-2 rounded bg-surface border border-border text-[11px] text-text-primary">
                                <div className="flex items-center justify-between">
                                  <span className="truncate pr-4 font-semibold">{file.name}</span>
                                  {file.url && (
                                    <a
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#6366F1] dark:text-[#818CF8] hover:underline font-bold text-[10px]"
                                    >
                                      Open
                                    </a>
                                  )}
                                </div>
                                {isAudio && file.url && (
                                  <audio controls src={file.url} className="w-full mt-1 h-7 rounded" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Threaded Nested Comments */}
                      <div className="pl-5 border-l border-border space-y-2">
                        {up.comments && up.comments.map((c) => (
                          <div key={c.id} className="p-2 bg-surface border border-border rounded space-y-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[10px] font-medium text-text-primary">{c.user?.name || "System"}</p>
                              <span className="text-[8px] text-text-tertiary">{new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            <p className="text-[11px] text-text-secondary">{c.body}</p>
                          </div>
                        ))}

                        {/* Inline comment inputs */}
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            placeholder="Reply to update..."
                            value={newCommentText[up.id] || ""}
                            onChange={(e) => setNewCommentText({ ...newCommentText, [up.id]: e.target.value })}
                            onKeyDown={(e) => { if (e.key === "Enter") handlePostComment(up.id); }}
                            className="block w-full px-3 py-1 border border-border-strong rounded bg-surface text-text-primary text-[11px] focus:outline-none focus:border-brand"
                          />
                          <button
                            onClick={() => handlePostComment(up.id)}
                            className="px-2.5 py-1 bg-bg hover:bg-bg/60 rounded text-text-secondary hover:text-text-primary text-[10px] font-medium"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 4. SUBTASKS TAB */}
          {activeTab === "subtasks" && (
            <div className="space-y-4">
              {/* Add inline subtask */}
              {currentUser?.role === "ADMIN" && (
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
                    className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded font-medium text-[12px] active:scale-95 transition-all shrink-0 cursor-pointer"
                  >
                    Add
                  </button>
                </form>
              )}

              {/* Subtasks List */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Subtasks List</h3>
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
          )}
        </div>

        {/* Footer */}
        {currentUser?.role === "ADMIN" ? (
          <div className="p-4 border-t border-border shrink-0 flex items-center justify-end bg-bg/25">
            <button
              onClick={handleDeleteTask}
              className="px-4 py-2 border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] text-[12px] font-medium rounded transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 focus-visible:outline-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Task
            </button>
          </div>
        ) : (
          task.status !== "DONE" && (
            <div className="p-4 border-t border-border shrink-0 flex items-center justify-end bg-bg/25">
              <button
                onClick={handleMarkCompleted}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-medium rounded transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 focus-visible:outline-none"
              >
                <Check className="w-3.5 h-3.5" />
                Mark as Completed
              </button>
            </div>
          )
        )}
      </div>

      {showUpdateVoiceModal && (
        <VoiceRecordingModal
          onSave={handleUpdateVoiceSave}
          onClose={() => setShowUpdateVoiceModal(false)}
        />
      )}
    </>
  );
}

// ── Voice Recording Modal ──────────────────────────────────────────────────────
function VoiceRecordingModal({ onSave, onClose }: { onSave: (blob: Blob, name: string) => void; onClose: () => void }) {
  const [state, setState] = useState<"idle" | "recording" | "paused" | "done">("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blobRef = useRef<Blob | null>(null);
  
  const pad = (n: number) => String(n).padStart(2, "0");
  const display = `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;

  const startTimer = () => { timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000); };
  const stopTimer  = () => { if (timerRef.current) clearInterval(timerRef.current); };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        blobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        setState("done");
      };
      mr.start();
      mediaRef.current = mr;
      setState("recording");
      startTimer();
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const pauseRecording  = () => { mediaRef.current?.pause();  stopTimer();  setState("paused"); };
  const resumeRecording = () => { mediaRef.current?.resume(); startTimer(); setState("recording"); };
  const stopRecording   = () => { mediaRef.current?.stop(); mediaRef.current?.stream.getTracks().forEach((t) => t.stop()); stopTimer(); };
  const discard         = () => { setAudioUrl(null); blobRef.current = null; setSeconds(0); setState("idle"); };

  useEffect(() => () => stopTimer(), []);

  return (
    <>
      {/* Overlay — z-modal-backdrop = 70 */}
      <div onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center" style={{ zIndex: "calc(var(--z-modal-backdrop) + 10)" }} />
      
      {/* Modal Container — z-modal = 80 */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[360px] bg-surface border border-border rounded-xl shadow-lg p-6 animate-in zoom-in-95 duration-150" style={{ zIndex: "calc(var(--z-modal) + 10)" }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-medium text-text-primary">Voice Recording</span>
          <button onClick={onClose} className="p-1 hover:bg-bg rounded-md text-text-tertiary">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="text-center mb-6">
          <div className={`text-3xl font-medium font-mono tracking-tight ${state === "recording" ? "text-[#EF4444] animate-pulse" : "text-text-primary"}`}>
            {display}
          </div>
          <div className="mt-2 text-[11px] font-medium text-text-tertiary">
            {state === "idle" && "Ready to record"}
            {state === "recording" && "● Recording..."}
            {state === "paused" && "Paused"}
            {state === "done" && "Recording saved"}
          </div>
        </div>

        {/* Waves Animation */}
        {(state === "recording" || state === "paused") && (
          <div className="flex justify-center items-center gap-1 mb-6 h-8">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className={`w-0.5 rounded-full ${state === "recording" ? "bg-[#EF4444]" : "bg-border-strong"}`}
                style={{
                  height: `${6 + Math.abs(Math.sin(i * 0.5) * 16) + Math.cos(i * 0.8) * 8}px`,
                  animation: state === "recording" ? `wave-anim ${1 + (i % 3) * 0.2}s ease-in-out infinite` : "none"
                }}
              />
            ))}
          </div>
        )}

        {state === "done" && audioUrl && (
          <div className="mb-6">
            <audio controls src={audioUrl} className="w-full rounded bg-bg" />
          </div>
        )}

        <div className="flex justify-center gap-3">
          {state === "idle" && (
            <Button onClick={startRecording} variant="danger" size="sm" icon={<Mic className="h-3.5 w-3.5" />}>
              Start Recording
            </Button>
          )}
          {state === "recording" && (
            <>
              <Button onClick={pauseRecording} variant="secondary" size="sm" icon={<Pause className="h-3.5 w-3.5" />}>
                Pause
              </Button>
              <Button onClick={stopRecording} variant="danger" size="sm" icon={<StopCircle className="h-3.5 w-3.5" />}>
                Stop
              </Button>
            </>
          )}
          {state === "paused" && (
            <>
              <Button onClick={resumeRecording} variant="secondary" size="sm" icon={<Play className="h-3.5 w-3.5" />}>
                Resume
              </Button>
              <Button onClick={stopRecording} variant="danger" size="sm" icon={<StopCircle className="h-3.5 w-3.5" />}>
                Stop
              </Button>
            </>
          )}
          {state === "done" && (
            <>
              <Button onClick={discard} variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />}>
                Discard
              </Button>
              <Button onClick={() => { if (blobRef.current) { onSave(blobRef.current, `recording-${Date.now()}.webm`); onClose(); } }}
                variant="primary" size="sm" icon={<Check className="h-3.5 w-3.5" />}>
                Save Note
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default TaskDetailPanel;
