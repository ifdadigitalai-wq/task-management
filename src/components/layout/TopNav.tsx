"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, LogOut, User, Menu } from "lucide-react";
import Link from "next/link";

import { useTaskStore } from "@/store/useTaskStore";
import { useThemeStore } from "@/store/useThemeStore";
import { AssignTaskModal } from "@/components/AssignTaskModal";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { SearchBar } from "@/components/ui/SearchBar";
import { Notification } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, fetchCurrentUser, setFilters, filters, fetchTasks } = useTaskStore();
  const { toggleSidebar } = useThemeStore();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);

  // Dynamic Page Title
  const getPageTitle = () => {
    const cleanPath = pathname.split("?")[0].replace(/\/$/, "");
    if (cleanPath === "/dashboard")     return "Performance Dashboard";
    if (cleanPath === "/my-tasks")      return "My Assigned Tasks";
    if (cleanPath === "/all-tasks")     return "Company Tasks Directory";
    if (cleanPath === "/employees")     return "Team Management";
    if (cleanPath === "/task-templates")return "Task Templates";
    if (cleanPath === "/task-directory")return "Category Directory";
    if (cleanPath === "/activities")    return "Audit Logs & Activities";
    if (cleanPath === "/holidays")      return "Corporate Holiday Calendar";
    if (cleanPath === "/notifications") return "Notifications Center";
    if (cleanPath === "/profile")       return "My Profile & Settings";
    if (cleanPath === "/delegatedBy")   return "Tasks Delegated By Me";
    return "Management Center";
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) return;
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) return;
      const payload = await res.json();
      if (payload.success && payload.data) {
        setNotifications(payload.data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      fetchCurrentUser();
    }
    fetchNotifications();

    // Poll notifications and tasks every 10 seconds for near-real-time sync
    const interval = setInterval(() => {
      fetchNotifications();
      fetchTasks();
    }, 10000);

    const handleOpenAssignModal = () => {
      if (currentUser?.role === "ADMIN") {
        setShowAssignModal(true);
      }
    };
    window.addEventListener("open-assign-task-modal", handleOpenAssignModal);

    return () => {
      clearInterval(interval);
      window.removeEventListener("open-assign-task-modal", handleOpenAssignModal);
    };
  }, [currentUser]);

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const showSearch =
    pathname === "/my-tasks" ||
    pathname === "/all-tasks" ||
    pathname === "/delegatedBy";

  return (
    /* TopNav height: 56px, sticky handled by parent wrapper */
    <div
      className="h-[56px] border-b border-border px-5 flex items-center gap-3 shrink-0 select-none"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      {/* Mobile Hamburger — 44×44 tap target */}
      <button
        onClick={toggleSidebar}
        className="icon-only w-11 h-11 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/5 md:hidden focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none shrink-0 transition-colors"
        style={{ minHeight: "unset", minWidth: "unset" }}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page Title */}
      <div className="min-w-0">
        <h1
          className="text-text-primary font-semibold truncate"
          style={{ fontSize: "0.9375rem" }}   /* 15px — body/nav size */
        >
          {getPageTitle()}
        </h1>
      </div>

      {/* Center Spacer */}
      <div className="flex-1" />

      {/* Right Action Items */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Create Task (Admin Only) — Problem 8: high-contrast button */}
        {currentUser?.role === "ADMIN" && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 font-medium rounded-lg transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
            style={{
              background: "#4F46E5",
              color: "#FFFFFF",
              border: "none",
              padding: "10px 20px",
              fontSize: "0.9375rem",
              fontWeight: 500,
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.4)",
              minHeight: "36px",
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
            <Plus className="w-4 h-4" />
            Assign task
          </button>
        )}

        {/* SearchBar */}
        {showSearch && (
          <SearchBar
            value={filters.search}
            onChange={(val) => setFilters({ search: val })}
            placeholder="Search tasks..."
            className="hidden md:block"
          />
        )}

        {/* Notifications */}
        <NotificationBell
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
        />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Profile Dropdown — z-dropdown (50) */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="icon-only focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none rounded-full flex items-center shrink-0"
            style={{ minHeight: "unset", minWidth: "unset" }}
          >
            <UserAvatar
              src={currentUser?.avatarUrl}
              name={currentUser?.name}
              size="sm"
            />
          </button>

          {profileOpen && (
            <>
              <div
                onClick={() => setProfileOpen(false)}
                className="fixed inset-0 bg-transparent"
                style={{ zIndex: "var(--z-dropdown)" }}
              />
              <div
                className="absolute right-0 mt-2 w-48 border border-border rounded-xl shadow-lg py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
                style={{
                  zIndex: "calc(var(--z-dropdown) + 1)",
                  backgroundColor: "var(--color-surface-raised)",
                }}
              >
                <div className="px-4 py-3 border-b border-border">
                  <p
                    className="font-medium text-text-primary truncate"
                    style={{ fontSize: "0.9375rem" }}
                  >
                    {currentUser?.name || "User Profile"}
                  </p>
                  <p
                    className="text-text-secondary truncate mt-0.5"
                    style={{ fontSize: "0.8125rem" }}
                  >
                    {currentUser?.role || "Employee"}
                  </p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors focus-visible:outline-none"
                  style={{ fontSize: "0.9375rem" }}
                >
                  <User className="w-4 h-4 text-text-tertiary" />
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-400 hover:bg-white/5 transition-colors text-left border-t border-border focus-visible:outline-none"
                  style={{ fontSize: "0.9375rem", minHeight: "unset" }}
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Assign Task Modal */}
      {showAssignModal && (
        <AssignTaskModal onClose={() => setShowAssignModal(false)} />
      )}
    </div>
  );
}
export default TopNav;