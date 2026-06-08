import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { members: true },
        },
      },
      orderBy: { name: "asc" },
    });

    if (departments.length === 0) {
      const defaultDepts = [
        "Admin department",
        "Centre head / Management",
        "Sales / counselling department",
        "Academics department",
        "Faculty department",
        "Backend department",
        "Accounts & Finance department",
        "IT department",
        "HR & Placement department"
      ];
      await Promise.all(
        defaultDepts.map((name) =>
          prisma.department.upsert({
            where: { name },
            update: {},
            create: { name, description: `Standard operational ${name}.` },
          })
        )
      );
      departments = await prisma.department.findMany({
        include: {
          _count: {
            select: { members: true },
          },
        },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({ success: true, data: departments });
  } catch (error: any) {
    console.error("[GET DEPARTMENTS ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "EMPLOYEE") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: "Department name is required" }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: {
        name: body.name,
        description: body.description ?? null,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE_DEPARTMENT",
        entityType: "DEPARTMENT",
        entityId: department.id,
        performedBy: session.name,
        details: { name: department.name },
      },
    });

    return NextResponse.json({ success: true, data: department });
  } catch (error: any) {
    console.error("[POST DEPARTMENT ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
