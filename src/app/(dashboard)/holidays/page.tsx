"use client";

import { useTimeTheme } from "@/hooks/useTimeTheme";

export default function HolidaysPage() {
  const timeTheme = useTimeTheme();

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: timeTheme.textColor, margin: 0, transition: "color 0.6s ease" }}>
          Holidays
        </h1>
        <p style={{ fontSize: "13px", color: timeTheme.mutedTextColor, marginTop: "4px", transition: "color 0.6s ease" }}>
          Official holidays and leave calendar
        </p>
      </div>

      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        backgroundColor: timeTheme.cardBackground,
        border: `1px solid ${timeTheme.cardBorder}`,
        borderRadius: "16px",
        textAlign: "center",
        transition: "background 1.2s ease",
      }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗓️</div>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: timeTheme.textColor, margin: "0 0 8px", transition: "color 0.6s ease" }}>
          Holiday Calendar Coming Soon
        </h2>
        <p style={{ fontSize: "14px", color: timeTheme.mutedTextColor, maxWidth: "360px", lineHeight: 1.6, margin: 0, transition: "color 0.6s ease" }}>
          View official holidays and plan your work schedule accordingly.
        </p>
        <div style={{
          marginTop: "24px",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 18px",
          borderRadius: "20px",
          background: `${timeTheme.accentColor}18`,
          border: `1px solid ${timeTheme.accentColor}44`,
          fontSize: "12px",
          fontWeight: 600,
          color: timeTheme.accentColor,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          transition: "all 0.6s ease",
        }}>
          <span>{timeTheme.icon}</span>
          {timeTheme.greeting} — Page Under Construction
        </div>
      </div>
    </div>
  );
}
