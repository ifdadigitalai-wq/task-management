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

  const body = await req.json();

  const update = await prisma.taskUpdate.create({
    data: {
      taskId: id,
      remark: body.remark,
      files: body.files ?? [],
      images: body.images ?? [],
      hasVoice: body.hasVoice ?? false,
    },
    include: { comments: true },
  });

  return NextResponse.json(update, { status: 201 });
}