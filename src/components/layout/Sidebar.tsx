"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  ListTodo,
  Send,
  Layers,
  FileText,
  Folder,
  Activity,
  User,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import React, { useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { useThemeStore } from "@/store/useThemeStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    label: "MAIN",
    items: [
      { name: "Dashboard",       href: "/dashboard",    icon: LayoutGrid },
      { name: "My Tasks",        href: "/my-tasks",     icon: ListTodo, badgeKey: "myTasks" },
      { name: "All Tasks",       href: "/all-tasks",    icon: Layers },
      { name: "Employees",       href: "/employees",    icon: User },
      { name: "Delegated By Me", href: "/delegatedBy",  icon: Send },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { name: "Task Templates",  href: "/task-templates",  icon: FileText },
      { name: "Task Directory",  href: "/task-directory",  icon: Folder },
      { name: "Activities",      href: "/activities",      icon: Activity },
      { name: "DayTracker",      href: "/holidays",        icon: Calendar },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, fetchCurrentUser, tasks } = useTaskStore();
  const { sidebarCollapsed, toggleSidebar } = useThemeStore();

  useEffect(() => {
    if (!currentUser) {
      fetchCurrentUser();
    }
  }, [currentUser]);

  const isEmployee = currentUser?.role === "EMPLOYEE";

  const filteredSections = NAV_SECTIONS.map((section) => {
    if (isEmployee) {
      if (section.label === "TOOLS") {
        // Employees can only see DayTracker from TOOLS
        return {
          ...section,
          items: section.items.filter((item) => item.name === "DayTracker"),
        };
      }
      return {
        ...section,
        items: section.items.filter(
          (item) => item.name === "Dashboard" || item.name === "My Tasks"
        ),
      };
    }
    return section;
  }).filter((s): s is typeof NAV_SECTIONS[number] => s !== null && s.items.length > 0);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const myTasksCount = tasks.filter(
    (t) => t.assigneeId === currentUser?.id && t.status === "TODO"
  ).length;

  return (
    <>
      {/* Mobile Drawer Backdrop — sits below sidebar (z-20), above content */}
      {!sidebarCollapsed && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-20 md:hidden"
        />
      )}

      <aside
        style={{ backgroundColor: "var(--color-sidebar-bg)" }}
        className={cn(
          "flex flex-col border-r border-border h-full fixed left-0 top-0 bottom-0 transition-all duration-200 ease-in-out",
          /* z-sidebar = 30 */
          "z-[30]",
          /* Width: 240px expanded, 56px collapsed */
          sidebarCollapsed
            ? "w-[56px] max-md:-translate-x-full"
            : "w-[240px] translate-x-0"
        )}
      >
        {/* ── Brand Header ── */}
        <div className="h-[56px] flex items-center px-4 gap-3 shrink-0 border-b border-border">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-extrabold shrink-0 shadow-sm"
            style={{
              background: "linear-gradient(135deg, #6366F1, #4F46E5)",
              fontSize: "13px",
            }}
          >
            IF
          </div>
          {!sidebarCollapsed && (
            <span
              className="font-semibold text-text-primary tracking-tight truncate"
              style={{ fontSize: "0.84375rem" }}
            >
              TaskCenter
            </span>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {filteredSections.map((section) => (
            <div key={section.label}>
              {/* Section label */}
              {!sidebarCollapsed ? (
                <p
                  className="text-text-tertiary uppercase tracking-[0.1em] font-semibold"
                  style={{
                    fontSize: "0.625rem",   /* 10px — compact label */
                    padding: "14px 12px 4px 12px",
                  }}
                >
                  {section.label}
                </p>
              ) : (
                <div className="h-px bg-border my-3 mx-1" />
              )}

              {/* Nav items */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const hasBadge =
                    item.badgeKey === "myTasks" && myTasksCount > 0;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={sidebarCollapsed ? item.name : undefined}
                      className={cn(
                        "flex items-center rounded-lg transition-all relative",
                        "mb-0.5",
                        isActive
                          ? "font-medium"
                          : "font-normal hover:bg-white/5"
                      )}
                      style={{
                        padding: "7px 10px",
                        gap: "9px",
                        fontSize: "0.8125rem",   /* 13px — compact nav */
                        color: isActive ? "#818CF8" : "#9CA3AF",
                        background: isActive
                          ? "rgba(99, 102, 241, 0.12)"
                          : undefined,
                      }}
                    >
                      <item.icon
                        style={{
                          width: "16px",
                          height: "16px",
                          minWidth: "16px",
                          fontSize: "16px",
                          color: isActive ? "#818CF8" : "#6B7280",
                          flexShrink: 0,
                        }}
                      />
                      {!sidebarCollapsed && (
                        <span className="truncate flex-1">{item.name}</span>
                      )}
                      {hasBadge && !sidebarCollapsed && (
                        <span
                          className="text-white rounded-full shrink-0 font-medium"
                          style={{
                            fontSize: "0.75rem",
                            background: "#6366F1",
                            padding: "1px 7px",
                          }}
                        >
                          {myTasksCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Collapse Toggle ── */}
        <div className="p-3 flex justify-center shrink-0">
          <button
            onClick={toggleSidebar}
            className="icon-only w-8 h-8 rounded-full border border-border-strong hover:bg-white/5 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none"
            style={{ minHeight: "unset", minWidth: "unset" }}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* ── User Section — Problem 2 spec ── */}
        {currentUser && (
          <div
            className="border-t border-border shrink-0"
            style={{ padding: "16px" }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Link
                href="/profile"
                className="shrink-0 focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none rounded-full"
              >
                <UserAvatar
                  src={currentUser.avatarUrl}
                  name={currentUser.name}
                  size="sm"
                />
              </Link>
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p
                    className="text-text-primary truncate font-medium"
                    style={{ fontSize: "0.78125rem" }}   /* 12.5px — compact user name */
                  >
                    {currentUser.name}
                  </p>
                  <span
                    className="inline-block mt-0.5 rounded-full font-medium tracking-wide"
                    style={{
                      fontSize: "0.625rem",             /* 10px — compact role badge */
                      background: "rgba(99, 102, 241, 0.2)",
                      color: "#A5B4FC",
                      padding: "1px 6px",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {currentUser.role === "ADMIN"
                      ? "Administrator"
                      : currentUser.jobTitle || "Staff"}
                  </span>
                </div>
              )}
              {!sidebarCollapsed && (
                <button
                  onClick={handleLogout}
                  title="Log Out"
                  className="icon-only p-1.5 hover:bg-white/5 text-text-tertiary hover:text-red-400 rounded-lg transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none"
                  style={{ minHeight: "unset", minWidth: "unset" }}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
export default Sidebar;