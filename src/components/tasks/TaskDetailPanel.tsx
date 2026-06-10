"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X, MessageSquare, Trash2, RefreshCw, Paperclip,
  Mic, ImageIcon, Send, ChevronRight, Play, Pause,
  CheckCircle2, Clock, ListTodo, Plus, Calendar, AlertCircle, Edit, Save, Check, StopCircle, Loader2, UserCheck
} from "lucide-react";
import { Task, TaskStatus, Priority, TaskUpdate, User, ApiResponse, TaskComment, Department, TaskFrequency } from "@/types";
import { useTaskStore } from "@/store/useTaskStore";
import { useToast } from "@/hooks/useToast";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { uploadFiles } from "@/lib/uploadthing-client";
import { hasPermission } from "@/lib/rbac";

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
  const { selectedTask: initialTask, updateTask: storeUpdateTask, deleteTask: storeDeleteTask, currentUser, fetchCurrentUser } = useTaskStore();
  const toast = useToast();
  
  const [task, setTask] = useState<Task | null>(initialTask);
  const [activeTab, setActiveTab] = useState<"details" | "updates" | "subtasks" | "comments">("details");
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
  const [editDepartment, setEditDepartment] = useState("General");
  const [editFrequency, setEditFrequency] = useState<TaskFrequency>("ONE_TIME");
  const [editCustomFrequency, setEditCustomFrequency] = useState("");
  const [selectedColleagueId, setSelectedColleagueId] = useState("");
  
  // Data lists
  const [updates, setUpdates] = useState<TaskUpdate[]>([]);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [directComments, setDirectComments] = useState<TaskComment[]>([]);
  
  // Inputs
  const [newRemark, setNewRemark] = useState("");
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newDirectComment, setNewDirectComment] = useState("");

  // Update attachments states
  const [updateSelectedFiles, setUpdateSelectedFiles] = useState<File[]>([]);
  const [updateVoiceRecordings, setUpdateVoiceRecordings] = useState<{ name: string; blob: Blob }[]>([]);
  const [showUpdateVoiceModal, setShowUpdateVoiceModal] = useState(false);
  const updateFileInputRef = useRef<HTMLInputElement>(null);

  // Direct Attachment states
  const [directAttachmentLoading, setDirectAttachmentLoading] = useState(false);
  const directAttachmentInputRef = useRef<HTMLInputElement>(null);

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
      setEditDepartment(initialTask.department || "General");
      setEditFrequency(initialTask.frequency || "ONE_TIME");
      setEditCustomFrequency(initialTask.customFrequency || "");
      
      const totalMinutes = initialTask.estimatedMinutes || 0;
      setEditEstimatedHours(Math.floor(totalMinutes / 60));
      setEditEstimatedMins(totalMinutes % 60);

      // Load updates, timers, subtasks, direct comments
      fetchTaskRelations(initialTask.id);
      fetchDirectComments(initialTask.id);
    } else {
      setTask(null);
    }
  }, [initialTask]);

  // Poll task relations every 3 seconds for real-time updates/comments/subtasks
  useEffect(() => {
    if (!initialTask?.id) return;
    const interval = setInterval(() => {
      fetchTaskRelations(initialTask.id);
      fetchDirectComments(initialTask.id);
    }, 3000);
    return () => clearInterval(interval);
  }, [initialTask?.id]);

  // Fetch current user session if not loaded
  useEffect(() => {
    if (!currentUser) {
      fetchCurrentUser().catch(console.error);
    }
  }, [currentUser, fetchCurrentUser]);

  // Fetch employees & departments lists
  useEffect(() => {
    fetch("/api/users", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) setEmployees(payload.data || []);
      })
      .catch(console.error);

    fetch("/api/departments")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) setDepartments(payload.data || []);
      })
      .catch(console.error);
  }, []);

  const fetchTaskRelations = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const payload = await res.json();
        if (payload.success && payload.data) {
          const detail = payload.data;
          setTask(detail);
          storeUpdateTask(detail);
          setUpdates(detail.updates || []);
          setSubtasks(detail.subTasks || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDirectComments = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          setDirectComments(payload.data || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch comments", err);
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

    // Calculate progress (if no subtasks exist)
    let newProgress = task.progress;
    if (subtasks.length === 0) {
      const doneChecklist = checklist.filter((item: any) => item.completed).length;
      const totalChecklist = checklist.length;
      newProgress = Math.round((doneChecklist / totalChecklist) * 100);
    }

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          checklistItems: checklist,
          progress: newProgress
        }),
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
          department: editDepartment,
          frequency: editFrequency,
          customFrequency: editFrequency === "CUSTOM" ? editCustomFrequency.trim() : null,
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

  const handleProgressChange = async (newProgress: number) => {
    if (!task) return;
    setTask({ ...task, progress: newProgress });
    try {
      const res = await fetch(`/api/tasks/${task.id}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: newProgress }),
      });
      const payload = await res.json();
      if (payload.success) {
        setTask(payload.data);
        storeUpdateTask(payload.data);
      } else {
        toast.error(payload.error || "Failed to update progress.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update progress.");
    }
  };

  const handleDelegateAssignee = async (newAssigneeId: string) => {
    if (!task) return;
    if (!newAssigneeId) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/assign-team-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: newAssigneeId }),
      });
      const payload = await res.json();
      if (payload.success) {
        setTask(payload.data);
        storeUpdateTask(payload.data);
        setEditAssigneeId(newAssigneeId);
        toast.success("Task successfully delegated!");
      } else {
        toast.error(payload.error || "Failed to delegate task.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delegate task.");
    }
  };

  const handleDelegationAction = async (
    action: "request" | "cancel" | "resend" | "accept" | "decline" | "clear_declined",
    colleagueId?: string
  ) => {
    if (!task) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/delegate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, colleagueId }),
      });
      const payload = await res.json();
      if (payload.success) {
        setTask(payload.data);
        storeUpdateTask(payload.data);
        setSelectedColleagueId("");
        if (action === "request") {
          toast.success("Delegation request sent successfully!");
        } else if (action === "cancel") {
          toast.success("Delegation request cancelled.");
        } else if (action === "resend") {
          toast.success("Delegation request resent!");
        } else if (action === "accept") {
          toast.success("Delegation request accepted!");
        } else if (action === "decline") {
          toast.success("Delegation request declined.");
        } else if (action === "clear_declined") {
          toast.success("Status cleared.");
        }
      } else {
        toast.error(payload.error || "Action failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    }
  };

  const handleUploadDirectAttachments = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task || !e.target.files || e.target.files.length === 0) return;
    setDirectAttachmentLoading(true);
    try {
      const filesToUpload = Array.from(e.target.files);
      toast.info("Uploading attachment(s)...");
      const uploadRes = await uploadFiles("taskAttachment", {
        files: filesToUpload,
      });
      const attachmentsPayload = uploadRes.map((res) => ({
        url: res.url,
        filename: res.name,
      }));

      const res = await fetch(`/api/tasks/${task.id}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachments: attachmentsPayload }),
      });
      const payload = await res.json();
      if (payload.success) {
        const updatedTask = {
          ...task,
          attachments: [...(task.attachments || []), ...payload.data],
        };
        setTask(updatedTask);
        storeUpdateTask(updatedTask);
        toast.success("Attachment(s) added successfully!");
      } else {
        toast.error(payload.error || "Failed to add attachment(s).");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Attachment upload failed: ${err.message || String(err)}`);
    } finally {
      setDirectAttachmentLoading(false);
      if (directAttachmentInputRef.current) {
        directAttachmentInputRef.current.value = "";
      }
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    const hasAttachments = updateSelectedFiles.length > 0 || updateVoiceRecordings.length > 0;
    if (!newRemark.trim() && !hasAttachments) return;

    try {
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
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to post update: ${err.message || String(err)}`);
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

  const handlePostDirectComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newDirectComment.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newDirectComment.trim() }),
      });
      const payload = await res.json();
      if (payload.success) {
        setDirectComments([...directComments, payload.data]);
        setNewDirectComment("");
        toast.success("Comment added.");
      } else {
        toast.error(payload.error || "Failed to add comment.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add comment.");
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
          department: task.department || "General",
        }),
      });
      const payload = await res.json();
      if (payload.success) {
        const updatedSubtasks = [...subtasks, payload.data];
        setSubtasks(updatedSubtasks);
        setNewSubtaskTitle("");
        toast.success("Subtask added successfully!");

        // Recalculate parent progress locally since the server already updated it
        const doneCount = updatedSubtasks.filter((s) => s.status === "DONE").length;
        const totalCount = updatedSubtasks.length;
        const newProgress = Math.round((doneCount / totalCount) * 100);

        const updatedParent = { ...task, progress: newProgress };
        setTask(updatedParent);
        storeUpdateTask(updatedParent);
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

  const handleUpdateStatus = async (newStatus: TaskStatus) => {
    if (!task) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const payload = await res.json();
      if (payload.success) {
        setTask(payload.data);
        storeUpdateTask(payload.data);
        toast.success(`Task status updated to ${newStatus === "IN_PROGRESS" ? "In Progress" : newStatus === "IN_REVIEW" ? "In Review" : newStatus}`);
      } else {
        toast.error(payload.error || "Failed to update status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update task status.");
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
        const updatedSubtasks = subtasks.map((s) => (s.id === sub.id ? payload.data : s));
        setSubtasks(updatedSubtasks);
        toast.success(`Subtask status updated to ${nextStatus}`);

        // Recalculate parent progress locally
        if (task) {
          const doneCount = updatedSubtasks.filter((s) => s.status === "DONE").length;
          const totalCount = updatedSubtasks.length;
          const newProgress = Math.round((doneCount / totalCount) * 100);

          const updatedParent = { ...task, progress: newProgress };
          setTask(updatedParent);
          storeUpdateTask(updatedParent);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update subtask status.");
    }
  };

  if (!task) return null;

  const statusStyle = STATUS_COLORS[task.status] || STATUS_COLORS.TODO;
  const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM;

  const canEdit = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER" || currentUser?.role === "TEAM_LEADER";
  const canDelegate = currentUser ? hasPermission(currentUser.role, "delegate") : false;
  const canCreateSubtask = currentUser ? hasPermission(currentUser.role, "create_subtask") : false;

  return (
    <>
      {/* Centered Modal Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-[3px] transition-all duration-300 flex items-center justify-center z-[50] p-4 max-sm:p-0"
      >
        {/* Modal Container */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "bg-surface border border-border shadow-2xl flex flex-col transition-all duration-200 ease-in-out",
            "w-full max-w-5xl h-[90vh] max-h-[850px] rounded-xl overflow-hidden animate-in zoom-in-95 max-sm:h-full max-sm:rounded-none"
          )}
        >
          {/* Header */}
          <div className="p-4 px-6 border-b border-border flex items-center justify-between gap-4 shrink-0 bg-bg/10">
            <div className="flex-1 min-w-0">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                  {task.department || "General"}
                </span>
                {task.frequency && task.frequency !== "ONE_TIME" && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">
                    🔄 {task.frequency === "CUSTOM" ? (task.customFrequency || "Custom") : task.frequency}
                  </span>
                )}
                {task.dueDate && (
                  <span className="flex items-center gap-1 text-text-tertiary text-[11px] ml-2">
                    <Calendar className="w-3.5 h-3.5" />
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Title / Edit Title */}
              {editMode ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border-strong rounded bg-bg text-text-primary text-[16px] font-semibold focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none"
                />
              ) : (
                <h2 className="text-text-primary font-semibold tracking-tight text-lg truncate">
                  {task.title}
                </h2>
              )}
            </div>

            {/* Close & Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {canEdit && (
                <button
                  onClick={() => (editMode ? handleSaveChanges() : setEditMode(true))}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-bg hover:text-text-primary transition-all focus:outline-none border border-border"
                  title={editMode ? "Save Changes" : "Edit Fields"}
                >
                  {editMode ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Edit className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-bg hover:text-text-primary transition-all focus:outline-none border border-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Columns */}
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
            {/* Left Area (2/3 size) */}
            <div className="md:col-span-2 overflow-y-auto p-6 space-y-6 border-r border-border flex flex-col min-h-0">
              {/* Tab Selector */}
              <div className="h-9 flex border-b border-border shrink-0 bg-bg/5 rounded-t-md">
                {(["details", "updates", "subtasks", "comments"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "h-full flex items-center font-normal px-4 text-text-secondary border-b-2 border-transparent transition-all cursor-pointer hover:text-text-primary uppercase tracking-[0.05em]",
                      activeTab === tab && "border-brand text-text-primary font-semibold"
                    )}
                    style={{ fontSize: "0.75rem" }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Scrollable tab panel contents */}
              <div className="flex-1 min-h-0 space-y-5">
                {/* 1. DETAILS TAB */}
                {activeTab === "details" && (
                  <div className="space-y-5">
                    {/* Description */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Description</span>
                      {editMode ? (
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={6}
                          className="w-full px-3 py-2 border border-border-strong rounded bg-bg text-text-primary text-[13px] focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none resize-none"
                        />
                      ) : (
                        <div className="text-[13.5px] text-text-primary leading-relaxed whitespace-pre-wrap bg-bg/30 p-4 rounded-lg border border-border/40">
                          {task.description || "No description provided for this task."}
                        </div>
                      )}
                    </div>

                    {/* Metadata attributes editable in details tab too */}
                    {editMode && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Assignee</span>
                          <select
                            value={editAssigneeId}
                            onChange={(e) => setEditAssigneeId(e.target.value)}
                            className="block w-full px-3 py-1.5 border border-border-strong rounded bg-bg text-text-primary text-[12px] cursor-pointer focus:outline-none focus:border-brand"
                          >
                            <option value="">Unassigned</option>
                            {employees
                              .filter((e) => e.isActive && (!editDepartment || editDepartment === "General" || e.department === editDepartment))
                              .map((e) => (
                                <option key={e.id} value={e.id}>{e.name}</option>
                              ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Priority</span>
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
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Department</span>
                          <select
                            value={editDepartment}
                            onChange={(e) => {
                              const newDept = e.target.value;
                              setEditDepartment(newDept);
                              const selectedEmp = employees.find((emp) => emp.id === editAssigneeId);
                              if (selectedEmp && newDept !== "General" && selectedEmp.department !== newDept) {
                                setEditAssigneeId("");
                              }
                            }}
                            className="block w-full px-3 py-1.5 border border-border-strong rounded bg-bg text-text-primary text-[12px] cursor-pointer focus:outline-none focus:border-brand"
                          >
                            <option value="General">General</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.name}>{dept.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Frequency</span>
                          <select
                            value={editFrequency}
                            onChange={(e) => setEditFrequency(e.target.value as TaskFrequency)}
                            className="block w-full px-3 py-1.5 border border-border-strong rounded bg-bg text-text-primary text-[12px] cursor-pointer focus:outline-none focus:border-brand"
                          >
                            <option value="ONE_TIME">One Time</option>
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="QUARTERLY">Quarterly</option>
                            <option value="YEARLY">Yearly</option>
                            <option value="CUSTOM">Custom</option>
                          </select>
                        </div>
                        {editFrequency === "CUSTOM" && (
                          <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Custom Recurrence (e.g. Every 2 Weeks)</span>
                            <input
                              type="text"
                              value={editCustomFrequency}
                              onChange={(e) => setEditCustomFrequency(e.target.value)}
                              placeholder="e.g. every Wednesday"
                              className="w-full px-3 py-1.5 border border-border-strong rounded bg-bg text-text-primary text-[12px] focus:outline-none focus:border-brand"
                            />
                          </div>
                        )}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Due Date</span>
                          <DateRangePicker value={editDueDate} onChange={setEditDueDate} showTime={true} />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 flex flex-col gap-1.5">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Est. Hours</span>
                            <input
                              type="number"
                              min="0"
                              value={editEstimatedHours}
                              onChange={(e) => setEditEstimatedHours(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full px-3 py-1.5 border border-border-strong rounded bg-bg text-text-primary text-[12px] focus:outline-none focus:border-brand"
                            />
                          </div>
                          <div className="flex-1 flex flex-col gap-1.5">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Est. Mins</span>
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={editEstimatedMins}
                              onChange={(e) => setEditEstimatedMins(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                              className="w-full px-3 py-1.5 border border-border-strong rounded bg-bg text-text-primary text-[12px] focus:outline-none focus:border-brand"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {!editMode && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 border-t border-border pt-4 text-xs text-text-secondary">
                        <div className="flex justify-between items-center py-1 border-b border-border/50">
                          <span className="font-semibold uppercase text-text-tertiary">Created By</span>
                          <span>{task.creator?.name || "System"}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-border/50">
                          <span className="font-semibold uppercase text-text-tertiary">Department</span>
                          <span>{task.department || "General"}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-border/50">
                          <span className="font-semibold uppercase text-text-tertiary">Frequency</span>
                          <span>{task.frequency}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-border/50">
                          <span className="font-semibold uppercase text-text-tertiary">Progress</span>
                          <span className="font-bold text-brand">{task.progress}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. DIRECT COMMENTS TAB */}
                {activeTab === "comments" && (
                  <div className="space-y-4 flex flex-col h-full">
                    {/* Add Comment Input Form */}
                    <form onSubmit={handlePostDirectComment} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Write a direct comment on this task..."
                        value={newDirectComment}
                        onChange={(e) => setNewDirectComment(e.target.value)}
                        className="block w-full px-3 py-2 border border-border-strong rounded bg-bg text-text-primary text-[13px] focus:outline-none focus:border-brand"
                      />
                      <button
                        type="submit"
                        disabled={!newDirectComment.trim()}
                        className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded font-medium text-[13px] disabled:opacity-50 active:scale-95 transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send
                      </button>
                    </form>

                    {/* Comments Feed list */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {directComments.length === 0 ? (
                        <div className="text-center py-8 text-text-tertiary text-[13px]">
                          No direct comments yet. Write one above.
                        </div>
                      ) : (
                        directComments.map((comment) => (
                          <div key={comment.id} className="p-3 bg-bg/40 border border-border rounded-lg flex gap-3 items-start">
                            <UserAvatar src={comment.user?.avatarUrl} name={comment.user?.name} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-text-primary">{comment.user?.name || "Member"}</span>
                                <span className="text-[10px] text-text-tertiary">{new Date(comment.createdAt).toLocaleString()}</span>
                              </div>
                              <p className="text-xs text-text-primary mt-1 leading-relaxed whitespace-pre-wrap">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 3. UPDATES TAB (Existing updates & remarks) */}
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
                )}
              </div>
            </div>

            {/* Right Area Sidebar (1/3 size) */}
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
                        {employees.filter((e) => e.isActive && e.id !== task.assigneeId).map((e) => (
                          <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                        ))}
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
                      <div className="space-y-2 p-3 bg-rose-50/55 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/40 rounded-xl">
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
          </div>
        </div>
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
      <div onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center" style={{ zIndex: 9999 }} />
      
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[360px] bg-surface border border-border rounded-xl shadow-lg p-6 animate-in zoom-in-95 duration-150" style={{ zIndex: 10000 }}>
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
