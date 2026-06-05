"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { TaskStatus, Priority } from "@/types";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  showDot?: boolean;
}

const STATUS_MAP: Record<TaskStatus, { bg: string; text: string; dot: string; label: string }> = {
  TODO: {
    bg: "bg-status-todo-bg",
    text: "text-status-todo-text",
    dot: "bg-status-todo-text",
    label: "To Do",
  },
  IN_PROGRESS: {
    bg: "bg-status-progress-bg",
    text: "text-status-progress-text",
    dot: "bg-status-progress-text",
    label: "In Progress",
  },
  IN_REVIEW: {
    bg: "bg-status-review-bg",
    text: "text-status-review-text",
    dot: "bg-status-review-text",
    label: "In Review",
  },
  DONE: {
    bg: "bg-status-done-bg",
    text: "text-status-done-text",
    dot: "bg-status-done-text",
    label: "Done",
  },
  CANCELLED: {
    bg: "bg-status-cancelled-bg",
    text: "text-status-cancelled-text",
    dot: "bg-status-cancelled-text",
    label: "Cancelled",
  },
};

const PRIORITY_MAP: Record<Priority, { bg: string; text: string; dot: string; label: string }> = {
  LOW: {
    bg: "bg-priority-low-bg",
    text: "text-priority-low-text",
    dot: "bg-priority-low-text",
    label: "Low",
  },
  MEDIUM: {
    bg: "bg-priority-medium-bg",
    text: "text-priority-medium-text",
    dot: "bg-priority-medium-text",
    label: "Medium",
  },
  HIGH: {
    bg: "bg-priority-high-bg",
    text: "text-priority-high-text",
    dot: "bg-priority-high-text",
    label: "High",
  },
  CRITICAL: {
    bg: "bg-priority-critical-bg",
    text: "text-priority-critical-text",
    dot: "bg-priority-critical-text",
    label: "Critical",
  },
};

export const StatusBadge = React.forwardRef<HTMLSpanElement, BadgeProps & { status: TaskStatus }>(
  ({ className, status, showDot = true, ...props }, ref) => {
    const config = STATUS_MAP[status] || STATUS_MAP.TODO;
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 py-0.5 px-2 text-[10px] font-medium uppercase tracking-[0.05em] rounded-full shrink-0",
          config.bg,
          config.text,
          className
        )}
        {...props}
      >
        {showDot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />}
        <span>{config.label}</span>
      </span>
    );
  }
);
StatusBadge.displayName = "StatusBadge";

export const PriorityBadge = React.forwardRef<HTMLSpanElement, BadgeProps & { priority: Priority }>(
  ({ className, priority, showDot = true, ...props }, ref) => {
    const config = PRIORITY_MAP[priority] || PRIORITY_MAP.MEDIUM;
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 py-0.5 px-2 text-[10px] font-medium uppercase tracking-[0.05em] rounded-full shrink-0",
          config.bg,
          config.text,
          className
        )}
        {...props}
      >
        {showDot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />}
        <span>{config.label}</span>
      </span>
    );
  }
);
PriorityBadge.displayName = "PriorityBadge";
