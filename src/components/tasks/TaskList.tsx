"use client";

import { useState } from "react";
import TaskCard from "./TaskCard";
import { Task } from "@/types";

export default function TaskList({ tasks }: { tasks: Task[] }) {
  const [showCompleted, setShowCompleted] = useState(false);

  const displayedTasks = showCompleted
    ? tasks.filter((t) => t.status === "COMPLETED")
    : tasks.filter((t) => t.status !== "COMPLETED");

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#111827", margin: 0 }}>
            {showCompleted ? "Completed tasks" : "Newly assigned tasks"}
          </h2>
          <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 500,
            backgroundColor: "#f3f4f6", padding: "3px 10px", borderRadius: "20px" }}>
            {displayedTasks.length} task{displayedTasks.length === 1 ? "" : "s"}
          </span>
        </div>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: showCompleted ? "#4f46e5" : "#374151",
            backgroundColor: showCompleted ? "#eef2ff" : "#ffffff",
            border: "1px solid #e5e7eb",
            padding: "6px 12px",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {showCompleted ? "Show Active Tasks" : "Show Completed Tasks"}
        </button>
      </div>

      {/* Cards — single column, full width */}
      {!displayedTasks.length ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>{showCompleted ? "🎉" : "📋"}</div>
          <p style={{ fontSize: "14px", color: "#9ca3af", fontWeight: 500 }}>
            {showCompleted ? "No completed tasks yet" : "No active tasks yet — assign one to get started"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {displayedTasks.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  );
}