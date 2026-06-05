"use client";
import { create } from "zustand";
import { Task, TaskStatus, Priority, FilterState, ViewMode } from "@/types";

interface TaskStore {
  tasks: Task[];
  filteredTasks: Task[];
  selectedTask: Task | null;
  filters: FilterState;
  viewMode: ViewMode;
  currentUser: any;
  theme: "morning" | "afternoon" | "evening" | "night";

  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  setSelectedTask: (task: Task | null) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  setViewMode: (mode: ViewMode) => void;
  
  fetchTasks: () => Promise<void>;
  setCurrentUser: (user: any) => void;
  fetchCurrentUser: () => Promise<void>;
  setTheme: (t: "morning" | "afternoon" | "evening" | "night") => void;
  updateThemeByTime: () => void;
}

const initialFilters: FilterState = {
  status: "ALL",
  priority: "ALL",
  assigneeId: "ALL",
  search: "",
  dateRange: "all",
  tags: [],
};

export const filterTasks = (tasks: Task[], filters: FilterState): Task[] => {
  return tasks.filter((task) => {
    // 1. Status Filter
    if (filters.status !== "ALL" && task.status !== filters.status) {
      return false;
    }

    // 2. Priority Filter
    if (filters.priority !== "ALL" && task.priority !== filters.priority) {
      return false;
    }

    // 3. Assignee Filter
    if (filters.assigneeId !== "ALL" && task.assigneeId !== filters.assigneeId) {
      return false;
    }

    // 4. Search Filter (title, description, tags)
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q) || false;
      const matchTags = task.tags.some((tag) => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags) {
        return false;
      }
    }

    // 5. Date Range Filter
    if (filters.dateRange !== "all") {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      const today = new Date();
      
      today.setHours(0, 0, 0, 0);
      const startOfDay = new Date(today);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      if (filters.dateRange === "today") {
        if (taskDate < startOfDay || taskDate > endOfDay) return false;
      } else if (filters.dateRange === "yesterday") {
        const yesterdayStart = new Date(startOfDay);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(endOfDay);
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
        if (taskDate < yesterdayStart || taskDate > yesterdayEnd) return false;
      } else if (filters.dateRange === "tomorrow") {
        const tomorrowStart = new Date(startOfDay);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        const tomorrowEnd = new Date(endOfDay);
        tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
        if (taskDate < tomorrowStart || taskDate > tomorrowEnd) return false;
      } else if (filters.dateRange === "this-week") {
        const startOfWeek = new Date(today);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        if (taskDate < startOfWeek || taskDate > endOfWeek) return false;
      }
    }

    // 6. Tags filter
    if (filters.tags.length > 0) {
      const matchesAllTags = filters.tags.every((tag) => task.tags.includes(tag));
      if (!matchesAllTags) return false;
    }

    return true;
  });
};

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  filteredTasks: [],
  selectedTask: null,
  filters: initialFilters,
  viewMode: "list",
  currentUser: null,
  theme: "morning",

  setTasks: (tasks) => {
    set({
      tasks,
      filteredTasks: filterTasks(tasks, get().filters),
    });
  },

  addTask: (task) => {
    const updatedTasks = [task, ...get().tasks];
    set({
      tasks: updatedTasks,
      filteredTasks: filterTasks(updatedTasks, get().filters),
    });
  },

  updateTask: (updatedTask) => {
    const updatedTasks = get().tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    const selectedTask = get().selectedTask;
    set({
      tasks: updatedTasks,
      filteredTasks: filterTasks(updatedTasks, get().filters),
      selectedTask: selectedTask?.id === updatedTask.id ? updatedTask : selectedTask,
    });
  },

  deleteTask: (id) => {
    const updatedTasks = get().tasks.filter((t) => t.id !== id);
    set({
      tasks: updatedTasks,
      filteredTasks: filterTasks(updatedTasks, get().filters),
      selectedTask: get().selectedTask?.id === id ? null : get().selectedTask,
    });
  },

  setSelectedTask: (selectedTask) => set({ selectedTask }),

  setFilters: (newFilters) => {
    const mergedFilters = { ...get().filters, ...newFilters };
    set({
      filters: mergedFilters,
      filteredTasks: filterTasks(get().tasks, mergedFilters),
    });
  },

  setViewMode: (viewMode) => set({ viewMode }),

  fetchTasks: async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const payload = await res.json();
        const data = payload.success ? payload.data : payload;
        const tasksList = Array.isArray(data) ? data : [];
        set({
          tasks: tasksList,
          filteredTasks: filterTasks(tasksList, get().filters),
        });
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  },

  setCurrentUser: (currentUser) => set({ currentUser }),

  fetchCurrentUser: async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const payload = await res.json();
        const data = payload.success ? payload.data : payload;
        set({ currentUser: data });
      }
    } catch (err) {
      console.error("Failed to fetch current user session:", err);
    }
  },

  setTheme: (theme) => set({ theme }),

  updateThemeByTime: () => {
    const hour = new Date().getHours();
    let t: "morning" | "afternoon" | "evening" | "night" = "morning";
    if (hour >= 6 && hour < 12) t = "morning";
    else if (hour >= 12 && hour < 17) t = "afternoon";
    else if (hour >= 17 && hour < 20) t = "evening";
    else t = "night";
    set({ theme: t });
  },
}));