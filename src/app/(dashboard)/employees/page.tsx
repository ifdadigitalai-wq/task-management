"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Users, RefreshCw, AlertTriangle } from "lucide-react";
import EmployeeTable from "@/components/employees/EmployeeTable";
import AddEmployeeModal from "@/components/employees/AddEmployeeModal";
import EditEmployeeModal from "@/components/employees/EditEmployeeModal";
import { User as UserType } from "@/types";
import { useTimeTheme } from "@/hooks/useTimeTheme";
import { useToast } from "@/hooks/useToast";

function DeleteConfirmModal({
  employee,
  onCancel,
  onConfirm,
}: {
  employee: UserType;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${employee.id}`, { method: "DELETE" });
      const payload = await res.json();
      if (!payload.success) throw new Error(payload.error || "Failed to delete.");
      
      toast.success(`${employee.name} deactivated successfully.`);
      onConfirm();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user.");
      setDeleting(false);
    }
  };

  return (
    <>
      <div
        onClick={onCancel}
        className="fixed inset-0 bg-black/35 backdrop-blur-xs z-50 transition-opacity"
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-55 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200 text-center"
      >
        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-955/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100 mb-1.5">
          Deactivate Employee?
        </h3>
        <p className="text-xs text-slate-450 dark:text-slate-400 mb-6 leading-relaxed">
          Are you sure you want to deactivate <strong className="text-slate-800 dark:text-slate-200">{employee.name}</strong>? They will no longer be able to log in or manage tasks.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-400 font-bold text-xs rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all"
          >
            {deleting ? "Deactivating..." : "Deactivate"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function EmployeesPage() {
  const timeTheme = useTimeTheme();
  const toast = useToast();
  
  const [employees, setEmployees] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<UserType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserType | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const payload = await res.json();
      if (payload.success) {
        setEmployees(payload.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      toast.error("Failed to load employees list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between p-6 bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl backdrop-blur-md flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Users className="w-5 h-5" style={{ color: timeTheme.accentColor }} />
            <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Team Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Manage your organization team members, profiles, job roles, and login access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLoading(true);
              fetchEmployees();
            }}
            className="p-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-550 active:scale-95 transition-all"
            title="Refresh team list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Employees Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/65 dark:border-slate-800/65 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-2" />
            Loading team profiles...
          </div>
        ) : (
          <EmployeeTable
            employees={employees}
            onEdit={(emp) => setEditTarget(emp)}
            onDelete={(emp) => setDeleteTarget(emp)}
          />
        )}
      </div>

      {/* Add Employee Modal */}
      {showAdd && (
        <AddEmployeeModal
          onClose={() => setShowAdd(false)}
          onCreated={fetchEmployees}
        />
      )}

      {/* Edit Employee Modal */}
      {editTarget && (
        <EditEmployeeModal
          employee={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={fetchEmployees}
        />
      )}

      {/* Delete/Deactivate Confirmation Modal */}
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
