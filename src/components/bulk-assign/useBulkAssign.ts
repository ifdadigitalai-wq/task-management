import { create } from "zustand";
import { Priority } from "@/types";

export interface TaskDetail {
  priority: Priority;
  assigneeId: string;
  dueDate: string | null;
  frequency: string;
  customFrequency: string;
  recurrenceRule: string;
  reminderSettings: {
    beforeDueDate: boolean;
    onDueDate: boolean;
    recurring: boolean;
    emailNotification: boolean;
    inAppNotification: boolean;
  };
  remindWhatsApp: boolean;
  remindEmail: boolean;
}

interface BulkAssignState {
  dept: string;
  deptId: string;
  mode: "template" | "custom" | "";
  selectedTemplates: Set<string>;
  titles: string[];
  descriptions: string[];
  details: TaskDetail[];
  files: File[][];
  voiceRecordings: Array<{ name: string; blob: Blob }[]>;
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
  setTasks: (tasks: { title: string; description: string; priority: Priority; assigneeId: string; dueDate: string | null; frequency?: string; customFrequency?: string; recurrenceRule?: string; reminderSettings?: any; remindWhatsApp?: boolean; remindEmail?: boolean }[]) => void;
  addFile: (taskIndex: number, file: File) => void;
  removeFile: (taskIndex: number, fileIndex: number) => void;
  addVoice: (taskIndex: number, blob: Blob, name: string) => void;
  removeVoice: (taskIndex: number, voiceIndex: number) => void;
  setSavedAsTemplate: (val: boolean) => void;
  reset: () => void;
}

const defaultDetails = (): TaskDetail => ({
  priority: "MEDIUM",
  assigneeId: "",
  dueDate: null,
  frequency: "ONE_TIME",
  customFrequency: "",
  recurrenceRule: "NONE",
  reminderSettings: {
    beforeDueDate: true,
    onDueDate: true,
    recurring: false,
    emailNotification: false,
    inAppNotification: true,
  },
  remindWhatsApp: false,
  remindEmail: false,
});

export const useBulkAssign = create<BulkAssignState>((set) => ({
  dept: "",
  deptId: "",
  mode: "",
  selectedTemplates: new Set<string>(),
  titles: [""], // Start with 1 empty title task
  descriptions: [""],
  details: [defaultDetails()],
  files: [[]],
  voiceRecordings: [[]],
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
    details: [...state.details, defaultDetails()],
    files: [...state.files, []],
    voiceRecordings: [...state.voiceRecordings, []],
  })),
  removeTitle: (index) => set((state) => {
    if (state.titles.length <= 1) return {}; // Can't remove last one
    const titles = state.titles.filter((_, i) => i !== index);
    const descriptions = state.descriptions.filter((_, i) => i !== index);
    const details = state.details.filter((_, i) => i !== index);
    const files = state.files.filter((_, i) => i !== index);
    const voiceRecordings = state.voiceRecordings.filter((_, i) => i !== index);
    let activeTaskIndex = state.activeTaskIndex;
    if (activeTaskIndex >= titles.length) {
      activeTaskIndex = titles.length - 1;
    }
    return { titles, descriptions, details, files, voiceRecordings, activeTaskIndex };
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
      frequency: t.frequency || "ONE_TIME",
      customFrequency: t.customFrequency || "",
      recurrenceRule: t.recurrenceRule || "NONE",
      reminderSettings: t.reminderSettings || {
        beforeDueDate: true,
        onDueDate: true,
        recurring: false,
        emailNotification: false,
        inAppNotification: true,
      },
      remindWhatsApp: t.remindWhatsApp || false,
      remindEmail: t.remindEmail || false,
    })),
    files: tasks.map(() => []),
    voiceRecordings: tasks.map(() => []),
    activeTaskIndex: 0,
  })),
  addFile: (taskIndex, file) => set((state) => {
    const nextFiles = [...state.files];
    nextFiles[taskIndex] = [...(nextFiles[taskIndex] || []), file];
    return { files: nextFiles };
  }),
  removeFile: (taskIndex, fileIndex) => set((state) => {
    const nextFiles = [...state.files];
    nextFiles[taskIndex] = (nextFiles[taskIndex] || []).filter((_, idx) => idx !== fileIndex);
    return { files: nextFiles };
  }),
  addVoice: (taskIndex, blob, name) => set((state) => {
    const nextVoices = [...state.voiceRecordings];
    nextVoices[taskIndex] = [...(nextVoices[taskIndex] || []), { blob, name }];
    return { voiceRecordings: nextVoices };
  }),
  removeVoice: (taskIndex, voiceIndex) => set((state) => {
    const nextVoices = [...state.voiceRecordings];
    nextVoices[taskIndex] = (nextVoices[taskIndex] || []).filter((_, idx) => idx !== voiceIndex);
    return { voiceRecordings: nextVoices };
  }),
  setSavedAsTemplate: (savedAsTemplate) => set({ savedAsTemplate }),
  reset: () => set({
    dept: "",
    deptId: "",
    mode: "",
    selectedTemplates: new Set<string>(),
    titles: [""],
    descriptions: [""],
    details: [defaultDetails()],
    files: [[]],
    voiceRecordings: [[]],
    activeTaskIndex: 0,
    savedAsTemplate: false,
  }),
}));
