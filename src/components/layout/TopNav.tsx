"use client";

import {
  Bell,
  Plus,
  Search,
  Filter,
  Bookmark,
  Calendar,
  ChevronDown,
  X,
  ClipboardList,
  FileText,
  Sparkles,
  Route,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { AssignTaskModal } from "@/components/AssignTaskModal";
import Link from "next/link";
import { useTimeTheme } from "@/hooks/useTimeTheme";
import { routeModule } from "next/dist/build/templates/pages";

const DATE_OPTIONS = [
  "Today", "Yesterday", "Tomorrow", "This week", "Last week", "This month", "Last month",
];

function AssignTaskPopup({ onClose, anchorRect, onAssignManually }: { onClose: () => void; anchorRect: DOMRect; onAssignManually: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <div
        onMouseDown={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
        }}
      />

      {/* Popup */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: anchorRect.bottom + 8,
          left: anchorRect.left,
          zIndex: 50,
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
          padding: "20px",
          width: "360px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
            Create a task
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
              color: "#9ca3af",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X style={{ height: "15px", width: "15px" }} />
          </button>
        </div>

        {/* Three option buttons in a row */}
        <div style={{ display: "flex", gap: "10px" }}>

          {/* Assign manually */}
          <button
            onClick={() => { onAssignManually(); onClose(); }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              padding: "16px 10px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#eef2ff";
              e.currentTarget.style.borderColor = "#c7d2fe";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f9fafb";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <div
              style={{
                height: "36px",
                width: "36px",
                borderRadius: "8px",
                backgroundColor: "#e0e7ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ClipboardList style={{ height: "17px", width: "17px", color: "#4f46e5" }} />
            </div>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "#374151", textAlign: "center", lineHeight: "1.4" }}>
              Assign manually
            </span>
          </button>

          {/* Use task template */}
          <button
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              padding: "16px 10px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#eef2ff";
              e.currentTarget.style.borderColor = "#c7d2fe";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f9fafb";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <div
              style={{
                height: "36px",
                width: "36px",
                borderRadius: "8px",
                backgroundColor: "#e0e7ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText style={{ height: "17px", width: "17px", color: "#4f46e5" }} />
            </div>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "#374151", textAlign: "center", lineHeight: "1.4" }}>
              Use task template
            </span>
          </button>

          {/* Generate using AI */}
          <button
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              padding: "16px 10px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#faf5ff";
              e.currentTarget.style.borderColor = "#e9d5ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f9fafb";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <div
              style={{
                height: "36px",
                width: "36px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #818cf8, #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles style={{ height: "17px", width: "17px", color: "#ffffff" }} />
            </div>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "#374151", textAlign: "center", lineHeight: "1.4" }}>
              Generate using AI
            </span>
          </button>

        </div>
      </div>
    </>
  );
}

export function TopNav() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [assignAnchorRect, setAssignAnchorRect] = useState<DOMRect | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const { currentUser, fetchCurrentUser } = useTaskStore();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const timeTheme = useTimeTheme();

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications((prev) => {
          const newUnseen = data.filter((n: any) => !n.isSeen && !prev.some((p) => p.id === n.id));
          if (newUnseen.length > 0 && prev.length > 0) {
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
          }
          return data;
        });
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
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const isEmployee = currentUser?.role === "EMPLOYEE";
  const unseenCount = notifications.filter((n) => !n.isSeen).length;

  return (
    <>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        background: timeTheme.background,
        borderBottom: timeTheme.borderBottom,
        flexShrink: 0,
        zIndex: 10,
        transition: "all 0.5s ease"
      }}
    >
      {/* ROW 1: Header & Profile Actions */}
      <div
        style={{
          display: "flex",
          height: "56px",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          borderBottom: timeTheme.borderBottom,
          gap: "20px",
        }}
      >
        {/* Greeting */}
        <div style={{ fontSize: "14px", fontWeight: 600, color: timeTheme.textColor, display: "flex", alignItems: "center", gap: "6px" }}>
          {timeTheme.icon} {timeTheme.greeting}, {currentUser?.name || "User"}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* Notification Bell */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              style={{
                position: "relative",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: timeTheme.textColor === "#ffffff" ? "#94a3b8" : "#9ca3af",
                padding: "4px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Bell style={{ height: "18px", width: "18px" }} />
              {unseenCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "0px",
                    right: "0px",
                    height: "16px",
                    minWidth: "16px",
                    borderRadius: "50%",
                    backgroundColor: "#ef4444",
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `2px solid ${timeTheme.textColor === "#ffffff" ? "#1e293b" : "#ffffff"}`,
                    padding: "2px"
                  }}
                >
                  {unseenCount}
                </span>
              )}
            </button>

            {/* Dropdown Popup */}
            {notifOpen && (
              <>
                <div onClick={() => setNotifOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 110 }} />
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: "320px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  zIndex: 120,
                  padding: "12px 0",
                  maxHeight: "360px",
                  overflowY: "auto"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 8px 16px", borderBottom: "1px solid #f3f4f6" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>Unseen Notifications</span>
                    <Link href="/notifications" onClick={() => setNotifOpen(false)} style={{ fontSize: "11px", color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>View all</Link>
                  </div>
                  {notifications.filter(n => !n.isSeen).length === 0 ? (
                    <div style={{ padding: "24px 16px", textAlign: "center", color: "#9ca3af", fontSize: "12px" }}>
                      No unseen notifications
                    </div>
                  ) : (
                    notifications.filter(n => !n.isSeen).map((notif) => (
                      <Link
                        key={notif.id}
                        href="/notifications"
                        onClick={() => setNotifOpen(false)}
                        style={{
                          display: "block",
                          padding: "10px 16px",
                          textDecoration: "none",
                          borderBottom: "1px solid #f9fafb",
                          transition: "background-color 0.15s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f9fafb"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <p style={{ fontSize: "12px", color: "#374151", margin: "0 0 4px", fontWeight: 500, lineHeight: "1.4" }}>
                          {notif.content.length > 80 ? notif.content.slice(0, 80) + "..." : notif.content}
                        </p>
                        <span style={{ fontSize: "10px", color: "#9ca3af" }}>
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <div style={{ height: "20px", width: "1px", backgroundColor: timeTheme.textColor === "#ffffff" ? "#334155" : "#e5e7eb" }} />

          {/* User Avatar */}
{/* User Avatar */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              style={{
                height: "32px",
                width: "32px",
                borderRadius: "50%",
                backgroundColor: timeTheme.textColor === "#ffffff" ? "#334155" : "#eef2ff",
                border: `1px solid ${timeTheme.textColor === "#ffffff" ? "#475569" : "#e0e7ff"}`,
                color: timeTheme.textColor === "#ffffff" ? "#ffffff" : "#4f46e5",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={currentUser?.name || "User Profile"}
            >
              {currentUser?.name ? currentUser.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "U"}
            </button>

            {profileOpen && (
              <>
                <div onClick={() => setProfileOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 110 }} />
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                  zIndex: 120,
                  width: "160px",
                  padding: "6px",
                }}>
  <Link 
  href="/profile"
  style={{
    display: "block", // Ensures it takes the full width
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "transparent",
    color: "#571313",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    textDecoration: "none" // Prevents default link underline
  }}
>
  💻 Profile
</Link>
                  <button
                    onClick={async () => {
                      await fetch("/api/auth/logout", { method: "POST" });
                      window.location.href = "/login";
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: "transparent",
                      color: "#ef4444",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    🚪 Logout
                  </button>
                </div>
              </>
            )}
          </div>        {/* ← closes relative wrapper */}
        </div>          {/* ← closes the flex actions row — was already there */}
      </div>            {/* ← closes ROW 1 — was already there */}

      {showToast && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#1f2937",
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 600,
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          animation: "fadeInUp 0.2s ease-out"
        }}>
          <Bell style={{ height: "16px", width: "16px", color: "#22c55e" }} />
          <span>1 new notification</span>
          <style>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translate(-50%, 10px); }
              to { opacity: 1; transform: translate(-50%, 0); }
            }
          `}</style>
        </div>
      )}

      {/* ROW 2: Filter / Action Bar */}
      <div
        style={{
          display: "flex",
          height: "56px",
          alignItems: "center",
          gap: "10px",
          padding: "0 28px",
          overflowX: "auto",
        }}
      >
        {/* Assign new task — anchor for popup */}
        {!isEmployee && (
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={(e) => {
                if (assignAnchorRect) {
                  setAssignAnchorRect(null);
                } else {
                  setAssignAnchorRect(e.currentTarget.getBoundingClientRect());
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                height: "34px",
                padding: "0 14px",
                borderRadius: "8px",
                backgroundColor: assignAnchorRect ? timeTheme.accentColor : timeTheme.accentColor,
                border: "none",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                opacity: assignAnchorRect ? 0.9 : 1,
                transition: "opacity 0.15s",
              }}
            >
              <Plus style={{ height: "14px", width: "14px" }} />
              Assign new task
            </button>

            {assignAnchorRect && (
              <AssignTaskPopup
                onClose={() => setAssignAnchorRect(null)}
                anchorRect={assignAnchorRect}
                onAssignManually={() => setShowAssignModal(true)}
              />
            )}
          </div>
        )}

        {/* Divider */}
        <div style={{ height: "20px", width: "1px", backgroundColor: timeTheme.dividerColor, flexShrink: 0, margin: "0 4px" }} />

        {/* Date range dropdown */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <select
            style={{
              height: "34px",
              appearance: "none",
              borderRadius: "8px",
              border: `1px solid ${timeTheme.cardBorder}`,
              backgroundColor: timeTheme.inputBackground,
              paddingLeft: "12px",
              paddingRight: "28px",
              fontSize: "13px",
              fontWeight: 500,
              color: timeTheme.textColor,
              outline: "none",
              cursor: "pointer",
              transition: "background 1.2s ease, color 0.6s ease",
            }}
          >
            <option value="" disabled selected>Date range</option>
            {DATE_OPTIONS.map((opt) => <option key={`range-${opt}`} value={opt}>{opt}</option>)}
          </select>
          <ChevronDown style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", height: "14px", width: "14px", pointerEvents: "none", color: timeTheme.mutedTextColor }} />
        </div>

        {/* Filters */}
        <button
          style={{
            flexShrink: 0, display: "flex", alignItems: "center", gap: "6px",
            height: "34px", padding: "0 14px", borderRadius: "8px",
            border: `1px solid ${timeTheme.cardBorder}`,
            backgroundColor: timeTheme.inputBackground,
            fontSize: "13px", fontWeight: 500,
            color: timeTheme.subTextColor,
            cursor: "pointer",
            transition: "background 1.2s ease",
          }}
        >
          <Filter style={{ height: "14px", width: "14px", color: timeTheme.mutedTextColor }} />
          Filters
        </button>

        {/* Search bar */}
        <div style={{ position: "relative", flexShrink: 0, width: "220px" }}>
          <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", height: "14px", width: "14px", color: timeTheme.mutedTextColor, pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search tasks..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              height: "34px", width: "100%", borderRadius: "8px",
              border: `1px solid ${searchFocused ? timeTheme.accentColor : timeTheme.cardBorder}`,
              backgroundColor: searchFocused ? timeTheme.inputBackground : timeTheme.inputBackground,
              paddingLeft: "32px", paddingRight: "12px", fontSize: "13px",
              color: timeTheme.textColor, outline: "none", boxSizing: "border-box",
              boxShadow: searchFocused ? `0 0 0 3px ${timeTheme.accentColor}18` : "none",
              transition: "border-color 0.2s, box-shadow 0.2s, background 1.2s ease",
            }}
          />
        </div>
      </div>
    </div>

    {showAssignModal && (
      <AssignTaskModal onClose={() => setShowAssignModal(false)} />
    )}
  </>
  );
}