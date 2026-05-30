import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updates = await prisma.taskUpdate.findMany({
    where: { taskId: id },
    include: {
      comments: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(updates);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { remark, files, images, hasVoice } = await req.json();

  const task = await prisma.task.findUnique({
    where: { id },
    select: { id: true, title: true, assignedToId: true, delegatedById: true },
  });

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const update = await prisma.taskUpdate.create({
    data: {
      taskId: id,
      remark,
      files: files || [],
      images: images || [],
      hasVoice: hasVoice || false,
    },
    include: {
      comments: true,
    },
  });

  const recipientId = session.id === task.assignedToId ? task.delegatedById : task.assignedToId;

  if (recipientId) {
    const user = await prisma.user.findUnique({ where: { id: session.id }, select: { name: true } });
    const link = recipientId === task.delegatedById ? "/all-tasks" : "/my-tasks";

    await prisma.notification.create({
      data: {
        userId: recipientId,
        content: `${user?.name ?? "Someone"} posted a new update on task: "${task.title}"`,
        link,
      },
    });
  }

  return NextResponse.json(update, { status: 201 });
}