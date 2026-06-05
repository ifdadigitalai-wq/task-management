import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const isSelf = session.id === id;
    const isAdmin = session.role === "ADMIN";

    if (!isSelf && !isAdmin) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Forbidden. You can only edit your own profile." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined && isAdmin) updateData.email = body.email; // Only admin can edit email
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.department !== undefined && isAdmin) updateData.department = body.department; // Only admin can edit dept
    if (body.jobTitle !== undefined && isAdmin) updateData.jobTitle = body.jobTitle; // Only admin can edit job title
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
    if (body.joinedAt !== undefined && isAdmin) {
      updateData.joinedAt = body.joinedAt ? new Date(body.joinedAt) : null;
    }
    if (body.role !== undefined && isAdmin) updateData.role = body.role;
    if (body.isActive !== undefined && isAdmin) updateData.isActive = body.isActive;

    if (body.password !== undefined && body.password.trim() !== "") {
      updateData.passwordHash = await bcrypt.hash(body.password, 12);
      updateData.mustResetPassword = body.mustResetPassword ?? false;
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: updateData,
      });

      await tx.activity.create({
        data: {
          userId: session.id,
          action: "UPDATE_USER",
          entityType: "USER",
          entityId: user.id,
          meta: { fieldsUpdated: Object.keys(updateData) },
        },
      });

      return user;
    });

    const { passwordHash, ...userWithoutPassword } = result;

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: userWithoutPassword,
    });
  } catch (err) {
    console.error("[PATCH USER ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to update user." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Soft delete: set isActive to false
      const user = await tx.user.update({
        where: { id },
        data: { isActive: false },
      });

      // 2. Unassign active tasks (non-completed and non-cancelled)
      await tx.task.updateMany({
        where: {
          assigneeId: id,
          NOT: {
            status: { in: ["DONE", "CANCELLED"] },
          },
        },
        data: { assigneeId: null },
      });

      // 3. Stop any active timers
      await tx.taskTimer.updateMany({
        where: {
          userId: id,
          stoppedAt: null,
        },
        data: {
          stoppedAt: new Date(),
        },
      });

      // 4. Log the activity
      await tx.activity.create({
        data: {
          userId: session.id,
          action: "SOFT_DELETE_USER",
          entityType: "USER",
          entityId: id,
          meta: { email: user.email },
        },
      });

      return user;
    });

    return NextResponse.json<ApiResponse<{ email: string }>>({
      success: true,
      data: { email: result.email },
    });
  } catch (err) {
    console.error("[DELETE USER ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to delete user." },
      { status: 500 }
    );
  }
}