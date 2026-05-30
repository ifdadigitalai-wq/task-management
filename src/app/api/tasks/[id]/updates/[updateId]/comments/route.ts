import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string; updateId: string }> }) {
  const { id, updateId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = await req.json();

  const comment = await prisma.updateComment.create({
    data: {
      updateId: updateId,
      text,
      authorId: session.id,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json(comment, { status: 201 });
}