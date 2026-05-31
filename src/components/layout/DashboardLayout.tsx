"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { useTimeTheme } from "@/hooks/useTimeTheme";
import { usePathname } from "next/navigation"; // 1. Import usePathname

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const timeTheme = useTimeTheme();
  const pathname = usePathname(); // 2. Get the current route path

  // Check if we are on the profile page (or any sub-route of it)
  const isProfilePage = pathname === "/profile" || pathname.startsWith("/profile/");

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: timeTheme.background,
        color: timeTheme.textColor,
        transition: "background-color 0.5s ease, color 0.5s ease",
      }}
    >
      {/* Sidebar (Always visible) */}
      <div style={{ flexShrink: 0, zIndex: 20 }}>
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* 3. Conditionally render the TopNav */}
        {!isProfilePage && <TopNav />}

        {/* Scrollable Content */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            backgroundColor: timeTheme.background,
            transition: "background-color 0.5s ease",
            // Add custom scrollbar styling directly
            scrollbarWidth: "thin",
            scrollbarColor: `${
              timeTheme.textColor === "#ffffff" ? "#475569" : "#cbd5e1"
            } transparent`,
          }}
        >
          {/* Main Container max-width */}
          <div
            style={{
              maxWidth: "1600px",
              margin: "0 auto",
              height: "100%",
            }}
          >
            {children}
          </div>
        </main>
      </div>

      {/* Global Scrollbar Styles for Webkit (Chrome/Safari/Edge) */}
      <style>{`
        main::-webkit-scrollbar {
          width: 6px;
        }
        main::-webkit-scrollbar-track {
          background: transparent;
        }
        main::-webkit-scrollbar-thumb {
          background-color: ${
            timeTheme.textColor === "#ffffff" ? "#475569" : "#cbd5e1"
          };
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}