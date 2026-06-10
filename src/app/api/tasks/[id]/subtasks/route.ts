import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.role, "create_subtask")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id: parentTaskId } = await params;
    const body = await req.json();

    if (!body.title) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }

    // Get parent task to inherit department
    const parentTask = await prisma.task.findUnique({
      where: { id: parentTaskId },
    });

    if (!parentTask) {
      return NextResponse.json({ success: false, error: "Parent task not found" }, { status: 404 });
    }

    const subtask = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description ?? null,
        status: body.status ?? "TODO",
        priority: body.priority ?? parentTask.priority,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        estimatedMinutes: body.estimatedMinutes ?? null,
        creatorId: session.id,
        assigneeId: body.assigneeId ?? null,
        parentTaskId,
        isSubtask: true,
        department: parentTask.department,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Create notification for assignee
    if (subtask.assigneeId) {
      const recipient = await prisma.user.findUnique({ where: { id: subtask.assigneeId }, select: { role: true } });
      const link = recipient?.role === "ADMIN" ? `/all-tasks?taskId=${subtask.id}` : `/my-tasks?taskId=${subtask.id}`;
      await prisma.notification.create({
        data: {
          userId: subtask.assigneeId,
          type: "SUBTASK_ASSIGNED",
          message: `${session.name} assigned you a subtask: "${subtask.title}"`,
          link,
        },
      });
    }

    // Write to AuditLog
    await prisma.auditLog.create({
      data: {
        action: "CREATE_SUBTASK",
        entityType: "TASK",
        entityId: subtask.id,
        performedBy: session.name,
        details: { parentTaskId, title: subtask.title },
      },
    });

    // Recalculate parent task progress
    const siblingSubtasks = await prisma.task.findMany({
      where: { parentTaskId },
      select: { id: true, status: true }
    });
    const doneCount = siblingSubtasks.filter(s => s.status === "DONE").length;
    const totalCount = siblingSubtasks.length;
    const parentProgress = Math.round((doneCount / totalCount) * 100);

    await prisma.task.update({
      where: { id: parentTaskId },
      data: { progress: parentProgress }
    });

    return NextResponse.json({ success: true, data: subtask });
  } catch (error: any) {
    console.error("[POST SUBTASK ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
