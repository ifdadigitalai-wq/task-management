import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json<ApiResponse<{ notifications: any[]; unreadCount: number }>>({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (err) {
    console.error("[GET NOTIFICATIONS ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch notifications." },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.notification.updateMany({
        where: { userId: session.id, read: false },
        data: { read: true },
      });

      return updateResult;
    }, { timeout: 30000 });

    return NextResponse.json<ApiResponse<{ count: number }>>({
      success: true,
      data: { count: result.count },
    });
  } catch (err) {
    console.error("[PATCH ALL NOTIFICATIONS ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to mark notifications as read." },
      { status: 500 }
    );
  }
}
