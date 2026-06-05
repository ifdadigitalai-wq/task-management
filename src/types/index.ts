export type UserRole = "ADMIN" | "EMPLOYEE";

export type EventType = "LEAVE" | "EVENT" | "OFFICIAL";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type UpdateType = "COMMENT" | "STATUS_CHANGE" | "ASSIGNMENT" | "TIME_LOG";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  department?: string | null;
  jobTitle?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  joinedAt?: string | Date | null;
  isActive: boolean;
  mustResetPassword: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string | Date | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  creatorId?: string | null;
  creator?: User | null;
  assigneeId?: string | null;
  assignee?: User | null;
  templateId?: string | null;
  template?: TaskTemplate | null;
  parentTaskId?: string | null;
  parentTask?: Task | null;
  subTasks?: Task[];
  tags: string[];
  attachments?: any; // JSON representation
  recurrence?: any;   // JSON representation
  checklistItems?: any; // JSON representation of {text, completed}[]
  createdAt: string | Date;
  updatedAt: string | Date;

  // client side additions
  updates?: TaskUpdate[];
  timers?: TaskTimer[];
}

export interface TaskUpdate {
  id: string;
  taskId: string;
  userId: string;
  user?: User;
  content: string;
  type: UpdateType;
  attachments?: any;
  createdAt: string | Date;
  comments?: TaskComment[];
}

export interface TaskComment {
  id: string;
  taskUpdateId: string;
  userId: string;
  user?: User;
  body: string;
  createdAt: string | Date;
}

export interface TaskTimer {
  id: string;
  taskId: string;
  userId: string;
  user?: User;
  startedAt: string | Date;
  stoppedAt?: string | Date | null;
  durationMinutes: number;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string | null;
  defaultPriority: Priority;
  checklistItems?: any; // JSON representation of string[]
  createdById?: string | null;
  createdBy?: User | null;
  createdAt: string | Date;
}

export interface Notification {
  id: string;
  userId: string;
  user?: User;
  type: string;
  message: string;
  read: boolean;
  link?: string | null;
  createdAt: string | Date;
}

export interface Holiday {
  id: string;
  name: string;
  date: string | Date;
  isRecurring: boolean;
  createdAt: string | Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  fromDate: string | Date;
  toDate: string | Date;
  time?: string | null;
  type: EventType;
  userId: string;
  user?: User;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Activity {
  id: string;
  userId?: string | null;
  user?: User | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  meta?: any; // JSON representation
  createdAt: string | Date;
  taskId?: string | null;
  task?: Task | null;
}

export interface FilterState {
  status: TaskStatus | "ALL";
  priority: Priority | "ALL";
  assigneeId: string | "ALL";
  search: string;
  dateRange: string; // "today" | "yesterday" | "tomorrow" | "this-week" | "all"
  tags: string[];
  sortBy?: string;
}

export type ViewMode = "list" | "kanban";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}