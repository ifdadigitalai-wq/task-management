import { TaskStatus, Priority, TaskFrequency } from "@/types";

export async function fetchTaskRelations(taskId: string) {
  const res = await fetch(`/api/tasks/${taskId}`);
  return res.json();
}

export async function fetchDirectComments(taskId: string) {
  const res = await fetch(`/api/tasks/${taskId}/comments`);
  return res.json();
}

export async function patchTaskChecklist(taskId: string, checklist: any[], progress: number) {
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checklistItems: checklist, progress }),
  });
  return res.json();
}

export async function patchTaskDetails(
  taskId: string,
  data: {
    title: string;
    description: string;
    priority: Priority;
    dueDate: string | null;
    assigneeId: string | null;
    estimatedMinutes: number;
    department: string;
    frequency: TaskFrequency;
    customFrequency: string | null;
  }
) {
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function patchTaskProgress(taskId: string, progress: number) {
  const res = await fetch(`/api/tasks/${taskId}/progress`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ progress }),
  });
  return res.json();
}

export async function assignTeamMember(taskId: string, assigneeId: string) {
  const res = await fetch(`/api/tasks/${taskId}/assign-team-member`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assigneeId }),
  });
  return res.json();
}

export async function delegateAction(
  taskId: string,
  action: "request" | "cancel" | "resend" | "accept" | "decline" | "clear_declined",
  colleagueId?: string
) {
  const res = await fetch(`/api/tasks/${taskId}/delegate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, colleagueId }),
  });
  return res.json();
}

export async function postDirectComment(taskId: string, content: string) {
  const res = await fetch(`/api/tasks/${taskId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return res.json();
}

export async function addSubtask(
  parentTaskId: string,
  data: {
    title: string;
    priority: Priority;
    assigneeId: string | null;
    department: string;
  }
) {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: data.title,
      parentTaskId,
      priority: data.priority,
      assigneeId: data.assigneeId,
      department: data.department,
    }),
  });
  return res.json();
}

export async function deleteTask(taskId: string) {
  return fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
}

export async function updateStatus(taskId: string, status: TaskStatus) {
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return res.json();
}

export async function uploadAttachments(taskId: string, attachments: any[]) {
  const res = await fetch(`/api/tasks/${taskId}/attachments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attachments }),
  });
  return res.json();
}

export async function postUpdateRemark(taskId: string, remark: string, attachments: any[]) {
  const res = await fetch(`/api/tasks/${taskId}/updates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ remark, attachments }),
  });
  return res.json();
}

export async function postUpdateComment(taskId: string, updateId: string, text: string) {
  const res = await fetch(`/api/tasks/${taskId}/updates/${updateId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return res.json();
}
