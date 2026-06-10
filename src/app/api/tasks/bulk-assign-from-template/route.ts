import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { Priority } from "@prisma/client";
import { sendWhatsAppTaskReminder } from "@/lib/whatsapp";
import { sendEmailTaskReminder } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN" && session.role !== "EMPLOYEE") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { templateId, employeeIds, dueDate } = body;

    if (!templateId || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "templateId and a non-empty employeeIds array are required" },
        { status: 400 }
      );
    }

    // Fetch template
    const template = await prisma.taskTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    // Fetch assignees
    const assignees = await prisma.user.findMany({
      where: {
        id: { in: employeeIds },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        email: true,
      },
    });

    if (assignees.length !== employeeIds.length) {
      return NextResponse.json(
        { success: false, error: "Some selected employees are inactive or do not exist." },
        { status: 400 }
      );
    }

    // Role-based validations
    if (session.role === "EMPLOYEE") {
      // Find currentUser department
      const currentUser = await prisma.user.findUnique({
        where: { id: session.id },
        select: { department: true },
      });

      if (!currentUser || !currentUser.department) {
        return NextResponse.json(
          { success: false, error: "Employee must belong to a department to assign tasks." },
          { status: 400 }
        );
      }

      // Check if all selected employees are in the same department
      const invalidAssignee = assignees.find((emp) => emp.department !== currentUser.department);
      if (invalidAssignee) {
        return NextResponse.json(
          { success: false, error: "You can only assign tasks to colleagues in your department." },
          { status: 403 }
        );
      }

      // Check if template department matches employee department (or is General)
      if (template.department !== "General" && template.department !== currentUser.department) {
        return NextResponse.json(
          { success: false, error: "You cannot assign a blueprint from another department." },
          { status: 403 }
        );
      }
    }

    // Map template checklist items (Json string[] -> Json { text, completed }[])
    let mappedChecklist: { text: string; completed: boolean }[] = [];
    if (Array.isArray(template.checklistItems)) {
      mappedChecklist = template.checklistItems.map((item: any) => ({
        text: typeof item === "string" ? item : String(item),
        completed: false,
      }));
    }

    // Create Tasks inside transaction
    const createdTasks = await prisma.$transaction(async (tx) => {
      const tasksList = [];

      for (const assignee of assignees) {
        const task = await tx.task.create({
          data: {
            title: template.name,
            description: template.description || null,
            status: "TODO",
            priority: template.defaultPriority,
            dueDate: dueDate ? new Date(dueDate) : null,
            creatorId: session.id,
            assigneeId: assignee.id,
            templateId: template.id,
            checklistItems: mappedChecklist,
            recurrence: template.recurrence || undefined,
            department: template.department || "General",
            frequency: template.frequency,
            customFrequency: template.customFrequency,
            reminderSettings: {
              create: {
                beforeDueDate: true,
                onDueDate: true,
                recurring: false,
                emailNotification: Array.isArray(template.remindVia) ? template.remindVia.includes("email") : false,
                inAppNotification: true,
              },
            },
          },
        });

        // Log Activity
        await tx.activity.create({
          data: {
            userId: session.id,
            action: "CREATE_TASK",
            entityType: "TASK",
            entityId: task.id,
            taskId: task.id,
            meta: { title: task.title, assignee: assignee.name },
          },
        });

        // Create Assignment Notification
        const linkPath = assignee.role === "ADMIN" ? "/all-tasks" : "/my-tasks";
        await tx.notification.create({
          data: {
            userId: assignee.id,
            type: "TASK_ASSIGNED",
            message: `${session.name} assigned you a new task: "${task.title}"`,
            link: `${linkPath}?taskId=${task.id}`,
          },
        });

        tasksList.push({
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate,
          assignee,
        });
      }

      // Write to AuditLog
      await tx.auditLog.create({
        data: {
          action: "BULK_ASSIGN_FROM_TEMPLATE",
          entityType: "TASK",
          performedBy: session.name,
          details: {
            templateId: template.id,
            templateName: template.name,
            employeeIds,
            count: employeeIds.length,
          },
        },
      });

      return tasksList;
    }, { timeout: 30000 });

    // Send notifications/reminders outside transaction
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const remindVia = Array.isArray(template.remindVia) ? template.remindVia : [];

    if (remindVia.length > 0) {
      for (const t of createdTasks) {
        const taskLink = t.assignee.role === "ADMIN"
          ? `${appUrl}/all-tasks?taskId=${t.id}`
          : `${appUrl}/my-tasks?taskId=${t.id}`;

        if (remindVia.includes("whatsapp") && t.assignee.phone) {
          try {
            await sendWhatsAppTaskReminder({
              employeePhone: t.assignee.phone,
              employeeName: t.assignee.name,
              taskTitle: t.title,
              taskDescription: t.description,
              taskPriority: t.priority,
              taskDueDate: t.dueDate,
              taskLink,
            });
          } catch (err) {
            console.error(`WhatsApp reminder failed for ${t.assignee.name}:`, err);
          }
        }

        if (remindVia.includes("email") && t.assignee.email) {
          try {
            await sendEmailTaskReminder({
              employeeEmail: t.assignee.email,
              employeeName: t.assignee.name,
              taskTitle: t.title,
              taskDescription: t.description,
              taskPriority: t.priority,
              taskDueDate: t.dueDate,
              taskLink,
            });
          } catch (err) {
            console.error(`Email reminder failed for ${t.assignee.name}:`, err);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: employeeIds.length,
      data: { count: employeeIds.length },
    });
  } catch (error: any) {
    console.error("[POST BULK ASSIGN FROM TEMPLATE ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
