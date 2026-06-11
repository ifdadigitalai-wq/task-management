import { create } from "zustand";
import { Priority } from "@/types";

export interface TaskDetail {
  priority: Priority;
  assigneeId: string;
  dueDate: string | null; // Keep as string (datetime-local format) or null
}

interface BulkAssignState {
  dept: string;
  deptId: string;
  mode: "template" | "custom" | "";
  selectedTemplates: Set<string>;
  titles: string[];
  descriptions: string[];
  details: TaskDetail[];
  activeTaskIndex: number;
  savedAsTemplate: boolean;
  
  // Actions
  setDept: (dept: string, deptId: string) => void;
  setMode: (mode: "template" | "custom") => void;
  toggleTemplate: (templateId: string) => void;
  addTitle: () => void;
  removeTitle: (index: number) => void;
  setTitle: (index: number, val: string) => void;
  setDescription: (index: number, val: string) => void;
  setDetailField: <K extends keyof TaskDetail>(index: number, field: K, val: TaskDetail[K]) => void;
  setActiveTaskIndex: (index: number) => void;
  setTasks: (tasks: { title: string; description: string; priority: Priority; assigneeId: string; dueDate: string | null }[]) => void;
  setSavedAsTemplate: (val: boolean) => void;
  reset: () => void;
}

export const useBulkAssign = create<BulkAssignState>((set) => ({
  dept: "",
  deptId: "",
  mode: "",
  selectedTemplates: new Set<string>(),
  titles: [""], // Start with 1 empty title task
  descriptions: [""],
  details: [{ priority: "MEDIUM", assigneeId: "", dueDate: null }],
  activeTaskIndex: 0,
  savedAsTemplate: false,

  setDept: (dept, deptId) => set(() => ({ dept, deptId })),
  setMode: (mode) => set(() => ({ mode })),
  toggleTemplate: (templateId) => set((state) => {
    const next = new Set(state.selectedTemplates);
    if (next.has(templateId)) {
      next.delete(templateId);
    } else {
      next.add(templateId);
    }
    return { selectedTemplates: next };
  }),
  addTitle: () => set((state) => ({
    titles: [...state.titles, ""],
    descriptions: [...state.descriptions, ""],
    details: [...state.details, { priority: "MEDIUM", assigneeId: "", dueDate: null }],
  })),
  removeTitle: (index) => set((state) => {
    if (state.titles.length <= 1) return {}; // Can't remove last one
    const titles = state.titles.filter((_, i) => i !== index);
    const descriptions = state.descriptions.filter((_, i) => i !== index);
    const details = state.details.filter((_, i) => i !== index);
    let activeTaskIndex = state.activeTaskIndex;
    if (activeTaskIndex >= titles.length) {
      activeTaskIndex = titles.length - 1;
    }
    return { titles, descriptions, details, activeTaskIndex };
  }),
  setTitle: (index, val) => set((state) => {
    const titles = [...state.titles];
    titles[index] = val;
    return { titles };
  }),
  setDescription: (index, val) => set((state) => {
    const descriptions = [...state.descriptions];
    descriptions[index] = val;
    return { descriptions };
  }),
  setDetailField: (index, field, val) => set((state) => {
    const details = [...state.details];
    details[index] = { ...details[index], [field]: val };
    return { details };
  }),
  setActiveTaskIndex: (activeTaskIndex) => set({ activeTaskIndex }),
  setTasks: (tasks) => set(() => ({
    titles: tasks.map((t) => t.title),
    descriptions: tasks.map((t) => t.description),
    details: tasks.map((t) => ({
      priority: t.priority,
      assigneeId: t.assigneeId,
      dueDate: t.dueDate,
    })),
    activeTaskIndex: 0,
  })),
  setSavedAsTemplate: (savedAsTemplate) => set({ savedAsTemplate }),
  reset: () => set({
    dept: "",
    deptId: "",
    mode: "",
    selectedTemplates: new Set<string>(),
    titles: [""],
    descriptions: [""],
    details: [{ priority: "MEDIUM", assigneeId: "", dueDate: null }],
    activeTaskIndex: 0,
    savedAsTemplate: false,
  }),
}));
