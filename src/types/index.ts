export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DELETED";

export interface Task {
  mode: string;
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  progress: number;
  tag?: string;
  dueDate?: string;
  targetDate?: string;
  isDeleted?: boolean;
  assignedTo?: { id: string; name: string; image?: string };
  delegatedBy?: { id: string; name: string };
  createdAt: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  priority: Priority;
  tag?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
}
export interface NewTask {
  title: string;
  description: string;
  assignedTo: string | null;       // "User" pill
  dueDate: string | null;          // ISO string
  priority: "High" | "Medium" | "Low" | null;
  department: string | null;
  inLoop: string | null;
  repeat: "Daily" | "Weekly" | "Monthly" | null;
  repeatDays: string[];            // ["M","W","F"] when Weekly
  alarmSet: boolean;
  attachments: string[];           // filenames
  voiceNotes: number;              // count
  mode: string
}