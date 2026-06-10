"use client";

import React from "react";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { Task, User, Department, Priority, TaskFrequency } from "@/types";

interface TaskDetailsTabProps {
  task: Task;
  editMode: boolean;
  editDescription: string;
  setEditDescription: (val: string) => void;
  editAssigneeId: string;
  setEditAssigneeId: (val: string) => void;
  editPriority: Priority;
  setEditPriority: (val: Priority) => void;
  editDepartment: string;
  setEditDepartment: (val: string) => void;
  editFrequency: TaskFrequency;
  setEditFrequency: (val: TaskFrequency) => void;
  editCustomFrequency: string;
  setEditCustomFrequency: (val: string) => void;
  editDueDate: Date | null;
  setEditDueDate: (val: Date | null) => void;
  editEstimatedHours: number;
  setEditEstimatedHours: (val: number) => void;
  editEstimatedMins: number;
  setEditEstimatedMins: (val: number) => void;
  employees: User[];
  departments: Department[];
}

export function TaskDetailsTab({
  task,
  editMode,
  editDescription,
  setEditDescription,
  editAssigneeId,
  setEditAssigneeId,
  editPriority,
  setEditPriority,
  editDepartment,
  setEditDepartment,
  editFrequency,
  setEditFrequency,
  editCustomFrequency,
  setEditCustomFrequency,
  editDueDate,
  setEditDueDate,
  editEstimatedHours,
  setEditEstimatedHours,
  editEstimatedMins,
  setEditEstimatedMins,
  employees,
  departments,
}: TaskDetailsTabProps) {
  return (
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
  );
}
