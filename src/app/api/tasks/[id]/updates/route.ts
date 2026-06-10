import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { ApiResponse, UpdateType } from "@/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const updates = await prisma.taskUpdate.findMany({
      where: { taskId: id },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let filteredUpdates = updates;
    if (session.role === "EMPLOYEE") {
      const task = await prisma.task.findUnique({
        where: { id },
        select: { assigneeId: true, creatorId: true }
      });
      filteredUpdates = updates.filter(
        (up) => up.user.role === "ADMIN" || up.userId === session.id || (task && (up.userId === task.assigneeId || up.userId === task.creatorId))
      );
    }

    return NextResponse.json<ApiResponse<any[]>>({
      success: true,
      data: filteredUpdates,
    });
  } catch (err) {
    console.error("[GET TASK UPDATES ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch task updates." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const remark = body.remark?.trim();
    const hasAttachments = Array.isArray(body.attachments) && body.attachments.length > 0;

    if (!remark && !hasAttachments) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Remark/content is required." },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id },
      select: { id: true, title: true, assigneeId: true, creatorId: true },
    });

    if (!task) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
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
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "Forbidden. You do not have permission to update this task." },
          { status: 403 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create task update
      const update = await tx.taskUpdate.create({
        data: {
          taskId: id,
          userId: session.id,
          content: remark || ((Array.isArray(body.attachments) && body.attachments.some((a: any) => a.type === "audio")) ? "Posted voice recording" : "Uploaded attachments"),
          type: (body.type as UpdateType) ?? "COMMENT",
          attachments: body.attachments ?? undefined, // Store attachments
        },
        include: {
          comments: true,
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      // 2. Log Activity
      await tx.activity.create({
        data: {
          userId: session.id,
          action: "ADD_TASK_UPDATE",
          entityType: "TASK_UPDATE",
          entityId: update.id,
          taskId: id,
          meta: { type: update.type },
        },
      });

      // 3. Create Notification for the other party (creator or assignee)
      const recipientId = session.id === task.assigneeId ? task.creatorId : task.assigneeId;
      if (recipientId) {
        const recipient = await tx.user.findUnique({ where: { id: recipientId }, select: { role: true } });
        const taskLink = recipient?.role === "ADMIN" ? `/all-tasks?taskId=${task.id}` : `/my-tasks?taskId=${task.id}`;
        await tx.notification.create({
          data: {
            userId: recipientId,
            type: "TASK_UPDATED",
            message: `${session.name} added an update on task: "${task.title}"`,
            link: taskLink,
          },
        });
      }

      return update;
    }, { timeout: 30000 });

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (err) {
    console.error("[POST TASK UPDATE ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to post task update." },
      { status: 500 }
    );
  }
}