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

    const department = req.nextUrl.searchParams.get("department");
    if (!department) {
      return NextResponse.json({ success: false, error: "Missing 'department' query parameter" }, { status: 400 });
    }

    const now = new Date();

    // ── 1. All tasks in this department ──────────────────────────────────
    const allTasks = await prisma.task.findMany({
      where: { department },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        assigneeId: true,
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // ── 2. Summary KPIs ─────────────────────────────────────────────────
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

    // ── 3. Status breakdown ─────────────────────────────────────────────
    const statusBreakdown = {
      TODO: todo,
      IN_PROGRESS: inProgress,
      IN_REVIEW: inReview,
      DONE: completed,
      CANCELLED: cancelled,
    };

    // ── 4. Priority breakdown ───────────────────────────────────────────
    const priorityBreakdown = {
      CRITICAL: allTasks.filter((t) => t.priority === "CRITICAL").length,
      HIGH: allTasks.filter((t) => t.priority === "HIGH").length,
      MEDIUM: allTasks.filter((t) => t.priority === "MEDIUM").length,
      LOW: allTasks.filter((t) => t.priority === "LOW").length,
    };

    // ── 5. Member performance ───────────────────────────────────────────
    const members = await prisma.user.findMany({
      where: { department },
      select: { id: true, name: true, avatarUrl: true, status: true },
    });

    const memberPerformance = members.map((m) => {
      const memberTasks = allTasks.filter((t) => t.assigneeId === m.id);
      const memberTotal = memberTasks.length;
      const memberCompleted = memberTasks.filter((t) => t.status === "DONE").length;
      const memberOverdue = memberTasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE" && t.status !== "CANCELLED"
      ).length;
      const memberInProgress = memberTasks.filter((t) => t.status === "IN_PROGRESS").length;
      const memberRate = memberTotal === 0 ? 0 : Math.round((memberCompleted / memberTotal) * 100);

      return {
        id: m.id,
        name: m.name,
        avatarUrl: m.avatarUrl,
        userStatus: m.status,
        total: memberTotal,
        completed: memberCompleted,
        inProgress: memberInProgress,
        overdue: memberOverdue,
        completionRate: memberRate,
      };
    });

    // Sort by total tasks descending
    memberPerformance.sort((a, b) => b.total - a.total);

    // ── 6. Overdue tasks list (top 10) ──────────────────────────────────
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
        assignee: t.assignee ? { name: t.assignee.name, avatarUrl: t.assignee.avatarUrl } : null,
        daysOverdue: Math.ceil((now.getTime() - new Date(t.dueDate!).getTime()) / (1000 * 60 * 60 * 24)),
      }));

    // ── 7. Weekly timeline (last 8 weeks) ───────────────────────────────
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

    // ── 8. Department member count ──────────────────────────────────────
    const memberCount = members.length;

    return NextResponse.json({
      success: true,
      data: {
        department,
        memberCount,
        summary: {
          totalTasks,
          completed,
          inProgress,
          overdue,
          completionRate,
        },
        statusBreakdown,
        priorityBreakdown,
        memberPerformance,
        overdueTasks,
        weeklyTimeline,
      },
    });
  } catch (error: any) {
    console.error("[GET DEPARTMENT ANALYTICS ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
