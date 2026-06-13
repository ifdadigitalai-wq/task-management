import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { ApiResponse, TaskStatus, Priority } from "@/types";

export async function GET(
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

    const task = await prisma.task.findUnique({
      where: { id },
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

    if (!task) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Task not found." },
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
          { success: false, error: "Forbidden. You do not have permission to view this task." },
          { status: 403 }
        );
      }
    }

    // Filter updates and subtasks for employees
    if (task && session.role === "EMPLOYEE") {
      task.updates = task.updates.filter(
        (up: any) => up.user.role === "ADMIN" || up.userId === session.id || up.userId === task.assigneeId || up.userId === task.creatorId
      );
      if (task.assigneeId !== session.id && task.creatorId !== session.id) {
        task.subTasks = task.subTasks.filter(
          (sub: any) => sub.assigneeId === session.id || sub.assigneeId === task.assigneeId
        );
      }
    }

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: task,
    });
  } catch (err) {
    console.error("[GET TASK BY ID ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch task details." },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const existingTask = await prisma.task.findUnique({ where: { id } });

    if (!existingTask) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Task not found." },
        { status: 404 }
      );
    }

    // Employees can only edit tasks assigned to them or created by them, or if it is a subtask of a task assigned to/created by them
    let isAllowed = false;
    if (session.role !== "EMPLOYEE") {
      isAllowed = true;
    } else {
      if (existingTask.assigneeId === session.id || existingTask.creatorId === session.id) {
        isAllowed = true;
      } else if (existingTask.parentTaskId) {
        const parentTask = await prisma.task.findUnique({
          where: { id: existingTask.parentTaskId },
          select: { assigneeId: true, creatorId: true }
        });
        if (parentTask && (parentTask.assigneeId === session.id || parentTask.creatorId === session.id)) {
          isAllowed = true;
        }
      }
    }

    if (!isAllowed) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Forbidden. You cannot edit this task." },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (session.role === "EMPLOYEE" && body.status === "DONE" && !existingTask.parentTaskId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Forbidden. Only administrators can mark parent tasks as completed." },
        { status: 403 }
      );
    }
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status as TaskStatus;
    if (body.priority !== undefined) updateData.priority = body.priority as Priority;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.estimatedMinutes !== undefined) updateData.estimatedMinutes = body.estimatedMinutes ? parseInt(body.estimatedMinutes) : null;
    if (body.actualMinutes !== undefined) updateData.actualMinutes = body.actualMinutes ? parseInt(body.actualMinutes) : null;
    if (body.assigneeId !== undefined) {
      updateData.assigneeId = body.assigneeId;
      if (body.assigneeId) {
        const newAssignee = await prisma.user.findUnique({
          where: { id: body.assigneeId },
          select: { department: true }
        });
        if (newAssignee?.department) {
          updateData.department = newAssignee.department;
        }
      }
      updateData.delegationPending = false;
      updateData.delegationStatus = null;
      updateData.delegationToId = null;
      updateData.delegationFromId = null;
    }
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.checklistItems !== undefined) updateData.checklistItems = body.checklistItems;
    if (body.recurrence !== undefined) updateData.recurrence = body.recurrence;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.frequency !== undefined) updateData.frequency = body.frequency;
    if (body.customFrequency !== undefined) updateData.customFrequency = body.customFrequency;
    if (body.progress !== undefined) updateData.progress = body.progress;
    if (body.remark !== undefined) updateData.remark = body.remark;
    if (body.attachments !== undefined) {
      updateData.attachments = {
        deleteMany: {},
        create: body.attachments.map((att: any) => ({
          url: att.url,
          filename: att.filename || att.name || "attachment",
          uploadedBy: session.name,
        })),
      };
    }
    if (body.reminderSettings !== undefined) {
      updateData.reminderSettings = {
        upsert: {
          create: {
            beforeDueDate: body.reminderSettings.beforeDueDate ?? true,
            onDueDate: body.reminderSettings.onDueDate ?? true,
            recurring: body.reminderSettings.recurring ?? false,
            emailNotification: body.reminderSettings.emailNotification ?? false,
            inAppNotification: body.reminderSettings.inAppNotification ?? true,
          },
          update: {
            beforeDueDate: body.reminderSettings.beforeDueDate,
            onDueDate: body.reminderSettings.onDueDate,
            recurring: body.reminderSettings.recurring,
            emailNotification: body.reminderSettings.emailNotification,
            inAppNotification: body.reminderSettings.inAppNotification,
          },
        },
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id },
        data: updateData,
        include: {
          assignee: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
        },
      });

      // Recalculate parent task progress if status changed on a subtask
      if (body.status !== undefined && body.status !== existingTask.status && existingTask.parentTaskId) {
        const siblingSubtasks = await tx.task.findMany({
          where: { parentTaskId: existingTask.parentTaskId },
          select: { id: true, status: true }
        });
        const updatedSiblings = siblingSubtasks.map(s => s.id === id ? { ...s, status: body.status } : s);
        const doneCount = updatedSiblings.filter(s => s.status === "DONE").length;
        const totalCount = updatedSiblings.length;
        const parentProgress = Math.round((doneCount / totalCount) * 100);
        
        await tx.task.update({
          where: { id: existingTask.parentTaskId },
          data: { progress: parentProgress }
        });
      }

      // Helper: determine the correct notification link based on recipient role
      const getTaskLink = async (recipientId: string, taskId: string) => {
        const recipient = await tx.user.findUnique({ where: { id: recipientId }, select: { role: true } });
        return recipient?.role === "ADMIN" ? `/all-tasks?taskId=${taskId}` : `/my-tasks?taskId=${taskId}`;
      };

      // Log Activity
      await tx.activity.create({
        data: {
          userId: session.id,
          action: "UPDATE_TASK",
          entityType: "TASK",
          entityId: task.id,
          taskId: task.id,
          meta: { fieldsUpdated: Object.keys(updateData), status: task.status },
        },
      });

      // Send status change notification if status changed
      if (body.status !== undefined && body.status !== existingTask.status) {
        if (task.status === "DONE") {
          const isSubtask = !!task.parentTaskId;
          if (isSubtask) {
            let parentAssigneeId: string | null = null;
            if (task.parentTaskId) {
              const parent = await tx.task.findUnique({
                where: { id: task.parentTaskId },
                select: { assigneeId: true },
              });
              parentAssigneeId = parent?.assigneeId || null;
            }

            // Notify Creator
            if (task.creatorId && task.creatorId !== session.id) {
              await tx.notification.create({
                data: {
                  userId: task.creatorId,
                  type: "SUBTASK_COMPLETED",
                  message: `${session.name} completed the subtask: "${task.title}"`,
                  link: await getTaskLink(task.creatorId, task.id),
                },
              });
            }

            // Notify Parent Task Assignee
            if (parentAssigneeId && parentAssigneeId !== session.id && parentAssigneeId !== task.creatorId) {
              await tx.notification.create({
                data: {
                  userId: parentAssigneeId,
                  type: "SUBTASK_COMPLETED",
                  message: `${session.name} completed the subtask "${task.title}" on your task`,
                  link: await getTaskLink(parentAssigneeId, task.parentTaskId!),
                },
              });
            }
          } else {
            const recipientId = session.id === task.assigneeId ? task.creatorId : task.assigneeId;
            if (recipientId) {
              await tx.notification.create({
                data: {
                  userId: recipientId,
                  type: "TASK_COMPLETED",
                  message: `${session.name} completed the task: "${task.title}"`,
                  link: await getTaskLink(recipientId, task.id),
                },
              });
            }
          }
        } else {
          const recipientId = session.id === task.assigneeId ? task.creatorId : task.assigneeId;
          if (recipientId) {
            await tx.notification.create({
              data: {
                userId: recipientId,
                type: "STATUS_CHANGED",
                message: `${session.name} updated the task status for "${task.title}"`,
                link: await getTaskLink(recipientId, task.id),
              },
            });
          }
        }
      }

      // Send assignment notification if assignee changed
      if (body.assigneeId !== undefined && body.assigneeId !== existingTask.assigneeId && body.assigneeId) {
        await tx.notification.create({
          data: {
            userId: body.assigneeId,
            type: "TASK_ASSIGNED",
            message: `${session.name} assigned you the task: "${task.title}"`,
            link: await getTaskLink(body.assigneeId, task.id),
          },
        });
      }

      // Send general details updated notification
      const updatedFields = Object.keys(updateData).filter(key => updateData[key] !== undefined && updateData[key] !== (existingTask as any)[key]);
      const detailKeys = ["title", "description", "priority", "dueDate"];
      const hasDetailUpdates = updatedFields.some(key => detailKeys.includes(key));
      if (hasDetailUpdates) {
        const recipientId = session.id === task.assigneeId ? task.creatorId : task.assigneeId;
        if (recipientId) {
          await tx.notification.create({
            data: {
              userId: recipientId,
              type: "TASK_UPDATED",
              message: `${session.name} updated the details of task: "${task.title}"`,
              link: await getTaskLink(recipientId, task.id),
            },
          });
        }
      }

      return task;
    }, { timeout: 30000 });

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("[PATCH TASK ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to update task." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const task = await tx.task.delete({
        where: { id },
      });

      if (task.parentTaskId) {
        const siblingSubtasks = await tx.task.findMany({
          where: { parentTaskId: task.parentTaskId },
          select: { id: true, status: true }
        });
        const totalCount = siblingSubtasks.length;
        const doneCount = siblingSubtasks.filter(s => s.status === "DONE").length;
        const parentProgress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

        await tx.task.update({
          where: { id: task.parentTaskId },
          data: { progress: parentProgress }
        });
      }

      await tx.activity.create({
        data: {
          userId: session.id,
          action: "DELETE_TASK",
          entityType: "TASK",
          entityId: id,
          meta: { title: task.title },
        },
      });
    }, { timeout: 30000 });

    return NextResponse.json<ApiResponse<null>>({
      success: true,
    });
  } catch (err) {
    console.error("[DELETE TASK ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to delete task." },
      { status: 500 }
    );
  }
}