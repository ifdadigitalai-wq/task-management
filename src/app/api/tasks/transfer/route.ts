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

    if (!hasPermission(session.role, "change_status")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { fromUserId, toUserId, reason } = body;

    if (!fromUserId || !toUserId) {
      return NextResponse.json({ success: false, error: "fromUserId and toUserId are required" }, { status: 400 });
    }

    const fromUser = await prisma.user.findUnique({ where: { id: fromUserId }, select: { name: true } });
    const toUser = await prisma.user.findUnique({ where: { id: toUserId }, select: { name: true, role: true } });

    if (!fromUser || !toUser) {
      return NextResponse.json({ success: false, error: "Source or Target user not found" }, { status: 404 });
    }

    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: fromUserId,
        status: { notIn: ["DONE", "CANCELLED"] },
      },
      select: { id: true, title: true },
    });

    const taskIds = tasks.map((t) => t.id);

    const result = await prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: { assigneeId: toUserId },
    });

    await Promise.all(
      taskIds.map((taskId) =>
        prisma.taskTransfer.create({
          data: {
            taskId,
            fromUserId,
            toUserId,
            transferredBy: session.name,
            reason: reason || "Employee deactivation/status change",
          },
        })
      )
    );

    const linkPath = toUser.role === "ADMIN" ? "/all-tasks" : "/my-tasks";

    await Promise.all(
      tasks.map((task) =>
        prisma.notification.create({
          data: {
            userId: toUserId,
            type: "TASK_ASSIGNED",
            message: `Task "${task.title}" has been transferred and assigned to you. (Previous assignee: ${fromUser.name})`,
            link: `${linkPath}?taskId=${task.id}`,
          },
        })
      )
    );

    await prisma.auditLog.create({
      data: {
        action: "TRANSFER_EMPLOYEE_TASKS",
        entityType: "USER",
        entityId: fromUserId,
        performedBy: session.name,
        details: {
          fromUserId,
          fromUserName: fromUser.name,
          toUserId,
          toUserName: toUser.name,
          transferredCount: result.count,
          taskIds,
          reason,
        },
      },
    });

    return NextResponse.json({ success: true, data: { count: result.count } });
  } catch (error: any) {
    console.error("[POST TASK TRANSFER ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
