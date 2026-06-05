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
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      const holiday = await tx.holiday.update({
        where: { id },
        data: {
          name: body.name ?? undefined,
          date: body.date ? new Date(body.date) : undefined,
          isRecurring: body.isRecurring !== undefined ? body.isRecurring : undefined,
        },
      });

      await tx.activity.create({
        data: {
          userId: session.id,
          action: "UPDATE_HOLIDAY",
          entityType: "HOLIDAY",
          entityId: holiday.id,
          meta: { name: holiday.name, date: holiday.date },
        },
      });

      return holiday;
    });

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("[PATCH HOLIDAY ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to update holiday." },
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

    await prisma.$transaction(async (tx) => {
      const holiday = await tx.holiday.delete({
        where: { id },
      });

      await tx.activity.create({
        data: {
          userId: session.id,
          action: "DELETE_HOLIDAY",
          entityType: "HOLIDAY",
          entityId: id,
          meta: { name: holiday.name },
        },
      });
    });

    return NextResponse.json<ApiResponse<null>>({
      success: true,
    });
  } catch (err) {
    console.error("[DELETE HOLIDAY ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to delete holiday." },
      { status: 500 }
    );
  }
}
