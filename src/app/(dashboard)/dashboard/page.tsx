"use client";

import PerformanceAnalytics from "@/components/dashboard/PerformanceAnalytics";
import { useTimeTheme } from "@/hooks/useTimeTheme";
import { useTaskStore } from "@/store/useTaskStore";

export default function DashboardPage() {
  const timeTheme = useTimeTheme();
  const { currentUser } = useTaskStore();

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200 }}>
      {/* Time-aware greeting header */}
      <div style={{
        marginBottom: "28px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "6px",
          }}>
            <span style={{ fontSize: "28px", lineHeight: 1 }}>{timeTheme.icon}</span>
            <h1 style={{
              fontSize: "22px",
              fontWeight: 700,
              color: timeTheme.textColor,
              margin: 0,
              transition: "color 0.6s ease",
            }}>
              {timeTheme.greeting}{currentUser?.name ? `, ${currentUser.name.split(" ")[0]}` : ""}!
            </h1>
          </div>
          <p style={{
            fontSize: "13px",
            color: timeTheme.mutedTextColor,
            margin: 0,
            transition: "color 0.6s ease",
          }}>
            Here&apos;s your performance overview for today.
          </p>
        </div>

        {/* Live time badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 16px",
          borderRadius: "20px",
          background: `${timeTheme.accentColor}15`,
          border: `1px solid ${timeTheme.accentColor}40`,
          fontSize: "12px",
          fontWeight: 600,
          color: timeTheme.accentColor,
          letterSpacing: "0.04em",
          transition: "all 0.6s ease",
        }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: timeTheme.accentColor,
            display: "inline-block",
            animation: "pulse-dot 2s infinite",
          }} />
          Live Dashboard
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>

      <PerformanceAnalytics />
    </div>
  );
}