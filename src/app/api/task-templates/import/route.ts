import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { Priority, Frequency } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "MANAGER")) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin or Manager access required." }, { status: 403 });
    }

    const body = await req.json();
    const { templates } = body;

    if (!Array.isArray(templates) || templates.length === 0) {
      return NextResponse.json({ success: false, error: "Templates array is required" }, { status: 400 });
    }

    const createdTemplates: any[] = [];
    
    await prisma.$transaction(async (tx) => {
      for (const t of templates) {
        if (!t.name || !t.name.trim()) {
          continue;
        }

        // Parse priority
        let priority: Priority = "MEDIUM";
        const rawPriority = String(t.defaultPriority).toUpperCase().trim();
        if (["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(rawPriority)) {
          priority = rawPriority as Priority;
        }

        // Parse frequency
        let frequency: Frequency = "ONE_TIME";
        const rawFrequency = String(t.frequency).toUpperCase().trim();
        if (["ONE_TIME", "DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"].includes(rawFrequency)) {
          frequency = rawFrequency as Frequency;
        }

        // Parse remindVia from comma-separated list
        const remindVia = t.remindVia
          ? String(t.remindVia).split(",").map((x) => x.trim().toLowerCase()).filter(Boolean)
          : [];

        // Parse checklist items from pipe-separated list
        const checklistItems = t.checklistItems
          ? String(t.checklistItems).split("|").map((x) => x.trim()).filter(Boolean)
          : [];

        // Parse recurrence
        const recurrenceObj = { rule: t.recurrence || "NONE" };

        const template = await tx.taskTemplate.create({
          data: {
            name: t.name.trim(),
            description: t.description ? String(t.description).trim() : null,
            defaultPriority: priority,
            checklistItems: checklistItems,
            department: t.department || "General",
            frequency: frequency,
            customFrequency: t.customFrequency ? String(t.customFrequency).trim() : null,
            recurrence: recurrenceObj,
            remindVia: remindVia,
            createdById: session.id,
          },
        });

        // Add related TaskTemplateItems
        if (checklistItems.length > 0) {
          for (const itemText of checklistItems) {
            await tx.taskTemplateItem.create({
              data: {
                templateId: template.id,
                title: itemText,
                description: null,
                priority: priority,
              },
            });
          }
        }

        createdTemplates.push(template);
      }

      // Write to AuditLog
      await tx.auditLog.create({
        data: {
          action: "IMPORT_TASK_TEMPLATES",
          entityType: "TASK_TEMPLATE",
          performedBy: session.name,
          details: { count: createdTemplates.length, names: createdTemplates.map((t) => t.name) },
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        importedCount: createdTemplates.length,
      },
    });
  } catch (error: any) {
    console.error("[POST IMPORT TEMPLATES ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
