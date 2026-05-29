"use client";

import { useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import TaskList from "@/components/tasks/TaskList";

export default function DashboardPage() {
  const { tasks, fetchTasks, currentUser, fetchCurrentUser } = useTaskStore();

  useEffect(() => {
    fetchTasks();
    if (!currentUser) {
      fetchCurrentUser();
    }
  }, []);

  const activeTasks = tasks.filter((t) => t.status !== "COMPLETED");

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "4px" }}>
          {activeTasks.length === 0 ? "No tasks yet — assign one to get started" : `${activeTasks.length} task${activeTasks.length === 1 ? "" : "s"} assigned`}
        </p>
      </div>

      <TaskList tasks={tasks} />
    </div>
  );
}