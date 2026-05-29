"use client";

import { useState } from "react";
import { Task } from "@/types";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { useTaskStore } from "@/store/useTaskStore";

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const PRIORITY_DOT: Record<string, string> = {
  HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#22c55e",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", IN_PROGRESS: "In Progress",
  COMPLETED: "Completed", DELETED: "Deleted",
};

// ── Hover Tooltip ──────────────────────────────────────────────────────────────

function HoverTooltip({ task }: { task: Task }) {
  const tagParts = task.tag ? task.tag.split(" · ").filter(Boolean) : [];
  return (
    <div style={{
      position: "absolute", left: 0, top: "calc(100% + 6px)",
      zIndex: 300, width: "320px",
      backgroundColor: "#ffffff", border: "1px solid #e5e7eb",
      borderRadius: "12px", boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
      padding: "16px", pointerEvents: "none",
    }}>
      {/* Title */}
      <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>{task.title}</p>

      {/* Description */}
      {task.description && (
        <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.5", margin: "0 0 10px" }}>
          {task.description.length > 120 ? task.description.slice(0, 120) + "…" : task.description}
        </p>
      )}

      {/* Chips row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "10px" }}>
        {/* Priority */}
        <span style={{
          padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
          backgroundColor: task.priority === "HIGH" ? "#fef2f2" : task.priority === "MEDIUM" ? "#fffbeb" : "#f0fdf4",
          color: PRIORITY_DOT[task.priority],
        }}>
          {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()} Priority
        </span>
        {/* Status */}
        <span style={{ padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 500, backgroundColor: "#f3f4f6", color: "#6b7280" }}>
          {STATUS_LABEL[task.status] ?? task.status}
        </span>
        {tagParts.map((t, i) => (
          <span key={i} style={{ padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 500, backgroundColor: "#eef2ff", color: "#4f46e5" }}>{t}</span>
        ))}
      </div>

      {/* Due date + assigned */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af" }}>
        <span>📅 {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "No due date"}</span>
        {task.assignedTo && <span>👤 {task.assignedTo.name}</span>}
      </div>
    </div>
  );
}

// ── Task Card Row ──────────────────────────────────────────────────────────────

export default function TaskCard({ task }: { task: Task }) {
  const [hovered, setHovered]     = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const { deleteTask } = useTaskStore();
  const {finishTask} = useTaskStore();

  const shortId = task.id.slice(0, 8).toUpperCase();
  const dotColor = PRIORITY_DOT[task.priority] ?? "#9ca3af";

  return (
    <>
      <div
        style={{ position: "relative" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          onClick={() => setPanelOpen(true)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 18px", backgroundColor: "#ffffff",
            border: "1px solid #f0f0f0", borderRadius: "10px",
            cursor: "pointer", transition: "all 0.15s",
            boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.07)" : "0 1px 3px rgba(0,0,0,0.04)",
            borderColor: hovered ? "#e0e7ff" : "#f0f0f0",
          }}
        >
          {/* Left: dot + ID + title */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <span style={{ height: "8px", width: "8px", borderRadius: "50%", backgroundColor: dotColor, flexShrink: 0 }} />
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", flexShrink: 0, fontFamily: "monospace" }}>
              #{shortId}
            </span>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {task.title}
            </span>
          </div>

          {/* Right: time ago */}
          <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500, flexShrink: 0, marginLeft: "16px" }}>
            {timeAgo(task.createdAt)}
          </span>
        </div>

        {/* Hover tooltip */}
        {hovered && <HoverTooltip task={task} />}
      </div>

      {/* Detail panel */}
      {panelOpen && (
        <TaskDetailPanel task={task} onClose={() => setPanelOpen(false)} onDelete={() => { deleteTask(task.id); setPanelOpen(false); }} onFinish={(id) => { finishTask(id); setPanelOpen(false); }} />
      )}
    </>
  );
}