import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        jobTitle: true,
        avatarUrl: true,
        phone: true,
        joinedAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json<ApiResponse<any[]>>({ success: true, data: users });
  } catch (err) {
    console.error("[GET USERS ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch users." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "A user with this email already exists." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(body.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: body.name,
          email: body.email,
          passwordHash: hashed,
          role: body.role ?? "EMPLOYEE",
          department: body.department ?? undefined,
          jobTitle: body.jobTitle ?? undefined,
          avatarUrl: body.avatarUrl ?? undefined,
          phone: body.phone ?? undefined,
          joinedAt: body.joinedAt ? new Date(body.joinedAt) : undefined,
          mustResetPassword: body.mustResetPassword ?? true,
        },
      });

      await tx.activity.create({
        data: {
          userId: session.id,
          action: "CREATE_USER",
          entityType: "USER",
          entityId: user.id,
          meta: { email: user.email, role: user.role },
        },
      });

      return user;
    });

    const { passwordHash, ...userWithoutPassword } = result;

    return NextResponse.json<ApiResponse<any>>(
      { success: true, data: userWithoutPassword },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST USER ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to create user." },
      { status: 500 }
    );
  }
}