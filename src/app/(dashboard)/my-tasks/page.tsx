"use client";

import { useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import TaskList from "@/components/tasks/TaskList";
import { useTimeTheme } from "@/hooks/useTimeTheme";

export default function MyTasksPage() {
  const { tasks, fetchTasks, currentUser, fetchCurrentUser } = useTaskStore();
  const timeTheme = useTimeTheme();

  useEffect(() => {
    fetchTasks();
    if (!currentUser) fetchCurrentUser();
  }, []);

  // API already returns only this employee's tasks — no client-side filter needed
  const activeMyTasks = tasks.filter((t) => t.status !== "COMPLETED");

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: timeTheme.textColor, margin: 0, transition: "color 0.6s ease" }}>
          My Tasks
        </h1>
        <p style={{ fontSize: "13px", color: timeTheme.mutedTextColor, marginTop: "4px", transition: "color 0.6s ease" }}>
          {activeMyTasks.length === 0
            ? "No tasks assigned to you"
            : `${activeMyTasks.length} active task${activeMyTasks.length === 1 ? "" : "s"} assigned`}
        </p>
      </div>

      <TaskList tasks={tasks} />
    </div>
  );
}