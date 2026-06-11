import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";
import { Priority, TaskStatus } from "@/types";

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
    const { department, mode, selectedTemplates, tasks } = body;

    if (!department) {
      return NextResponse.json({ success: false, error: "Department is required" }, { status: 400 });
    }

    if (mode !== "template" && mode !== "custom") {
      return NextResponse.json({ success: false, error: "Invalid mode. Must be 'template' or 'custom'." }, { status: 400 });
    }

    const createdTasksCount = await prisma.$transaction(async (tx) => {
      let count = 0;

      // In either mode, if the frontend sends the resolved and customized tasks array, use it!
      if (Array.isArray(tasks) && tasks.length > 0) {
        for (const taskObj of tasks) {
          if (!taskObj.title || !taskObj.title.trim()) {
            throw new Error("Task title is required");
          }

          const task = await tx.task.create({
            data: {
              title: taskObj.title.trim(),
              description: taskObj.description ? taskObj.description.trim() : null,
              priority: (taskObj.priority as Priority) || "MEDIUM",
              assigneeId: taskObj.assigneeId || null,
              dueDate: taskObj.dueDate ? new Date(taskObj.dueDate) : null,
              department: department,
              status: "TODO",
              creatorId: session.id,
              progress: 0,
              isSubtask: false,
            },
            include: {
              assignee: { select: { id: true, name: true, role: true } },
            },
          });

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

          // Create notification for assignee
          if (task.assigneeId) {
            const linkPath = task.assignee?.role === "ADMIN" ? "/all-tasks" : "/my-tasks";
            await tx.notification.create({
              data: {
                userId: task.assigneeId,
                type: "TASK_ASSIGNED",
                message: `${session.name} assigned you a new task: "${task.title}"`,
                link: `${linkPath}?taskId=${task.id}`,
              },
            });
          }
          count++;
        }
      } else if (mode === "template") {
        // Fallback: Resolve template items on the database side if tasks array is not provided
        if (!Array.isArray(selectedTemplates) || selectedTemplates.length === 0) {
          throw new Error("No templates selected");
        }

        const templates = await tx.taskTemplate.findMany({
          where: { id: { in: selectedTemplates } },
          include: { items: true },
        });

        for (const template of templates) {
          if (template.items && template.items.length > 0) {
            for (const item of template.items) {
              const task = await tx.task.create({
                data: {
                  title: item.title,
                  description: item.description || null,
                  priority: (item.priority as Priority) || "MEDIUM",
                  department: department,
                  status: "TODO",
                  creatorId: session.id,
                  progress: 0,
                  isSubtask: false,
                },
              });

              await tx.activity.create({
                data: {
                  userId: session.id,
                  action: "CREATE_TASK",
                  entityType: "TASK",
                  entityId: task.id,
                  taskId: task.id,
                  meta: { title: task.title },
                },
              });
              count++;
            }
          } else {
            // Fallback for single task templates (without items)
            const task = await tx.task.create({
              data: {
                title: template.name,
                description: template.description || null,
                priority: template.defaultPriority || "MEDIUM",
                department: department,
                status: "TODO",
                creatorId: session.id,
                checklistItems: template.checklistItems || undefined,
                progress: 0,
                isSubtask: false,
              },
            });

            await tx.activity.create({
              data: {
                userId: session.id,
                action: "CREATE_TASK",
                entityType: "TASK",
                entityId: task.id,
                taskId: task.id,
                meta: { title: task.title },
              },
            });
            count++;
          }
        }
      } else {
        throw new Error("No tasks provided");
      }

      // Write a single summary AuditLog for the bulk assignment
      await tx.auditLog.create({
        data: {
          action: "BULK_ASSIGN_TASKS",
          entityType: "TASK",
          performedBy: session.name,
          details: { count, department, mode, templatesCount: selectedTemplates?.length || 0 },
        },
      });

      return count;
    });

    return NextResponse.json({ success: true, data: { count: createdTasksCount } });
  } catch (error: any) {
    console.error("[POST BULK ASSIGN ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
