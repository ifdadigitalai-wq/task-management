"use client";

import { useEffect, useState } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { useRouter } from "next/navigation";
import { Bell, Check, ExternalLink } from "lucide-react";
import { useTimeTheme } from "@/hooks/useTimeTheme";

interface Notification {
  id: string;
  userId: string;
  content: string;
  isSeen: boolean;
  link: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const { currentUser, fetchCurrentUser } = useTaskStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const timeTheme = useTimeTheme();

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
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
      // Mark as seen
      if (!notif.isSeen) {
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
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: timeTheme.textColor, margin: 0, transition: "color 0.6s ease" }}>
            Notifications
          </h1>
          <p style={{ fontSize: "13px", color: timeTheme.mutedTextColor, marginTop: "4px", transition: "color 0.6s ease" }}>
            View and manage your task assignments and alerts
          </p>
        </div>
        {notifications.some(n => !n.isSeen) && (
          <button
            onClick={handleMarkAllAsRead}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              height: "34px",
              padding: "0 14px",
              borderRadius: "8px",
              border: `1px solid ${timeTheme.cardBorder}`,
              backgroundColor: timeTheme.cardBackground,
              fontSize: "12px",
              fontWeight: 500,
              color: timeTheme.textColor,
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
          >
            <Check style={{ height: "14px", width: "14px" }} /> Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: "14px" }}>
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", backgroundColor: timeTheme.cardBackground, borderRadius: "12px", border: `1px solid ${timeTheme.cardBorder}`, transition: "background 1.2s ease" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔔</div>
          <p style={{ fontSize: "14px", color: timeTheme.mutedTextColor, fontWeight: 500 }}>
            You have no notifications yet
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "16px",
                backgroundColor: notif.isSeen ? timeTheme.cardBackground : `${timeTheme.accentColor}12`,
                border: "1px solid",
                borderColor: notif.isSeen ? timeTheme.cardBorder : `${timeTheme.accentColor}44`,
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
            >
              <div style={{
                height: "32px",
                width: "32px",
                borderRadius: "50%",
                backgroundColor: notif.isSeen ? timeTheme.dividerColor : `${timeTheme.accentColor}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: notif.isSeen ? timeTheme.mutedTextColor : timeTheme.accentColor,
                flexShrink: 0,
                transition: "all 0.3s ease",
              }}>
                <Bell style={{ height: "14px", width: "14px" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: "13px",
                  fontWeight: notif.isSeen ? 500 : 600,
                  color: timeTheme.textColor,
                  margin: 0,
                  lineHeight: "1.4"
                }}>
                  {notif.content}
                </p>
                <span style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px", display: "inline-block" }}>
                  {new Date(notif.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
              <div style={{ display: "flex", alignSelf: "center", color: "#9ca3af" }}>
                <ExternalLink style={{ height: "14px", width: "14px" }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
