import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // 1. Employees counts
    const totalEmployees = await prisma.user.count();
    const activeEmployees = await prisma.user.count({
      where: { status: "ACTIVE" },
    });

    // 2. Tasks counts
    const totalTasks = await prisma.task.count();

    const pendingTasks = await prisma.task.count({
      where: { status: { notIn: ["DONE", "CANCELLED"] } },
    });

    const completedTasks = await prisma.task.count({
      where: { status: "DONE" },
    });

    const overdueTasks = await prisma.task.count({
      where: {
        status: { notIn: ["DONE", "CANCELLED"] },
        dueDate: { lt: now },
      },
    });

    // 3. Department-wise performance/counts
    const departments = await prisma.department.findMany({
      select: { id: true, name: true },
    });

    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        const total = await prisma.task.count({ where: { department: dept.name } });
        const completed = await prisma.task.count({ where: { department: dept.name, status: "DONE" } });
        const pending = await prisma.task.count({ where: { department: dept.name, status: { notIn: ["DONE", "CANCELLED"] } } });
        const overdue = await prisma.task.count({
          where: {
            department: dept.name,
            status: { notIn: ["DONE", "CANCELLED"] },
            dueDate: { lt: now },
          },
        });
        const memberCount = await prisma.user.count({ where: { department: dept.name } });

        return {
          id: dept.id,
          name: dept.name,
          memberCount,
          total,
          completed,
          pending,
          overdue,
        };
      })
    );

    // 4. Employee-wise performance/counts
    const employees = await prisma.user.findMany({
      select: { id: true, name: true, email: true, avatarUrl: true, department: true },
    });

    const employeeStats = await Promise.all(
      employees.map(async (emp) => {
        const total = await prisma.task.count({ where: { assigneeId: emp.id } });
        const completed = await prisma.task.count({ where: { assigneeId: emp.id, status: "DONE" } });
        const pending = await prisma.task.count({ where: { assigneeId: emp.id, status: { notIn: ["DONE", "CANCELLED"] } } });
        const overdue = await prisma.task.count({
          where: {
            assigneeId: emp.id,
            status: { notIn: ["DONE", "CANCELLED"] },
            dueDate: { lt: now },
          },
        });

        return {
          id: emp.id,
          name: emp.name,
          email: emp.email,
          avatarUrl: emp.avatarUrl,
          department: emp.department,
          total,
          completed,
          pending,
          overdue,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
        departmentStats,
        employeeStats,
      },
    });
  } catch (error: any) {
    console.error("[GET DASHBOARD STATS ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
