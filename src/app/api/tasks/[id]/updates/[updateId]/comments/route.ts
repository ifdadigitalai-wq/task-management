import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; updateId: string }> }
) {
  try {
    const { id, updateId } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { text } = await req.json();
    if (!text || text.trim() === "") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Comment text is required." },
        { status: 400 }
      );
    }

    const taskUpdate = await prisma.taskUpdate.findUnique({
      where: { id: updateId },
      include: {
        user: { select: { role: true } }
      }
    });

    if (!taskUpdate) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Task update not found." },
        { status: 404 }
      );
    }

    if (session.role === "EMPLOYEE" && taskUpdate.user.role === "EMPLOYEE" && taskUpdate.userId !== session.id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Forbidden. You cannot comment on this task update." },
        { status: 403 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the comment
      const comment = await tx.taskUpdateComment.create({
        data: {
          taskUpdateId: updateId,
          body: text,
          userId: session.id,
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      // 2. Fetch the Task to determine who to notify
      const taskUpdate = await tx.taskUpdate.findUnique({
        where: { id: updateId },
        include: {
          task: {
            select: { id: true, title: true, assigneeId: true, creatorId: true },
          },
        },
      });

      if (taskUpdate?.task) {
        const { task } = taskUpdate;

        // 3. Determine recipient
        const recipientId = session.id === task.assigneeId ? task.creatorId : task.assigneeId;
        const link = `/my-tasks?taskId=${task.id}`;

        // 4. Create the Notification
        if (recipientId) {
          await tx.notification.create({
            data: {
              userId: recipientId,
              type: "COMMENT_ADDED",
              message: `${session.name} commented on task update: "${task.title}"`,
              link,
            },
          });
        }
      }

      // 5. Create Activity Log
      await tx.activity.create({
        data: {
          userId: session.id,
          action: "ADD_COMMENT",
          entityType: "TASK_COMMENT",
          entityId: comment.id,
          taskId: id,
        },
      });

      return comment;
    }, { timeout: 30000 });

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (err) {
    console.error("[POST TASK COMMENT ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to post comment." },
      { status: 500 }
    );
  }
}