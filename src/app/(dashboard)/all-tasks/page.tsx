"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTaskStore } from "@/store/useTaskStore";
import TaskList from "@/components/tasks/TaskList";
import FilterBar from "@/components/layout/FilterBar";
import { Layers } from "lucide-react";

function AllTasksContent() {
  const { tasks, fetchTasks, currentUser, fetchCurrentUser, setSelectedTask } = useTaskStore();
  const searchParams = useSearchParams();
  const taskIdFromUrl = searchParams.get("taskId");

  useEffect(() => {
    fetchTasks();
    if (!currentUser) fetchCurrentUser();
  }, []);

  // Auto-open task detail panel when navigated via notification link
  useEffect(() => {
    if (taskIdFromUrl && tasks.length > 0) {
      const targetTask = tasks.find((t) => t.id === taskIdFromUrl);
      if (targetTask) {
        setSelectedTask(targetTask);
      }
    }
  }, [taskIdFromUrl, tasks]);

  const activeTasks = tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED");

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-3 px-4.5 bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-md font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Company Tasks Directory
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Overview of all tasks across departments, priorities, and assignees.
          </p>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold">
          {activeTasks.length} Active Tasks
        </span>
      </div>

      {/* Filters and List */}
      <FilterBar />
      <TaskList />
    </div>
  );
}

export default function AllTasksPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
        <div className="w-6 h-6 border-2 border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-2" />
        Loading tasks directory...
      </div>
    }>
      <AllTasksContent />
    </Suspense>
  );
}