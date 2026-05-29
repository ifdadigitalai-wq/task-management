"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { useTaskStore } from "@/store/useTaskStore";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser } = useTaskStore();
  const router = useRouter();

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <TopNav />

        {currentUser?.mustResetPassword && (
          <div style={{
            backgroundColor: "#fef3c7",
            borderBottom: "1px solid #fde68a",
            padding: "10px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "13px",
            color: "#92400e",
            fontWeight: 500,
            flexShrink: 0,
          }}>
            <span>🔐 You're using a temporary password. Please reset it to secure your account.</span>
            <button
              onClick={() => router.push("/reset-password")}
              style={{
                backgroundColor: "#d97706",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
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