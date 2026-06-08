import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        data: { employees: [], departments: [], teams: [], tasks: [] },
      });
    }

    const q = query.trim();

    // 1. Search employees (name, email)
    const employees = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true, avatarUrl: true },
      take: 5,
    });

    // 2. Search departments
    const departments = await prisma.department.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
      },
      select: { id: true, name: true },
      take: 5,
    });

    // 3. Search tasks (title, description, tags)
    const taskWhere: any = {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
      ],
    };

    if (session.role === "EMPLOYEE") {
      taskWhere.assigneeId = session.id;
    }

    const tasks = await prisma.task.findMany({
      where: taskWhere,
      select: { id: true, title: true, status: true, department: true },
      take: 5,
    });

    // 4. Search unique teams
    const teamsUsers = await prisma.user.findMany({
      where: {
        team: { contains: q, mode: "insensitive" },
      },
      select: { team: true },
      distinct: ["team"],
      take: 5,
    });
    const teams = teamsUsers.map((u) => u.team).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        employees,
        departments,
        teams,
        tasks,
      },
    });
  } catch (error: any) {
    console.error("[GET SEARCH ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
