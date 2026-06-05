import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { ApiResponse, Priority } from "@/types";

export async function PATCH(
  req: Request,
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
    const body = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      const template = await tx.taskTemplate.update({
        where: { id },
        data: {
          name: body.name ?? undefined,
          description: body.description ?? undefined,
          defaultPriority: body.defaultPriority ? (body.defaultPriority as Priority) : undefined,
          checklistItems: body.checklistItems ?? undefined,
        },
      });

      await tx.activity.create({
        data: {
          userId: session.id,
          action: "UPDATE_TASK_TEMPLATE",
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
    });
  } catch (err) {
    console.error("[PATCH TASK TEMPLATE ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to update task template." },
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
      const template = await tx.taskTemplate.delete({
        where: { id },
      });

      await tx.activity.create({
        data: {
          userId: session.id,
          action: "DELETE_TASK_TEMPLATE",
          entityType: "TASK_TEMPLATE",
          entityId: id,
          meta: { name: template.name },
        },
      });
    });

    return NextResponse.json<ApiResponse<null>>({
      success: true,
    });
  } catch (err) {
    console.error("[DELETE TASK TEMPLATE ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to delete task template." },
      { status: 500 }
    );
  }
}
