"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { useThemeStore } from "@/store/useThemeStore";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useThemeStore();
  const pathname = usePathname();

  const isProfilePage = pathname === "/profile" || pathname.startsWith("/profile/");

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-text-primary">
      {/* Sidebar — fixed, uses z-sidebar (30) */}
      <Sidebar />

      {/* Main Content Area — shifts right to clear sidebar */}
      <div
        className={cn(
          "flex-1 min-w-0 flex flex-col overflow-hidden transition-[margin-left] duration-200 ease-in-out",
          /* On mobile: no margin — sidebar overlays */
          "ml-0",
          /* Desktop: match sidebar width */
          sidebarCollapsed ? "md:ml-[56px]" : "md:ml-[240px]"
        )}
      >
        {/* TopNav — sticky, never scrolls away, z-topnav (40) */}
        {!isProfilePage && (
          <div className="sticky top-0 z-[40] shrink-0">
            <TopNav />
          </div>
        )}

        {/* Scrollable Content — padding 24px desktop, 16px mobile */}
        <main className="flex-1 overflow-y-auto bg-bg p-4 md:p-6">
          {/* Max-width container */}
          <div className="max-w-[1400px] mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}