"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ListTodo,
  Send,
  Bookmark,
  Layers,
  Trash2,
  FileText,
  Folder,
  Activity,
  User,
  Calendar,
} from "lucide-react";

import { useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";

const NAV_SECTIONS = [
  {
    label: "MAIN",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
      { name: "My tasks", href: "/my-tasks", icon: ListTodo },
      { name: "All tasks", href: "/all-tasks", icon: Layers },
      { name: "Employees", href: "/employees", icon: User},
      { name: "Delegated BY", href: "/delegatedBy", icon: Send }
    ],
  },
  {
    label: "TOOLS",
    items: [
      { name: "Task templates", href: "/task-templates", icon: FileText },
      { name: "Task directory", href: "/task-directory", icon: Folder },
      { name: "Activities", href: "/activities", icon: Activity },
      { name: "Holidays", href: "/holidays", icon: Calendar },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, fetchCurrentUser } = useTaskStore();

  useEffect(() => {
    if (!currentUser) {
      fetchCurrentUser();
    }
  }, []);

  const isEmployee = currentUser?.role === "EMPLOYEE";
  const filteredSections = NAV_SECTIONS.map((section) => {
    if (isEmployee) {
      if (section.label === "TOOLS") return null;
      return {
        ...section,
        items: section.items.filter((item) => item.name === "Dashboard" || item.name === "My tasks"),
      };
    }
    return section;
  }).filter((s): s is typeof NAV_SECTIONS[number] => s !== null);

  return (
    <aside
      style={{
        width: "260px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        borderRight: "1px solid #f0f0f0",
        height: "100%",
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "0 20px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            height: "36px",
            width: "36px",
            borderRadius: "8px",
            backgroundColor: "#4F46E5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          IFDA
        </div>
        <span
          style={{
            fontSize: "17px",
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "-0.01em",
          }}
        >
          Intelligence
        </span>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        {filteredSections.map((section) => (
          <div key={section.label}>
            {/* Section Label */}
            <p
              style={{
                padding: "0 12px",
                marginBottom: "10px",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "#9ca3af",
                textTransform: "uppercase",
              }}
            >
              {section.label}
            </p>

            {/* Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (pathname === "/" && item.name === "Dashboard");

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      fontSize: "14px",
                      fontWeight: 500,
                      textDecoration: "none",
                      transition: "background-color 0.15s, color 0.15s",
                      backgroundColor: isActive ? "#eef2ff" : "transparent",
                      color: isActive ? "#4338ca" : "#6b7280",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#f9fafb";
                        (e.currentTarget as HTMLAnchorElement).style.color = "#111827";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
                        (e.currentTarget as HTMLAnchorElement).style.color = "#6b7280";
                      }
                    }}
                  >
                    <item.icon
                      style={{
                        height: "18px",
                        width: "18px",
                        flexShrink: 0,
                        color: isActive ? "#4f46e5" : "#9ca3af",
                      }}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}