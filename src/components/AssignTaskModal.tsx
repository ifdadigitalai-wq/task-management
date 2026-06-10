"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X, User, Flag, Briefcase, Repeat2, Paperclip, Mic, StopCircle, Trash2, Play, Pause, Check, Clock, Plus, Bookmark, FileText
} from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { useToast } from "@/hooks/useToast";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Priority, TaskTemplate, User as UserType } from "@/types";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { cn } from "@/lib/utils";
import { uploadFiles } from "@/lib/uploadthing-client";

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
      <div onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center" style={{ zIndex: "var(--z-modal-backdrop)" }} />
      
      {/* Modal Container — z-modal = 80 */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[360px] bg-surface border border-border rounded-xl shadow-lg p-6 animate-in zoom-in-95 duration-150" style={{ zIndex: "var(--z-modal)" }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-medium text-text-primary">Voice Recording</span>
          <button onClick={onClose} className="p-1 hover:bg-bg rounded-md text-text-tertiary">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="text-center mb-6">
          <div className={`text-3xl font-medium font-mono tracking-tight ${state === "recording" ? "text-priority-critical-text animate-pulse" : "text-text-primary"}`}>
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
                className={`w-0.5 rounded-full ${state === "recording" ? "bg-priority-critical-text" : "bg-border-strong"}`}
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

export function AssignTaskModal({ onClose }: { onClose: () => void }) {
  const { addTask, currentUser, fetchCurrentUser } = useTaskStore();
  const toast = useToast();

  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [employees, setEmployees] = useState<UserType[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [recurrenceRule, setRecurrenceRule] = useState<string>("NONE");
  const [checklist, setChecklist] = useState<{ text: string; completed: boolean }[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [voiceRecordings, setVoiceRecordings] = useState<{ name: string; blob: Blob }[]>([]);
  const [remindWhatsApp, setRemindWhatsApp] = useState(false);
  const [remindEmail, setRemindEmail] = useState(false);

  // New fields
  const [department, setDepartment] = useState("");
  const [frequency, setFrequency] = useState("ONE_TIME");
  const [customFrequency, setCustomFrequency] = useState("");

  // Reminder settings
  const [reminderBeforeDue, setReminderBeforeDue] = useState(true);
  const [reminderOnDue, setReminderOnDue] = useState(true);
  const [reminderRecurring, setReminderRecurring] = useState(false);
  const [reminderEmail, setReminderEmail] = useState(false);
  const [reminderInApp, setReminderInApp] = useState(true);
  const [showReminders, setShowReminders] = useState(false);
  
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load current user
  useEffect(() => {
    if (!currentUser) {
      fetchCurrentUser();
    }
  }, [currentUser, fetchCurrentUser]);

  // Auto-set department for employee
  useEffect(() => {
    if (currentUser && currentUser.role === "EMPLOYEE" && currentUser.department) {
      setDepartment(currentUser.department);
    }
  }, [currentUser]);

  // Fetch users, templates, and departments on mount
  useEffect(() => {
    fetch("/api/users", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) setEmployees(payload.data);
      })
      .catch(console.error);

    fetch("/api/task-templates")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) setTemplates(payload.data);
      })
      .catch(console.error);

    fetch("/api/departments")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) setDepartments(payload.data);
      })
      .catch(console.error);
  }, []);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedTemplateId(id);
    const template = templates.find((t) => t.id === id);
    if (template) {
      setTitle(template.name);
      setDescription(template.description || "");
      setPriority(template.defaultPriority);
      if (currentUser?.role === "ADMIN" && template.department) {
        setDepartment(template.department);
      }
      setRecurrenceRule(template.recurrence?.rule || "NONE");
      setFrequency(template.frequency || "ONE_TIME");
      setCustomFrequency(template.customFrequency || "");
      setRemindWhatsApp(
        Array.isArray(template.remindVia) ? template.remindVia.includes("whatsapp") : false
      );
      setRemindEmail(
        Array.isArray(template.remindVia) ? template.remindVia.includes("email") : false
      );
      if (template.checklistItems && Array.isArray(template.checklistItems)) {
        setChecklist(
          template.checklistItems.map((item: string) => ({ text: item, completed: false }))
        );
      }
    }
  };

  const handleAddTag = () => {
    if (tagsInput.trim() && !tags.includes(tagsInput.trim())) {
      setTags([...tags, tagsInput.trim()]);
      setTagsInput("");
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((tag) => tag !== t));
  };

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklist([...checklist, { text: newChecklistItem.trim(), completed: false }]);
      setNewChecklistItem("");
    }
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)]);
    }
  };

  const handleVoiceSave = (blob: Blob, name: string) => {
    setVoiceRecordings([...voiceRecordings, { blob, name }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Task title is required.");
      return;
    }
    if (!department) {
      toast.error("Department is a mandatory field.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Prepare files list for UploadThing
      const filesToUpload: File[] = [];
      selectedFiles.forEach((file) => {
        filesToUpload.push(file);
      });
      voiceRecordings.forEach((v) => {
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
          return {
            url: res.url,
            filename: res.name,
          };
        });
      }

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          dueDate: dueDate ? dueDate.toISOString() : null,
          assigneeId: assigneeId || null,
          templateId: selectedTemplateId || null,
          tags,
          checklistItems: checklist,
          attachments: uploadedAttachments,
          recurrence: { rule: recurrenceRule },
          remindVia: [
            remindWhatsApp && "whatsapp",
            remindEmail && "email",
          ].filter(Boolean),
          department,
          frequency,
          customFrequency: frequency === "CUSTOM" ? customFrequency.trim() : null,
          reminderSettings: {
            beforeDueDate: reminderBeforeDue,
            onDueDate: reminderOnDue,
            recurring: reminderRecurring,
            emailNotification: reminderEmail,
            inAppNotification: reminderInApp,
          },
        }),
      });

      const payload = await res.json();
      if (payload.success) {
        addTask(payload.data);
        toast.success("Task created and assigned successfully!");
        onClose();
      } else {
        toast.error(payload.error || "Failed to create task.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to save task: ${err.message || String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop ── z-modal-backdrop = 70 */}
      <div onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center" style={{ zIndex: "var(--z-modal-backdrop)" }} />
      
      {/* Modal Container ── z-modal = 80 */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[520px] max-h-[85vh] overflow-y-auto bg-surface rounded-xl shadow-lg flex flex-col animate-in zoom-in-95 duration-150" style={{ zIndex: "var(--z-modal)" }}>
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-border flex items-start justify-between shrink-0 relative">
          <div>
            <h2 className="text-[15px] font-medium text-text-primary">Assign New Task</h2>
            <p className="text-[12px] text-text-secondary mt-0.5">Fill in the task details below</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 w-6 h-6 rounded-full hover:bg-bg flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors focus-visible:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Template Selection */}
          <FormField label="Use Task Template">
            <select
              value={selectedTemplateId}
              onChange={handleTemplateChange}
              className="block w-full h-[34px] cursor-pointer focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none"
            >
              <option value="">No template selected (Create custom)</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.defaultPriority})
                </option>
              ))}
            </select>
          </FormField>

          {/* Department */}
          {(currentUser?.role === "ADMIN" || currentUser?.role === "EMPLOYEE") && (
            <FormField label="Department *" required>
              <select
                value={department}
                onChange={(e) => {
                  const newDept = e.target.value;
                  setDepartment(newDept);
                  const selectedEmp = employees.find((emp) => emp.id === assigneeId);
                  if (selectedEmp && selectedEmp.department !== newDept) {
                    setAssigneeId("");
                  }
                }}
                required
                className="block w-full h-[34px] cursor-pointer focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none text-text-primary"
              >
                <option value="">Select Department...</option>
                {departments
                  .filter((d) => currentUser?.role !== "EMPLOYEE" || d.name === currentUser?.department)
                  .map((d) => (
                    <option key={d.id} value={d.name} className="bg-surface text-text-primary">
                      {d.name}
                    </option>
                  ))}
              </select>
            </FormField>
          )}

          {/* Title */}
          <FormField label="Task Title *" required>
            <input
              type="text"
              placeholder="E.g., Review billing reports..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="block w-full h-[34px] focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none"
            />
          </FormField>

          {/* Description */}
          <FormField label="Description">
            <textarea
              placeholder="Enter comprehensive task instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="block w-full min-h-[80px] p-2 focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none resize-none"
            />
          </FormField>

          {/* Priority Selection */}
          <FormField label="Priority">
            <div className="flex gap-2">
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as Priority[]).map((p) => {
                const isActive = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex-1 h-[34px] rounded border text-[11px] uppercase tracking-wider font-medium transition-all focus-visible:outline-none",
                      isActive
                        ? "bg-brand text-white border-brand shadow-sm"
                        : "bg-transparent text-text-secondary border-border-strong hover:bg-bg"
                    )}
                  >
                    {p.toLowerCase()}
                  </button>
                );
              })}
            </div>
          </FormField>

          {/* Due Date */}
          <FormField label="Due Date & Time">
            <DateRangePicker value={dueDate} onChange={setDueDate} showTime={true} />
          </FormField>

          {/* Assignee & Recurrence Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assignee */}
            <FormField label="Assignee">
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="block w-full h-[34px] cursor-pointer focus:border-brand focus:ring-2 focus:ring-brand/10"
              >
                <option value="">Unassigned (Assign to Self)</option>
                {employees
                  .filter((e) => e.isActive && (!department || e.department === department))
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.department || "No department"})
                    </option>
                  ))}
              </select>
            </FormField>

            {/* Recurrence */}
            <FormField label="Recurrence">
              <select
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value)}
                className="block w-full h-[34px] cursor-pointer focus:border-brand focus:ring-2 focus:ring-brand/10"
              >
                <option value="NONE">No Recurrence</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </FormField>
          </div>

          {/* Frequency & Custom Frequency Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Task Frequency">
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="block w-full h-[34px] cursor-pointer focus:border-brand focus:ring-2 focus:ring-brand/10"
              >
                <option value="ONE_TIME">One Time</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
                <option value="CUSTOM">Custom Frequency</option>
              </select>
            </FormField>

            {frequency === "CUSTOM" && (
              <FormField label="Custom Frequency Rule" required>
                <input
                  type="text"
                  placeholder="e.g. Every 2 weeks on Tuesday"
                  value={customFrequency}
                  onChange={(e) => setCustomFrequency(e.target.value)}
                  required
                  className="block w-full h-[34px] focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none"
                />
              </FormField>
            )}
          </div>

          {/* Collapsible Auto Reminder Settings */}
          <div className="border border-border rounded-xl overflow-hidden bg-bg/5">
            <button
              type="button"
              onClick={() => setShowReminders(!showReminders)}
              className="w-full flex items-center justify-between p-3.5 text-[12px] font-medium text-text-primary hover:bg-bg/40 transition-colors select-none"
            >
              <span>Auto Reminder Settings</span>
              <span className="text-text-tertiary">{showReminders ? "▲" : "▼"}</span>
            </button>
            {showReminders && (
              <div className="p-4 border-t border-border bg-surface space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-primary font-medium select-none">
                    <input
                      type="checkbox"
                      checked={reminderBeforeDue}
                      onChange={(e) => setReminderBeforeDue(e.target.checked)}
                      className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
                    />
                    Before Due Date
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-primary font-medium select-none">
                    <input
                      type="checkbox"
                      checked={reminderOnDue}
                      onChange={(e) => setReminderOnDue(e.target.checked)}
                      className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
                    />
                    On Due Date
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-primary font-medium select-none">
                    <input
                      type="checkbox"
                      checked={reminderRecurring}
                      onChange={(e) => setReminderRecurring(e.target.checked)}
                      className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
                    />
                    Recurring
                  </label>
                </div>
                <div className="flex gap-x-6 pt-2 border-t border-border-strong/5">
                  <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-primary font-medium select-none">
                    <input
                      type="checkbox"
                      checked={reminderEmail}
                      onChange={(e) => setReminderEmail(e.target.checked)}
                      className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
                    />
                    Email Reminders
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-primary font-medium select-none">
                    <input
                      type="checkbox"
                      checked={reminderInApp}
                      onChange={(e) => setReminderInApp(e.target.checked)}
                      className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
                    />
                    In-App Notifications
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Reminders / Notifications via WhatsApp/Email */}
          <FormField label="Remind Employee Via">
            <div className="flex items-center gap-6 py-1">
              <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-primary font-medium select-none">
                <input
                  type="checkbox"
                  checked={remindWhatsApp}
                  onChange={(e) => setRemindWhatsApp(e.target.checked)}
                  className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
                />
                WhatsApp Message
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-primary font-medium select-none">
                <input
                  type="checkbox"
                  checked={remindEmail}
                  onChange={(e) => setRemindEmail(e.target.checked)}
                  className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
                />
                Email Notification
              </label>
            </div>
          </FormField>

          {/* Tags Input */}
          <FormField label="Tags (Comma-separated)">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="E.g., bug, billing"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "," || e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                className="block w-full h-[34px] focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="h-[34px] px-3 bg-bg hover:bg-surface-raised border border-border-strong rounded text-[12px] font-medium text-text-secondary transition-colors"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-light text-brand-text text-[11px] font-medium border border-brand/10">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:opacity-75 focus-visible:outline-none">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </FormField>

          {/* Checklist subtask list */}
          <FormField label="Checklist Items">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add checklist sub-task..."
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddChecklistItem(); } }}
                className="block w-full h-[34px] focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="h-[34px] w-[34px] bg-bg hover:bg-surface-raised border border-border-strong rounded flex items-center justify-center text-text-secondary transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {checklist.length > 0 && (
              <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto">
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-bg border border-border">
                    <span className="text-[12px] text-text-primary font-medium">{item.text}</span>
                    <button type="button" onClick={() => handleRemoveChecklistItem(i)} className="text-text-tertiary hover:text-text-primary focus-visible:outline-none">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormField>

          {/* File attachments & voice note button */}
          <div className="flex items-center gap-2 border-t border-border pt-4 mt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Paperclip className="w-3.5 h-3.5" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Attach File
            </Button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />

            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Mic className="w-3.5 h-3.5" />}
              onClick={() => setShowVoiceModal(true)}
              className="text-[#EF4444] border-[#FECACA] hover:bg-[#FEF2F2] dark:hover:bg-red-955/20"
            >
              Record voice note
            </Button>
          </div>

          {/* Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedFiles.map((f, i) => (
                <div key={i} className="inline-flex items-center gap-2 p-2 bg-bg border border-border rounded-lg">
                  <span className="text-[12px] text-text-primary font-medium truncate max-w-[120px]">{f.name}</span>
                  <span className="text-[10px] text-text-tertiary">({(f.size / 1024).toFixed(1)} KB)</span>
                  <button type="button" onClick={() => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))} className="text-text-tertiary hover:text-text-primary focus-visible:outline-none">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Voice Notes Preview */}
          {voiceRecordings.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {voiceRecordings.map((v, i) => (
                <div key={i} className="inline-flex items-center gap-2 p-2 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-[#EF4444] dark:bg-red-955/20 dark:border-red-900/40 dark:text-red-400">
                  <Mic className="w-3.5 h-3.5" />
                  <span className="text-[12px] font-medium">Voice note {i + 1}</span>
                  <button type="button" onClick={() => setVoiceRecordings(voiceRecordings.filter((_, idx) => idx !== i))} className="hover:opacity-75 focus-visible:outline-none">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-border flex items-center justify-end gap-3 shrink-0 bg-bg/15">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            size="md"
            className="h-[34px] px-4"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            onClick={handleSubmit}
            variant="primary"
            size="md"
            className="h-[34px] px-4"
          >
            {submitting ? "Assigning..." : "Assign task"}
          </Button>
        </div>
      </div>

      {showVoiceModal && <VoiceRecordingModal onSave={handleVoiceSave} onClose={() => setShowVoiceModal(false)} />}
    </>
  );
}

export default AssignTaskModal;