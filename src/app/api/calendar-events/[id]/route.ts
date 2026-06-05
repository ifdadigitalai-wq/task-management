import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

export async function PATCH(
  req: Request,
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
    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Event not found." },
        { status: 404 }
      );
    }

    // Only owner or admin can edit
    if (existing.userId !== session.id && session.role !== "ADMIN") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Forbidden. You can only edit your own events." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updated = await prisma.calendarEvent.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        fromDate: body.fromDate ? new Date(body.fromDate) : undefined,
        toDate: body.toDate ? new Date(body.toDate) : undefined,
        time: body.time !== undefined ? (body.time || null) : undefined,
        type: body.type ?? undefined,
      },
      include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } },
    });

    return NextResponse.json<ApiResponse<any>>({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH CALENDAR EVENT ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to update event." },
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
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Event not found." },
        { status: 404 }
      );
    }

    // Only owner or admin can delete
    if (existing.userId !== session.id && session.role !== "ADMIN") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Forbidden. You can only delete your own events." },
        { status: 403 }
      );
    }

    await prisma.calendarEvent.delete({ where: { id } });
    return NextResponse.json<ApiResponse<null>>({ success: true });
  } catch (err) {
    console.error("[DELETE CALENDAR EVENT ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to delete event." },
      { status: 500 }
    );
  }
}
