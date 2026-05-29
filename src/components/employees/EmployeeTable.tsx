"use client";

import { Pencil, Trash2 } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  joinedAt?: string;
  createdAt: string;
  password: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#6366f1","#0ea5e9","#10b981","#f59e0b",
  "#ef4444","#8b5cf6","#ec4899","#14b8a6",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Shared styles ────────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  background: "#f9fafb",
  borderBottom: "1px solid #f0f0f0",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: 13,
  color: "#111827",
  borderBottom: "1px solid #f9fafb",
  verticalAlign: "middle",
};

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  employees: Employee[];
  onEdit: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
}

export default function EmployeeTable({ employees, onEdit, onDelete }: Props) {
  if (!employees.length) {
    return (
      <div style={{ padding: "56px 24px", textAlign: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "#eef2ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: "0 0 4px" }}>
          No employees yet
        </p>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
          Add your first employee to get started.
        </p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
        <thead>
          <tr>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Phone</th>
            <th style={thStyle}>Department</th>
            <th style={thStyle}>Joined</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, i) => {
            const bg = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <tr
                key={emp.id}
                style={{ background: i % 2 ? "#fafafa" : "#fff" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background =
                    i % 2 ? "#fafafa" : "#fff";
                }}
              >
                {/* # */}
                <td style={{ ...tdStyle, fontFamily: "ui-monospace,monospace", fontSize: 12, color: "#9ca3af" }}>
                  {i + 1}
                </td>

                {/* Name + Avatar */}
                <td style={tdStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: bg + "18",
                        border: `1.5px solid ${bg}44`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: bg,
                      }}
                    >
                      {initials(emp.name)}
                    </div>
                    <span style={{ fontWeight: 500, color: "#111827" }}>{emp.name}</span>
                  </div>
                </td>

                {/* Email */}
                <td style={{ ...tdStyle, color: "#6b7280" }}>{emp.email}</td>

                {/* Phone */}
                <td style={{ ...tdStyle, color: "#6b7280" }}>{emp.phone || "—"}</td>

                {/* Department */}
                <td style={tdStyle}>
                  {emp.department ? (
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: "#eef2ff",
                        color: "#4338ca",
                      }}
                    >
                      {emp.department}
                    </span>
                  ) : (
                    <span style={{ color: "#d1d5db" }}>—</span>
                  )}
                </td>

                {/* Joined */}
                <td style={{ ...tdStyle, color: "#6b7280", fontSize: 12 }}>
                  {formatDate(emp.joinedAt)}
                </td>

                {/* Actions */}
                <td style={{ ...tdStyle, textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <button
                      onClick={() => onEdit(emp)}
                      title="Edit employee"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                        color: "#6b7280",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#4f46e5";
                        e.currentTarget.style.color = "#4f46e5";
                        e.currentTarget.style.background = "#eef2ff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#e5e7eb";
                        e.currentTarget.style.color = "#6b7280";
                        e.currentTarget.style.background = "#fff";
                      }}
                    >
                      <Pencil style={{ height: 14, width: 14 }} />
                    </button>
                    <button
                      onClick={() => onDelete(emp)}
                      title="Delete employee"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                        color: "#6b7280",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#ef4444";
                        e.currentTarget.style.color = "#ef4444";
                        e.currentTarget.style.background = "#fef2f2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#e5e7eb";
                        e.currentTarget.style.color = "#6b7280";
                        e.currentTarget.style.background = "#fff";
                      }}
                    >
                      <Trash2 style={{ height: 14, width: 14 }} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
