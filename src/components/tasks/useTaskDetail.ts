"use client";

import React, { useState, useEffect, useRef } from "react";
import { Task, TaskStatus, Priority, TaskUpdate, User, TaskComment, Department, TaskFrequency } from "@/types";
import { useTaskStore } from "@/store/useTaskStore";
import { useToast } from "@/hooks/useToast";
import { uploadFiles } from "@/lib/uploadthing-client";
import * as api from "./taskDetailApi";

export function useTaskDetail(onClose: () => void) {
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
      const payload = await api.fetchTaskRelations(taskId);
      if (payload.success && payload.data) {
        const detail = payload.data;
        setTask(detail);
        storeUpdateTask(detail);
        setUpdates(detail.updates || []);
        setSubtasks(detail.subTasks || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDirectComments = async (taskId: string) => {
    try {
      const payload = await api.fetchDirectComments(taskId);
      if (payload.success) {
        setDirectComments(payload.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch comments", err);
    }
  };

  const handleChecklistToggle = async (index: number) => {
    if (!task) return;
    const checklist = Array.isArray(task.checklistItems) ? [...task.checklistItems] : [];
    checklist[index].completed = !checklist[index].completed;

    let newProgress = task.progress;
    if (subtasks.length === 0) {
      const doneChecklist = checklist.filter((item: any) => item.completed).length;
      const totalChecklist = checklist.length;
      newProgress = Math.round((doneChecklist / totalChecklist) * 100);
    }

    try {
      const payload = await api.patchTaskChecklist(task.id, checklist, newProgress);
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
      const payload = await api.patchTaskDetails(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        dueDate: editDueDate ? editDueDate.toISOString() : null,
        assigneeId: editAssigneeId || null,
        estimatedMinutes: totalMinutes,
        department: editDepartment,
        frequency: editFrequency,
        customFrequency: editFrequency === "CUSTOM" ? editCustomFrequency.trim() : null,
      });
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
      const payload = await api.patchTaskProgress(task.id, newProgress);
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
      const payload = await api.assignTeamMember(task.id, newAssigneeId);
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
      const payload = await api.delegateAction(task.id, action, colleagueId);
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

      const payload = await api.uploadAttachments(task.id, attachmentsPayload);
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

      const payload = await api.postUpdateRemark(task.id, newRemark.trim(), uploadedAttachments);
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
      const payload = await api.postUpdateComment(task.id, updateId, text.trim());
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
      const payload = await api.postDirectComment(task.id, newDirectComment.trim());
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
      const payload = await api.addSubtask(task.id, {
        title: newSubtaskTitle.trim(),
        priority: task.priority,
        assigneeId: task.assigneeId || null,
        department: task.department || "General",
      });
      if (payload.success) {
        const updatedSubtasks = [...subtasks, payload.data];
        setSubtasks(updatedSubtasks);
        setNewSubtaskTitle("");
        toast.success("Subtask added successfully!");

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
        const res = await api.deleteTask(task.id);
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
      const payload = await api.updateStatus(task.id, newStatus);
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
      const payload = await api.updateStatus(sub.id, nextStatus);
      if (payload.success) {
        const updatedSubtasks = subtasks.map((s) => (s.id === sub.id ? payload.data : s));
        setSubtasks(updatedSubtasks);
        toast.success(`Subtask status updated to ${nextStatus}`);

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

  const handleSaveSubtaskRemark = async (subtaskId: string, remark: string) => {
    try {
      const payload = await api.patchTaskRemark(subtaskId, remark);
      if (payload.success) {
        const updatedSubtasks = subtasks.map((s) => (s.id === subtaskId ? payload.data : s));
        setSubtasks(updatedSubtasks);
        toast.success("Subtask remark updated successfully!");
      } else {
        toast.error(payload.error || "Failed to update remark.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update subtask remark.");
    }
  };

  return {
    task,
    setTask,
    activeTab,
    setActiveTab,
    editMode,
    setEditMode,
    loading,
    setLoading,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editPriority,
    setEditPriority,
    editDueDate,
    setEditDueDate,
    editAssigneeId,
    setEditAssigneeId,
    editEstimatedHours,
    setEditEstimatedHours,
    editEstimatedMins,
    setEditEstimatedMins,
    editDepartment,
    setEditDepartment,
    editFrequency,
    setEditFrequency,
    editCustomFrequency,
    setEditCustomFrequency,
    selectedColleagueId,
    setSelectedColleagueId,
    updates,
    setUpdates,
    subtasks,
    setSubtasks,
    employees,
    setEmployees,
    departments,
    setDepartments,
    directComments,
    setDirectComments,
    newRemark,
    setNewRemark,
    newCommentText,
    setNewCommentText,
    newSubtaskTitle,
    setNewSubtaskTitle,
    newDirectComment,
    setNewDirectComment,
    updateSelectedFiles,
    setUpdateSelectedFiles,
    updateVoiceRecordings,
    setUpdateVoiceRecordings,
    showUpdateVoiceModal,
    setShowUpdateVoiceModal,
    updateFileInputRef,
    directAttachmentLoading,
    setDirectAttachmentLoading,
    directAttachmentInputRef,
    handleUpdateFileChange,
    handleUpdateVoiceSave,
    handleChecklistToggle,
    handleSaveChanges,
    handleProgressChange,
    handleDelegateAssignee,
    handleDelegationAction,
    handleUploadDirectAttachments,
    handlePostUpdate,
    handlePostComment,
    handlePostDirectComment,
    handleAddSubtask,
    handleDeleteTask,
    handleUpdateStatus,
    handleToggleSubtaskStatus,
    handleSaveSubtaskRemark,
    currentUser,
  };
}
