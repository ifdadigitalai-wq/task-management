export type UserRole = "ADMIN" | "MANAGER" | "TEAM_LEADER" | "EMPLOYEE";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "RESIGNED" | "ON_LEAVE";

export type TaskFrequency = "ONE_TIME" | "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";

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
  status: UserStatus;
  department?: string | null;
  departmentId?: string | null;
  departmentObj?: Department | null;
  team?: string | null;
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
  recurrence?: any;   // JSON representation
  checklistItems?: any; // JSON representation of {text, completed}[]
  createdAt: string | Date;
  updatedAt: string | Date;

  // New fields
  department: string;
  frequency: TaskFrequency;
  customFrequency?: string | null;
  progress: number;
  isSubtask: boolean;
  delegationPending: boolean;
  delegationStatus?: string | null;
  delegationToId?: string | null;
  delegationFromId?: string | null;
  delegationTo?: User | null;
  delegationFrom?: User | null;

  // New relations
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  reminderSettings?: TaskReminder | null;

  // client side additions
  updates?: TaskUpdate[];
  timers?: TaskTimer[];
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  url: string;
  filename: string;
  uploadedBy: string;
  uploadedAt: string | Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  user?: User;
  content: string;
  createdAt: string | Date;
}

export interface TaskReminder {
  id: string;
  taskId: string;
  beforeDueDate: boolean;
  onDueDate: boolean;
  recurring: boolean;
  emailNotification: boolean;
  inAppNotification: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  performedBy: string;
  details: any;
  createdAt: string | Date;
}

export interface TaskTransfer {
  id: string;
  taskId: string;
  fromUserId: string;
  toUserId: string;
  transferredBy: string;
  transferredAt: string | Date;
  reason: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  members?: User[];
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
  comments?: TaskUpdateComment[];
}

export interface TaskUpdateComment {
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

  // New fields
  department: string;
  frequency: TaskFrequency;
  customFrequency?: string | null;
  recurrence?: any;     // JSON representation
  remindVia?: any;      // JSON representation of string[]
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
  department: string | "ALL";
  team: string | "ALL";
}

export type ViewMode = "list" | "kanban";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}