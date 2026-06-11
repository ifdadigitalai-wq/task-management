"use client";

import React, { useEffect, useState } from "react";
import { useBulkAssign, TaskDetail } from "./useBulkAssign";
import { User as UserType, Priority } from "@/types";
import { Check, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function TaskDetailsStep() {
  const {
    dept,
    titles,
    details,
    activeTaskIndex,
    setDetailField,
    setActiveTaskIndex,
  } = useBulkAssign();

  const [employees, setEmployees] = useState<UserType[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  useEffect(() => {
    fetch("/api/users", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) {
          setEmployees(payload.data || []);
        }
      })
      .catch((err) => console.error("Failed to load employees:", err))
      .finally(() => setLoadingEmployees(false));
  }, []);

  // Filter active employees belonging to the selected department
  const filteredEmployees = employees.filter(
    (emp) => emp.isActive && emp.department === dept
  );

  const activeTaskTitle = titles[activeTaskIndex] || `Task ${activeTaskIndex + 1}`;
  const activeTaskDetails = details[activeTaskIndex] || {
    priority: "MEDIUM",
    assigneeId: "",
    dueDate: null,
  };

  // Helper to check if a task has an assignee assigned (meaning it is filled)
  const isFilled = (idx: number) => {
    return details[idx] && details[idx].assigneeId !== "";
  };

  return (
    <div className="space-y-4">
      {/* Dropdown at top */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-tertiary block">
          Editing Task
        </label>
        <select
          value={activeTaskIndex}
          onChange={(e) => setActiveTaskIndex(parseInt(e.target.value))}
          className="w-full bg-surface-raised text-text-primary border border-border-strong rounded-xl text-xs font-semibold focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none p-2.5 cursor-pointer"
        >
          {titles.map((title, idx) => (
            <option key={idx} value={idx}>
              T{idx + 1} — {title || "(Untitled)"} {isFilled(idx) ? " ✓" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Editing Card */}
      <div className="p-5 bg-surface-raised border border-border-strong rounded-2xl space-y-4">
        {/* Priority buttons */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
            Priority
          </span>
          <div className="flex gap-2">
            {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as Priority[]).map((p) => {
              const isSelected = activeTaskDetails.priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDetailField(activeTaskIndex, "priority", p)}
                  className={cn(
                    "flex-1 h-8 rounded-lg border text-[10px] uppercase tracking-wider font-extrabold transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
                    isSelected
                      ? "bg-brand text-white border-brand shadow-sm"
                      : "bg-surface text-text-secondary border-border-strong hover:bg-bg"
                  )}
                  style={{ minHeight: "unset", minWidth: "unset" }}
                >
                  {p.toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Assignee select */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
            Assignee
          </span>
          {loadingEmployees ? (
            <div className="h-9 flex items-center justify-center text-xs text-text-tertiary">
              Loading employees...
            </div>
          ) : (
            <select
              value={activeTaskDetails.assigneeId || ""}
              onChange={(e) => setDetailField(activeTaskIndex, "assigneeId", e.target.value)}
              className="w-full bg-surface text-text-primary border border-border-strong rounded-xl text-xs font-semibold focus:border-brand focus:ring-2"
            >
              <option value="">Unassigned / Keep Unassigned</option>
              {filteredEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.jobTitle || "Employee"})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Due date picker */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
            Due Date & Time
          </span>
          <input
            type="datetime-local"
            value={activeTaskDetails.dueDate || ""}
            onChange={(e) => setDetailField(activeTaskIndex, "dueDate", e.target.value || null)}
            className="w-full bg-surface text-text-primary border border-border-strong rounded-xl text-xs font-semibold focus:border-brand focus:ring-2 p-2"
          />
        </div>
      </div>

      {/* Pill tabs shortcuts */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
          Task Shortcut Navigation
        </span>
        <div className="flex flex-wrap gap-2">
          {titles.map((title, idx) => {
            const isActive = activeTaskIndex === idx;
            const filled = isFilled(idx);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveTaskIndex(idx)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-extrabold transition-all cursor-pointer outline-none",
                  isActive
                    ? "bg-brand/10 border-brand text-brand"
                    : filled
                    ? "bg-surface-raised border-success-text/25 text-success-text"
                    : "bg-surface-raised border-border-strong text-text-disabled"
                )}
                style={{ minHeight: "unset", minWidth: "unset" }}
              >
                <span>T{idx + 1}</span>
                {filled && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
