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

    const holidays = await prisma.holiday.findMany({
      orderBy: { date: "asc" },
    });

    return NextResponse.json<ApiResponse<any[]>>({
      success: true,
      data: holidays,
    });
  } catch (err) {
    console.error("[GET HOLIDAYS ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch holidays." },
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
    if (!body.name || !body.date) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Holiday name and date are required." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const holiday = await tx.holiday.create({
        data: {
          name: body.name,
          date: new Date(body.date),
          isRecurring: body.isRecurring ?? false,
        },
      });

      await tx.activity.create({
        data: {
          userId: session.id,
          action: "CREATE_HOLIDAY",
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
    }, { status: 201 });
  } catch (err) {
    console.error("[POST HOLIDAY ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to create holiday." },
      { status: 500 }
    );
  }
}
