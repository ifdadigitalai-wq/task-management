"use client";

import { useEffect, useState } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { useRouter } from "next/navigation";
import { Bell, Check, ExternalLink, Inbox } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Notification } from "@/types";

export default function NotificationsPage() {
  const { currentUser, fetchCurrentUser } = useTaskStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const toast = useToast();

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const payload = await res.json();
        if (payload.success && payload.data) {
          // payload.data shape: { notifications, unreadCount }
          setNotifications(payload.data.notifications || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      fetchCurrentUser();
    }
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (notif: Notification) => {
    try {
      // Mark as read
      if (!notif.read) {
        await fetch(`/api/notifications/${notif.id}`, {
          method: "PATCH",
        });
      }
      
      // Redirect
      router.push(notif.link || "/my-tasks");
    } catch (err) {
      console.error("Failed to update notification:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
      });
      const payload = await res.json();
      if (payload.success) {
        toast.success("All notifications marked as read.");
        fetchNotifications();
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Notification Inbox
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            View updates on task assignments, comments, and status cycles.
          </p>
        </div>

        {unreadNotifications.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <Check className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-2" />
            Loading inbox items...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="w-12 h-12 text-slate-350 mb-3" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Inbox is Empty
            </h3>
            <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1">
              You don't have any notifications logged at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer hover:shadow-xs transition-all border ${
                  notif.read
                    ? "bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-850"
                    : "bg-indigo-50/40 dark:bg-indigo-950/10 border-indigo-150/40 dark:border-indigo-900/30"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    notif.read
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs leading-relaxed ${
                      notif.read ? "text-slate-650 dark:text-slate-400 font-medium" : "text-slate-850 dark:text-slate-100 font-extrabold"
                    }`}
                  >
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block font-medium">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center self-center text-slate-400 hover:text-slate-650">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
