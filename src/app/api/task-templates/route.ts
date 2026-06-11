import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { ApiResponse, Priority } from "@/types";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const templates = await prisma.taskTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    return NextResponse.json<ApiResponse<any[]>>({
      success: true,
      data: templates,
    });
  } catch (err) {
    console.error("[GET TASK TEMPLATES ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch task templates." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (!body.name) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Template name is required." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const template = await tx.taskTemplate.create({
        data: {
          name: body.name,
          description: body.description ?? undefined,
          defaultPriority: (body.defaultPriority as Priority) ?? "MEDIUM",
          checklistItems: body.checklistItems ?? [],
          createdById: session.id,
          department: body.department ?? "General",
          frequency: body.frequency ?? "ONE_TIME",
          customFrequency: body.customFrequency ?? null,
          recurrence: body.recurrence ?? undefined,
          remindVia: body.remindVia ?? undefined,
        },
      });

      await tx.activity.create({
        data: {
          userId: session.id,
          action: "CREATE_TASK_TEMPLATE",
          entityType: "TASK_TEMPLATE",
          entityId: template.id,
          meta: { name: template.name },
        },
      });

      return template;
    });

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (err) {
    console.error("[POST TASK TEMPLATE ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to create task template." },
      { status: 500 }
    );
  }
}
