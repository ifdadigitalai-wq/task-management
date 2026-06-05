"use client";

import React, { useState, useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { Folder, Search, Filter, Calendar, Tag, Clock, ArrowUpDown, Eye } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { Task, Priority, TaskStatus } from "@/types";

export default function TaskDirectoryPage() {
  const { tasks, fetchTasks, selectedTask, setSelectedTask } = useTaskStore();
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedTag, setSelectedTag] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"title" | "dueDate" | "priority" | "status" | "created">("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchTasks();
  }, []);

  // Get all unique tags across all tasks for the tag filter dropdown
  const allTags = Array.from(
    new Set(tasks.flatMap((t) => t.tags || []))
  );

  // Toggle sort helper
  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Filter Tasks (Blank as of now)
  const filteredTasks: Task[] = [];

  // Sort Tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aVal: any = "";
    let bVal: any = "";

    if (sortBy === "title") {
      aVal = a.title.toLowerCase();
      bVal = b.title.toLowerCase();
    } else if (sortBy === "dueDate") {
      aVal = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      bVal = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    } else if (sortBy === "priority") {
      const pVal = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      aVal = pVal[a.priority] || 0;
      bVal = pVal[b.priority] || 0;
    } else if (sortBy === "status") {
      aVal = a.status;
      bVal = b.status;
    } else if (sortBy === "created") {
      aVal = new Date(a.createdAt).getTime();
      bVal = new Date(b.createdAt).getTime();
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const getPriorityBadge = (p: Priority) => {
    const styles = {
      LOW: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400",
      MEDIUM: "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400",
      HIGH: "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400",
      CRITICAL: "bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-455",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${styles[p] || styles.MEDIUM}`}>
        {p}
      </span>
    );
  };

  const getStatusBadge = (s: TaskStatus) => {
    const styles = {
      TODO: "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350",
      IN_PROGRESS: "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400",
      IN_REVIEW: "bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400",
      DONE: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400",
      CANCELLED: "bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-455",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${styles[s] || styles.TODO}`}>
        {s.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Folder className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Company Task Directory
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Searchable directory of all operational tasks, priorities, tags, and team assignments.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold">
          {sortedTasks.length} Tasks Listed
        </span>
      </div>

      {/* Directory filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-xs backdrop-blur-md">
        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-250 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="appearance-none px-3.5 py-1.5 pr-8 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Priority */}
        <div className="relative">
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="appearance-none px-3.5 py-1.5 pr-8 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        {/* Tag category */}
        {allTags.length > 0 && (
          <div className="relative">
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="appearance-none px-3.5 py-1.5 pr-8 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Tag Categories</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Directory Table Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/65 dark:border-slate-800/65 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-850 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/10">
                <th className="px-6 py-4 cursor-pointer hover:text-slate-650" onClick={() => handleSort("created")}>
                  Created {sortBy === "created" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-slate-650" onClick={() => handleSort("title")}>
                  Task Title {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-slate-650" onClick={() => handleSort("priority")}>
                  Priority {sortBy === "priority" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-slate-650" onClick={() => handleSort("status")}>
                  Status {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-6 py-4">Assignee</th>
                <th className="px-6 py-4">Tags & Categories</th>
                <th className="px-6 py-4 cursor-pointer hover:text-slate-650" onClick={() => handleSort("dueDate")}>
                  Due Date {sortBy === "dueDate" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {sortedTasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors cursor-pointer group"
                >
                  {/* Created Date */}
                  <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                    {new Date(task.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </td>

                  {/* Title */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 max-w-[220px]">
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5 max-w-[220px]">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="px-6 py-4">
                    {getPriorityBadge(task.priority)}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {getStatusBadge(task.status)}
                  </td>

                  {/* Assignee */}
                  <td className="px-6 py-4">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <UserAvatar src={task.assignee.avatarUrl} name={task.assignee.name} size="sm" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 truncate max-w-[100px]">
                          {task.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">Unassigned</span>
                    )}
                  </td>

                  {/* Tags */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {task.tags && task.tags.length > 0 ? (
                        task.tags.slice(0, 2).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-indigo-50/70 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold">
                            {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-300 dark:text-slate-600">—</span>
                      )}
                      {task.tags && task.tags.length > 2 && (
                        <span className="text-[9px] text-slate-400 font-bold">
                          +{task.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Due Date */}
                  <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {task.dueDate ? (
                      <span className={new Date(task.dueDate) < new Date() && task.status !== "DONE" ? "text-rose-500 font-bold" : ""}>
                        {new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric", year: "2-digit" })}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>

                  {/* Action link */}
                  <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Detail Panel */}
      {selectedTask && (
        <TaskDetailPanel onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
