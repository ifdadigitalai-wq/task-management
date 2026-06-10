import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

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

    const { id: taskId } = await params;
    const { action, colleagueId } = await req.json();

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignee: true, creator: true }
    });

    if (!task) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Task not found." },
        { status: 404 }
      );
    }

    const currentUserId = session.id;

    // Helper to fetch admin users to notify them
    const getAdmins = async () => {
      return await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true }
      });
    };

    if (action === "request") {
      // Verify current user is the assignee
      if (task.assigneeId !== currentUserId) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "You are not the assignee of this task." },
          { status: 403 }
        );
      }

      // Fetch colleague user to ensure they are active and in the same department
      const colleague = await prisma.user.findUnique({
        where: { id: colleagueId }
      });

      if (!colleague || !colleague.isActive) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "Colleague not found or inactive." },
          { status: 400 }
        );
      }

      // Verify they are in the same department
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId }
      });

      if (!currentUser || currentUser.department !== colleague.department) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "You can only delegate tasks to colleagues in the same department." },
          { status: 403 }
        );
      }

      // Initiate delegation
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          delegationPending: true,
          delegationStatus: "PENDING",
          delegationToId: colleagueId,
          delegationFromId: currentUserId
        },
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          creator: { select: { id: true, name: true, email: true } },
          subTasks: { select: { id: true, title: true, status: true } },
          timers: { select: { id: true, startedAt: true, stoppedAt: true, durationMinutes: true } },
          attachments: true,
          comments: { include: { user: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { createdAt: "asc" } },
          reminderSettings: true
        }
      });

      // Log activity
      await prisma.activity.create({
        data: {
          userId: currentUserId,
          action: "DELEGATION_REQUESTED",
          entityType: "TASK",
          entityId: task.id,
          taskId: task.id,
          meta: { title: task.title, delegationTo: colleague.name }
        }
      });

      // Notify Y
      await prisma.notification.create({
        data: {
          userId: colleagueId,
          type: "DELEGATION_PENDING",
          message: `${currentUser!.name} requested to delegate the task "${task.title}" to you.`,
          link: `/my-tasks?taskId=${task.id}`
        }
      });

      // Notify X (Requester)
      await prisma.notification.create({
        data: {
          userId: currentUserId,
          type: "DELEGATION_REQUESTED",
          message: `You requested to delegate the task "${task.title}" to ${colleague.name}.`,
          link: `/my-tasks?taskId=${task.id}`
        }
      });

      // Notify all Admin users
      const admins = await getAdmins();
      const adminMsg = `${currentUser!.name} requested to delegate the task "${task.title}" to ${colleague.name}.`;
      await Promise.all(
        admins.map((adm) =>
          prisma.notification.create({
            data: {
              userId: adm.id,
              type: "DELEGATION_REQUESTED",
              message: adminMsg,
              link: `/all-tasks?taskId=${task.id}`
            }
          })
        )
      );

      return NextResponse.json({ success: true, data: updatedTask });
    }

    if (action === "cancel") {
      // Verify X is the one who requested
      if (task.delegationFromId !== currentUserId) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "You did not initiate this delegation request." },
          { status: 403 }
        );
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          delegationPending: false,
          delegationStatus: null,
          delegationToId: null,
          delegationFromId: null
        },
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          creator: { select: { id: true, name: true, email: true } },
          subTasks: { select: { id: true, title: true, status: true } },
          timers: { select: { id: true, startedAt: true, stoppedAt: true, durationMinutes: true } },
          attachments: true,
          comments: { include: { user: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { createdAt: "asc" } },
          reminderSettings: true
        }
      });

      return NextResponse.json({ success: true, data: updatedTask });
    }

    if (action === "resend") {
      // Verify X is the one who requested
      if (task.delegationFromId !== currentUserId || !task.delegationToId) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "No active delegation request found to resend." },
          { status: 403 }
        );
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId }
      });

      // Reset status back to PENDING and set pending to true
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          delegationPending: true,
          delegationStatus: "PENDING"
        },
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          creator: { select: { id: true, name: true, email: true } },
          subTasks: { select: { id: true, title: true, status: true } },
          timers: { select: { id: true, startedAt: true, stoppedAt: true, durationMinutes: true } },
          attachments: true,
          comments: { include: { user: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { createdAt: "asc" } },
          reminderSettings: true
        }
      });

      // Re-notify Y
      await prisma.notification.create({
        data: {
          userId: task.delegationToId,
          type: "DELEGATION_PENDING",
          message: `Reminder: ${currentUser?.name} requested to delegate the task "${task.title}" to you.`,
          link: `/my-tasks?taskId=${task.id}`
        }
      });

      return NextResponse.json({ success: true, data: updatedTask });
    }

    if (action === "accept") {
      // Verify Y is the target of the delegation
      if (task.delegationToId !== currentUserId) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "This task is not delegated to you." },
          { status: 403 }
        );
      }

      const delegationFrom = await prisma.user.findUnique({
        where: { id: task.delegationFromId! }
      });

      const colleagueY = await prisma.user.findUnique({
        where: { id: currentUserId }
      });

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          assigneeId: currentUserId,
          department: colleagueY?.department || task.department,
          delegationPending: false,
          delegationStatus: null,
          delegationToId: null,
          delegationFromId: null
        },
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          creator: { select: { id: true, name: true, email: true } },
          subTasks: { select: { id: true, title: true, status: true } },
          timers: { select: { id: true, startedAt: true, stoppedAt: true, durationMinutes: true } },
          attachments: true,
          comments: { include: { user: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { createdAt: "asc" } },
          reminderSettings: true
        }
      });

      // Log activity
      await prisma.activity.create({
        data: {
          userId: currentUserId,
          action: "DELEGATION_ACCEPTED",
          entityType: "TASK",
          entityId: task.id,
          taskId: task.id,
          meta: { title: task.title, delegationFrom: delegationFrom?.name }
        }
      });

      // Trigger notifications: to employee X and to admin
      const notificationMsg = `The task "${task.title}" delegation request from emp. ${delegationFrom?.name} from dept. ${delegationFrom?.department} has been accepted by ${colleagueY?.name}`;

      // 1. Notify X (delegationFrom)
      await prisma.notification.create({
        data: {
          userId: delegationFrom!.id,
          type: "DELEGATION_ACCEPTED",
          message: notificationMsg,
          link: `/my-tasks?taskId=${task.id}`
        }
      });

      // 2. Notify all Admin users
      const admins = await getAdmins();
      await Promise.all(
        admins.map((adm) =>
          prisma.notification.create({
            data: {
              userId: adm.id,
              type: "DELEGATION_ACCEPTED",
              message: notificationMsg,
              link: `/all-tasks?taskId=${task.id}`
            }
          })
        )
      );

      return NextResponse.json({ success: true, data: updatedTask });
    }

    if (action === "decline") {
      // Verify Y is the target of the delegation
      if (task.delegationToId !== currentUserId) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "This task is not delegated to you." },
          { status: 403 }
        );
      }

      const delegationFrom = await prisma.user.findUnique({
        where: { id: task.delegationFromId! }
      });

      const colleagueY = await prisma.user.findUnique({
        where: { id: currentUserId }
      });

      // Set delegationStatus to "DECLINED" and keep pending true
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          delegationPending: true,
          delegationStatus: "DECLINED"
        },
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          creator: { select: { id: true, name: true, email: true } },
          subTasks: { select: { id: true, title: true, status: true } },
          timers: { select: { id: true, startedAt: true, stoppedAt: true, durationMinutes: true } },
          attachments: true,
          comments: { include: { user: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { createdAt: "asc" } },
          reminderSettings: true
        }
      });

      // Log activity
      await prisma.activity.create({
        data: {
          userId: currentUserId,
          action: "DELEGATION_DECLINED",
          entityType: "TASK",
          entityId: task.id,
          taskId: task.id,
          meta: { title: task.title, delegationFrom: delegationFrom?.name }
        }
      });

      // Trigger notifications: to employee X and to admin
      const notificationMsg = `The task "${task.title}" delegation request from emp. ${delegationFrom?.name} from dept. ${delegationFrom?.department} has been declined by ${colleagueY?.name}`;

      // 1. Notify X (delegationFrom)
      await prisma.notification.create({
        data: {
          userId: delegationFrom!.id,
          type: "DELEGATION_DECLINED",
          message: notificationMsg,
          link: `/my-tasks?taskId=${task.id}`
        }
      });

      // 2. Notify all Admin users
      const admins = await getAdmins();
      await Promise.all(
        admins.map((adm) =>
          prisma.notification.create({
            data: {
              userId: adm.id,
              type: "DELEGATION_DECLINED",
              message: notificationMsg,
              link: `/all-tasks?taskId=${task.id}`
            }
          })
        )
      );

      return NextResponse.json({ success: true, data: updatedTask });
    }

    if (action === "clear_declined") {
      // Verify X is clearing it
      if (task.delegationFromId !== currentUserId) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "You did not initiate this delegation request." },
          { status: 403 }
        );
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          delegationPending: false,
          delegationStatus: null,
          delegationToId: null,
          delegationFromId: null
        },
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          creator: { select: { id: true, name: true, email: true } },
          subTasks: { select: { id: true, title: true, status: true } },
          timers: { select: { id: true, startedAt: true, stoppedAt: true, durationMinutes: true } },
          attachments: true,
          comments: { include: { user: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { createdAt: "asc" } },
          reminderSettings: true
        }
      });

      return NextResponse.json({ success: true, data: updatedTask });
    }

    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Invalid action." },
      { status: 400 }
    );

  } catch (err) {
    console.error("[DELEGATE TASK ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
