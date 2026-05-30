import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string; updateId: string }> }) {
  const { id, updateId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = await req.json();

  // 1. Create the comment
  const comment = await prisma.updateComment.create({
    data: {
      updateId: updateId,
      text,
      authorId: session.id,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  // 2. Fetch the Task to determine who to notify
  const taskUpdate = await prisma.taskUpdate.findUnique({
    where: { id: updateId },
    include: {
      task: {
        select: { id: true, title: true, assignedToId: true, delegatedById: true }
      }
    }
  });

  if (taskUpdate?.task) {
    const { task } = taskUpdate;
    
    // 3. Determine recipient
    const recipientId = session.id === task.assignedToId ? task.delegatedById : task.assignedToId;
    const link = recipientId === task.delegatedById ? "/all-tasks" : "/my-tasks";

    // 4. Create the Notification
    if (recipientId) {
      await prisma.notification.create({
        data: {
          userId: recipientId,
          content: `${comment.author.name} commented on task: "${task.title}"`,
          link,
        }
      });
    }
  }

  return NextResponse.json(comment, { status: 201 });
}