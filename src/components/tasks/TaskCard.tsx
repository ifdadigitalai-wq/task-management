"use client";

import React, { useState, useEffect } from "react";
import { Task, TaskStatus, Priority } from "@/types";
import { useTaskStore } from "@/store/useTaskStore";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

// Time ago formatter helper
function timeAgo(dateStr: string | Date): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const PRIORITY_BORDER: Record<Priority, string> = {
  LOW: "border-l-priority-low-text",
  MEDIUM: "border-l-priority-medium-text",
  HIGH: "border-l-priority-high-text",
  CRITICAL: "border-l-priority-critical-text",
};

const STATUS_TEXT: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_CLASSES: Record<TaskStatus, string> = {
  TODO: "bg-status-todo-bg text-status-todo-text",
  IN_PROGRESS: "bg-status-progress-bg text-status-progress-text",
  IN_REVIEW: "bg-status-review-bg text-status-review-text",
  DONE: "bg-status-done-bg text-status-done-text",
  CANCELLED: "bg-status-cancelled-bg text-status-cancelled-text",
};



interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const { setSelectedTask } = useTaskStore();
  const [isDragging, setIsDragging] = useState(false);

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "DONE" &&
    task.status !== "CANCELLED";

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const assigneeInitials = task.assignee
    ? task.assignee.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  const visibleTags = task.tags?.slice(0, 2) || [];
  const overflowTags = (task.tags?.length || 0) - 2;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => setSelectedTask(task)}
      className={cn(
        "bg-surface border border-border p-2 mb-0 hover:border-border-strong hover:shadow-sm transition-all duration-150 cursor-pointer select-none rounded-r-lg rounded-l-none border-l-[3px]",
        PRIORITY_BORDER[task.priority] || PRIORITY_BORDER.MEDIUM,
        isDragging && "opacity-40 scale-95"
      )}
    >
      {/* First Row: Title + Status */}
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <h3 className="text-[12.5px] font-semibold text-text-primary leading-tight flex-1 line-clamp-2 pr-2">
          {task.title}
        </h3>
        <span
          className={cn(
            "text-[9px] font-medium py-0.5 px-1.5 rounded-full shrink-0 uppercase tracking-[0.02em]",
            STATUS_CLASSES[task.status] || STATUS_CLASSES.TODO
          )}
        >
          {STATUS_TEXT[task.status]}
        </span>
      </div>

      {/* Second Row: Meta Info */}
      <div className="flex items-center gap-1.5 flex-wrap text-text-secondary leading-none">
        {/* Assignee Avatar + Name */}
        {task.assignee ? (
          <div className="flex items-center gap-1 min-w-0" title={`Assigned to ${task.assignee.name}`}>
            <div className="w-[18px] h-[18px] rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-brand-light text-brand-text text-[8px] font-medium border border-border">
              {task.assignee.avatarUrl ? (
                <img
                  src={task.assignee.avatarUrl}
                  alt={task.assignee.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{assigneeInitials}</span>
              )}
            </div>
            <span className="text-[9.5px] text-text-secondary truncate max-w-[85px]">
              {task.assignee.name.split(" ")[0]}
            </span>
          </div>
        ) : (
          <span className="text-[9.5px] text-text-tertiary">Unassigned</span>
        )}

        {/* Separator Dot */}
        <span className="text-text-tertiary shrink-0">&bull;</span>

        {/* Due date */}
        {task.dueDate ? (
          <span
            className={cn(
              "text-[9.5px] shrink-0 flex items-center gap-1",
              isOverdue ? "text-priority-critical-text font-medium" : "text-text-tertiary"
            )}
          >
            <Calendar className="w-2.5 h-2.5" />
            <span>
              {new Date(task.dueDate).toLocaleDateString([], {
                month: "short",
                day: "numeric",
              })}
            </span>
          </span>
        ) : (
          <span className="text-[9.5px] text-text-tertiary shrink-0">No due date</span>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <>
            <span className="text-text-tertiary shrink-0">&bull;</span>
            <div className="flex items-center gap-1 shrink-0">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[8.5px] bg-bg border border-border rounded-full px-1.5 py-0.2 text-text-secondary shrink-0 font-medium"
                >
                  {tag}
                </span>
              ))}
              {overflowTags > 0 && (
                <span className="text-[8.5px] text-text-tertiary shrink-0 font-medium">
                  +{overflowTags} more
                </span>
              )}
            </div>
          </>
        )}

      </div>

      {/* Third Row: TimeAgo (Float Right) */}
      <div className="flow-root mt-1">
        <span className="text-[8px] text-text-tertiary float-right">
          {timeAgo(task.createdAt)}
        </span>
      </div>
    </div>
  );
}