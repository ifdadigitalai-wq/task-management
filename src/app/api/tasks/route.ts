import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: {
      isDeleted: false,
      ...(session.role === "EMPLOYEE" && { assignedToId: session.id }),
    },
    include: { assignedTo: true, delegatedBy: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tasks);
}

// Maps modal priority labels → Prisma enum values
const priorityMap: Record<string, "HIGH" | "MEDIUM" | "LOW"> = {
  High: "HIGH",
  Medium: "MEDIUM",
  Low: "LOW",
};

export async function POST(req: Request) {
  const session = await getSession();
  const body = await req.json();

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description ?? undefined,
      priority: priorityMap[body.priority] ?? "MEDIUM",
      // Store extra modal fields that don't have DB columns as a tag for now
      tag: [
        body.department,
        body.repeat,
        body.inLoop,
      ].filter(Boolean).join(" · ") || undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      assignedToId: body.assignedToId ?? undefined,
      delegatedById: session?.id ?? undefined,
    },
    include: { assignedTo: true, delegatedBy: true },
  });

  if (task.assignedToId) {
    const delegatorName = task.delegatedBy?.name || "Admin";
    await prisma.notification.create({
      data: {
        userId: task.assignedToId,
        content: `${delegatorName} assigned you a new task: "${task.title}". Click to view the task`,
        link: "/my-tasks",
      },
    });
  }

  return NextResponse.json(task, { status: 201 });
}