import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ApiResponse, TaskStatus, Priority } from "@/types";

export const dynamic = "force-dynamic";

const POINTS: Record<Priority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

type HML = { H: number; M: number; L: number };
const emptyHML = (): HML => ({ H: 0, M: 0, L: 0 });

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all active tasks (not cancelled/deleted depending on scope)
    const tasks = await prisma.task.findMany({
      where: {
        parentTaskId: null,
        ...(session.role === "EMPLOYEE" && { assigneeId: session.id }),
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, department: true, avatarUrl: true },
        },
      },
    });

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    let total = tasks.length;
    let overdue = 0;
    let completedToday = 0;

    const byStatus: Record<TaskStatus, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
      CANCELLED: 0,
    };

    const byPriority: Record<Priority, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    // Employee and department statistics Maps (for workload / performance charts)
    const empMap = new Map<string, {
      id: string;
      name: string;
      dept: string;
      total: number;
      due: HML;
      completed: HML;
      maxScore: number;
      score: number;
      avatarUrl?: string | null;
    }>();

    const deptMap = new Map<string, {
      name: string;
      total: number;
      due: HML;
      completed: HML;
      maxScore: number;
      score: number;
    }>();

    // Priority stats block for legacy compatibility
    const priorityMap: Record<"HIGH" | "MEDIUM" | "LOW", { total: number; due: number; completed: number }> = {
      HIGH: { total: 0, due: 0, completed: 0 },
      MEDIUM: { total: 0, due: 0, completed: 0 },
      LOW: { total: 0, due: 0, completed: 0 },
    };

    for (const task of tasks) {
      const status = task.status as TaskStatus;
      const priority = task.priority as Priority;
      const pts = POINTS[priority] ?? 2;
      const isDone = status === "DONE";

      // Increment status & priority counters
      byStatus[status]++;
      byPriority[priority]++;

      // Calculate completed today
      if (isDone && task.updatedAt >= todayStart) {
        completedToday++;
      }

      // Calculate overdue (dueDate in past & not done/cancelled)
      const isOverdue = task.dueDate && new Date(task.dueDate) < now && status !== "DONE" && status !== "CANCELLED";
      if (isOverdue) {
        overdue++;
      }

      // Legacy priority compatibility mapping
      if (priority !== "CRITICAL") {
        priorityMap[priority].total++;
        if (isOverdue) priorityMap[priority].due++;
        if (isDone) priorityMap[priority].completed++;
      } else {
        // map critical to HIGH in legacy compat
        priorityMap.HIGH.total++;
        if (isOverdue) priorityMap.HIGH.due++;
        if (isDone) priorityMap.HIGH.completed++;
      }

      const bucket: keyof HML = priority === "CRITICAL" || priority === "HIGH" ? "H" : priority === "MEDIUM" ? "M" : "L";

      // Assignee workload breakdown
      if (task.assignee) {
        const uid = task.assignee.id;
        if (!empMap.has(uid)) {
          empMap.set(uid, {
            id: uid,
            name: task.assignee.name,
            dept: task.assignee.department || "Unassigned",
            total: 0,
            due: emptyHML(),
            completed: emptyHML(),
            maxScore: 0,
            score: 0,
            avatarUrl: task.assignee.avatarUrl,
          });
        }
        const emp = empMap.get(uid)!;
        emp.total++;
        emp.maxScore += pts;
        if (status !== "DONE" && status !== "CANCELLED") {
          emp.due[bucket]++;
        }
        if (isDone) {
          emp.completed[bucket]++;
          emp.score += pts;
        }
      }

      // Department workload breakdown
      const deptName = task.assignee?.department || "General";
      if (!deptMap.has(deptName)) {
        deptMap.set(deptName, {
          name: deptName,
          total: 0,
          due: emptyHML(),
          completed: emptyHML(),
          maxScore: 0,
          score: 0,
        });
      }
      const dept = deptMap.get(deptName)!;
      dept.total++;
      dept.maxScore += pts;
      if (status !== "DONE" && status !== "CANCELLED") {
        dept.due[bucket]++;
      }
      if (isDone) {
        dept.completed[bucket]++;
        dept.score += pts;
      }
    }

    const statsData = {
      total,
      byStatus,
      byPriority,
      overdue,
      completedToday,
      employees: Array.from(empMap.values()),
      departments: Array.from(deptMap.values()),
      priorities: priorityMap, // legacy compatibility
    };

    return NextResponse.json<ApiResponse<typeof statsData>>({
      success: true,
      data: statsData,
    });
  } catch (err) {
    console.error("[GET TASK STATS ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to load task statistics." },
      { status: 500 }
    );
  }
}