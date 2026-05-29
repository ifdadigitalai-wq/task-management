import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const user = await prisma.user.update({
    where: { id },
    data: {
      name:       body.name       ?? undefined,
      email:      body.email      ?? undefined,
      phone:      body.phone      ?? undefined,
      department: body.department ?? undefined,
      joinedAt:   body.joinedAt   ? new Date(body.joinedAt) : undefined,
    },
  });
  return NextResponse.json(user);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}