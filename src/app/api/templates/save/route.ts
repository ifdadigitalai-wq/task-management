import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "MANAGER")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin or Manager access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, tasks, department, departmentId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Template name is required." }, { status: 400 });
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ success: false, error: "Tasks list is required." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const template = await tx.taskTemplate.create({
        data: {
          name: name.trim(),
          department: department || "General",
          departmentId: departmentId || null,
          defaultPriority: "MEDIUM",
          checklistItems: [],
          createdById: session.id,
        },
      });

      const items = [];
      for (const t of tasks) {
        if (!t.title || !t.title.trim()) {
          throw new Error("Each task template item must have a title.");
        }
        const item = await tx.taskTemplateItem.create({
          data: {
            templateId: template.id,
            title: t.title.trim(),
            description: t.description ? t.description.trim() : null,
            priority: t.priority || "MEDIUM",
          },
        });
        items.push(item);
      }

      await tx.activity.create({
        data: {
          userId: session.id,
          action: "CREATE_TASK_TEMPLATE",
          entityType: "TASK_TEMPLATE",
          entityId: template.id,
          meta: { name: template.name, itemsCount: items.length },
        },
      });

      return { ...template, items };
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error("[POST SAVE TEMPLATE ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to save template." }, { status: 500 });
  }
}
