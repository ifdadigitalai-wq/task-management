"use client";

import React, { useEffect, useState } from "react";
import { List, Kanban, X } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { User, Department } from "@/types";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function FilterBar() {
  const { filters, setFilters, viewMode, setViewMode, currentUser } = useTaskStore();
  const pathname = usePathname();
  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<string>("createdAt-desc");

  useEffect(() => {
    // Fetch employees list
    fetch("/api/users")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success && Array.isArray(payload.data)) {
          setEmployees(payload.data);
          // Extract unique teams
          const uniqueTeams = Array.from(
            new Set(payload.data.map((u: User) => u.team).filter(Boolean))
          ) as string[];
          setTeams(uniqueTeams);
        }
      })
      .catch(console.error);

    // Fetch departments list
    fetch("/api/departments")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) {
          setDepartments(payload.data || []);
        }
      })
      .catch(console.error);
  }, []);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ status: e.target.value as any });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ priority: e.target.value as any });
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ assigneeId: e.target.value });
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ department: e.target.value });
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ team: e.target.value });
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ dateRange: e.target.value });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSortOption(val);
    setFilters({ sortBy: val } as any);
  };

  const isAdmin = currentUser?.role === "ADMIN";

  // Active filter chips list
  const activeChips: { label: string; key: string; defaultValue: any }[] = [];
  if (filters.status && filters.status !== "ALL") {
    activeChips.push({ label: `Status: ${filters.status.replace("_", " ")}`, key: "status", defaultValue: "ALL" });
  }
  if (filters.priority && filters.priority !== "ALL") {
    activeChips.push({ label: `Priority: ${filters.priority}`, key: "priority", defaultValue: "ALL" });
  }
  if (filters.assigneeId && filters.assigneeId !== "ALL" && isAdmin) {
    const assignee = employees.find((emp) => emp.id === filters.assigneeId);
    activeChips.push({
      label: `Assignee: ${assignee ? assignee.name : "Selected"}`,
      key: "assigneeId",
      defaultValue: "ALL",
    });
  }
  if (filters.department && filters.department !== "ALL") {
    activeChips.push({ label: `Department: ${filters.department}`, key: "department", defaultValue: "ALL" });
  }
  if (filters.team && filters.team !== "ALL") {
    activeChips.push({ label: `Team: ${filters.team}`, key: "team", defaultValue: "ALL" });
  }
  if (filters.dateRange && filters.dateRange !== "all") {
    activeChips.push({ label: `Due: ${filters.dateRange.replace("-", " ")}`, key: "dateRange", defaultValue: "all" });
  }

  const clearChip = (key: string, defaultValue: any) => {
    setFilters({ [key]: defaultValue });
  };

  return (
    <div className="flex flex-col gap-2.5 mb-5 select-none">
      {/* 44px height Transparent Strip for Pills */}
      <div className="h-11 border-b border-border flex items-center justify-between gap-4 px-1">
        {/* Dropdown Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {/* Status */}
          <select
            value={filters.status}
            onChange={handleStatusChange}
            className={cn(
              "h-7 text-[12px] bg-transparent border border-border-strong rounded-full pl-3 pr-8 !py-0 outline-none cursor-pointer font-medium transition-all",
              filters.status !== "ALL" ? "bg-brand-light border-brand text-brand-text" : "text-text-secondary hover:bg-bg"
            )}
          >
            <option value="ALL" className="text-text-primary bg-surface">All Statuses</option>
            <option value="TODO" className="text-text-primary bg-surface">To Do</option>
            <option value="IN_PROGRESS" className="text-text-primary bg-surface">In Progress</option>
            <option value="IN_REVIEW" className="text-text-primary bg-surface">In Review</option>
            <option value="DONE" className="text-text-primary bg-surface">Completed</option>
            <option value="CANCELLED" className="text-text-primary bg-surface">Cancelled</option>
          </select>

          {/* Priority */}
          <select
            value={filters.priority}
            onChange={handlePriorityChange}
            className={cn(
              "h-7 text-[12px] bg-transparent border border-border-strong rounded-full pl-3 pr-8 !py-0 outline-none cursor-pointer font-medium transition-all",
              filters.priority !== "ALL" ? "bg-brand-light border-brand text-brand-text" : "text-text-secondary hover:bg-bg"
            )}
          >
            <option value="ALL" className="text-text-primary bg-surface">All Priorities</option>
            <option value="LOW" className="text-text-primary bg-surface">Low</option>
            <option value="MEDIUM" className="text-text-primary bg-surface">Medium</option>
            <option value="HIGH" className="text-text-primary bg-surface">High</option>
            <option value="CRITICAL" className="text-text-primary bg-surface">Critical</option>
          </select>

          {/* Assignee (Admin Only) */}
          {isAdmin && pathname !== "/my-tasks" && (
            <select
              value={filters.assigneeId}
              onChange={handleAssigneeChange}
              className={cn(
                "h-7 text-[12px] bg-transparent border border-border-strong rounded-full pl-3 pr-8 !py-0 outline-none cursor-pointer font-medium transition-all",
                filters.assigneeId !== "ALL" ? "bg-brand-light border-brand text-brand-text" : "text-text-secondary hover:bg-bg"
              )}
            >
              <option value="ALL" className="text-text-primary bg-surface">All Assignees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id} className="text-text-primary bg-surface">
                  {e.name}
                </option>
              ))}
            </select>
          )}

          {/* Department Filter */}
          <select
            value={filters.department || "ALL"}
            onChange={handleDepartmentChange}
            className={cn(
              "h-7 text-[12px] bg-transparent border border-border-strong rounded-full pl-3 pr-8 !py-0 outline-none cursor-pointer font-medium transition-all",
              filters.department !== "ALL" ? "bg-brand-light border-brand text-brand-text" : "text-text-secondary hover:bg-bg"
            )}
          >
            <option value="ALL" className="text-text-primary bg-surface">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name} className="text-text-primary bg-surface">
                {d.name}
              </option>
            ))}
          </select>

          {/* Team Filter */}
          <select
            value={filters.team || "ALL"}
            onChange={handleTeamChange}
            className={cn(
              "h-7 text-[12px] bg-transparent border border-border-strong rounded-full pl-3 pr-8 !py-0 outline-none cursor-pointer font-medium transition-all",
              filters.team !== "ALL" ? "bg-brand-light border-brand text-brand-text" : "text-text-secondary hover:bg-bg"
            )}
          >
            <option value="ALL" className="text-text-primary bg-surface">All Teams</option>
            {teams.map((t) => (
              <option key={t} value={t} className="text-text-primary bg-surface">
                {t}
              </option>
            ))}
          </select>

          {/* Date Range */}
          <select
            value={filters.dateRange}
            onChange={handleDateRangeChange}
            className={cn(
              "h-7 text-[12px] bg-transparent border border-border-strong rounded-full pl-3 pr-8 !py-0 outline-none cursor-pointer font-medium transition-all",
              filters.dateRange !== "all" ? "bg-brand-light border-brand text-brand-text" : "text-text-secondary hover:bg-bg"
            )}
          >
            <option value="all" className="text-text-primary bg-surface">All Dates</option>
            <option value="today" className="text-text-primary bg-surface">Due Today</option>
            <option value="yesterday" className="text-text-primary bg-surface">Due Yesterday</option>
            <option value="tomorrow" className="text-text-primary bg-surface">Due Tomorrow</option>
            <option value="this-week" className="text-text-primary bg-surface">Due This Week</option>
          </select>

          {/* Sorting */}
          <select
            value={sortOption}
            onChange={handleSortChange}
            className={cn(
              "h-7 text-[12px] bg-transparent border border-border-strong rounded-full pl-3 pr-8 !py-0 outline-none cursor-pointer font-medium text-text-secondary hover:bg-bg transition-all"
            )}
          >
            <option value="createdAt-desc" className="text-text-primary bg-surface">Newest Created</option>
            <option value="createdAt-asc" className="text-text-primary bg-surface">Oldest Created</option>
            <option value="dueDate-asc" className="text-text-primary bg-surface">Due Date (Soonest)</option>
            <option value="dueDate-desc" className="text-text-primary bg-surface">Due Date (Furthest)</option>
            <option value="priority-desc" className="text-text-primary bg-surface">Priority (High to Low)</option>
            <option value="priority-asc" className="text-text-primary bg-surface">Priority (Low to High)</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-transparent border border-border-strong p-0.5 rounded-md shrink-0">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded transition-all focus-visible:outline-none",
              viewMode === "list" ? "bg-brand-light text-brand-text shadow-sm" : "text-text-secondary hover:bg-bg hover:text-text-primary"
            )}
            title="List View"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setViewMode("kanban")}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded transition-all focus-visible:outline-none",
              viewMode === "kanban" ? "bg-brand-light text-brand-text shadow-sm" : "text-text-secondary hover:bg-bg hover:text-text-primary"
            )}
            title="Kanban Board"
          >
            <Kanban className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Chips row */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 py-1 px-1">
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-medium mr-1">
            Active Filters:
          </span>
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 py-0.5 pl-2 pr-1 text-[11px] font-medium bg-brand-light text-brand-text border border-brand/20 rounded-full shrink-0"
            >
              <span>{chip.label}</span>
              <button
                onClick={() => clearChip(chip.key, chip.defaultValue)}
                className="w-3.5 h-3.5 rounded-full hover:bg-brand/20 flex items-center justify-center transition-colors shrink-0 focus-visible:outline-none"
              >
                <X className="w-3 w-3 text-brand" />
              </button>
            </span>
          ))}
          <button
            onClick={() => {
              setFilters({
                status: "ALL",
                priority: "ALL",
                assigneeId: "ALL",
                department: "ALL",
                team: "ALL",
                dateRange: "all",
              });
            }}
            className="text-[10px] text-text-secondary hover:text-brand-text font-medium underline ml-1 focus-visible:outline-none"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
export default FilterBar;
