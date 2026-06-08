import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;
    const body = await req.json();

    if (body.progress === undefined || typeof body.progress !== "number") {
      return NextResponse.json({ success: false, error: "Progress percentage is required and must be a number" }, { status: 400 });
    }

    const progress = Math.max(0, Math.min(100, body.progress));

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    // Allow assignee or managers/admin to update
    if (session.role === "EMPLOYEE" && task.assigneeId !== session.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        progress,
      },
    });

    // Write to AuditLog
    await prisma.auditLog.create({
      data: {
        action: "UPDATE_PROGRESS",
        entityType: "TASK",
        entityId: task.id,
        performedBy: session.name,
        details: { oldProgress: task.progress, newProgress: progress, title: task.title },
      },
    });

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error: any) {
    console.error("[PATCH PROGRESS ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
