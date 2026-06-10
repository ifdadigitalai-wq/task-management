import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const employeeId = req.nextUrl.searchParams.get("employeeId");
    if (!employeeId) {
      return NextResponse.json({ success: false, error: "Missing 'employeeId' query parameter" }, { status: 400 });
    }

    // ── 1. Fetch employee info ──────────────────────────────────────────
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        department: true,
        jobTitle: true,
        status: true,
        role: true,
        joinedAt: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const now = new Date();

    // ── 2. All tasks assigned to this employee ──────────────────────────
    const allTasks = await prisma.task.findMany({
      where: { assigneeId: employeeId },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        department: true,
        progress: true,
        delegationPending: true,
        delegationStatus: true,
      },
    });

    // ── 3. Summary KPIs ─────────────────────────────────────────────────
    const totalTasks = allTasks.length;
    const completed = allTasks.filter((t) => t.status === "DONE").length;
    const inProgress = allTasks.filter((t) => t.status === "IN_PROGRESS").length;
    const inReview = allTasks.filter((t) => t.status === "IN_REVIEW").length;
    const todo = allTasks.filter((t) => t.status === "TODO").length;
    const cancelled = allTasks.filter((t) => t.status === "CANCELLED").length;
    const overdue = allTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE" && t.status !== "CANCELLED"
    ).length;
    const completionRate = totalTasks === 0 ? 0 : Math.round((completed / totalTasks) * 100);

    // Average progress across active tasks
    const activeTasks = allTasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED");
    const avgProgress = activeTasks.length === 0
      ? 0
      : Math.round(activeTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / activeTasks.length);

    // ── 4. Status breakdown ─────────────────────────────────────────────
    const statusBreakdown = {
      TODO: todo,
      IN_PROGRESS: inProgress,
      IN_REVIEW: inReview,
      DONE: completed,
      CANCELLED: cancelled,
    };

    // ── 5. Priority breakdown ───────────────────────────────────────────
    const priorityBreakdown = {
      CRITICAL: allTasks.filter((t) => t.priority === "CRITICAL").length,
      HIGH: allTasks.filter((t) => t.priority === "HIGH").length,
      MEDIUM: allTasks.filter((t) => t.priority === "MEDIUM").length,
      LOW: allTasks.filter((t) => t.priority === "LOW").length,
    };

    // ── 6. Department-wise task distribution ────────────────────────────
    const deptMap: Record<string, { total: number; completed: number }> = {};
    allTasks.forEach((t) => {
      const dept = t.department || "Unassigned";
      if (!deptMap[dept]) deptMap[dept] = { total: 0, completed: 0 };
      deptMap[dept].total++;
      if (t.status === "DONE") deptMap[dept].completed++;
    });
    const departmentDistribution = Object.entries(deptMap)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total);

    // ── 7. Overdue tasks list (top 10) ──────────────────────────────────
    const overdueTasks = allTasks
      .filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE" && t.status !== "CANCELLED"
      )
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 10)
      .map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate,
        department: t.department,
        daysOverdue: Math.ceil((now.getTime() - new Date(t.dueDate!).getTime()) / (1000 * 60 * 60 * 24)),
      }));

    // ── 8. Weekly timeline (last 8 weeks) ───────────────────────────────
    const weeklyTimeline: { week: string; created: number; completed: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const created = allTasks.filter(
        (t) => new Date(t.createdAt) >= weekStart && new Date(t.createdAt) < weekEnd
      ).length;
      const comp = allTasks.filter(
        (t) => t.status === "DONE" && new Date(t.updatedAt) >= weekStart && new Date(t.updatedAt) < weekEnd
      ).length;

      const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      weeklyTimeline.push({ week: label, created, completed: comp });
    }

    // ── 9. Active tasks (current workload) ──────────────────────────────
    const currentWorkload = allTasks
      .filter((t) => t.status !== "DONE" && t.status !== "CANCELLED")
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 8)
      .map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        progress: t.progress,
        department: t.department,
      }));

    return NextResponse.json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          avatarUrl: employee.avatarUrl,
          department: employee.department,
          jobTitle: employee.jobTitle,
          status: employee.status,
          role: employee.role,
          joinedAt: employee.joinedAt,
        },
        summary: {
          totalTasks,
          completed,
          inProgress,
          overdue,
          completionRate,
          avgProgress,
        },
        statusBreakdown,
        priorityBreakdown,
        departmentDistribution,
        overdueTasks,
        weeklyTimeline,
        currentWorkload,
      },
    });
  } catch (error: any) {
    console.error("[GET EMPLOYEE ANALYTICS ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
