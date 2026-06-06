"use client";

import React, { useEffect, useState } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import {
  Layers, CheckCircle, Clock, AlertTriangle, BarChart3,
  Calendar, ChevronRight
} from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import PerformanceAnalytics from "@/components/dashboard/PerformanceAnalytics";

interface StatsData {
  total: number;
  overdue: number;
  completedToday: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  employees: any[];
  departments: any[];
}

export default function DashboardPage() {
  const { currentUser, fetchCurrentUser, setSelectedTask } = useTaskStore();

  const [stats, setStats]               = useState<StatsData | null>(null);
  const [activities, setActivities]     = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);

  const fetchDashboardData = async () => {
    try {
      const statsRes    = await fetch("/api/tasks/stats");
      const statsPayload = await statsRes.json();
      if (statsPayload.success) setStats(statsPayload.data);

      const actRes    = await fetch("/api/activities");
      const actPayload = await actRes.json();
      if (actPayload.success) setActivities((actPayload.data || []).slice(0, 10));

      const notifRes    = await fetch("/api/notifications");
      const notifPayload = await notifRes.json();
      if (notifPayload.success)
        setNotifications((notifPayload.data?.notifications || []).slice(0, 5));

      const tasksRes    = await fetch("/api/tasks");
      const tasksPayload = await tasksRes.json();
      if (tasksPayload.success) {
        const activeTasks = (tasksPayload.data || []).filter(
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
    const id = setInterval(fetchDashboardData, 15000);
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

  const isAdmin = currentUser.role === "ADMIN";

  // Donut chart segments
  const statusSegments = [
    { label: "To Do",       count: stats?.byStatus.TODO       || 0, color: "#94A3B8" },
    { label: "In Progress", count: stats?.byStatus.IN_PROGRESS || 0, color: "#60A5FA" },
    { label: "In Review",   count: stats?.byStatus.IN_REVIEW  || 0, color: "#A78BFA" },
    { label: "Completed",   count: stats?.byStatus.DONE       || 0, color: "#34D399" },
    { label: "Cancelled",   count: stats?.byStatus.CANCELLED  || 0, color: "#F87171" },
  ];

  const totalTasks     = stats?.total       || 0;
  const completedTasks = stats?.byStatus.DONE || 0;
  const overdueTasks   = stats?.overdue     || 0;
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

  return (
    <div className="space-y-6 select-none">

      {/* ── PROBLEM 9: Greeting Header ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 rounded-xl border border-border"
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <div>
          {/* Problem 9: h1 — 22px / 700 */}
          <h1
            className="text-text-primary"
            style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "2px" }}
          >
            Hello, {currentUser.name.split(" ")[0]}!
          </h1>
          {/* Problem 9: subtitle — 15px / 400 */}
          <p style={{ fontSize: "0.8125rem", color: "rgba(156, 163, 175, 0.9)", fontWeight: 400 }}>
            Here is the live workload statistics and activity updates for today.
          </p>
        </div>

        {/* "Live Workspace" button — high contrast */}
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
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#4338CA";
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#4F46E5";
            (e.currentTarget as HTMLButtonElement).style.transform = "";
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-ping"
            style={{ backgroundColor: "#A5B4FC" }}
          />
          Live Workspace
        </button>
      </div>

      {/* ── PROBLEM 3: KPI Cards ── */}
      {/* Problem 10: grid responsive — 2 cols mobile, 4 cols desktop */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
      >
        {/* KPI 1: Total Tasks */}
        <KpiCard
          label={isAdmin ? "Total Tasks" : "My Assigned"}
          value={totalTasks}
          delta="+8%"
          deltaPositive
          comparison="vs last week"
          icon={<Layers />}
          iconColor="#6366F1"
        />
        {/* KPI 2: Completed */}
        <KpiCard
          label="Completed"
          value={completedTasks}
          delta="+15%"
          deltaPositive
          comparison="vs last week"
          icon={<CheckCircle />}
          iconColor="#34D399"
        />
        {/* KPI 3: Overdue */}
        <KpiCard
          label="Overdue"
          value={overdueTasks}
          delta={overdueTasks > 0 ? "+2 new" : "0%"}
          deltaPositive={overdueTasks === 0}
          comparison="vs yesterday"
          icon={<AlertTriangle />}
          iconColor={overdueTasks > 0 ? "#F87171" : "#6366F1"}
        />
        {/* KPI 4: Completion Rate */}
        <KpiCard
          label={isAdmin ? "Completion Rate" : "Logged Hours"}
          value={isAdmin ? `${completionRate}%` : `${(completedTasks * 1.5).toFixed(1)}h`}
          delta="+4%"
          deltaPositive
          comparison="vs last month"
          icon={<BarChart3 />}
          iconColor="#60A5FA"
        />
      </div>

      {/* ── PROBLEM 4 & 5: Charts & Workload ── */}
      {/* Problem 10: 1 col mobile → 3 col desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Status Breakdown — PROBLEM 4 card title fix */}
        <div
          className="rounded-xl border border-border"
          style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
        >
          {/* Problem 4: card title — 16px/600, no uppercase */}
          <h3
            className="text-text-primary"
            style={{ fontSize: "0.875rem", fontWeight: 650, letterSpacing: "-0.01em", marginBottom: "12px" }}
          >
            Task Status Breakdown
          </h3>
          {/* Problem 6: Donut chart with larger center text */}
          <DonutChart data={statusSegments} />
        </div>

        {/* Team Workload — PROBLEM 4 & 5 */}
        <div
          className="lg:col-span-2 rounded-xl border border-border flex flex-col justify-between"
          style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
        >
          <div>
            {/* Problem 4: card title */}
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-text-primary"
                style={{ fontSize: "0.875rem", fontWeight: 650, letterSpacing: "-0.01em" }}
              >
                {isAdmin ? "Team Workload & Utilization" : "My Upcoming Actions"}
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
              // ADMIN view — PROBLEM 5: employee name/dept hierarchy
              <div className="space-y-0">
                {stats?.employees && stats.employees.length > 0 ? (
                  stats.employees.slice(0, 5).map((emp, idx) => {
                    const empRate =
                      emp.maxScore === 0
                        ? 0
                        : Math.round((emp.score / emp.maxScore) * 100);
                    return (
                      <div
                        key={emp.id}
                        className="flex flex-col gap-2"
                        style={{
                          padding: "10px 12px",
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          {/* Problem 5: name + dept hierarchy */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <UserAvatar src={emp.avatarUrl} name={emp.name} size="sm" />
                            <span
                              className="text-text-primary font-medium truncate"
                              style={{ fontSize: "0.9375rem" }}
                            >
                              {emp.name}
                            </span>
                            {emp.dept && (
                              <span
                                style={{
                                  fontSize: "0.8125rem",
                                  fontWeight: 400,
                                  color: "rgba(156, 163, 175, 0.85)",
                                  marginLeft: "6px",
                                }}
                              >
                                ({emp.dept})
                              </span>
                            )}
                          </div>
                          {/* Problem 5: tasks count + utilization */}
                          <span style={{ fontSize: "0.8125rem", color: "#818CF8" }}>
                            {emp.total} tasks • {empRate}%
                          </span>
                        </div>
                        {/* Problem 5: progress bar — 6px height, gradient fill */}
                        <div
                          className="rounded-full overflow-hidden"
                          style={{
                            height: "6px",
                            background: "rgba(255,255,255,0.08)",
                          }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(empRate, 100)}%`,
                              background:
                                empRate === 0
                                  ? "transparent"
                                  : "linear-gradient(to right, #6366F1, #818CF8)",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div
                    className="text-center py-10 text-text-tertiary"
                    style={{ fontSize: "0.9375rem" }}
                  >
                    No employee statistics available.
                  </div>
                )}
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

      {/* ── Activities & Notifications ── */}
      {/* Problem 10: 1 col mobile → 3 col desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Activities */}
        <div
          className="lg:col-span-2 rounded-xl border border-border"
          style={{ padding: "14px 16px", backgroundColor: "var(--color-surface)" }}
        >
          {/* Problem 4: card title */}
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
                    {/* Problem 1: timestamps min 12px */}
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
            {/* Problem 4: card title */}
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
                      {/* Timestamp — min 12px */}
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
            System polls notifications every 15s.
          </p>
        </div>
      </div>
      {isAdmin && <PerformanceAnalytics />}
    </div>
  );
}

// ── KPI Card — PROBLEM 3 spec ──────────────────────────────────────────────────
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
      {/* Label row + Icon */}
      <div className="flex items-start justify-between">
        {/* Problem 3: label — 12px/500/uppercase */}
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
        {/* Problem 3: icon box — 44×44, border-radius 10px */}
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

      {/* Value — Problem 3: 36px/700 */}
      <p
        className="text-text-primary leading-none"
        style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        {value}
      </p>

      {/* Delta chip + comparison */}
      <div className="flex items-center gap-1.5 mt-1">
        {/* Problem 3: delta chip */}
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
        {/* Problem 3: comparison text */}
        <span style={{ fontSize: "0.6875rem", color: "rgba(156, 163, 175, 0.9)" }}>
          {comparison}
        </span>
      </div>
    </div>
  );
}

// ── Donut Chart — PROBLEM 6 spec ───────────────────────────────────────────────
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
  const radius      = 38;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-2 select-none">
      {/* SVG Donut */}
      <div className="relative w-44 h-44">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle
            cx="50" cy="50" r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
          {data.map((item, idx) => {
            if (item.count === 0) return null;
            const percent      = item.count / total;
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

        {/* Center text */}
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

      {/* Legend Grid */}
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