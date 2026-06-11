"use client";

import React, { useEffect, useState } from "react";
import { useBulkAssign } from "./useBulkAssign";
import { User as UserType, Priority } from "@/types";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AutoReminderSettings } from "@/components/tasks/AutoReminderSettings";
import { FormField } from "@/components/ui/FormField";

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

  const activeTaskDetails = details[activeTaskIndex] || {
    priority: "MEDIUM",
    assigneeId: "",
    dueDate: null,
    frequency: "ONE_TIME",
    customFrequency: "",
    recurrenceRule: "NONE",
    reminderSettings: {
      beforeDueDate: true,
      onDueDate: true,
      recurring: false,
      emailNotification: false,
      inAppNotification: true,
    },
    remindWhatsApp: false,
    remindEmail: false,
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
          Editing Task Details
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
      <div className="p-5 bg-surface-raised border border-border-strong rounded-2xl space-y-4 max-h-[350px] overflow-y-auto pr-1">
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

        {/* Recurrence and Frequency Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Recurrence */}
          <FormField label="Recurrence">
            <select
              value={activeTaskDetails.recurrenceRule || "NONE"}
              onChange={(e) => setDetailField(activeTaskIndex, "recurrenceRule", e.target.value)}
              className="block w-full h-[34px] cursor-pointer focus:border-brand focus:ring-2 focus:ring-brand/10 text-xs font-semibold"
            >
              <option value="NONE">No Recurrence</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </FormField>

          {/* Frequency */}
          <FormField label="Task Frequency">
            <select
              value={activeTaskDetails.frequency || "ONE_TIME"}
              onChange={(e) => setDetailField(activeTaskIndex, "frequency", e.target.value)}
              className="block w-full h-[34px] cursor-pointer focus:border-brand focus:ring-2 focus:ring-brand/10 text-xs font-semibold"
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
        </div>

        {/* Custom Frequency Input */}
        {activeTaskDetails.frequency === "CUSTOM" && (
          <FormField label="Custom Frequency Rule" required>
            <input
              type="text"
              placeholder="e.g. Every 2 weeks on Tuesday"
              value={activeTaskDetails.customFrequency || ""}
              onChange={(e) => setDetailField(activeTaskIndex, "customFrequency", e.target.value)}
              required
              className="block w-full h-[34px] focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none text-xs font-semibold"
            />
          </FormField>
        )}

        {/* Auto Reminder Settings Component */}
        <div className="pt-1">
          <AutoReminderSettings
            reminderBeforeDue={activeTaskDetails.reminderSettings.beforeDueDate}
            setReminderBeforeDue={(val) =>
              setDetailField(activeTaskIndex, "reminderSettings", {
                ...activeTaskDetails.reminderSettings,
                beforeDueDate: val,
              })
            }
            reminderOnDue={activeTaskDetails.reminderSettings.onDueDate}
            setReminderOnDue={(val) =>
              setDetailField(activeTaskIndex, "reminderSettings", {
                ...activeTaskDetails.reminderSettings,
                onDueDate: val,
              })
            }
            reminderRecurring={activeTaskDetails.reminderSettings.recurring}
            setReminderRecurring={(val) =>
              setDetailField(activeTaskIndex, "reminderSettings", {
                ...activeTaskDetails.reminderSettings,
                recurring: val,
              })
            }
            reminderEmail={activeTaskDetails.reminderSettings.emailNotification}
            setReminderEmail={(val) =>
              setDetailField(activeTaskIndex, "reminderSettings", {
                ...activeTaskDetails.reminderSettings,
                emailNotification: val,
              })
            }
            reminderInApp={activeTaskDetails.reminderSettings.inAppNotification}
            setReminderInApp={(val) =>
              setDetailField(activeTaskIndex, "reminderSettings", {
                ...activeTaskDetails.reminderSettings,
                inAppNotification: val,
              })
            }
          />
        </div>

        {/* Remind Employee Via checkboxes */}
        <FormField label="Remind Employee Via">
          <div className="flex items-center gap-6 py-1">
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-primary font-medium select-none">
              <input
                type="checkbox"
                checked={activeTaskDetails.remindWhatsApp}
                onChange={(e) => setDetailField(activeTaskIndex, "remindWhatsApp", e.target.checked)}
                className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
              />
              WhatsApp Message
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-primary font-medium select-none">
              <input
                type="checkbox"
                checked={activeTaskDetails.remindEmail}
                onChange={(e) => setDetailField(activeTaskIndex, "remindEmail", e.target.checked)}
                className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
              />
              Email Notification
            </label>
          </div>
        </FormField>
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
