import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;

    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: comments });
  } catch (error: any) {
    console.error("[GET COMMENTS ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;
    const body = await req.json();

    if (!body.content) {
      return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { title: true, assigneeId: true, creatorId: true },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    // Verify access
    if (session.role === "EMPLOYEE" && task.assigneeId !== session.id && task.creatorId !== session.id) {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.id },
        select: { department: true }
      });
      const assignee = await prisma.user.findUnique({
        where: { id: task.assigneeId || "" },
        select: { department: true }
      });
      const creator = await prisma.user.findUnique({
        where: { id: task.creatorId || "" },
        select: { department: true }
      });
      const isColleague = currentUser?.department && (currentUser.department === assignee?.department || currentUser.department === creator?.department);
      if (!isColleague) {
        return NextResponse.json({ success: false, error: "Forbidden. You do not have permission to comment on this task." }, { status: 403 });
      }
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId: session.id,
        content: body.content,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Notify assignee and creator about comment if they are not the comment author
    if (task) {
      const notifyUserIds = new Set<string>();
      if (task.assigneeId && task.assigneeId !== session.id) notifyUserIds.add(task.assigneeId);
      if (task.creatorId && task.creatorId !== session.id) notifyUserIds.add(task.creatorId);

      for (const uid of notifyUserIds) {
        await prisma.notification.create({
          data: {
            userId: uid,
            type: "TASK_COMMENT",
            message: `${session.name} commented on "${task.title}": "${body.content.substring(0, 30)}..."`,
            link: `/my-tasks?taskId=${taskId}`,
          },
        });
      }
    }

    // Write to AuditLog
    await prisma.auditLog.create({
      data: {
        action: "ADD_COMMENT",
        entityType: "TASK",
        entityId: taskId,
        performedBy: session.name,
        details: { preview: body.content.substring(0, 50) },
      },
    });

    return NextResponse.json({ success: true, data: comment });
  } catch (error: any) {
    console.error("[POST COMMENT ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
