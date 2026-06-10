"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, Inbox } from "lucide-react";
import { Notification } from "@/types";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationBell({
  notifications,
  onMarkRead,
  onMarkAllRead,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const unreadNotifications = notifications.filter((n) => !n.read);
  const unreadCount = unreadNotifications.length;
  const recentNotifications = notifications.slice(0, 5);

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) {
      try {
        const res = await fetch(`/api/notifications/${notif.id}`, {
          method: "PATCH",
        });
        if (res.ok) {
          onMarkRead(notif.id);
        }
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }
    setIsOpen(false);
    router.push(notif.link || "/my-tasks");
  };

  const handleMarkAllReadClick = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
      });
      if (res.ok) {
        onMarkAllRead();
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Determine category color and icon
  const getCategoryDetails = (message: string) => {
    const msg = message.toLowerCase();
    if (msg.includes("assign") || msg.includes("delegate") || msg.includes("transfer")) {
      return { color: "bg-[#EFF6FF] text-[#2563EB]" }; // blue
    } else if (msg.includes("overdue") || msg.includes("late")) {
      return { color: "bg-[#FEF2F2] text-[#EF4444]" }; // red
    } else if (msg.includes("comment") || msg.includes("reply") || msg.includes("replied")) {
      return { color: "bg-[#F5F3FF] text-[#7C3AED]" }; // purple
    } else if (msg.includes("complete") || msg.includes("done")) {
      return { color: "bg-[#ECFDF5] text-[#10B981]" }; // green
    }
    return { color: "bg-[#F1F5F9] text-[#475569]" }; // fallback gray
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative w-8 h-8 rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg active:scale-96 transition-all duration-150 shrink-0",
          "focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none"
        )}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#EF4444] text-[9px] font-bold text-white border border-surface shrink-0">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[320px] bg-surface border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150" style={{ zIndex: "var(--z-dropdown)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
            <span className="text-text-primary font-medium" style={{ fontSize: "0.9375rem" }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllReadClick}
                className="text-brand-text hover:underline font-medium transition-colors"
                style={{ fontSize: "0.8125rem" }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Inbox className="w-8 h-8 mb-2 text-text-tertiary stroke-1" />
                <p className="text-[12px] text-text-secondary">You're all caught up</p>
              </div>
            ) : (
              recentNotifications.map((notif) => {
                const cat = getCategoryDetails(notif.message);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-bg/40",
                      !notif.read ? "bg-brand-light/40 border-l-2 border-brand" : ""
                    )}
                  >
                    {/* Category Icon Wrapper */}
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-base font-bold", cat.color)}>
                      <Bell className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary leading-normal line-clamp-2" style={{ fontSize: "0.9375rem" }}>
                        {notif.message}
                      </p>
                      <span className="block mt-1 text-text-tertiary" style={{ fontSize: "0.75rem" }}>
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="bg-bg/20 border-t border-border text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block py-2.5 text-brand-text hover:underline font-medium transition-colors"
              style={{ fontSize: "0.8125rem" }}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
export default NotificationBell;
