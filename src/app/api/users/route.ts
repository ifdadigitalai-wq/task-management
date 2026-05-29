import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, phone: true, department: true, joinedAt: true, createdAt: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.name || !body.email) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone ?? undefined,
      department: body.department ?? undefined,
      joinedAt: body.joinedAt ? new Date(body.joinedAt) : undefined,
      password: body.password ?? undefined,
      mustResetPassword: body.password ? false : true,
    },
  });
  return NextResponse.json(user, { status: 201 });
}