import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const notif = await prisma.$transaction(async (tx) => {
      const n = await tx.notification.update({
        where: { id, userId: session.id },
        data: { read: true },
      });

      return n;
    });

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: notif,
    });
  } catch (err) {
    console.error("[PATCH NOTIFICATION ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to update notification." },
      { status: 500 }
    );
  }
}
