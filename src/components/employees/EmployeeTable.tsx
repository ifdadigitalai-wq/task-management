"use client";

import React, { useState } from "react";
import { User, Task } from "@/types";
import { useTaskStore } from "@/store/useTaskStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Pencil, Trash2, Search, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface EmployeeTableProps {
  employees: User[];
  onEdit: (emp: User) => void;
  onDelete: (emp: User) => void;
  onStatusChange: (emp: User, newStatus: any) => void;
}

export default function EmployeeTable({ employees, onEdit, onDelete, onStatusChange }: EmployeeTableProps) {
  const { tasks, setSelectedTask } = useTaskStore();
  
  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "department" | "joined" | "tasks">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedEmployeeTasks, setSelectedEmployeeTasks] = useState<User | null>(null);

  // Get active tasks for an employee
  const getEmployeeTasks = (empId: string) => {
    return tasks.filter((t) => t.assigneeId === empId);
  };

  const getActiveCount = (empId: string) => {
    return tasks.filter((t) => t.assigneeId === empId && t.status !== "DONE" && t.status !== "CANCELLED").length;
  };

  // Toggle sort helper
  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Filter & Search
  const filtered = employees.filter((emp) => {
    if (showInactive) {
      // "Show deactivated members" is checked → show ONLY inactive
      if (emp.isActive) return false;
    } else {
      // Default → show only active members
      if (!emp.isActive) return false;
    }

    const q = searchTerm.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      (emp.jobTitle || "").toLowerCase().includes(q) ||
      (emp.department || "").toLowerCase().includes(q)
    );
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let aVal: any = "";
    let bVal: any = "";

    if (sortBy === "name") {
      aVal = a.name.toLowerCase();
      bVal = b.name.toLowerCase();
    } else if (sortBy === "department") {
      aVal = (a.department || "").toLowerCase();
      bVal = (b.department || "").toLowerCase();
    } else if (sortBy === "joined") {
      aVal = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
      bVal = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
    } else if (sortBy === "tasks") {
      aVal = getActiveCount(a.id);
      bVal = getActiveCount(b.id);
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const formatDate = (iso?: string | Date | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Sort Options Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface border border-border rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
          <div className="relative w-full sm:max-w-[220px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full !pl-10 h-8 text-[12px] font-medium placeholder:text-text-tertiary focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none bg-bg"
            />
          </div>
          <label className="flex items-center gap-2 text-[12px] text-text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
            />
            Show deactivated team members
          </label>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-text-secondary">
          <span className="font-medium text-text-tertiary uppercase tracking-wider mr-1">Sort By:</span>
          {(["name", "department", "joined", "tasks"] as const).map((field) => {
            const isActive = sortBy === field;
            return (
              <button
                key={field}
                onClick={() => handleSort(field)}
                className={cn(
                  "h-7 px-3 border rounded-full text-[11px] font-medium transition-all cursor-pointer focus-visible:outline-none",
                  isActive
                    ? "bg-brand-light text-brand-text border-brand"
                    : "bg-transparent border-border-strong text-text-secondary hover:bg-bg"
                )}
              >
                <span className="capitalize">{field === "joined" ? "Joined Date" : field}</span>
                {isActive && (sortOrder === "asc" ? " ↑" : " ↓")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden select-none">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-bg text-[11px] font-medium text-text-tertiary uppercase tracking-[0.06em]">
                <th className="px-4 py-2.5 w-12">#</th>
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5">Title & Department</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-center">Active Tasks</th>
                <th className="px-4 py-2.5">Joined Date</th>
                <th className="px-4 py-2.5 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((emp, idx) => {
                const activeTasksCount = getActiveCount(emp.id);

                return (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedEmployeeTasks(emp)}
                    className="hover:bg-bg/40 transition-colors duration-100 cursor-pointer group"
                  >
                    {/* # */}
                    <td className="px-4 py-3 text-[13px] text-text-tertiary font-mono">
                      {idx + 1}
                    </td>

                    {/* Employee Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="shrink-0">
                          <UserAvatar src={emp.avatarUrl} name={emp.name} size="sm" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-text-primary group-hover:text-brand-text transition-colors truncate">
                            {emp.name}
                          </p>
                          <p className="text-[11px] text-text-secondary truncate mt-0.5">
                            {emp.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Title & Department */}
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-text-primary truncate">
                          {emp.jobTitle || "Staff"}
                        </p>
                        <p className="text-[11px] text-text-secondary truncate mt-0.5">
                          {emp.department || "No Department"}
                        </p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={emp.status || (emp.isActive ? "ACTIVE" : "INACTIVE")}
                        onChange={(e) => onStatusChange(emp, e.target.value)}
                        className={cn(
                          "inline-flex items-center gap-1 py-0.5 px-2 text-[10px] font-medium uppercase tracking-[0.05em] rounded-full shrink-0 border border-border-strong cursor-pointer outline-none",
                          emp.status === "ACTIVE" || (!emp.status && emp.isActive)
                            ? "bg-status-done-bg text-status-done-text"
                            : emp.status === "INACTIVE" || emp.status === "RESIGNED" || (!emp.status && !emp.isActive)
                            ? "bg-status-cancelled-bg text-status-cancelled-text"
                            : emp.status === "SUSPENDED"
                            ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400"
                            : "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400" // ON_LEAVE
                        )}
                      >
                        <option value="ACTIVE" className="bg-surface text-text-primary">Active</option>
                        <option value="INACTIVE" className="bg-surface text-text-primary">Inactive</option>
                        <option value="SUSPENDED" className="bg-surface text-text-primary">Suspended</option>
                        <option value="RESIGNED" className="bg-surface text-text-primary">Resigned</option>
                        <option value="ON_LEAVE" className="bg-surface text-text-primary">On Leave</option>
                      </select>
                    </td>

                    {/* Active Tasks Count */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0",
                          activeTasksCount > 0
                            ? "bg-brand-light text-brand-text"
                            : "bg-bg text-text-tertiary"
                        )}
                      >
                        {activeTasksCount} active
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="px-4 py-3 text-[13px] text-text-secondary">
                      {formatDate(emp.joinedAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEdit(emp)}
                          title="Edit employee"
                          className="w-7 h-7 rounded-md flex items-center justify-center border border-border-strong text-text-tertiary hover:border-brand hover:text-brand-text hover:bg-brand-light/30 transition-all active:scale-95 focus-visible:outline-none"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(emp)}
                          title="Delete employee"
                          className="w-7 h-7 rounded-md flex items-center justify-center border border-border-strong text-text-tertiary hover:border-[#EF4444] hover:text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-red-955/20 transition-all active:scale-95 focus-visible:outline-none"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Tasks Modal (Row Click) */}
      {selectedEmployeeTasks && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setSelectedEmployeeTasks(null)}
            className="fixed inset-0 bg-black/20 backdrop-blur-[3px] z-[60] flex items-center justify-center"
          />
          
          {/* Modal container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[65] w-full max-w-[520px] bg-surface border border-border rounded-xl shadow-lg p-6 md:p-8 animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border flex-shrink-0 relative">
              <div className="flex items-center gap-3">
                <UserAvatar src={selectedEmployeeTasks.avatarUrl} name={selectedEmployeeTasks.name} size="sm" />
                <div>
                  <h3 className="text-[15px] font-medium text-text-primary">
                    Tasks for {selectedEmployeeTasks.name}
                  </h3>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    {selectedEmployeeTasks.jobTitle} &bull; {selectedEmployeeTasks.department}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployeeTasks(null)}
                className="absolute top-0 right-0 w-6 h-6 rounded-full hover:bg-bg flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors focus-visible:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tasks List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {getEmployeeTasks(selectedEmployeeTasks.id).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-3xl mb-2">🤝</span>
                  <p className="text-[13px] font-medium text-text-primary">
                    No Tasks Assigned
                  </p>
                  <p className="text-[11px] text-text-secondary mt-1 max-w-[280px]">
                    This employee doesn't have any tasks assigned to them currently.
                  </p>
                </div>
              ) : (
                getEmployeeTasks(selectedEmployeeTasks.id).map((task) => {
                  const priorityDotColor =
                    task.priority === "CRITICAL"
                      ? "bg-priority-critical-text"
                      : task.priority === "HIGH"
                      ? "bg-priority-high-text"
                      : task.priority === "MEDIUM"
                      ? "bg-priority-medium-text"
                      : "bg-priority-low-text";
                  
                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedTask(task);
                        setSelectedEmployeeTasks(null); // Close this modal to show the detail slideover
                      }}
                      className="flex items-center justify-between p-3.5 bg-bg/30 hover:bg-bg border border-border rounded-lg cursor-pointer hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", priorityDotColor)} />
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-text-primary truncate pr-4 leading-snug">
                            {task.title}
                          </p>
                          <p className="text-[10px] text-text-tertiary mt-0.5 flex items-center gap-1.5">
                            <span className="font-mono">#{task.id.slice(0, 8).toUpperCase()}</span>
                            {task.dueDate && (
                              <span>&bull; Due {new Date(task.dueDate).toLocaleDateString()}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-[0.02em] bg-surface text-text-secondary border border-border">
                          {task.status.replace("_", " ").toLowerCase()}
                        </span>
                        <Eye className="w-3.5 h-3.5 text-text-tertiary group-hover:text-text-primary" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-4 mt-4 border-t border-border flex-shrink-0">
              <Button
                onClick={() => setSelectedEmployeeTasks(null)}
                variant="secondary"
                size="sm"
                className="h-[34px] px-4"
              >
                Close Window
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
