import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.role, "bulk_assign")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { taskIds, assigneeId } = body;

    if (!Array.isArray(taskIds) || taskIds.length === 0 || !assigneeId) {
      return NextResponse.json({ success: false, error: "taskIds array and assigneeId are required" }, { status: 400 });
    }

    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: { name: true },
    });

    if (!assignee) {
      return NextResponse.json({ success: false, error: "Assignee not found" }, { status: 404 });
    }

    const result = await prisma.task.updateMany({
      where: {
        id: { in: taskIds },
      },
      data: {
        assigneeId,
      },
    });

    // Notify assignee for each task
    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
      select: { id: true, title: true },
    });

    await Promise.all(
      tasks.map((task) =>
        prisma.notification.create({
          data: {
            userId: assigneeId,
            type: "TASK_ASSIGNED",
            message: `${session.name} assigned task to you: "${task.title}"`,
            link: `/my-tasks?taskId=${task.id}`,
          },
        })
      )
    );

    // Write to AuditLog
    await prisma.auditLog.create({
      data: {
        action: "BULK_ASSIGN_TASKS",
        entityType: "TASK",
        performedBy: session.name,
        details: { count: taskIds.length, taskIds, assigneeId, assigneeName: assignee.name },
      },
    });

    return NextResponse.json({ success: true, data: { count: result.count } });
  } catch (error: any) {
    console.error("[POST BULK ASSIGN ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
