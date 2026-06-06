"use client";

import { useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTaskStore } from "@/store/useTaskStore";
import TaskList from "@/components/tasks/TaskList";
import FilterBar from "@/components/layout/FilterBar";
import { ListTodo } from "lucide-react";

function MyTasksContent() {
  const { tasks, fetchTasks, currentUser, fetchCurrentUser, setSelectedTask } = useTaskStore();
  const searchParams = useSearchParams();
  const taskIdFromUrl = searchParams.get("taskId");
  const autoOpenedRef = useRef<string | null>(null);

  useEffect(() => {
    fetchTasks();
    if (!currentUser) fetchCurrentUser();
  }, []);

  // Auto-open task detail panel when navigated via notification link
  useEffect(() => {
    if (taskIdFromUrl && tasks.length > 0 && autoOpenedRef.current !== taskIdFromUrl) {
      const targetTask = tasks.find((t) => t.id === taskIdFromUrl);
      if (targetTask) {
        setSelectedTask(targetTask);
        autoOpenedRef.current = taskIdFromUrl;
      }
    }
  }, [taskIdFromUrl, tasks, setSelectedTask]);

  const myTasks = tasks.filter((t) => t.assigneeId === currentUser?.id);
  const activeMyTasks = myTasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED");

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-3 px-4.5 bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <ListTodo className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-md font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              My Assigned Tasks
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Manage your personal active task workload, checklists, and time tracking.
          </p>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold">
          {activeMyTasks.length === 0
            ? "All Caught Up"
            : `${activeMyTasks.length} Active Tasks`}
        </span>
      </div>

      {/* Filters and List */}
      <FilterBar />
      <TaskList tasks={myTasks} />
    </div>
  );
}

export default function MyTasksPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
        <div className="w-6 h-6 border-2 border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-2" />
        Loading your tasks...
      </div>
    }>
      <MyTasksContent />
    </Suspense>
  );
}