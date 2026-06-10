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

    if (!hasPermission(session.role, "delegate")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id: taskId } = await params;
    const body = await req.json();

    if (!body.assigneeId) {
      return NextResponse.json({ success: false, error: "Assignee ID is required" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    const previousAssigneeId = task.assigneeId;

    const newAssignee = await prisma.user.findUnique({
      where: { id: body.assigneeId },
      select: { department: true }
    });

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        assigneeId: body.assigneeId,
        department: newAssignee?.department || task.department,
        delegationPending: false,
        delegationStatus: null,
        delegationToId: null,
        delegationFromId: null,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true, department: true, jobTitle: true },
        },
        creator: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        subTasks: {
          include: {
            assignee: { select: { id: true, name: true, avatarUrl: true } }
          }
        },
        updates: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true, role: true },
            },
            comments: {
              orderBy: { createdAt: "asc" },
              include: {
                user: {
                  select: { id: true, name: true, avatarUrl: true, role: true },
                },
              },
            },
          },
        },
        attachments: true,
        comments: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        reminderSettings: true,
      },
    });

    // Create notification for new assignee
    const recipient = await prisma.user.findUnique({ where: { id: body.assigneeId }, select: { role: true } });
    const link = recipient?.role === "ADMIN" ? `/all-tasks?taskId=${task.id}` : `/my-tasks?taskId=${task.id}`;
    await prisma.notification.create({
      data: {
        userId: body.assigneeId,
        type: "TASK_DELEGATED",
        message: `${session.name} delegated a task to you: "${task.title}"`,
        link,
      },
    });

    // Write to AuditLog
    await prisma.auditLog.create({
      data: {
        action: "DELEGATE_TASK",
        entityType: "TASK",
        entityId: task.id,
        performedBy: session.name,
        details: { previousAssigneeId, newAssigneeId: body.assigneeId, title: task.title },
      },
    });

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error: any) {
    console.error("[POST DELEGATE ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
