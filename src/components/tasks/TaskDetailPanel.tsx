"use client";

import { useState, useRef, useEffect } from "react";
import { Task } from "@/types";
import { useTaskStore } from "@/store/useTaskStore";
import {
  X, MessageSquare, Trash2, RefreshCw, Paperclip,
  Mic, ImageIcon, Send, ChevronDown,
  StopCircle, Play, Pause, Check,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface TaskUpdate {
  id: string;
  remark: string;
  files: string[];
  images: string[];
  hasVoice: boolean;
  createdAt: string;
  comments: UpdateComment[];
}

interface UpdateComment {
  id: string;
  text: string;
  createdAt: string;
  author?: { id: string; name: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const PRIORITY: Record<string, { label: string; color: string; bg: string }> = {
  HIGH:   { label: "High",   color: "#ef4444", bg: "#fef2f2" },
  MEDIUM: { label: "Medium", color: "#f59e0b", bg: "#fffbeb" },
  LOW:    { label: "Low",    color: "#22c55e", bg: "#f0fdf4" },
};

const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "COMPLETED"];
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", IN_PROGRESS: "In Progress", COMPLETED: "Completed",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  const colors = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6"];
  const color  = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ height: size, width: size, borderRadius: "50%", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Mini Voice Recorder ────────────────────────────────────────────────────────

function InlineVoiceRecorder({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const [state, setState]   = useState<"idle"|"recording"|"paused"|"done">("idle");
  const [secs, setSecs]     = useState(0);
  const timerRef            = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRef            = useRef<MediaRecorder | null>(null);
  const chunksRef           = useRef<Blob[]>([]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const startTimer = () => { timerRef.current = setInterval(() => setSecs(s => s + 1), 1000); };
  const stopTimer  = () => { if (timerRef.current) clearInterval(timerRef.current); };

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = e => chunksRef.current.push(e.data);
    mr.onstop = () => setState("done");
    mr.start(); mediaRef.current = mr;
    setState("recording"); startTimer();
  };
  const pause  = () => { mediaRef.current?.pause();  stopTimer(); setState("paused"); };
  const resume = () => { mediaRef.current?.resume(); startTimer(); setState("recording"); };
  const stop   = () => { mediaRef.current?.stop(); mediaRef.current?.stream.getTracks().forEach(t => t.stop()); stopTimer(); };

  useEffect(() => () => stopTimer(), []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", backgroundColor: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
      <Mic style={{ height: "14px", width: "14px", color: "#ef4444", flexShrink: 0 }} />
      <span style={{ fontSize: "13px", fontWeight: 600, color: "#ef4444", fontVariantNumeric: "tabular-nums", minWidth: "40px" }}>
        {pad(Math.floor(secs / 60))}:{pad(secs % 60)}
      </span>
      <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
        {state === "idle" && (
          <button onClick={start} style={{ padding: "4px 10px", borderRadius: "6px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Start</button>
        )}
        {state === "recording" && (<>
          <button onClick={pause} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #e5e7eb", backgroundColor: "#fff", fontSize: "12px", cursor: "pointer" }}><Pause style={{ height: "12px", width: "12px" }} /></button>
          <button onClick={stop}  style={{ padding: "4px 8px", borderRadius: "6px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "12px", cursor: "pointer" }}><StopCircle style={{ height: "12px", width: "12px" }} /></button>
        </>)}
        {state === "paused" && (<>
          <button onClick={resume} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #e5e7eb", backgroundColor: "#fff", fontSize: "12px", cursor: "pointer" }}><Play style={{ height: "12px", width: "12px" }} /></button>
          <button onClick={stop}   style={{ padding: "4px 8px", borderRadius: "6px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "12px", cursor: "pointer" }}><StopCircle style={{ height: "12px", width: "12px" }} /></button>
        </>)}
        {state === "done" && (
          <button onClick={onSave} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", border: "none", backgroundColor: "#4f46e5", color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            <Check style={{ height: "11px", width: "11px" }} /> Save
          </button>
        )}
        <button onClick={onCancel} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #e5e7eb", backgroundColor: "#fff", fontSize: "12px", cursor: "pointer", color: "#9ca3af" }}>
          <X style={{ height: "12px", width: "12px" }} />
        </button>
      </div>
    </div>
  );
}

// ── Comment Popup ──────────────────────────────────────────────────────────────

function CommentPopup({ onSubmit, onClose }: { onSubmit: (text: string) => void; onClose: () => void }) {
  const [text, setText] = useState("");
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 200 }} />
      <div onClick={e => e.stopPropagation()} style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 210, backgroundColor: "#fff", borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", width: "400px", maxWidth: "calc(100vw - 32px)", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <span style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>Add Comment</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}>
            <X style={{ height: "16px", width: "16px" }} />
          </button>
        </div>
        <textarea
          value={text} onChange={e => setText(e.target.value)}
          placeholder="Write your comment..."
          rows={4}
          style={{ width: "100%", borderRadius: "8px", border: "1px solid #e5e7eb", padding: "10px 12px", fontSize: "13px", color: "#374151", outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit", lineHeight: "1.5", backgroundColor: "#fafafa" }}
          onFocus={e => { e.currentTarget.style.borderColor = "#4f46e5"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.08)"; }}
          onBlur={e  => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
          autoFocus
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "14px" }}>
          <button onClick={onClose} style={{ height: "34px", padding: "0 16px", borderRadius: "8px", border: "1px solid #e5e7eb", backgroundColor: "#fff", fontSize: "13px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { if (text.trim()) { onSubmit(text.trim()); onClose(); } }}
            style={{ height: "34px", padding: "0 16px", borderRadius: "8px", border: "none", backgroundColor: "#4f46e5", fontSize: "13px", fontWeight: 500, color: "#fff", cursor: "pointer" }}>
            Post Comment
          </button>
        </div>
      </div>
    </>
  );
}

// ── Task Update Entry ──────────────────────────────────────────────────────────

function UpdateEntry({ update, onAddComment }: { update: TaskUpdate; onAddComment: (updateId: string, text: string) => void }) {
  const [showCommentPopup, setShowCommentPopup] = useState(false);

  return (
    <div style={{ borderLeft: "2px solid #e0e7ff", paddingLeft: "14px", marginBottom: "16px" }}>
      {/* Update body */}
      <div style={{ backgroundColor: "#fafafa", borderRadius: "10px", border: "1px solid #f0f0f0", padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500 }}>{formatTime(update.createdAt)}</span>
          <button
            onClick={() => setShowCommentPopup(true)}
            style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "11px", fontWeight: 500, padding: "2px 6px", borderRadius: "6px" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <MessageSquare style={{ height: "11px", width: "11px" }} /> Comment
          </button>
        </div>

        <p style={{ fontSize: "13px", color: "#374151", margin: "0 0 8px", lineHeight: "1.5" }}>{update.remark}</p>

        {/* Attachments row */}
        {(update.files.length > 0 || update.images.length > 0 || update.hasVoice) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {update.files.map((f, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "6px", backgroundColor: "#f3f4f6", fontSize: "11px", color: "#6b7280" }}>
                <Paperclip style={{ height: "10px", width: "10px" }} />{f}
              </span>
            ))}
            {update.images.map((img, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "6px", backgroundColor: "#f0fdf4", fontSize: "11px", color: "#22c55e" }}>
                <ImageIcon style={{ height: "10px", width: "10px" }} />{img}
              </span>
            ))}
            {update.hasVoice && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "6px", backgroundColor: "#fef2f2", fontSize: "11px", color: "#ef4444" }}>
                <Mic style={{ height: "10px", width: "10px" }} /> Voice note
              </span>
            )}
          </div>
        )}
      </div>

      {/* Comments under this update */}
      {update.comments.length > 0 && (
        <div style={{ paddingLeft: "12px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {update.comments.map(c => (
            <div key={c.id} style={{ backgroundColor: "#ffffff", border: "1px solid #f0f0f0", borderRadius: "8px", padding: "8px 12px" }}>
              <p style={{ fontSize: "12px", color: "#374151", margin: "0 0 3px", lineHeight: "1.4" }}>{c.text}</p>
              <span style={{ fontSize: "10px", color: "#d1d5db" }}>{formatTime(c.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      {showCommentPopup && (
        <CommentPopup
          onSubmit={text => onAddComment(update.id, text)}
          onClose={() => setShowCommentPopup(false)}
        />
      )}
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────

export function TaskDetailPanel({
  task,
  onClose,
  onReopen,
  onDelete,
  onFinish
}: {
  task: Task;
  onClose: () => void;
  onDelete: () => void;
  onReopen?: () => void;
  onFinish?: (id: string) => void;
}) {
  const { currentUser, fetchCurrentUser } = useTaskStore();
  useEffect(() => {
    if (!currentUser) {
      fetchCurrentUser();
    }
  }, []);

  const isEmployee = currentUser?.role === "EMPLOYEE";
  const [updates, setUpdates]               = useState<TaskUpdate[]>([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showCommentPopup, setShowCommentPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFinishedConfirm, setShowFinishedConfirm] = useState(false);
  const [Finishing, setFinishing] = useState(false);

  // Update form state
  const [remark, setRemark]       = useState("");
  const [updateFiles, setUpdateFiles] = useState<File[]>([]);
  const [updateImages, setUpdateImages] = useState<File[]>([]);
  const [showVoice, setShowVoice] = useState(false);
  const [hasVoice, setHasVoice]   = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const fileRef  = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const prio     = PRIORITY[task.priority] ?? PRIORITY.MEDIUM;
  const tagParts = task.tag ? task.tag.split(" · ").filter(Boolean) : [];

const submitUpdate = async () => {
  if (!remark.trim()) return;
  const res = await fetch(`/api/tasks/${task.id}/updates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      remark: remark.trim(),
      files: updateFiles.map(f => f.name),
      images: updateImages.map(f => f.name),
      hasVoice,
    }),
  });
  const saved = await res.json();
  setUpdates(prev => [saved, ...prev]);
  setRemark(""); setUpdateFiles([]); setUpdateImages([]); setHasVoice(false);
  setShowVoice(false); setShowUpdateForm(false);
};
  // updat the taskstatus to completed if the update remark contains "completed" or "finished"
  useEffect(() => {
  fetch(`/api/tasks/${task.id}/updates`)
    .then(r => r.json())
    .then(setUpdates)
    .catch(console.error);
}, [task.id]);

const addCommentToUpdate = async (updateId: string, text: string) => {
  const res = await fetch(`/api/tasks/${task.id}/updates/${updateId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const saved = await res.json();
  setUpdates(prev => prev.map(u =>
    u.id === updateId
      ? { ...u, comments: [...u.comments, saved] }
      : u
  ));
};
  const handleDelete = async () => {
  try {
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    setShowDeleteConfirm(false);
    onDelete();
    onClose();
    STATUS_LABEL: "COMPLETED";
  } catch (err) {
    console.error("Failed to delete task", err);
  }
};
const handleFinish = async () => {
  try {
    setFinishing(true);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED", progress: 100 }),
    });
    setShowFinishedConfirm(false);
    onFinish && onFinish(task.id);
    onClose();
  } catch (err) {
    console.error("Failed to mark task as finished", err);
  } finally {
    setFinishing(false);
  }
};
  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.2)", zIndex: 80 }} />

      {/* Slide-in panel */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "min(520px, 100vw)",
          backgroundColor: "#ffffff",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          zIndex: 90,
          display: "flex", flexDirection: "column",
          animation: "slideIn 0.22s cubic-bezier(0.16,1,0.3,1)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* ── Header ── */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", color: "#9ca3af", fontFamily: "monospace", fontWeight: 600 }}>
                  #{task.id.slice(0, 8).toUpperCase()}
                </span>
                <span style={{ padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, backgroundColor: prio.bg, color: prio.color }}>
                  {prio.label}
                </span>
              </div>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", margin: 0, lineHeight: "1.3" }}>
                {task.title}
              </h2>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px", display: "flex", flexShrink: 0 }}>
              <X style={{ height: "18px", width: "18px" }} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {/* Task details grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            {[
              { label: "Status",     value: STATUS_LABEL[task.status] ?? task.status },
              { label: "Due Date",   value: task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—" },
              { label: "Assigned To", value: task.assignedTo?.name ?? "—" },
              { label: "Assigned By", value: task.delegatedBy?.name ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "10px 12px", border: "1px solid #f0f0f0" }}>
                <p style={{ fontSize: "10px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 3px" }}>{label}</p>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827", margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {task.description && (
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Description</p>
              <p style={{ fontSize: "13px", color: "#374151", lineHeight: "1.6", margin: 0 }}>{task.description}</p>
            </div>
          )}

          {/* Tags */}
          {tagParts.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
              {tagParts.map((t, i) => (
                <span key={i} style={{ padding: "3px 10px", borderRadius: "6px", backgroundColor: "#eef2ff", color: "#4f46e5", fontSize: "12px", fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          )}

          {/* Divider */}
          <div style={{ height: "1px", backgroundColor: "#f3f4f6", marginBottom: "20px" }} />

          {/* Task Updates feed */}
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 14px" }}>
              Task Updates {updates.length > 0 && `(${updates.length})`}
            </p>

            {updates.length === 0 && (
              <p style={{ fontSize: "13px", color: "#d1d5db", textAlign: "center", padding: "20px 0" }}>No updates yet</p>
            )}

            {updates.map(u => (
              <UpdateEntry key={u.id} update={u} onAddComment={addCommentToUpdate} />
            ))}
          </div>

          {/* Update form (shown when "Task Update" is clicked) */}
          {showUpdateForm && (
            <div style={{ backgroundColor: "#f9fafb", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "16px", marginTop: "12px" }}>
              <textarea
                value={remark} onChange={e => setRemark(e.target.value)}
                placeholder="Describe this update..."
                rows={3}
                style={{ width: "100%", borderRadius: "8px", border: "1px solid #e5e7eb", padding: "10px 12px", fontSize: "13px", color: "#374151", outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit", lineHeight: "1.5", backgroundColor: "#ffffff" }}
                onFocus={e => { e.currentTarget.style.borderColor = "#4f46e5"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.08)"; }}
                onBlur={e  => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
                autoFocus
              />

              {/* Voice recorder */}
              {showVoice && (
                <div style={{ marginTop: "8px" }}>
                  <InlineVoiceRecorder onSave={() => { setHasVoice(true); setShowVoice(false); }} onCancel={() => setShowVoice(false)} />
                </div>
              )}

              {/* Attached files preview */}
              {(updateFiles.length > 0 || updateImages.length > 0) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                  {updateFiles.map((f, i) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "6px", backgroundColor: "#f3f4f6", fontSize: "11px", color: "#6b7280" }}>
                      <Paperclip style={{ height: "10px", width: "10px" }} />{f.name}
                      <button onClick={() => setUpdateFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, display: "flex" }}>
                        <X style={{ height: "10px", width: "10px" }} />
                      </button>
                    </span>
                  ))}
                  {updateImages.map((f, i) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "6px", backgroundColor: "#f0fdf4", fontSize: "11px", color: "#22c55e" }}>
                      <ImageIcon style={{ height: "10px", width: "10px" }} />{f.name}
                      <button onClick={() => setUpdateImages(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, display: "flex" }}>
                        <X style={{ height: "10px", width: "10px" }} />
                      </button>
                    </span>
                  ))}
                  {hasVoice && (
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "6px", backgroundColor: "#fef2f2", fontSize: "11px", color: "#ef4444" }}>
                      <Mic style={{ height: "10px", width: "10px" }} /> Voice note
                      <button onClick={() => setHasVoice(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, display: "flex" }}>
                        <X style={{ height: "10px", width: "10px" }} />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Update form actions */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  {/* File */}
                  <button onClick={() => fileRef.current?.click()} title="Attach file"
                    style={{ height: "30px", width: "30px", borderRadius: "7px", border: "1px solid #e5e7eb", backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9ca3af" }}>
                    <Paperclip style={{ height: "13px", width: "13px" }} />
                  </button>
                  <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={e => { if (e.target.files) setUpdateFiles(prev => [...prev, ...Array.from(e.target.files!)]); }} />

                  {/* Voice */}
                  <button onClick={() => setShowVoice(v => !v)} title="Voice note"
                    style={{ height: "30px", width: "30px", borderRadius: "7px", border: `1px solid ${showVoice ? "#ef4444" : "#e5e7eb"}`, backgroundColor: showVoice ? "#fef2f2" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: showVoice ? "#ef4444" : "#9ca3af" }}>
                    <Mic style={{ height: "13px", width: "13px" }} />
                  </button>

                  {/* Image */}
                  <button onClick={() => imageRef.current?.click()} title="Attach image"
                    style={{ height: "30px", width: "30px", borderRadius: "7px", border: "1px solid #e5e7eb", backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9ca3af" }}>
                    <ImageIcon style={{ height: "13px", width: "13px" }} />
                  </button>
                  <input ref={imageRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files) setUpdateImages(prev => [...prev, ...Array.from(e.target.files!)]); }} />
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => { setShowUpdateForm(false); setRemark(""); setUpdateFiles([]); setUpdateImages([]); setHasVoice(false); }}
                    style={{ height: "30px", padding: "0 12px", borderRadius: "7px", border: "1px solid #e5e7eb", backgroundColor: "#fff", fontSize: "12px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button onClick={submitUpdate}
                    style={{ height: "30px", padding: "0 14px", borderRadius: "7px", border: "none", backgroundColor: "#4f46e5", fontSize: "12px", fontWeight: 600, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Send style={{ height: "11px", width: "11px" }} /> Post Update
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #f3f4f6", flexShrink: 0, backgroundColor: "#fafafa" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

            {/* Reopen */}
            <button onClick={onReopen}
              style={{ display: "flex", alignItems: "center", gap: "5px", height: "34px", padding: "0 12px", borderRadius: "8px", border: "1px solid #e5e7eb", backgroundColor: "#fff", fontSize: "12px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
              <RefreshCw style={{ height: "12px", width: "12px", color: "#4f46e5" }} /> Reopen
            </button>

            {/* Comment */}
            <button onClick={() => setShowCommentPopup(true)}
              style={{ display: "flex", alignItems: "center", gap: "5px", height: "34px", padding: "0 12px", borderRadius: "8px", border: "1px solid #e5e7eb", backgroundColor: "#fff", fontSize: "12px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
              <MessageSquare style={{ height: "12px", width: "12px", color: "#6b7280" }} /> Comment
            </button>

            {/* Delete */}
            {!isEmployee && (
              <button onClick={() => setShowDeleteConfirm(true)}
                style={{ display: "flex", alignItems: "center", gap: "5px", height: "34px", padding: "0 12px", borderRadius: "8px", border: "1px solid #fecaca", backgroundColor: "#fef2f2", fontSize: "12px", fontWeight: 500, color: "#ef4444", cursor: "pointer" }}>
                  <Trash2 style={{ height: "12px", width: "12px" }} /> Delete
              </button>
            )}
            
            {/*Finished Task*/}
            <button onClick={() => setShowFinishedConfirm(true)}
              style={{ display: "flex", alignItems: "center", gap: "5px", height: "34px", padding: "0 12px", borderRadius: "8px", border: "1px solid #d1fae5", backgroundColor: "#ecfdf5", fontSize: "12px", fontWeight: 500, color: "#22c55e", cursor: "pointer" }}>
                <Check style={{ height: "12px", width: "12px" }} /> Mark Completed
            </button>

            {/* Task Update — rightmost */}
            <div style={{ marginLeft: "auto", position: "relative" }}>
              <button onClick={() => setShowUpdateForm(v => !v)}
                style={{ display: "flex", alignItems: "center", gap: "5px", height: "34px", padding: "0 14px", borderRadius: "8px", border: "none", backgroundColor: showUpdateForm ? "#4338ca" : "#4f46e5", fontSize: "12px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                Task Update <ChevronDown style={{ height: "12px", width: "12px" }} />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Comment popup (task-level) */}
     {showCommentPopup && (
  <CommentPopup
    onSubmit={async (text) => {
      const res = await fetch(`/api/tasks/${task.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remark: text, files: [], images: [], hasVoice: false }),
      });
      const saved = await res.json();
      setUpdates(prev => [saved, ...prev]);
      setShowCommentPopup(false);
    }}
    onClose={() => setShowCommentPopup(false)}
  />
)}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <>
          <div onClick={() => setShowDeleteConfirm(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 200 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 210, backgroundColor: "#fff", borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", width: "360px", padding: "28px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🗑️</div>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>Delete this task?</p>
            <p style={{ fontSize: "13px", color: "#9ca3af", margin: "0 0 20px" }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ height: "36px", padding: "0 20px", borderRadius: "8px", border: "1px solid #e5e7eb", backgroundColor: "#fff", fontSize: "13px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleDelete} style={{ height: "36px", padding: "0 20px", borderRadius: "8px", border: "none", backgroundColor: "#ef4444", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>Delete Task</button>
            </div>
          </div>
        </>
      )}
      {/* finished task confirm */}
        {showFinishedConfirm && (
          <>
            <div onClick={() => setShowFinishedConfirm(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 200 }} />
            <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 210, backgroundColor: "#fff", borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", width: "360px", padding: "28px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>✅</div>
              <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>Mark this task as finished?</p>
              <p style={{ fontSize: "13px", color: "#9ca3af", margin: "0 0 20px" }}>This action cannot be undone.</p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button onClick={() => setShowFinishedConfirm(false)} style={{ height: "36px", padding: "0 20px", borderRadius: "8px", border: "1px solid #e5e7eb", backgroundColor: "#fff", fontSize: "13px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>Cancel</button>
                <button onClick={handleFinish} disabled= {Finishing} style={{ height: "36px", padding: "0 20px", borderRadius: "8px", border: "none", backgroundColor: "#22c55e", fontSize: "13px", fontWeight: 600, color : "#fff", cursor: "pointer" }}>{Finishing ? "Saving..." : "Mark as Finished"}</button>
              </div>
            </div>
          </>
        )}
    </>
  );
}

