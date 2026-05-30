"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { useTaskStore } from "@/store/useTaskStore";
import { useRouter } from "next/navigation";
import { useTimeTheme } from "@/hooks/useTimeTheme";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser } = useTaskStore();
  const router = useRouter();
  const timeTheme = useTimeTheme();

  return (
    <div
      className="flex h-screen w-full font-sans overflow-hidden"
      style={{
        background: timeTheme.background,
        color: timeTheme.textColor,
        transition: "background 1.2s ease, color 0.6s ease",
      }}
    >
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <TopNav />

        {currentUser?.mustResetPassword && (
          <div style={{
            backgroundColor: timeTheme.cardBackground,
            borderBottom: `1px solid ${timeTheme.cardBorder}`,
            padding: "10px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "13px",
            color: timeTheme.textColor,
            fontWeight: 500,
            flexShrink: 0,
            transition: "background 1.2s ease",
          }}>
            <span>🔐 You're using a temporary password. Please reset it to secure your account.</span>
            <button
              onClick={() => router.push("/reset-password")}
              style={{
                backgroundColor: timeTheme.accentColor,
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.3s ease",
              }}
            >
              Reset now
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="mx-auto max-w-6xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}