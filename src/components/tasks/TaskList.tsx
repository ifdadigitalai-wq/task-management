"use client";

import { useState, useEffect } from "react";
import TaskCard from "./TaskCard";
import { Task, TaskStatus, Priority } from "@/types";
import { useTaskStore, filterTasks } from "@/store/useTaskStore";
import { useToast } from "@/hooks/useToast";
import { ListTodo, CheckCircle2, Play, AlertCircle, HelpCircle } from "lucide-react";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { Button } from "@/components/ui/Button";

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"];

const STATUS_HEADERS: Record<TaskStatus, { label: string; color: string; bg: string; border: string; icon: any }> = {
  TODO: {
    label: "To Do",
    color: "text-status-todo-text",
    bg: "bg-status-todo-bg/30 dark:bg-status-todo-bg/5",
    border: "border-status-todo-text/10 dark:border-status-todo-text/10",
    icon: HelpCircle,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-status-progress-text",
    bg: "bg-status-progress-bg/30 dark:bg-status-progress-bg/5",
    border: "border-status-progress-text/10 dark:border-status-progress-text/10",
    icon: Play,
  },
  IN_REVIEW: {
    label: "In Review",
    color: "text-status-review-text",
    bg: "bg-status-review-bg/30 dark:bg-status-review-bg/5",
    border: "border-status-review-text/10 dark:border-status-review-text/10",
    icon: AlertCircle,
  },
  DONE: {
    label: "Completed",
    color: "text-status-done-text",
    bg: "bg-status-done-bg/30 dark:bg-status-done-bg/5",
    border: "border-status-done-text/10 dark:border-status-done-text/10",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-status-cancelled-text",
    bg: "bg-status-cancelled-bg/30 dark:bg-status-cancelled-bg/5",
    border: "border-status-cancelled-text/10 dark:border-status-cancelled-text/10",
    icon: AlertCircle,
  },
};

export default function TaskList({ tasks: initialTasks }: { tasks?: Task[] }) {
  const { filteredTasks: storeFilteredTasks, viewMode, updateTask, filters, selectedTask, setSelectedTask, currentUser } = useTaskStore();
  const toast = useToast();
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  // Auto-open task details from query parameters (e.g. ?taskId=...)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const taskIdParam = params.get("taskId");
      if (taskIdParam) {
        // First try to find it in already fetched tasks in store
        const taskInStore = useTaskStore.getState().tasks.find((t) => t.id === taskIdParam);
        if (taskInStore) {
          setSelectedTask(taskInStore);
        } else {
          // If not in store yet, fetch it from the backend
          fetch(`/api/tasks/${taskIdParam}`)
            .then((res) => res.json())
            .then((payload) => {
              if (payload.success && payload.data) {
                setSelectedTask(payload.data);
              }
            })
            .catch(console.error);
        }
      }
    }
  }, [setSelectedTask]);

  // If no tasks passed, use filteredTasks from the store (handles all filters).
  // If tasks are passed, filter them using current filter conditions.
  const displayedTasks = initialTasks
    ? filterTasks(initialTasks, filters)
    : storeFilteredTasks;

  // Client-side Sorting
  const sortedTasks = [...displayedTasks].sort((a, b) => {
    const sortBy = filters.sortBy || "createdAt-desc";
    
    if (sortBy === "createdAt-desc") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "createdAt-asc") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === "dueDate-asc") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === "dueDate-desc") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    }
    if (sortBy === "priority-desc") {
      const pVal = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (pVal[b.priority] || 0) - (pVal[a.priority] || 0);
    }
    if (sortBy === "priority-asc") {
      const pVal = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (pVal[a.priority] || 0) - (pVal[b.priority] || 0);
    }
    return 0;
  });

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    if (currentUser?.role !== "ADMIN") return;
    e.preventDefault();
    setDragOverStatus(status);
  };

  const handleDragLeave = () => {
    if (currentUser?.role !== "ADMIN") return;
    setDragOverStatus(null);
  };

  const handleDrop = async (e: React.DragEvent, status: TaskStatus) => {
    if (currentUser?.role !== "ADMIN") return;
    e.preventDefault();
    setDragOverStatus(null);
    const taskId = e.dataTransfer.getData("text/plain");
    
    const targetTask = displayedTasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    if (targetTask.status === status) return;

    if (status === "DONE" && currentUser?.role !== "ADMIN") {
      toast.error("Only administrators can mark tasks as completed.");
      return;
    }

    // Optimistic UI update
    const previousTask = { ...targetTask };
    const updated = { ...targetTask, status };
    updateTask(updated);

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      const payload = await res.json();
      if (!payload.success) {
        // Rollback
        updateTask(previousTask);
        toast.error(payload.error || "Failed to update task status");
      } else {
        toast.success(`Task status updated to ${STATUS_HEADERS[status].label}`);
      }
    } catch (err) {
      updateTask(previousTask);
      console.error(err);
      toast.error("An error occurred while updating status");
    }
  };

  if (!sortedTasks.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-surface border border-border rounded-xl text-center max-w-md mx-auto shadow-sm my-8">
        <div className="p-3 bg-bg rounded-full text-text-tertiary mb-4">
          <ListTodo className="w-10 h-10" />
        </div>
        <h3 className="text-md font-medium text-text-primary mb-1.5">No Tasks Found</h3>
        <p className="text-sm text-text-secondary max-w-xs mb-5 leading-normal">
          No tasks match the selected filter conditions. Adjust filters or assign a new task to get started.
        </p>
        {currentUser?.role === "ADMIN" && (
          <Button
            onClick={() => window.dispatchEvent(new CustomEvent("open-assign-task-modal"))}
            variant="primary"
            size="sm"
          >
            Create your first task
          </Button>
        )}
      </div>
    );
  }

  // --- RENDERING VIEWS ---

  if (viewMode === "kanban") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start">
        {STATUSES.map((status) => {
          const columnTasks = sortedTasks.filter((t) => t.status === status);
          const header = STATUS_HEADERS[status];
          const isOver = dragOverStatus === status;

          return (
            <div
              key={status}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
              className={`flex flex-col min-h-[500px] rounded-xl border p-3 transition-all duration-200 ${header.bg} ${header.border} ${
                isOver ? "ring-2 ring-brand scale-[1.01] bg-brand-light/20" : ""
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-border">
                <div className="flex items-center gap-2">
                  <header.icon className={`w-4 h-4 ${header.color}`} />
                  <span className={`text-xs font-medium tracking-wide uppercase ${header.color}`}>
                    {header.label}
                  </span>
                </div>
                <span className="text-[10px] font-medium bg-bg dark:bg-surface-raised px-2 py-0.5 rounded-full text-text-secondary">
                  {columnTasks.length}
                </span>
              </div>

              {/* Task list inside column */}
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[600px] pr-1">
                {columnTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 border border-dashed border-border rounded-xl text-text-tertiary text-[10px] font-medium text-center">
                    Drag tasks here
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
          );
        })}

        {/* Global Detail Panel */}
        {selectedTask && (
          <TaskDetailPanel onClose={() => setSelectedTask(null)} />
        )}
      </div>
    );
  }

  // DEFAULT: List View
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2">
        {sortedTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {/* Global Detail Panel */}
      {selectedTask && (
        <TaskDetailPanel onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}