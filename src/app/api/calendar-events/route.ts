import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/types";

/**
 * GET /api/calendar-events
 *   ?scope=own   → current user's events only (default, used for calendar display)
 *   ?scope=team  → admin only: all OTHER users' events (used for admin team activity sidebar)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const scope = req.nextUrl.searchParams.get("scope") ?? "own";

    let where: any;

    if (scope === "team") {
      // Admin-only: all events from other users (employees)
      if (session.role !== "ADMIN") {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "Forbidden. Admin access required." },
          { status: 403 }
        );
      }
      where = { userId: { not: session.id } };
    } else {
      // Default: only this user's own events
      where = { userId: session.id };
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } },
      orderBy: { fromDate: "asc" },
    });

    return NextResponse.json<ApiResponse<any[]>>({ success: true, data: events });
  } catch (err) {
    console.error("[GET CALENDAR EVENTS ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch calendar events." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    if (!body.title || !body.fromDate || !body.toDate) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Title, fromDate and toDate are required." },
        { status: 400 }
      );
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title: body.title,
        fromDate: new Date(body.fromDate),
        toDate: new Date(body.toDate),
        time: body.time || null,
        type: body.type ?? "EVENT",
        userId: session.id,
      },
      include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } },
    });

    return NextResponse.json<ApiResponse<any>>({ success: true, data: event }, { status: 201 });
  } catch (err) {
    console.error("[POST CALENDAR EVENT ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to create calendar event." },
      { status: 500 }
    );
  }
}
