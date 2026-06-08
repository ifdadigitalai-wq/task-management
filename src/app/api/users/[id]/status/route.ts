import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";
import { UserStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.role, "change_status")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id: userId } = await params;
    const body = await req.json();

    if (!body.status) {
      return NextResponse.json({ success: false, error: "Status is required" }, { status: 400 });
    }

    const statusUpper = body.status.toUpperCase();
    if (!["ACTIVE", "INACTIVE", "SUSPENDED", "RESIGNED", "ON_LEAVE"].includes(statusUpper)) {
      return NextResponse.json({ success: false, error: "Invalid status value" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const isActive = statusUpper === "ACTIVE";

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: statusUpper as UserStatus,
        isActive,
      },
    });

    // Write to AuditLog
    await prisma.auditLog.create({
      data: {
        action: "CHANGE_USER_STATUS",
        entityType: "USER",
        entityId: userId,
        performedBy: session.name,
        details: { oldStatus: user.status, newStatus: statusUpper, email: user.email },
      },
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    console.error("[PATCH USER STATUS ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
