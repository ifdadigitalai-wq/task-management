import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Only admins can delete tasks" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.task.update({
    where: { id },
    data: { isDeleted: true },
  });
  return NextResponse.json({ success: true });
}
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.progress !== undefined && { progress: body.progress }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.dueDate !== undefined && { dueDate: new Date(body.dueDate) }),
      ...(body.assignedToId !== undefined && { assignedToId: body.assignedToId }),
    },
    include: { assignedTo: true, delegatedBy: true },
  });

  if (body.assignedToId && task.assignedToId === body.assignedToId) {
    const delegatorName = task.delegatedBy?.name || "Admin";
    await prisma.notification.create({
      data: {
        userId: task.assignedToId as string,
        content: `${delegatorName} assigned you a new task: "${task.title}". Click to view the task`,
        link: "/my-tasks",
      },
    });
  }

  return NextResponse.json(task);
}