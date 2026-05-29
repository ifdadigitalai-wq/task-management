"use client";
import { create } from "zustand";
import { Task } from "@/types";

interface TaskStore {
  tasks: Task[];
  currentUser: any;
  theme: "morning" | "afternoon" | "evening" | "night";
  dateRange: string;
  targetDate: string;
  search: string;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  fetchTasks: () => Promise<void>;
  setDateRange: (v: string) => void;
  setTargetDate: (v: string) => void;
  setSearch: (v: string) => void;
  deleteTask: (id: string) => void;
  finishTask: (id: string) => void;
  setCurrentUser: (user: any) => void;
  fetchCurrentUser: () => Promise<void>;
  setTheme: (t: "morning" | "afternoon" | "evening" | "night") => void;
  updateThemeByTime: () => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  currentUser: null,
  theme: "morning",
  dateRange: "today",
  targetDate: "today",
  search: "",
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  fetchTasks: async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      set({ tasks: data });
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  },
  setDateRange: (dateRange) => set({ dateRange }),
  setTargetDate: (targetDate) => set({ targetDate }),
  setSearch: (search) => set({ search }),
  deleteTask: (id) => set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
  finishTask: (id) => set((state) => ({ tasks: state.tasks.map((t) => t.id === id ? { ...t, status: "COMPLETED", progress :100 } : t) })),
  setCurrentUser: (currentUser) => set({ currentUser }),
  fetchCurrentUser: async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
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
  }
}));