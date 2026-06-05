import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userIdQuery = searchParams.get("userId");
    const actionQuery = searchParams.get("action");
    const entityTypeQuery = searchParams.get("entityType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    // 1. Role-based scoping: Employees can only see their own activities
    if (session.role === "EMPLOYEE") {
      where.userId = session.id;
    } else {
      if (userIdQuery && userIdQuery !== "ALL") {
        where.userId = userIdQuery;
      }
    }

    // 2. Filter by action
    if (actionQuery && actionQuery !== "ALL") {
      where.action = actionQuery;
    }

    // 3. Filter by entityType
    if (entityTypeQuery && entityTypeQuery !== "ALL") {
      where.entityType = entityTypeQuery;
    }

    // 4. Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json<ApiResponse<any[]>>({
      success: true,
      data: activities,
    });
  } catch (err) {
    console.error("[GET ACTIVITIES ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch activities." },
      { status: 500 }
    );
  }
}
