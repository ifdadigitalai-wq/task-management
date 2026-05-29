"use client";

import { useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import TaskList from "@/components/tasks/TaskList";

export default function MyTasksPage() {
  const { tasks, fetchTasks, currentUser, fetchCurrentUser } = useTaskStore();

  useEffect(() => {
    fetchTasks();
    if (!currentUser) {
      fetchCurrentUser();
    }
  }, []);

  // Filter tasks assigned to current user
  const myTasks = tasks.filter((t) => t.assignedTo === currentUser?.id);
  const activeMyTasks = myTasks.filter((t) => t.status !== "COMPLETED");

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: 0 }}>
          My Tasks
        </h1>
        <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "4px" }}>
          {activeMyTasks.length === 0 ? "No tasks assigned to you" : `${activeMyTasks.length} active task${activeMyTasks.length === 1 ? "" : "s"} assigned`}
        </p>
      </div>

      <TaskList tasks={myTasks} />
    </div>
  );
}