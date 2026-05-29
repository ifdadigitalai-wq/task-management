"use client";

import { useState, useRef, useEffect } from "react";
import {
  X, ChevronDown, ChevronLeft, ChevronRight,
  User, CalendarDays, Flag, Building2, Users,
  Repeat2, Paperclip, Bell, Mic,
  StopCircle, Trash2, Play, Pause, Check,
  MessageCircle,
} from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";

// ── Static data ────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  "Admin Department","Centre Head/ Management","Sales/counseling",
  "Academic","Faculty","Backend","Account & Finance","HR & Placement","IT Support",
];

const PRIORITY_OPTIONS = [
  { label: "High",   color: "#ef4444", bg: "#fef2f2" },
  { label: "Medium", color: "#f59e0b", bg: "#fffbeb" },
  { label: "Low",    color: "#22c55e", bg: "#f0fdf4" },
];

const REPEAT_OPTIONS = ["Daily", "Weekly", "Monthly"];

const WEEK_DAYS = [
  { key: "M",  label: "Mon" },
  { key: "T",  label: "Tue" },
  { key: "W",  label: "Wed" },
  { key: "T2", label: "Thu" },
  { key: "F",  label: "Fri" },
  { key: "S",  label: "Sat" },
  { key: "S2", label: "Sun" },
];

const CAL_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ── Mini Calendar ──────────────────────────────────────────────────────────────

function MiniCalendar({ value, onChange, onClose }: { value: Date | null; onChange: (d: Date) => void; onClose: () => void }) {
  const today = new Date();
  const [cursor, setCursor] = useState(value ?? today);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const isSelected = (d: number) => value?.getFullYear() === year && value?.getMonth() === month && value?.getDate() === d;
  const isToday = (d: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  return (
    <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200, backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: "14px", width: "240px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: "2px", display: "flex" }}>
          <ChevronLeft style={{ height: "15px", width: "15px" }} />
        </button>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{MONTHS[month]} {year}</span>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: "2px", display: "flex" }}>
          <ChevronRight style={{ height: "15px", width: "15px" }} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "4px" }}>
        {CAL_DAYS.map((d) => <div key={d} style={{ textAlign: "center", fontSize: "11px", fontWeight: 600, color: "#9ca3af", padding: "2px 0" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {cells.map((d, i) => (
          <button key={i} disabled={!d} onClick={() => { if (d) { onChange(new Date(year, month, d)); onClose(); } }}
            style={{ height: "30px", width: "100%", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: isSelected(d!) ? 600 : 400, cursor: d ? "pointer" : "default", backgroundColor: isSelected(d!) ? "#4f46e5" : isToday(d!) ? "#eef2ff" : "transparent", color: isSelected(d!) ? "#ffffff" : isToday(d!) ? "#4f46e5" : d ? "#374151" : "transparent" }}>
            {d ?? ""}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Generic Dropdown ───────────────────────────────────────────────────────────

function DropdownMenu({ options, onSelect, onClose }: { options: string[]; onSelect: (v: string) => void; onClose: () => void }) {
  return (
    <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200, backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: "6px", minWidth: "150px", maxHeight: "200px", overflowY: "auto" }}>
      {options.map((opt) => (
        <button key={opt} onClick={() => { onSelect(opt); onClose(); }}
          style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: "6px", border: "none", backgroundColor: "transparent", fontSize: "13px", color: "#374151", cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
          {opt}
        </button>
      ))}
    </div>
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
  };

  const pauseRecording  = () => { mediaRef.current?.pause();  stopTimer();  setState("paused"); };
  const resumeRecording = () => { mediaRef.current?.resume(); startTimer(); setState("recording"); };
  const stopRecording   = () => { mediaRef.current?.stop(); mediaRef.current?.stream.getTracks().forEach((t) => t.stop()); stopTimer(); };
  const discard         = () => { setAudioUrl(null); blobRef.current = null; setSeconds(0); setState("idle"); };

  useEffect(() => () => stopTimer(), []);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 90 }} />
      <div onClick={(e) => e.stopPropagation()} style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 100, backgroundColor: "#ffffff", borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", width: "360px", padding: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <span style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>Voice Recording</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", padding: "4px" }}>
            <X style={{ height: "16px", width: "16px" }} />
          </button>
        </div>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "48px", fontWeight: 700, color: state === "recording" ? "#ef4444" : "#111827", fontVariantNumeric: "tabular-nums", letterSpacing: "-2px", lineHeight: 1 }}>{display}</div>
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#9ca3af", fontWeight: 500 }}>
            {state === "idle" && "Ready to record"}
            {state === "recording" && "● Recording..."}
            {state === "paused" && "Paused"}
            {state === "done" && "Recording saved"}
          </div>
        </div>
        {(state === "recording" || state === "paused") && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", marginBottom: "24px", height: "40px" }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} style={{ width: "3px", borderRadius: "2px", backgroundColor: state === "recording" ? "#ef4444" : "#d1d5db", height: `${8 + Math.sin(i * 0.8) * 14 + Math.cos(i * 1.2) * 8}px`, opacity: state === "recording" ? 0.7 + (i % 3) * 0.1 : 0.4 }} />
            ))}
          </div>
        )}
        {state === "done" && audioUrl && (
          <div style={{ marginBottom: "20px" }}>
            <audio controls src={audioUrl} style={{ width: "100%", borderRadius: "8px" }} />
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
          {state === "idle" && (
            <button onClick={startRecording} style={{ display: "flex", alignItems: "center", gap: "8px", height: "40px", padding: "0 24px", borderRadius: "8px", border: "none", backgroundColor: "#ef4444", color: "#ffffff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              <Mic style={{ height: "15px", width: "15px" }} /> Start Recording
            </button>
          )}
          {state === "recording" && (
            <>
              <button onClick={pauseRecording} style={{ display: "flex", alignItems: "center", gap: "6px", height: "38px", padding: "0 16px", borderRadius: "8px", border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", color: "#374151", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                <Pause style={{ height: "14px", width: "14px" }} /> Pause
              </button>
              <button onClick={stopRecording} style={{ display: "flex", alignItems: "center", gap: "6px", height: "38px", padding: "0 16px", borderRadius: "8px", border: "none", backgroundColor: "#ef4444", color: "#ffffff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                <StopCircle style={{ height: "14px", width: "14px" }} /> Stop
              </button>
            </>
          )}
          {state === "paused" && (
            <>
              <button onClick={resumeRecording} style={{ display: "flex", alignItems: "center", gap: "6px", height: "38px", padding: "0 16px", borderRadius: "8px", border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", color: "#374151", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                <Play style={{ height: "14px", width: "14px" }} /> Resume
              </button>
              <button onClick={stopRecording} style={{ display: "flex", alignItems: "center", gap: "6px", height: "38px", padding: "0 16px", borderRadius: "8px", border: "none", backgroundColor: "#ef4444", color: "#ffffff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                <StopCircle style={{ height: "14px", width: "14px" }} /> Stop
              </button>
            </>
          )}
          {state === "done" && (
            <>
              <button onClick={discard} style={{ display: "flex", alignItems: "center", gap: "6px", height: "38px", padding: "0 16px", borderRadius: "8px", border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#ef4444", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                <Trash2 style={{ height: "14px", width: "14px" }} /> Discard
              </button>
              <button onClick={() => { if (blobRef.current) { onSave(blobRef.current, `recording-${Date.now()}.webm`); onClose(); } }}
                style={{ display: "flex", alignItems: "center", gap: "6px", height: "38px", padding: "0 16px", borderRadius: "8px", border: "none", backgroundColor: "#4f46e5", color: "#ffffff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                <Check style={{ height: "14px", width: "14px" }} /> Save & Attach
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────────

type OpenDropdown = "user" | "duedate" | "priority" | "department" | "inloop" | "repeat" | "mode" | null;

export function AssignTaskModal({ onClose }: { onClose: () => void }) {
  const { addTask } = useTaskStore();

  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [user, setUser]                 = useState<string | null>(null);
  const [dueDate, setDueDate]           = useState<Date | null>(null);
  const [priority, setPriority]         = useState<string | null>(null);
  const [department, setDepartment]     = useState<string | null>(null);
  const [inLoop, setInLoop]             = useState<string | null>(null);
  const [open, setOpen]                 = useState<OpenDropdown>(null);
  const [repeat, setRepeat]             = useState<string | null>(null);
  const [mode, setMode]                 = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [alarmSet, setAlarmSet]         = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceRecordings, setVoiceRecordings] = useState<{ name: string; blob: Blob }[]>([]);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [assignedToId, setAssignedToId] = useState<string | null>(null);
  useEffect(() => {
  fetch("/api/users").then(r => r.json()).then(setEmployees);
}, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggle = (key: OpenDropdown) => setOpen((prev) => (prev === key ? null : key));
  const priorityMeta = PRIORITY_OPTIONS.find((p) => p.label === priority);
  const formatDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
  const toggleDay = (key: string) => setSelectedDays((prev) => prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]);
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)]); };
  const handleVoiceSave = (blob: Blob, name: string) => setVoiceRecordings((prev) => [...prev, { blob, name }]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim()) { setError("Please add a task title."); return; }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          priority: priority ?? "Medium",          // route maps → "MEDIUM" etc.
          dueDate: dueDate?.toISOString() ?? undefined,
          department,
          inLoop,
          repeat,
          mode,
          repeatDays: selectedDays,
          alarmSet,
          attachments: attachedFiles.map((f) => f.name),
          voiceNotes: voiceRecordings.length,
          assignedToId: assignedToId ?? undefined,
          tag: [department, repeat].filter(Boolean).join(" · ") || undefined,
        }),
      });
      if (!res.ok) throw new Error("Server error");
      const saved = await res.json();
      addTask(saved);   // instantly shows on dashboard
      onClose();
    } catch (err) {
      setError("Failed to save task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Shared styles ────────────────────────────────────────────────────────────
  const pill = (active: boolean, activeColor = "#4f46e5", activeBg = "#eef2ff") => ({
    display: "flex" as const, alignItems: "center" as const, gap: "5px",
    height: "32px", padding: "0 12px", borderRadius: "8px",
    border: `1px solid ${active ? activeColor : "#e5e7eb"}`,
    backgroundColor: active ? activeBg : "#f9fafb",
    fontSize: "12px", fontWeight: 500,
    color: active ? activeColor : "#6b7280",
    cursor: "pointer" as const, whiteSpace: "nowrap" as const, flexShrink: 0,
  });

  const iconPill = (active: boolean, activeColor = "#4f46e5", activeBg = "#eef2ff") => ({
    display: "flex" as const, alignItems: "center" as const, justifyContent: "center" as const,
    height: "32px", width: "32px", borderRadius: "8px",
    border: `1px solid ${active ? activeColor : "#e5e7eb"}`,
    backgroundColor: active ? activeBg : "#f9fafb",
    color: active ? activeColor : "#6b7280",
    cursor: "pointer" as const, flexShrink: 0,
  });

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.25)", zIndex: 60 }} />

      <div onClick={(e) => e.stopPropagation()}
        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 70, backgroundColor: "#ffffff", borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", width: "540px", maxWidth: "calc(100vw - 32px)", padding: "28px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>Assign new task</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px", borderRadius: "6px", display: "flex" }}>
            <X style={{ height: "17px", width: "17px" }} />
          </button>
        </div>

        {/* Title */}
        <div style={{ marginBottom: "14px" }}>
          <input type="text" placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", height: "40px", borderRadius: "8px", border: `1px solid ${error && !title.trim() ? "#ef4444" : "#e5e7eb"}`, padding: "0 14px", fontSize: "14px", fontWeight: 500, color: "#111827", outline: "none", boxSizing: "border-box", backgroundColor: "#fafafa" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#4f46e5"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.08)"; }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = error && !title.trim() ? "#ef4444" : "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }} />
        </div>

        {/* Description */}
        <div style={{ marginBottom: "20px" }}>
          <textarea placeholder="Add a description..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            style={{ width: "100%", borderRadius: "8px", border: "1px solid #e5e7eb", padding: "10px 14px", fontSize: "13px", color: "#374151", outline: "none", resize: "none", boxSizing: "border-box", backgroundColor: "#fafafa", lineHeight: "1.5", fontFamily: "inherit" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#4f46e5"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.08)"; }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }} />
        </div>

        <div style={{ height: "1px", backgroundColor: "#f3f4f6", marginBottom: "16px" }} />

        {/* Row 1 — existing pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
          <div style={{ position: "relative" }}>
            <button style={pill(!!user)} onClick={() => toggle("user")}>
              <User style={{ height: "13px", width: "13px" }} />{user ?? "User"}<ChevronDown style={{ height: "11px", width: "11px", opacity: 0.6 }} />
            </button>
            {open === "user" && (
            <DropdownMenu
            options={employees.map((e) => e.name)}
            onSelect={(name) => {
            const emp = employees.find((e) => e.name === name);
            setUser(name);
            setAssignedToId(emp?.id ?? null);
            setOpen(null);
                          }}
            onClose={() => setOpen(null)}
          />
        )}
          </div>
          <div style={{ position: "relative" }}>
            <button style={pill(!!dueDate)} onClick={() => toggle("duedate")}>
              <CalendarDays style={{ height: "13px", width: "13px" }} />{dueDate ? formatDate(dueDate) : "Due Date"}<ChevronDown style={{ height: "11px", width: "11px", opacity: 0.6 }} />
            </button>
            {open === "duedate" && <MiniCalendar value={dueDate} onChange={setDueDate} onClose={() => setOpen(null)} />}
          </div>
          <div style={{ position: "relative" }}>
            <button style={pill(!!priority, priorityMeta?.color, priorityMeta?.bg)} onClick={() => toggle("priority")}>
              <Flag style={{ height: "13px", width: "13px" }} />{priority ?? "Priority"}<ChevronDown style={{ height: "11px", width: "11px", opacity: 0.6 }} />
            </button>
            {open === "priority" && <DropdownMenu options={PRIORITY_OPTIONS.map((p) => p.label)} onSelect={setPriority} onClose={() => setOpen(null)} />}
          </div>
          <div style={{ position: "relative" }}>
            <button style={pill(!!department)} onClick={() => toggle("department")}>
              <Building2 style={{ height: "13px", width: "13px" }} />{department ?? "Department"}<ChevronDown style={{ height: "11px", width: "11px", opacity: 0.6 }} />
            </button>
            {open === "department" && <DropdownMenu options={DEPARTMENTS} onSelect={setDepartment} onClose={() => setOpen(null)} />}
          </div>
          <div style={{ position: "relative" }}>
            <button style={pill(!!inLoop)} onClick={() => toggle("inloop")}>
              <Users style={{ height: "13px", width: "13px" }} />{inLoop ?? "In Loop"}<ChevronDown style={{ height: "11px", width: "11px", opacity: 0.6 }} />
            </button>
            {open === "inloop" && <DropdownMenu options={["To be decided"]} onSelect={setInLoop} onClose={() => setOpen(null)} />}
          </div>
          <div style = {{position: "relative"}}>
            <button style={pill(!!mode)} onClick={() => toggle("mode")}>
              <MessageCircle style={{ height: "13px", width: "13px" }} />{mode ?? "Mode"}<ChevronDown style={{ height: "11px", width: "11px", opacity: 0.6 }} />
            </button>
            {open === "mode" && <DropdownMenu options={["Whatsapp", "Email", "Text"]} onSelect={setMode} onClose={() => setOpen(null)} />}
          </div>
        </div>

        {/* Row 2 — new action pills */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
          <div style={{ position: "relative" }}>
            <button style={pill(!!repeat)} onClick={() => toggle("repeat")}>
              <Repeat2 style={{ height: "13px", width: "13px" }} />{repeat ?? "Repeat"}<ChevronDown style={{ height: "11px", width: "11px", opacity: 0.6 }} />
            </button>
            {open === "repeat" && <DropdownMenu options={REPEAT_OPTIONS} onSelect={(v) => { setRepeat(v); setSelectedDays([]); setOpen(null); }} onClose={() => setOpen(null)} />}
          </div>
          <button style={iconPill(attachedFiles.length > 0)} onClick={() => fileInputRef.current?.click()} title="Attach file">
            <Paperclip style={{ height: "14px", width: "14px" }} />
          </button>
          <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleFiles} />
          <button style={iconPill(alarmSet, "#f59e0b", "#fffbeb")} onClick={() => setAlarmSet((v) => !v)} title="Set alarm">
            <Bell style={{ height: "14px", width: "14px" }} />
          </button>
          <button style={iconPill(voiceRecordings.length > 0, "#ef4444", "#fef2f2")} onClick={() => setShowVoiceModal(true)} title="Voice recording">
            <Mic style={{ height: "14px", width: "14px" }} />
          </button>
        </div>

        {/* Weekly day selector */}
        {repeat === "Weekly" && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px", padding: "10px 14px", backgroundColor: "#f9fafb", borderRadius: "10px", border: "1px solid #f0f0f0" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", marginRight: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>On</span>
            {WEEK_DAYS.map((d) => {
              const active = selectedDays.includes(d.key);
              return (
                <button key={d.key} onClick={() => toggleDay(d.key)} title={d.label}
                  style={{ height: "28px", width: "28px", borderRadius: "50%", border: `1px solid ${active ? "#4f46e5" : "#e5e7eb"}`, backgroundColor: active ? "#4f46e5" : "#ffffff", color: active ? "#ffffff" : "#6b7280", fontSize: "11px", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                  {d.key.replace("2", "")}
                </button>
              );
            })}
          </div>
        )}

        {/* Attached files */}
        {attachedFiles.length > 0 && (
          <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {attachedFiles.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 12px", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Paperclip style={{ height: "13px", width: "13px", color: "#9ca3af" }} />
                  <span style={{ fontSize: "12px", color: "#374151", fontWeight: 500 }}>{f.name}</span>
                  <span style={{ fontSize: "11px", color: "#9ca3af" }}>({(f.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button onClick={() => setAttachedFiles((prev) => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", padding: "2px" }}>
                  <X style={{ height: "13px", width: "13px" }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Voice recordings */}
        {voiceRecordings.length > 0 && (
          <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {voiceRecordings.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 12px", backgroundColor: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Mic style={{ height: "13px", width: "13px", color: "#ef4444" }} />
                  <span style={{ fontSize: "12px", color: "#374151", fontWeight: 500 }}>Voice note {i + 1}</span>
                </div>
                <button onClick={() => setVoiceRecordings((prev) => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", padding: "2px" }}>
                  <X style={{ height: "13px", width: "13px" }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginBottom: "12px", padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "13px", color: "#ef4444" }}>
            {error}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
          <button onClick={onClose} style={{ height: "36px", padding: "0 18px", borderRadius: "8px", border: "1px solid #e5e7eb", backgroundColor: "#ffffff", fontSize: "13px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            style={{ height: "36px", padding: "0 18px", borderRadius: "8px", border: "none", backgroundColor: submitting ? "#a5b4fc" : "#4f46e5", fontSize: "13px", fontWeight: 500, color: "#ffffff", cursor: submitting ? "not-allowed" : "pointer" }}>
            {submitting ? "Saving..." : "Assign task"}
          </button>
        </div>
      </div>

      {showVoiceModal && <VoiceRecordingModal onSave={handleVoiceSave} onClose={() => setShowVoiceModal(false)} />}
    </>
  );
}