"use client";

import { useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import TaskList from "@/components/tasks/TaskList";
import FilterBar from "@/components/layout/FilterBar";
import { Send } from "lucide-react";

export default function DelegatedByPage() {
  const { tasks, fetchTasks, currentUser, fetchCurrentUser } = useTaskStore();

  useEffect(() => {
    fetchTasks();
    if (!currentUser) fetchCurrentUser();
  }, []);

  if (!currentUser) return null;

  // Admin sees all delegated tasks, others see tasks they delegated
  const delegatedTasks = tasks.filter((t) => 
    currentUser.role === "ADMIN"
      ? (t.creatorId && t.assigneeId && t.creatorId !== t.assigneeId)
      : (t.creatorId === currentUser.id && t.assigneeId !== currentUser.id)
  );

  const activeDelegated = delegatedTasks.filter(
    (t) => t.status !== "DONE" && t.status !== "CANCELLED"
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-3 px-4.5 bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-md font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Delegated Tasks
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Monitor the status and progress of tasks you have delegated to other team members.
          </p>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold">
          {activeDelegated.length} Active Delegated
        </span>
      </div>

      {/* Filter and TaskList */}
      <FilterBar />
      <TaskList tasks={delegatedTasks} />
    </div>
  );
}
