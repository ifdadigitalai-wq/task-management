"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { useRouter } from "next/navigation";
import {
  Layers, CheckCircle, Clock, AlertTriangle, BarChart3,
  Calendar, ChevronRight, User, Users, Briefcase, X,
  TrendingUp, Activity, Target, Shield
} from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import Link from "next/link";
import { cn } from "@/lib/utils";


interface StatsData {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  pendingTasks: number;
  totalEmployees: number;
  activeEmployees: number;
  departmentStats: any[];
  employeeStats: any[];
}

export default function DashboardPage() {
  const { currentUser, fetchCurrentUser, setSelectedTask, setFilters } = useTaskStore();
  const router = useRouter();

  const [stats, setStats] = useState<StatsData | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [byStatusCounts, setByStatusCounts] = useState<Record<string, number>>({
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    DONE: 0,
    CANCELLED: 0,
  });
  const [loading, setLoading] = useState(true);
  const [drilldownDept, setDrilldownDept] = useState<string | null>(null);
  const [drilldownEmpId, setDrilldownEmpId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await fetch("/api/dashboard/stats");
      const statsPayload = await statsRes.json();
      if (statsPayload.success) {
        setStats(statsPayload.data);
      }

      const actRes = await fetch("/api/activities");
      const actPayload = await actRes.json();
      if (actPayload.success) setActivities((actPayload.data || []).slice(0, 10));

      const notifRes = await fetch("/api/notifications");
      const notifPayload = await notifRes.json();
      if (notifPayload.success)
        setNotifications((notifPayload.data?.notifications || []).slice(0, 5));

      const tasksRes = await fetch("/api/tasks");
      const tasksPayload = await tasksRes.json();
      if (tasksPayload.success && Array.isArray(tasksPayload.data)) {
        // Calculate status counts
        const counts: Record<string, number> = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0, CANCELLED: 0 };
        tasksPayload.data.forEach((task: any) => {
          if (counts[task.status] !== undefined) {
            counts[task.status]++;
          }
        });
        setByStatusCounts(counts);

        // Upcoming tasks
        const activeTasks = tasksPayload.data.filter(
          (t: any) => t.status !== "DONE" && t.status !== "CANCELLED"
        );
        const sorted = activeTasks.sort((a: any, b: any) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
        setUpcomingTasks(sorted.slice(0, 5));
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) fetchCurrentUser();
    fetchDashboardData();
    const id = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(id);
  }, [currentUser]);

  if (loading || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-text-secondary"
        style={{ fontSize: "0.75rem" }}>
        <div className="w-6 h-6 border-[3px] border-white/10 border-t-brand rounded-full animate-spin mb-2.5" />
        Synchronizing dashboard statistics...
      </div>
    );
  }

  const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "MANAGER";

  // Donut chart segments
  const statusSegments = [
    { label: "To Do", count: byStatusCounts.TODO, color: "#94A3B8" },
    { label: "In Progress", count: byStatusCounts.IN_PROGRESS, color: "#60A5FA" },
    { label: "In Review", count: byStatusCounts.IN_REVIEW, color: "#A78BFA" },
    { label: "Completed", count: byStatusCounts.DONE, color: "#34D399" },
    { label: "Cancelled", count: byStatusCounts.CANCELLED, color: "#F87171" },
  ];

  const totalTasks = stats?.totalTasks || 0;
  const completedTasks = stats?.completedTasks || 0;
  const overdueTasks = stats?.overdueTasks || 0;
  const totalEmployees = stats?.totalEmployees || 0;
  const activeEmployees = stats?.activeEmployees || 0;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const formatActivityAction = (act: any) => {
    const action = act.action;

    if (action === "CREATE_TASK") {
      const assigneeName = act.meta?.assignee;
      if (assigneeName) {
        return `assigned task to ${assigneeName}`;
      }
      return "created a task";
    }

    if (action === "UPDATE_TASK") {
      const status = act.meta?.status;
      if (status) {
        return `updated status of task to ${status.replace("_", " ").toLowerCase()}`;
      }
      return "updated task details";
    }

    if (action === "DELETE_TASK") {
      return "deleted a task";
    }

    if (action === "ADD_TASK_UPDATE") {
      return "posted a progress update";
    }

    if (action === "ADD_COMMENT") {
      return "commented on a task";
    }

    return action.replace(/_/g, " ").toLowerCase();
  };

  const handleCardClick = (statusFilter: string) => {
    setFilters({ status: statusFilter as any, department: "ALL", team: "ALL", assigneeId: "ALL" });
    router.push(currentUser.role === "ADMIN" ? "/all-tasks" : "/my-tasks");
  };

  return (
    <div className="space-y-6 select-none">
      {/* Greeting Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 rounded-xl border border-border"
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <div>
          <h1
            className="text-text-primary"
            style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "2px" }}
          >
            Hello, {currentUser.name.split(" ")[0]}!
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "rgba(156, 163, 175, 0.9)", fontWeight: 400 }}>
            Here is the live workload statistics and activity updates for today.
          </p>
        </div>

        {/* Live Workspace status */}
        <button
          className="inline-flex items-center gap-2 rounded-lg font-medium transition-all shrink-0 focus-visible:outline-none"
          style={{
            background: "#4F46E5",
            color: "#FFFFFF",
            border: "none",
            padding: "8px 16px",
            fontSize: "0.8125rem",
            fontWeight: 500,
            borderRadius: "6px",
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.4)",
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-ping"
            style={{ backgroundColor: "#A5B4FC" }}
          />
          Live Workspace
        </button>
      </div>

      {/* KPI Cards */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
      >
        {/* KPI 1: Total Tasks */}
        <div className="cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all" onClick={() => handleCardClick("ALL")}>
          <KpiCard
            label={currentUser.role === "ADMIN" ? "Total Tasks" : "My Assigned"}
            value={totalTasks}
            delta="+8%"
            deltaPositive
            comparison="vs last week"
            icon={<Layers />}
            iconColor="#6366F1"
          />
        </div>
        {/* KPI 2: Completed */}
        <div className="cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all" onClick={() => handleCardClick("DONE")}>
          <KpiCard
            label="Completed"
            value={completedTasks}
            delta="+15%"
            deltaPositive
            comparison="vs last week"
            icon={<CheckCircle />}
            iconColor="#34D399"
          />
        </div>
        {/* KPI 3: Overdue */}
        <div className="cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all" onClick={() => handleCardClick("TODO")}>
          <KpiCard
            label="Overdue"
            value={overdueTasks}
            delta={overdueTasks > 0 ? `+${overdueTasks} new` : "0%"}
            deltaPositive={overdueTasks === 0}
            comparison="vs yesterday"
            icon={<AlertTriangle />}
            iconColor={overdueTasks > 0 ? "#F87171" : "#6366F1"}
          />
        </div>
        {/* KPI 4: Active Employees (For Admins) or Completion Rate */}
        {currentUser.role === "ADMIN" ? (
          <div className="cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all" onClick={() => router.push("/employees")}>
            <KpiCard
              label="Active Employees"
              value={`${activeEmployees} / ${totalEmployees}`}
              delta="Live"
              deltaPositive
              comparison="total team size"
              icon={<Users />}
              iconColor="#10B981"
            />
          </div>
        ) : (
          <KpiCard
            label="Completion Rate"
            value={`${completionRate}%`}
            delta="+4%"
            deltaPositive
            comparison="vs last month"
            icon={<BarChart3 />}
            iconColor="#60A5FA"
          />
        )}
      </div>

      {/* Charts & Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Status Breakdown */}
        <div
          className="rounded-xl border border-border"
          style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
        >
          <h3
            className="text-text-primary"
            style={{ fontSize: "0.875rem", fontWeight: 650, letterSpacing: "-0.01em", marginBottom: "12px" }}
          >
            Task Status Breakdown
          </h3>
          <DonutChart data={statusSegments} />
        </div>

        {/* Team Workload & Department metrics */}
        <div
          className="lg:col-span-2 rounded-xl border border-border flex flex-col justify-between"
          style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
        >
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3
                className="text-text-primary"
                style={{ fontSize: "0.875rem", fontWeight: 650, letterSpacing: "-0.01em" }}
              >
                {isAdmin ? "Team Workload & Distribution" : "My Upcoming Actions"}
              </h3>
              {!isAdmin && upcomingTasks.length > 0 && (
                <Link
                  href="/my-tasks"
                  className="flex items-center text-brand-text hover:underline"
                  style={{ fontSize: "0.8125rem" }}
                >
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {isAdmin ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employee Performance list */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Employee Workloads</span>
                  <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.25) transparent' }}>
                    {stats?.employeeStats && stats.employeeStats.length > 0 ? (
                      stats.employeeStats.map((emp: any) => {
                        const empRate = emp.total === 0 ? 0 : Math.round((emp.completed / emp.total) * 100);
                        return (
                          <div
                            key={emp.id}
                            onClick={() => setDrilldownEmpId(emp.id)}
                            className="flex flex-col gap-2 p-2 bg-bg/30 border border-border rounded-lg hover:border-brand/40 cursor-pointer transition-all hover:bg-bg/60"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <UserAvatar src={emp.avatarUrl} name={emp.name} size="sm" />
                                <div className="min-w-0">
                                  <p className="text-[12px] font-semibold text-text-primary truncate">{emp.name}</p>
                                  {emp.department && (
                                    <p className="text-[10px] text-text-tertiary truncate">🏢 {emp.department}</p>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10.5px] text-brand font-semibold shrink-0">
                                {emp.completed}/{emp.total} Tasks ({empRate}%)
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                                style={{ width: `${empRate}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-xs text-text-tertiary">No workload data</div>
                    )}
                  </div>
                </div>

                {/* Department Performance list (Clickable → opens drilldown) */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Department Metrics</span>
                  <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.25) transparent' }}>
                    {stats?.departmentStats && stats.departmentStats.length > 0 ? (
                      stats.departmentStats.map((dept: any) => {
                        const deptRate = dept.total === 0 ? 0 : Math.round((dept.completed / dept.total) * 100);
                        return (
                          <div
                            key={dept.id}
                            onClick={() => setDrilldownDept(dept.name)}
                            className="flex flex-col gap-2 p-2 bg-bg/30 border border-border rounded-lg hover:border-brand/40 cursor-pointer transition-all hover:bg-bg/60"
                          >
                            <div className="flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="text-[12px] font-semibold text-text-primary truncate">🏢 {dept.name}</p>
                                <p className="text-[10px] text-text-tertiary truncate">{dept.memberCount} members</p>
                              </div>
                              <span className="text-[10.5px] text-brand font-semibold shrink-0">
                                {dept.completed}/{dept.total} Tasks ({deptRate}%)
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand rounded-full transition-all duration-300"
                                style={{ width: `${deptRate}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-xs text-text-tertiary">No department metrics configured</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // EMPLOYEE view: upcoming tasks
              <div className="space-y-2">
                {upcomingTasks.length > 0 ? (
                  upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="flex items-center justify-between rounded-lg cursor-pointer transition-all border border-border hover:border-brand/30"
                      style={{
                        padding: "12px 16px",
                        minHeight: "48px",
                        backgroundColor: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              task.priority === "CRITICAL"
                                ? "#F87171"
                                : task.priority === "HIGH"
                                  ? "#FB923C"
                                  : task.priority === "MEDIUM"
                                    ? "#60A5FA"
                                    : "#94A3B8",
                          }}
                        />
                        <span
                          className="text-text-primary font-medium truncate pr-4"
                          style={{ fontSize: "0.9375rem" }}
                        >
                          {task.title}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-2 shrink-0 text-text-tertiary"
                        style={{ fontSize: "0.8125rem" }}
                      >
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(task.dueDate).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                        <span
                          className="px-2 py-0.5 rounded-full border border-border text-text-secondary uppercase tracking-wide"
                          style={{ fontSize: "0.75rem" }}
                        >
                          {task.status.replace("_", " ").toLowerCase()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    className="text-center py-10 text-text-tertiary"
                    style={{ fontSize: "0.9375rem" }}
                  >
                    You have no active upcoming tasks due. Good job!
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className="border-t border-border mt-4 pt-3 text-right"
            style={{ fontSize: "0.75rem", color: "#6B7280" }}
          >
            Performance analytics index recalculates in real-time.
          </div>
        </div>
      </div>

      {/* Activities & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Activities */}
        <div
          className="lg:col-span-2 rounded-xl border border-border"
          style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
        >
          <div className="flex items-center justify-between mb-3.5">
            <h3
              className="text-text-primary"
              style={{ fontSize: "0.875rem", fontWeight: 650, letterSpacing: "-0.01em" }}
            >
              Recent Organizational Activities
            </h3>
            {isAdmin && (
              <Link
                href="/activities"
                className="flex items-center text-brand-text hover:underline"
                style={{ fontSize: "0.8125rem" }}
              >
                View audit logs <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {activities.length > 0 ? (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="flex gap-3 items-start"
                  style={{ minHeight: "48px" }}
                >
                  <UserAvatar
                    src={act.user?.avatarUrl}
                    name={act.user?.name}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-text-secondary font-normal leading-normal"
                      style={{ fontSize: "0.9375rem" }}
                    >
                      <span className="font-medium text-text-primary">
                        {act.user?.name || "System"}
                      </span>{" "}
                      {formatActivityAction(act)}
                      {act.task && (
                        <span
                          className="font-medium text-brand-text block sm:inline sm:ml-1 cursor-pointer hover:underline"
                          onClick={() => setSelectedTask(act.task)}
                        >
                          • {act.task.title}
                        </span>
                      )}
                    </p>
                    <p
                      className="text-text-tertiary mt-0.5"
                      style={{ fontSize: "0.75rem" }}
                    >
                      {new Date(act.createdAt).toLocaleString([], {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div
                className="text-center py-10 text-text-tertiary"
                style={{ fontSize: "0.9375rem" }}
              >
                No recent activity logged.
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div
          className="rounded-xl border border-border flex flex-col justify-between"
          style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
        >
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3
                className="text-text-primary"
                style={{ fontSize: "0.875rem", fontWeight: 650, letterSpacing: "-0.01em" }}
              >
                My Unread Notifications
              </h3>
              <Link
                href="/notifications"
                className="flex items-center text-brand-text hover:underline"
                style={{ fontSize: "0.8125rem" }}
              >
                Open inbox <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {notifications.filter((n) => !n.read).length > 0 ? (
                notifications
                  .filter((n) => !n.read)
                  .map((n) => (
                    <div
                      key={n.id}
                      className="rounded-lg border"
                      style={{
                        padding: "12px 14px",
                        background: "rgba(99, 102, 241, 0.08)",
                        borderColor: "rgba(99, 102, 241, 0.2)",
                      }}
                    >
                      <p
                        className="text-text-primary font-medium leading-normal"
                        style={{ fontSize: "0.9375rem" }}
                      >
                        {n.message}
                      </p>
                      <span
                        className="text-text-tertiary block mt-1"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-text-tertiary">
                  <span className="text-4xl mb-2">🎉</span>
                  <p
                    className="font-medium text-text-primary"
                    style={{ fontSize: "0.9375rem" }}
                  >
                    You are all caught up!
                  </p>
                  <p
                    className="mt-1"
                    style={{ fontSize: "0.8125rem" }}
                  >
                    No unread notifications.
                  </p>
                </div>
              )}
            </div>
          </div>

          <p
            className="text-text-tertiary border-t border-border pt-3 mt-4 text-center"
            style={{ fontSize: "0.75rem" }}
          >
            System polls notifications every 30s.
          </p>
        </div>
      </div>

      {/* Department Analytics Drilldown Panel */}
      {drilldownDept && (
        <DepartmentDrilldown
          department={drilldownDept}
          onClose={() => setDrilldownDept(null)}
        />
      )}

      {/* Employee Analytics Drilldown Panel */}
      {drilldownEmpId && (
        <EmployeeDrilldown
          employeeId={drilldownEmpId}
          onClose={() => setDrilldownEmpId(null)}
        />
      )}
    </div>
  );
}

// KPI Card helper
function KpiCard({
  label, value, delta, deltaPositive, comparison, icon, iconColor,
}: {
  label: string;
  value: string | number;
  delta: string;
  deltaPositive: boolean;
  comparison: string;
  icon: React.ReactNode;
  iconColor: string;
}) {
  return (
    <div
      className="rounded-xl border border-border flex flex-col gap-1"
      style={{
        padding: "12px 16px",
        minHeight: "90px",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <div className="flex items-start justify-between">
        <p
          className="font-medium uppercase"
          style={{
            fontSize: "0.6875rem",
            letterSpacing: "0.07em",
            color: "rgba(156, 163, 175, 1)",
          }}
        >
          {label}
        </p>
        <div
          className="flex items-center justify-center rounded-lg shrink-0"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: `${iconColor}22`,
            color: iconColor,
          }}
        >
          {React.cloneElement(icon as React.ReactElement<any>, { className: "w-4.5 h-4.5" })}
        </div>
      </div>

      <p
        className="text-text-primary leading-none"
        style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        {value}
      </p>

      <div className="flex items-center gap-1.5 mt-1">
        <span
          className="rounded-full font-semibold text-[10px] px-1.5 py-0.5"
          style={{
            background: deltaPositive
              ? "rgba(16, 185, 129, 0.12)"
              : "rgba(239, 68, 68, 0.12)",
            color: deltaPositive ? "#34D399" : "#F87171",
          }}
        >
          {delta}
        </span>
        <span style={{ fontSize: "0.6875rem", color: "rgba(156, 163, 175, 0.9)" }}>
          {comparison}
        </span>
      </div>
    </div>
  );
}

// Donut Chart helper
function DonutChart({ data }: { data: { label: string; count: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-48 text-text-tertiary"
        style={{ fontSize: "0.9375rem" }}
      >
        <span className="text-4xl mb-2">📊</span>
        No active tasks recorded.
      </div>
    );
  }

  let accumulatedPercent = 0;
  const radius = 38;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-2 select-none">
      <div className="relative w-44 h-44">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50" cy="50" r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
          {data.map((item, idx) => {
            if (item.count === 0) return null;
            const percent = item.count / total;
            const strokeLength = circumference * percent;
            const strokeOffset = circumference - circumference * accumulatedPercent;
            accumulatedPercent += percent;

            return (
              <circle
                key={idx}
                cx="50" cy="50" r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${strokeLength} ${circumference}`}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-300"
                style={{ transformOrigin: "50px 50px" }}
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-text-primary leading-none"
            style={{ fontSize: "1.5rem", fontWeight: 700 }}
          >
            {total}
          </span>
          <span
            className="uppercase tracking-[0.08em] font-medium mt-0.5"
            style={{ fontSize: "0.625rem", color: "rgba(156,163,175,0.9)" }}
          >
            Tasks
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 w-full px-2">
        {data.map((item, idx) => {
          if (item.count === 0) return null;
          return (
            <div key={idx} className="flex items-center gap-1.5 min-w-0">
              <span
                className="rounded-full flex-shrink-0"
                style={{ width: "6px", height: "6px", backgroundColor: item.color }}
              />
              <span
                className="text-text-secondary truncate"
                style={{ fontSize: "0.75rem", fontWeight: 400 }}
              >
                {item.label}
              </span>
              <span
                className="ml-auto font-semibold text-text-primary font-mono"
                style={{ fontSize: "0.75rem" }}
              >
                {item.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Department Drilldown Panel ────────────────────────────────────────────
interface DeptAnalytics {
  department: string;
  memberCount: number;
  summary: {
    totalTasks: number;
    completed: number;
    inProgress: number;
    overdue: number;
    completionRate: number;
  };
  statusBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  memberPerformance: {
    id: string;
    name: string;
    avatarUrl: string | null;
    userStatus: string;
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
    completionRate: number;
  }[];
  overdueTasks: {
    id: string;
    title: string;
    priority: string;
    dueDate: string;
    assignee: { name: string; avatarUrl: string | null } | null;
    daysOverdue: number;
  }[];
  weeklyTimeline: {
    week: string;
    created: number;
    completed: number;
  }[];
}

function DepartmentDrilldown({ department, onClose }: { department: string; onClose: () => void }) {
  const [data, setData] = useState<DeptAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger slide-in animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/dashboard/department-analytics?department=${encodeURIComponent(department)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error || "Failed to load analytics");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [department]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  // Status config for donut segments
  const statusConfig = [
    { key: "TODO", label: "To Do", color: "#94A3B8" },
    { key: "IN_PROGRESS", label: "In Progress", color: "#60A5FA" },
    { key: "IN_REVIEW", label: "In Review", color: "#A78BFA" },
    { key: "DONE", label: "Completed", color: "#34D399" },
    { key: "CANCELLED", label: "Cancelled", color: "#F87171" },
  ];

  const priorityConfig = [
    { key: "CRITICAL", label: "Critical", color: "#DC2626", bg: "rgba(220,38,38,0.12)" },
    { key: "HIGH", label: "High", color: "#F97316", bg: "rgba(249,115,22,0.12)" },
    { key: "MEDIUM", label: "Medium", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
    { key: "LOW", label: "Low", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 z-50"
        style={{
          backgroundColor: visible ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)",
          backdropFilter: visible ? "blur(4px)" : "none",
          transition: "all 0.3s ease",
        }}
      />

      {/* Slide-over panel */}
      <div
        className="fixed top-0 right-0 z-50 h-full border-l border-border flex flex-col"
        style={{
          width: "min(620px, 90vw)",
          backgroundColor: "var(--color-bg)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "-8px 0 30px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div
          className="shrink-0 flex items-center justify-between border-b border-border"
          style={{ padding: "16px 20px" }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div
                className="flex items-center justify-center rounded-lg shrink-0"
                style={{
                  width: "32px",
                  height: "32px",
                  background: "rgba(99,102,241,0.12)",
                  color: "#6366F1",
                }}
              >
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2
                  className="text-text-primary font-bold truncate"
                  style={{ fontSize: "1rem", letterSpacing: "-0.01em" }}
                >
                  {department}
                </h2>
                {data && (
                  <p className="text-text-tertiary" style={{ fontSize: "0.75rem" }}>
                    {data.memberCount} team member{data.memberCount !== 1 ? "s" : ""} · {data.summary.totalTasks} total tasks
                  </p>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex items-center justify-center rounded-lg border border-border hover:bg-bg/80 cursor-pointer transition-colors shrink-0"
            style={{ width: "32px", height: "32px", background: "transparent" }}
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>

        {/* Body */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: "16px 20px", scrollbarWidth: "thin", scrollbarColor: "rgba(99,102,241,0.2) transparent" }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-text-tertiary" style={{ fontSize: "0.8125rem" }}>
              <div className="w-6 h-6 border-[3px] border-white/10 border-t-brand rounded-full animate-spin mb-3" />
              Loading department analytics…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
              <p className="text-text-primary font-medium" style={{ fontSize: "0.875rem" }}>Failed to load analytics</p>
              <p className="text-text-tertiary mt-1" style={{ fontSize: "0.8125rem" }}>{error}</p>
            </div>
          ) : data ? (
            <div className="space-y-5">
              {/* ── KPI Row ──────────────────────────────── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <MiniKPI label="Total Tasks" value={data.summary.totalTasks} icon={<Layers />} color="#6366F1" />
                <MiniKPI label="Completed" value={data.summary.completed} icon={<CheckCircle />} color="#34D399" />
                <MiniKPI label="In Progress" value={data.summary.inProgress} icon={<Activity />} color="#60A5FA" />
                <MiniKPI label="Overdue" value={data.summary.overdue} icon={<AlertTriangle />} color={data.summary.overdue > 0 ? "#F87171" : "#94A3B8"} />
              </div>

              {/* ── Completion Rate Arc ───────────────────── */}
              <div
                className="rounded-xl border border-border"
                style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="40" fill="transparent"
                        stroke={data.summary.completionRate >= 75 ? "#34D399" : data.summary.completionRate >= 40 ? "#F59E0B" : "#F87171"}
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40 * (data.summary.completionRate / 100)} ${2 * Math.PI * 40}`}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <span
                      className="absolute inset-0 flex items-center justify-center text-text-primary font-bold"
                      style={{ fontSize: "0.875rem" }}
                    >
                      {data.summary.completionRate}%
                    </span>
                  </div>
                  <div>
                    <p className="text-text-primary font-semibold" style={{ fontSize: "0.875rem" }}>Completion Rate</p>
                    <p className="text-text-tertiary" style={{ fontSize: "0.75rem" }}>
                      {data.summary.completed} of {data.summary.totalTasks} tasks completed
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Status & Priority Breakdown ──────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Status */}
                <div
                  className="rounded-xl border border-border"
                  style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
                >
                  <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-3">Status Breakdown</p>
                  <div className="space-y-2">
                    {statusConfig.map((s) => {
                      const count = data.statusBreakdown[s.key] || 0;
                      const pct = data.summary.totalTasks === 0 ? 0 : Math.round((count / data.summary.totalTasks) * 100);
                      return (
                        <div key={s.key} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                          <span className="text-text-secondary flex-1 truncate" style={{ fontSize: "0.75rem" }}>{s.label}</span>
                          <span className="text-text-primary font-semibold font-mono shrink-0" style={{ fontSize: "0.75rem" }}>{count}</span>
                          <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Priority */}
                <div
                  className="rounded-xl border border-border"
                  style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
                >
                  <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-3">Priority Distribution</p>
                  <div className="space-y-2">
                    {priorityConfig.map((p) => {
                      const count = data.priorityBreakdown[p.key] || 0;
                      const pct = data.summary.totalTasks === 0 ? 0 : Math.round((count / data.summary.totalTasks) * 100);
                      return (
                        <div key={p.key} className="flex items-center gap-2">
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
                            style={{ backgroundColor: p.bg, color: p.color }}
                          >
                            {p.label}
                          </span>
                          <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                          </div>
                          <span className="text-text-primary font-semibold font-mono shrink-0" style={{ fontSize: "0.75rem" }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── Weekly Timeline ───────────────────────── */}
              <div
                className="rounded-xl border border-border"
                style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
              >
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-3">Weekly Task Trend (Last 8 Weeks)</p>
                <div className="flex items-end gap-1.5" style={{ height: "100px" }}>
                  {data.weeklyTimeline.map((w, i) => {
                    const maxVal = Math.max(...data.weeklyTimeline.map((t) => Math.max(t.created, t.completed)), 1);
                    const createdH = (w.created / maxVal) * 80;
                    const compH = (w.completed / maxVal) * 80;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end" title={`${w.week}: ${w.created} created, ${w.completed} completed`}>
                        <div className="flex gap-px items-end flex-1 w-full">
                          <div
                            className="flex-1 rounded-t transition-all duration-300"
                            style={{ height: `${createdH}%`, backgroundColor: "rgba(99,102,241,0.5)", minHeight: w.created > 0 ? "4px" : "0" }}
                          />
                          <div
                            className="flex-1 rounded-t transition-all duration-300"
                            style={{ height: `${compH}%`, backgroundColor: "#34D399", minHeight: w.completed > 0 ? "4px" : "0" }}
                          />
                        </div>
                        <span className="text-[8px] text-text-tertiary whitespace-nowrap">{w.week}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-2 justify-center">
                  <span className="flex items-center gap-1 text-[10px] text-text-tertiary">
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: "rgba(99,102,241,0.5)" }} /> Created
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-text-tertiary">
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: "#34D399" }} /> Completed
                  </span>
                </div>
              </div>

              {/* ── Member Performance ────────────────────── */}
              <div
                className="rounded-xl border border-border"
                style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
              >
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-3">
                  Member Performance ({data.memberPerformance.length})
                </p>
                <div
                  className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1"
                  style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(99,102,241,0.2) transparent" }}
                >
                  {data.memberPerformance.length > 0 ? (
                    data.memberPerformance.map((m, idx) => (
                      <div
                        key={m.id}
                        className="flex flex-col gap-1.5 p-2.5 rounded-lg border border-border hover:border-brand/30 transition-all"
                        style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <UserAvatar src={m.avatarUrl} name={m.name} size="sm" />
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold text-text-primary truncate">{m.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-text-tertiary">
                                <span>{m.total} tasks</span>
                                {m.overdue > 0 && (
                                  <span className="text-red-400 font-semibold">{m.overdue} overdue</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: m.completionRate >= 75 ? "rgba(52,211,153,0.12)" : m.completionRate >= 40 ? "rgba(245,158,11,0.12)" : "rgba(248,113,113,0.12)",
                                color: m.completionRate >= 75 ? "#34D399" : m.completionRate >= 40 ? "#F59E0B" : "#F87171",
                              }}
                            >
                              {m.completionRate}%
                            </span>
                            <span className="text-[10.5px] text-brand font-semibold">
                              {m.completed}/{m.total}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${m.completionRate}%`,
                              backgroundColor: m.completionRate >= 75 ? "#34D399" : m.completionRate >= 40 ? "#F59E0B" : "#F87171",
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-6 text-xs text-text-tertiary">No members in this department</p>
                  )}
                </div>
              </div>

              {/* ── Overdue Tasks ─────────────────────────── */}
              {data.overdueTasks.length > 0 && (
                <div
                  className="rounded-xl border border-border"
                  style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
                >
                  <div className="flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                      Overdue Tasks ({data.overdueTasks.length})
                    </p>
                  </div>
                  <div
                    className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1"
                    style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(248,113,113,0.25) transparent" }}
                  >
                    {data.overdueTasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg border"
                        style={{
                          borderColor: "rgba(248,113,113,0.15)",
                          backgroundColor: "rgba(248,113,113,0.04)",
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-medium text-text-primary truncate">{t.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {t.assignee && (
                              <span className="text-[10px] text-text-tertiary truncate">{t.assignee.name}</span>
                            )}
                            <span className="text-[10px] text-red-400 font-semibold">
                              {t.daysOverdue}d overdue
                            </span>
                          </div>
                        </div>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase"
                          style={{
                            backgroundColor: t.priority === "CRITICAL" ? "rgba(220,38,38,0.15)" : t.priority === "HIGH" ? "rgba(249,115,22,0.15)" : t.priority === "MEDIUM" ? "rgba(59,130,246,0.15)" : "rgba(16,185,129,0.15)",
                            color: t.priority === "CRITICAL" ? "#DC2626" : t.priority === "HIGH" ? "#F97316" : t.priority === "MEDIUM" ? "#3B82F6" : "#10B981",
                          }}
                        >
                          {t.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div
          className="shrink-0 border-t border-border flex items-center justify-between"
          style={{ padding: "10px 20px" }}
        >
          <p className="text-text-tertiary" style={{ fontSize: "0.6875rem" }}>
            Analytics refresh on panel open
          </p>
          <button
            onClick={handleClose}
            className="px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-bg/80 cursor-pointer transition-colors text-xs font-medium"
            style={{ background: "transparent" }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// Mini KPI helper for drilldown panel
function MiniKPI({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div
      className="rounded-xl border border-border flex flex-col gap-0.5"
      style={{ padding: "10px 12px", backgroundColor: "var(--color-surface)" }}
    >
      <div className="flex items-center justify-between">
        <p
          className="font-medium uppercase"
          style={{ fontSize: "0.5625rem", letterSpacing: "0.07em", color: "rgba(156,163,175,1)" }}
        >
          {label}
        </p>
        <div
          className="flex items-center justify-center rounded-md shrink-0"
          style={{ width: "22px", height: "22px", background: `${color}22`, color }}
        >
          {React.cloneElement(icon as React.ReactElement<any>, { className: "w-3 h-3" })}
        </div>
      </div>
      <p className="text-text-primary leading-none font-bold" style={{ fontSize: "1.25rem", letterSpacing: "-0.02em", color }}>
        {value}
      </p>
    </div>
  );
}

// ── Employee Drilldown Panel ──────────────────────────────────────────────
interface EmpAnalytics {
  employee: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    department: string | null;
    jobTitle: string | null;
    status: string;
    role: string;
    joinedAt: string | null;
  };
  summary: {
    totalTasks: number;
    completed: number;
    inProgress: number;
    overdue: number;
    completionRate: number;
    avgProgress: number;
  };
  statusBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  departmentDistribution: { name: string; total: number; completed: number }[];
  overdueTasks: {
    id: string;
    title: string;
    priority: string;
    dueDate: string;
    department: string;
    daysOverdue: number;
  }[];
  weeklyTimeline: { week: string; created: number; completed: number }[];
  currentWorkload: {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    progress: number;
    department: string;
  }[];
}

function EmployeeDrilldown({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const [data, setData] = useState<EmpAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/dashboard/employee-analytics?employeeId=${encodeURIComponent(employeeId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error || "Failed to load analytics");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [employeeId]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const statusConfig = [
    { key: "TODO", label: "To Do", color: "#94A3B8" },
    { key: "IN_PROGRESS", label: "In Progress", color: "#60A5FA" },
    { key: "IN_REVIEW", label: "In Review", color: "#A78BFA" },
    { key: "DONE", label: "Completed", color: "#34D399" },
    { key: "CANCELLED", label: "Cancelled", color: "#F87171" },
  ];

  const priorityConfig = [
    { key: "CRITICAL", label: "Critical", color: "#DC2626", bg: "rgba(220,38,38,0.12)" },
    { key: "HIGH", label: "High", color: "#F97316", bg: "rgba(249,115,22,0.12)" },
    { key: "MEDIUM", label: "Medium", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
    { key: "LOW", label: "Low", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  ];

  const statusColorMap: Record<string, string> = {
    TODO: "#94A3B8",
    IN_PROGRESS: "#60A5FA",
    IN_REVIEW: "#A78BFA",
    DONE: "#34D399",
    CANCELLED: "#F87171",
  };

  const roleBadge = (role: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      ADMIN: { bg: "rgba(220,38,38,0.12)", color: "#DC2626" },
      MANAGER: { bg: "rgba(249,115,22,0.12)", color: "#F97316" },
      TEAM_LEADER: { bg: "rgba(99,102,241,0.12)", color: "#6366F1" },
      EMPLOYEE: { bg: "rgba(16,185,129,0.12)", color: "#10B981" },
    };
    return map[role] || { bg: "rgba(148,163,184,0.12)", color: "#94A3B8" };
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 z-50"
        style={{
          backgroundColor: visible ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)",
          backdropFilter: visible ? "blur(4px)" : "none",
          transition: "all 0.3s ease",
        }}
      />

      {/* Slide-over panel */}
      <div
        className="fixed top-0 right-0 z-50 h-full border-l border-border flex flex-col"
        style={{
          width: "min(620px, 90vw)",
          backgroundColor: "var(--color-bg)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "-8px 0 30px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div
          className="shrink-0 flex items-center justify-between border-b border-border"
          style={{ padding: "16px 20px" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {data?.employee && (
              <UserAvatar src={data.employee.avatarUrl} name={data.employee.name} size="md" />
            )}
            <div className="min-w-0">
              <h2
                className="text-text-primary font-bold truncate"
                style={{ fontSize: "1rem", letterSpacing: "-0.01em" }}
              >
                {data?.employee?.name || "Loading…"}
              </h2>
              {data?.employee && (
                <div className="flex items-center gap-2 flex-wrap">
                  {data.employee.jobTitle && (
                    <span className="text-text-tertiary" style={{ fontSize: "0.75rem" }}>
                      {data.employee.jobTitle}
                    </span>
                  )}
                  {data.employee.department && (
                    <span className="text-text-tertiary" style={{ fontSize: "0.75rem" }}>
                      🏢 {data.employee.department}
                    </span>
                  )}
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                    style={roleBadge(data.employee.role)}
                  >
                    {data.employee.role}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex items-center justify-center rounded-lg border border-border hover:bg-bg/80 cursor-pointer transition-colors shrink-0"
            style={{ width: "32px", height: "32px", background: "transparent" }}
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>

        {/* Body */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: "16px 20px", scrollbarWidth: "thin", scrollbarColor: "rgba(99,102,241,0.2) transparent" }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-text-tertiary" style={{ fontSize: "0.8125rem" }}>
              <div className="w-6 h-6 border-[3px] border-white/10 border-t-brand rounded-full animate-spin mb-3" />
              Loading employee analytics…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
              <p className="text-text-primary font-medium" style={{ fontSize: "0.875rem" }}>Failed to load analytics</p>
              <p className="text-text-tertiary mt-1" style={{ fontSize: "0.8125rem" }}>{error}</p>
            </div>
          ) : data ? (
            <div className="space-y-5">
              {/* ── KPI Row ──────────────────────────────── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <MiniKPI label="Total Tasks" value={data.summary.totalTasks} icon={<Layers />} color="#6366F1" />
                <MiniKPI label="Completed" value={data.summary.completed} icon={<CheckCircle />} color="#34D399" />
                <MiniKPI label="In Progress" value={data.summary.inProgress} icon={<Activity />} color="#60A5FA" />
                <MiniKPI label="Overdue" value={data.summary.overdue} icon={<AlertTriangle />} color={data.summary.overdue > 0 ? "#F87171" : "#94A3B8"} />
              </div>

              {/* ── Completion Rate & Avg Progress ────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Completion Rate */}
                <div
                  className="rounded-xl border border-border"
                  style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 shrink-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                        <circle
                          cx="50" cy="50" r="40" fill="transparent"
                          stroke={data.summary.completionRate >= 75 ? "#34D399" : data.summary.completionRate >= 40 ? "#F59E0B" : "#F87171"}
                          strokeWidth="8" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 40 * (data.summary.completionRate / 100)} ${2 * Math.PI * 40}`}
                          className="transition-all duration-700"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-text-primary font-bold" style={{ fontSize: "0.8125rem" }}>
                        {data.summary.completionRate}%
                      </span>
                    </div>
                    <div>
                      <p className="text-text-primary font-semibold" style={{ fontSize: "0.8125rem" }}>Completion Rate</p>
                      <p className="text-text-tertiary" style={{ fontSize: "0.6875rem" }}>
                        {data.summary.completed} of {data.summary.totalTasks} done
                      </p>
                    </div>
                  </div>
                </div>

                {/* Avg Progress */}
                <div
                  className="rounded-xl border border-border"
                  style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 shrink-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                        <circle
                          cx="50" cy="50" r="40" fill="transparent"
                          stroke="#6366F1"
                          strokeWidth="8" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 40 * (data.summary.avgProgress / 100)} ${2 * Math.PI * 40}`}
                          className="transition-all duration-700"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-text-primary font-bold" style={{ fontSize: "0.8125rem" }}>
                        {data.summary.avgProgress}%
                      </span>
                    </div>
                    <div>
                      <p className="text-text-primary font-semibold" style={{ fontSize: "0.8125rem" }}>Avg Task Progress</p>
                      <p className="text-text-tertiary" style={{ fontSize: "0.6875rem" }}>
                        Across {data.summary.totalTasks - data.summary.completed} active tasks
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Status & Priority Breakdown ──────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Status */}
                <div
                  className="rounded-xl border border-border"
                  style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
                >
                  <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-3">Status Breakdown</p>
                  <div className="space-y-2">
                    {statusConfig.map((s) => {
                      const count = data.statusBreakdown[s.key] || 0;
                      const pct = data.summary.totalTasks === 0 ? 0 : Math.round((count / data.summary.totalTasks) * 100);
                      return (
                        <div key={s.key} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                          <span className="text-text-secondary flex-1 truncate" style={{ fontSize: "0.75rem" }}>{s.label}</span>
                          <span className="text-text-primary font-semibold font-mono shrink-0" style={{ fontSize: "0.75rem" }}>{count}</span>
                          <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Priority */}
                <div
                  className="rounded-xl border border-border"
                  style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
                >
                  <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-3">Priority Distribution</p>
                  <div className="space-y-2">
                    {priorityConfig.map((p) => {
                      const count = data.priorityBreakdown[p.key] || 0;
                      const pct = data.summary.totalTasks === 0 ? 0 : Math.round((count / data.summary.totalTasks) * 100);
                      return (
                        <div key={p.key} className="flex items-center gap-2">
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
                            style={{ backgroundColor: p.bg, color: p.color }}
                          >
                            {p.label}
                          </span>
                          <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                          </div>
                          <span className="text-text-primary font-semibold font-mono shrink-0" style={{ fontSize: "0.75rem" }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── Weekly Timeline ───────────────────────── */}
              <div
                className="rounded-xl border border-border"
                style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
              >
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-3">Weekly Activity (Last 8 Weeks)</p>
                <div className="flex items-end gap-1.5" style={{ height: "100px" }}>
                  {data.weeklyTimeline.map((w, i) => {
                    const maxVal = Math.max(...data.weeklyTimeline.map((t) => Math.max(t.created, t.completed)), 1);
                    const createdH = (w.created / maxVal) * 80;
                    const compH = (w.completed / maxVal) * 80;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end" title={`${w.week}: ${w.created} assigned, ${w.completed} completed`}>
                        <div className="flex gap-px items-end flex-1 w-full">
                          <div
                            className="flex-1 rounded-t transition-all duration-300"
                            style={{ height: `${createdH}%`, backgroundColor: "rgba(99,102,241,0.5)", minHeight: w.created > 0 ? "4px" : "0" }}
                          />
                          <div
                            className="flex-1 rounded-t transition-all duration-300"
                            style={{ height: `${compH}%`, backgroundColor: "#34D399", minHeight: w.completed > 0 ? "4px" : "0" }}
                          />
                        </div>
                        <span className="text-[8px] text-text-tertiary whitespace-nowrap">{w.week}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-2 justify-center">
                  <span className="flex items-center gap-1 text-[10px] text-text-tertiary">
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: "rgba(99,102,241,0.5)" }} /> Assigned
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-text-tertiary">
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: "#34D399" }} /> Completed
                  </span>
                </div>
              </div>

              {/* ── Department Distribution ───────────────── */}
              {data.departmentDistribution.length > 1 && (
                <div
                  className="rounded-xl border border-border"
                  style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
                >
                  <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-3">Task Distribution by Department</p>
                  <div className="space-y-2">
                    {data.departmentDistribution.map((d) => {
                      const pct = data.summary.totalTasks === 0 ? 0 : Math.round((d.total / data.summary.totalTasks) * 100);
                      return (
                        <div key={d.name} className="flex items-center gap-2">
                          <span className="text-text-secondary truncate flex-1" style={{ fontSize: "0.75rem" }}>🏢 {d.name}</span>
                          <span className="text-text-primary font-semibold font-mono shrink-0" style={{ fontSize: "0.75rem" }}>{d.total}</span>
                          <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                            <div className="h-full rounded-full transition-all duration-500 bg-indigo-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Current Workload ──────────────────────── */}
              {data.currentWorkload.length > 0 && (
                <div
                  className="rounded-xl border border-border"
                  style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
                >
                  <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-3">
                    Current Workload ({data.currentWorkload.length})
                  </p>
                  <div
                    className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1"
                    style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(99,102,241,0.2) transparent" }}
                  >
                    {data.currentWorkload.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border transition-all"
                        style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-medium text-text-primary truncate">{t.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: (statusColorMap[t.status] || "#94A3B8") + "1A",
                                color: statusColorMap[t.status] || "#94A3B8",
                              }}
                            >
                              {t.status.replace("_", " ")}
                            </span>
                            {t.dueDate && (
                              <span className="text-[10px] text-text-tertiary flex items-center gap-0.5">
                                <Calendar className="w-2.5 h-2.5" />
                                {new Date(t.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${t.progress}%` }} />
                          </div>
                          <span className="text-[10px] text-text-tertiary font-mono">{t.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Overdue Tasks ─────────────────────────── */}
              {data.overdueTasks.length > 0 && (
                <div
                  className="rounded-xl border border-border"
                  style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
                >
                  <div className="flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                      Overdue Tasks ({data.overdueTasks.length})
                    </p>
                  </div>
                  <div
                    className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1"
                    style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(248,113,113,0.25) transparent" }}
                  >
                    {data.overdueTasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg border"
                        style={{
                          borderColor: "rgba(248,113,113,0.15)",
                          backgroundColor: "rgba(248,113,113,0.04)",
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-medium text-text-primary truncate">{t.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-text-tertiary">🏢 {t.department}</span>
                            <span className="text-[10px] text-red-400 font-semibold">
                              {t.daysOverdue}d overdue
                            </span>
                          </div>
                        </div>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase"
                          style={{
                            backgroundColor: t.priority === "CRITICAL" ? "rgba(220,38,38,0.15)" : t.priority === "HIGH" ? "rgba(249,115,22,0.15)" : t.priority === "MEDIUM" ? "rgba(59,130,246,0.15)" : "rgba(16,185,129,0.15)",
                            color: t.priority === "CRITICAL" ? "#DC2626" : t.priority === "HIGH" ? "#F97316" : t.priority === "MEDIUM" ? "#3B82F6" : "#10B981",
                          }}
                        >
                          {t.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div
          className="shrink-0 border-t border-border flex items-center justify-between"
          style={{ padding: "10px 20px" }}
        >
          <p className="text-text-tertiary" style={{ fontSize: "0.6875rem" }}>
            {data?.employee?.joinedAt ? `Joined ${new Date(data.employee.joinedAt).toLocaleDateString([], { month: "short", year: "numeric" })}` : "Analytics refresh on panel open"}
          </p>
          <button
            onClick={handleClose}
            className="px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-bg/80 cursor-pointer transition-colors text-xs font-medium"
            style={{ background: "transparent" }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}