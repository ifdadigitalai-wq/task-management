"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Users, RefreshCw, AlertTriangle } from "lucide-react";
import EmployeeTable from "@/components/employees/EmployeeTable";
import AddEmployeeModal from "@/components/employees/AddEmployeeModal";
import EditEmployeeModal from "@/components/employees/EditEmployeeModal";
import type { Employee } from "@/components/employees/EmployeeTable";

// ── Delete confirmation popup ────────────────────────────────────────────────

function DeleteConfirmModal({
  employee,
  onCancel,
  onConfirm,
}: {
  employee: Employee;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${employee.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onConfirm();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <>
      <div
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.25)",
          zIndex: 80,
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 90,
          backgroundColor: "#ffffff",
          borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          width: 400,
          maxWidth: "calc(100vw - 32px)",
          padding: 28,
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "#fef2f2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <AlertTriangle style={{ height: 22, width: 22, color: "#ef4444" }} />
        </div>

        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#111827",
            textAlign: "center",
            margin: "0 0 8px",
          }}
        >
          Delete employee?
        </h3>
        <p
          style={{
            fontSize: 13,
            color: "#6b7280",
            textAlign: "center",
            margin: "0 0 24px",
            lineHeight: 1.5,
          }}
        >
          Are you sure you want to delete{" "}
          <strong style={{ color: "#111827" }}>{employee.name}</strong>? This
          action cannot be undone.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              height: 36,
              padding: "0 20px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
              fontSize: 13,
              fontWeight: 500,
              color: "#374151",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              height: 36,
              padding: "0 20px",
              borderRadius: 8,
              border: "none",
              backgroundColor: deleting ? "#fca5a5" : "#ef4444",
              fontSize: 13,
              fontWeight: 500,
              color: "#ffffff",
              cursor: deleting ? "not-allowed" : "pointer",
            }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Filtered list
  const filtered = employees.filter((emp) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      (emp.department ?? "").toLowerCase().includes(q) ||
      (emp.phone ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200 }}>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 4px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Users style={{ height: 22, width: 22, color: "#4f46e5" }} />
            Employees
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
            Manage your team members and their details.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 38,
            padding: "0 18px",
            borderRadius: 8,
            border: "none",
            backgroundColor: "#4f46e5",
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background-color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#4338ca";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#4f46e5";
          }}
        >
          <Plus style={{ height: 16, width: 16 }} />
          Add Employee
        </button>
      </div>

      {/* Toolbar strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", maxWidth: 320, flex: 1 }}>
          <Search
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              height: 15,
              width: 15,
              color: "#9ca3af",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search by name, email, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              height: 38,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              paddingLeft: 36,
              paddingRight: 14,
              fontSize: 13,
              color: "#111827",
              outline: "none",
              boxSizing: "border-box",
              backgroundColor: "#ffffff",
              fontFamily: "inherit",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#4f46e5";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(79,70,229,0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Right side: count + refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#6b7280",
            }}
          >
            {filtered.length}{" "}
            {filtered.length === 1 ? "employee" : "employees"}
          </span>
          <button
            onClick={() => {
              setLoading(true);
              fetchEmployees();
            }}
            title="Refresh"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#6b7280",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#4f46e5";
              e.currentTarget.style.color = "#4f46e5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.color = "#6b7280";
            }}
          >
            <RefreshCw style={{ height: 14, width: 14 }} />
          </button>
        </div>
      </div>

      {/* Table card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #f0f0f0",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              fontSize: 13,
              color: "#9ca3af",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                border: "3px solid #eef2ff",
                borderTopColor: "#4f46e5",
                borderRadius: "50%",
                margin: "0 auto 12px",
                animation: "spin 0.8s linear infinite",
              }}
            />
            Loading employees…
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <EmployeeTable
            employees={filtered}
            onEdit={(emp) => setEditTarget(emp)}
            onDelete={(emp) => setDeleteTarget(emp)}
          />
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <AddEmployeeModal
          onClose={() => setShowAdd(false)}
          onCreated={fetchEmployees}
        />
      )}

      {editTarget && (
        <EditEmployeeModal
          employee={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={fetchEmployees}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          employee={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            setDeleteTarget(null);
            fetchEmployees();
          }}
        />
      )}
    </div>
  );
}
