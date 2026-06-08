import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { ApiResponse, TaskStatus, Priority } from "@/types";
import { sendWhatsAppTaskReminder } from "@/lib/whatsapp";
import { sendEmailTaskReminder } from "@/lib/email";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeIdParam = searchParams.get("assigneeId");
    const search = searchParams.get("search");
    const dateRange = searchParams.get("dateRange");

    const where: any = {
      parentTaskId: null,
    };

    // 1. Enforce Employee Scope (employees can only see tasks assigned to them)
    if (session.role === "EMPLOYEE") {
      where.assigneeId = session.id;
    } else {
      // Admin filter by assigneeId
      if (assigneeIdParam && assigneeIdParam !== "ALL") {
        where.assigneeId = assigneeIdParam;
      }
    }

    // 2. Status Filter
    if (status && status !== "ALL") {
      where.status = status as TaskStatus;
    }

    // 3. Priority Filter
    if (priority && priority !== "ALL") {
      where.priority = priority as Priority;
    }

    // 4. Search Filter
    if (search && search.trim() !== "") {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
      ];
    }

    // 5. Date Range Filter
    if (dateRange && dateRange !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startOfDay = new Date(today);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      if (dateRange === "today") {
        where.dueDate = {
          gte: startOfDay,
          lte: endOfDay,
        };
      } else if (dateRange === "yesterday") {
        const yesterdayStart = new Date(startOfDay);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(endOfDay);
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
        where.dueDate = {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        };
      } else if (dateRange === "tomorrow") {
        const tomorrowStart = new Date(startOfDay);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        const tomorrowEnd = new Date(endOfDay);
        tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
        where.dueDate = {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        };
      } else if (dateRange === "this-week") {
        const startOfWeek = new Date(today);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        where.dueDate = {
          gte: startOfWeek,
          lte: endOfWeek,
        };
      }
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        subTasks: {
          select: { id: true, title: true, status: true },
        },
        timers: {
          select: { id: true, startedAt: true, stoppedAt: true, durationMinutes: true },
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json<ApiResponse<any[]>>({
      success: true,
      data: tasks,
    });
  } catch (err) {
    console.error("[GET TASKS ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch tasks." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Forbidden. Only admins can create tasks or subtasks." },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (!body.title) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Task title is required." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title: body.title,
          description: body.description ?? undefined,
          status: (body.status as TaskStatus) ?? "TODO",
          priority: (body.priority as Priority) ?? "MEDIUM",
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          estimatedMinutes: body.estimatedMinutes ? parseInt(body.estimatedMinutes) : undefined,
          actualMinutes: body.actualMinutes ? parseInt(body.actualMinutes) : 0,
          creatorId: session.id,
          assigneeId: body.assigneeId ?? undefined,
          templateId: body.templateId ?? undefined,
          parentTaskId: body.parentTaskId ?? undefined,
          tags: Array.isArray(body.tags) ? body.tags : [],
          checklistItems: body.checklistItems ?? undefined, // Store as JSON
          recurrence: body.recurrence ?? undefined,     // Store as JSON
          department: body.department || "General",
          frequency: body.frequency || "ONE_TIME",
          customFrequency: body.customFrequency || null,
          attachments: body.attachments && Array.isArray(body.attachments)
            ? {
                create: body.attachments.map((att: any) => ({
                  url: att.url,
                  filename: att.filename || att.name || "attachment",
                  uploadedBy: session.name,
                })),
              }
            : undefined,
          reminderSettings: body.reminderSettings
            ? {
                create: {
                  beforeDueDate: body.reminderSettings.beforeDueDate ?? true,
                  onDueDate: body.reminderSettings.onDueDate ?? true,
                  recurring: body.reminderSettings.recurring ?? false,
                  emailNotification: body.reminderSettings.emailNotification ?? false,
                  inAppNotification: body.reminderSettings.inAppNotification ?? true,
                },
              }
            : undefined,
        },
        include: {
          assignee: { select: { id: true, name: true, email: true, phone: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      });

      // Helper: determine the correct notification link based on recipient role
      const getTaskLink = async (recipientId: string, taskId: string) => {
        const recipient = await tx.user.findUnique({ where: { id: recipientId }, select: { role: true } });
        return recipient?.role === "ADMIN" ? `/all-tasks?taskId=${taskId}` : `/my-tasks?taskId=${taskId}`;
      };

      // Log Activity
      await tx.activity.create({
        data: {
          userId: session.id,
          action: "CREATE_TASK",
          entityType: "TASK",
          entityId: task.id,
          taskId: task.id,
          meta: { title: task.title, assignee: task.assignee?.name },
        },
      });

      // Create Assignment Notification
      if (task.assigneeId) {
        const creatorName = task.creator?.name || "Someone";
        const isSubtask = !!task.parentTaskId;
        await tx.notification.create({
          data: {
            userId: task.assigneeId,
            type: isSubtask ? "SUBTASK_ADDED" : "TASK_ASSIGNED",
            message: isSubtask
              ? `${creatorName} assigned you a new subtask: "${task.title}"`
              : `${creatorName} assigned you a new task: "${task.title}"`,
            link: await getTaskLink(task.assigneeId, task.id),
          },
        });
      }

      // If it's a subtask, notify parent task assignee
      if (task.parentTaskId) {
        const parentTask = await tx.task.findUnique({
          where: { id: task.parentTaskId },
          select: { title: true, assigneeId: true },
        });
        if (parentTask && parentTask.assigneeId && parentTask.assigneeId !== session.id) {
          const creatorName = session.name || "Admin";
          await tx.notification.create({
            data: {
              userId: parentTask.assigneeId,
              type: "SUBTASK_ADDED",
              message: `${creatorName} added a new subtask "${task.title}" to your task: "${parentTask.title}"`,
              link: await getTaskLink(parentTask.assigneeId, task.parentTaskId),
            },
          });
        }
      }

      return task;
    }, { timeout: 30000 });

    // Outbound Reminders (WhatsApp & Email) outside transaction to avoid db locks
    if (result.assigneeId && result.assignee) {
      const { remindVia } = body;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const taskLink = `${appUrl}/my-tasks?taskId=${result.id}`;

      if (Array.isArray(remindVia)) {
        if (remindVia.includes("whatsapp") && result.assignee.phone) {
          try {
            await sendWhatsAppTaskReminder({
              employeePhone: result.assignee.phone,
              employeeName: result.assignee.name,
              taskTitle: result.title,
              taskDescription: result.description,
              taskPriority: result.priority,
              taskDueDate: result.dueDate,
              taskLink,
            });
          } catch (err) {
            console.error("WhatsApp reminder sending failed:", err);
          }
        }

        if (remindVia.includes("email") && result.assignee.email) {
          try {
            await sendEmailTaskReminder({
              employeeEmail: result.assignee.email,
              employeeName: result.assignee.name,
              taskTitle: result.title,
              taskDescription: result.description,
              taskPriority: result.priority,
              taskDueDate: result.dueDate,
              taskLink,
            });
          } catch (err) {
            console.error("Email reminder sending failed:", err);
          }
        }
      }
    }

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (err) {
    console.error("[POST TASK ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to create task." },
      { status: 500 }
    );
  }
}