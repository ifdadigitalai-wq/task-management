import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { signToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/session";
import { ApiResponse } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Both current and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "New password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.id } });

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashed,
          mustResetPassword: false,
        },
      });

      await tx.activity.create({
        data: {
          userId: user.id,
          action: "RESET_PASSWORD",
          entityType: "USER",
          entityId: user.id,
          meta: { email: user.email },
        },
      });
    });

    // Re-issue token with mustResetPassword: false
    const newToken = await signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustResetPassword: false,
    });

    const response = NextResponse.json<ApiResponse<null>>({ success: true });

    response.cookies.set(COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (err) {
    console.error("[RESET PASSWORD ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}