"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, LogOut, User, Menu, Search, X, Loader2 } from "lucide-react";
import Link from "next/link";

import { useTaskStore } from "@/store/useTaskStore";
import { useThemeStore } from "@/store/useThemeStore";
import { AssignTaskModal } from "@/components/AssignTaskModal";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { StatusBadge } from "@/components/ui/Badge";
import { Notification } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const { currentUser, fetchCurrentUser, setSelectedTask, fetchTasks } = useTaskStore();
  const { toggleSidebar } = useThemeStore();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);

  // Global search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    employees: any[];
    departments: any[];
    teams: any[];
    tasks: any[];
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (cleanPath === "/my-delegations")return "My Delegated Tasks";
    if (cleanPath === "/departments")   return "Departments Directory";
    if (cleanPath === "/onboarding")    return "Onboarding Templates";
    if (cleanPath === "/audit-log")     return "Security Audit Logs";
    return "Management Center";
  };

  const fetchNotifications = async (isInitial = false) => {
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
        const fetchedNotifs = payload.data.notifications || [];
        
        // If not initial fetch, check for new notifications to show toast
        if (!isInitial && notifications.length > 0) {
          const newUnread = fetchedNotifs.filter(
            (n: Notification) => !n.read && !notifications.some((old) => old.id === n.id)
          );
          newUnread.forEach((n: Notification) => {
            toast.info(n.message);
          });
        }
        
        setNotifications(fetchedNotifs);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      fetchCurrentUser();
    }
    fetchNotifications(true);

    // Poll notifications and tasks every 3 seconds
    const interval = setInterval(() => {
      fetchNotifications(false);
      fetchTasks();
    }, 3000);

    const handleOpenAssignModal = () => {
      if (currentUser?.role === "ADMIN" || currentUser?.role === "EMPLOYEE") {
        setShowAssignModal(true);
      }
    };
    window.addEventListener("open-assign-task-modal", handleOpenAssignModal);

    return () => {
      clearInterval(interval);
      window.removeEventListener("open-assign-task-modal", handleOpenAssignModal);
    };
  }, [currentUser, notifications]);

  // Click outside search dropdown handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Search Input Change with Debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!q.trim()) {
      setSearchResults(null);
      return;
    }

    setSearchLoading(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const payload = await res.json();
          if (payload.success) {
            setSearchResults(payload.data);
          }
        }
      } catch (err) {
        console.error("Global search failed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 40000 / 100); // 400ms debounce
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setSearchFocused(false);
  };

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

  const handleTaskClick = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          setSelectedTask(payload.data);
        }
      }
    } catch (err) {
      console.error(err);
    }
    clearSearch();
  };

  return (
    <div
      className="h-[56px] border-b border-border px-5 flex items-center gap-3 shrink-0 select-none sticky top-0 z-30"
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
      <div className="min-w-0 mr-4">
        <h1
          className="text-text-primary font-semibold truncate"
          style={{ fontSize: "0.9375rem" }}   /* 15px — body/nav size */
        >
          {getPageTitle()}
        </h1>
      </div>

      {/* Global Search Bar input with results dropdown */}
      <div className="flex-1 max-w-md relative" ref={searchContainerRef}>
        <div className="relative w-full h-9">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Global search (tasks, team, departments...)"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setSearchFocused(true)}
            className="w-full h-full pl-9 pr-9 bg-bg text-text-primary placeholder:text-text-tertiary placeholder:text-[13px] text-xs border border-border-strong rounded-lg transition-all duration-200 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none"
          />
          {searchLoading && (
            <div className="absolute inset-y-0 right-3 flex items-center text-text-tertiary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            </div>
          )}
          {!searchLoading && searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-3 flex items-center text-text-tertiary hover:text-text-primary transition-colors focus-visible:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Global Search Dropdown Results */}
        {searchFocused && searchResults && (
          <div className="absolute left-0 right-0 mt-2 bg-surface border border-border shadow-xl rounded-xl p-4 space-y-4 max-h-[420px] overflow-y-auto z-[99]">
            {/* 1. Tasks Category */}
            {searchResults.tasks && searchResults.tasks.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Tasks ({searchResults.tasks.length})</span>
                <div className="space-y-1">
                  {searchResults.tasks.map((task: any) => (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task.id)}
                      className="p-2 hover:bg-bg rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="font-medium text-text-primary truncate">{task.title}</span>
                      <span className="shrink-0"><StatusBadge status={task.status} showDot={false} /></span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Employees Category */}
            {searchResults.employees && searchResults.employees.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Team Members ({searchResults.employees.length})</span>
                <div className="space-y-1">
                  {searchResults.employees.map((emp: any) => (
                    <Link
                      key={emp.id}
                      href="/employees"
                      onClick={clearSearch}
                      className="p-2 hover:bg-bg rounded-lg cursor-pointer transition-colors flex items-center gap-2.5 text-xs text-text-primary"
                    >
                      <UserAvatar src={emp.avatarUrl} name={emp.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{emp.name}</p>
                        <p className="text-[10.5px] text-text-tertiary truncate">{emp.email}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Departments Category */}
            {searchResults.departments && searchResults.departments.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Departments ({searchResults.departments.length})</span>
                <div className="space-y-1">
                  {searchResults.departments.map((dept: any) => (
                    <Link
                      key={dept.id}
                      href="/departments"
                      onClick={clearSearch}
                      className="p-2 hover:bg-bg rounded-lg cursor-pointer transition-colors block text-xs text-text-primary font-semibold"
                    >
                      🏢 {dept.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Teams Category */}
            {searchResults.teams && searchResults.teams.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Teams ({searchResults.teams.length})</span>
                <div className="space-y-1">
                  {searchResults.teams.map((team: string) => (
                    <Link
                      key={team}
                      href="/employees"
                      onClick={clearSearch}
                      className="p-2 hover:bg-bg rounded-lg cursor-pointer transition-colors block text-xs text-text-primary font-semibold"
                    >
                      👥 Team: {team}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {(!searchResults.tasks?.length &&
              !searchResults.employees?.length &&
              !searchResults.departments?.length &&
              !searchResults.teams?.length) && (
              <div className="text-center py-4 text-xs text-text-tertiary">
                No matching results found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Action Items */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Create Task */}
        {(currentUser?.role === "ADMIN" || currentUser?.role === "EMPLOYEE") && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 font-semibold rounded-lg transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 hover:scale-[1.02] active:scale-95"
            style={{
              background: "#4F46E5",
              color: "#FFFFFF",
              border: "none",
              padding: "8px 16px",
              fontSize: "0.875rem",
              fontWeight: 600,
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
              minHeight: "36px",
            }}
          >
            <Plus className="w-4 h-4" />
            Assign task
          </button>
        )}

        {/* Notifications */}
        <NotificationBell
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
        />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Profile Dropdown */}
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