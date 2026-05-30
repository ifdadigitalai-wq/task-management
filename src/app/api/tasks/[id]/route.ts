import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  
  // 1. Update the task
  const updatedTask = await prisma.task.update({
    where: { id },
    data: body, // e.g., { status: "COMPLETED" }
  });

  // 2. Determine who to notify
  const recipientId = session.id === updatedTask.assignedToId 
    ? updatedTask.delegatedById 
    : updatedTask.assignedToId;

  // 3. Send Notification
  if (recipientId) {
    const user = await prisma.user.findUnique({ where: { id: session.id }, select: { name: true } });
    const userName = user?.name || "Someone";
    
    let actionType = "updated details for";
    if (body.status) actionType = `changed status to ${body.status} on`;

    await prisma.notification.create({
      data: {
        userId: recipientId,
        content: `${userName} ${actionType} task: "${updatedTask.title}"`,
        link: `/tasks/${updatedTask.id}`,
      }
    });
  }

  return NextResponse.json(updatedTask, { status: 200 });
}