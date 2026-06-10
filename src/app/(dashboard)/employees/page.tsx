"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { Plus, Search, Users, RefreshCw, AlertTriangle, Upload, X, Download } from "lucide-react";
import EmployeeTable from "@/components/employees/EmployeeTable";
import AddEmployeeModal from "@/components/employees/AddEmployeeModal";
import EditEmployeeModal from "@/components/employees/EditEmployeeModal";
import { User as UserType } from "@/types";
import { useTimeTheme } from "@/hooks/useTimeTheme";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import * as XLSX from "xlsx";
import { useSearchParams, useRouter } from "next/navigation";

function DeleteConfirmModal({
  employee,
  employees,
  onCancel,
  onConfirm,
}: {
  employee: UserType;
  employees: UserType[];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [transferTasks, setTransferTasks] = useState(false);
  const [targetEmployeeId, setTargetEmployeeId] = useState("");
  const toast = useToast();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // 1. Transfer tasks if checkbox is checked
      if (transferTasks && targetEmployeeId) {
        const transferRes = await fetch("/api/tasks/transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromUserId: employee.id,
            toUserId: targetEmployeeId,
            reason: "Employee deactivated/exited",
          }),
        });
        const transferPayload = await transferRes.json();
        if (!transferPayload.success) throw new Error(transferPayload.error || "Failed to transfer tasks.");
        toast.success("Tasks successfully transferred.");
      }

      // 2. Deactivate employee
      const res = await fetch(`/api/users/${employee.id}`, { method: "DELETE" });
      const payload = await res.json();
      if (!payload.success) throw new Error(payload.error || "Failed to deactivate.");
      
      toast.success(`${employee.name} deactivated successfully.`);
      onConfirm();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user.");
      setDeleting(false);
    }
  };

  const otherEmployees = employees.filter(
    (e) => e.id !== employee.id && e.isActive && e.department === employee.department
  );

  return (
    <>
      <div
        onClick={onCancel}
        className="fixed inset-0 bg-black/35 backdrop-blur-xs z-50 transition-opacity"
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-55 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-955/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100 mb-1.5 text-center">
          Deactivate Employee?
        </h3>
        <p className="text-xs text-slate-450 dark:text-slate-400 mb-4 leading-relaxed text-center">
          Are you sure you want to deactivate <strong className="text-slate-800 dark:text-slate-200">{employee.name}</strong>? They will no longer be able to log in or manage tasks.
        </p>

        {/* Task Transfer Section */}
        <div className="space-y-4 mb-6 border-t border-b border-slate-100 dark:border-slate-800/80 py-4">
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={transferTasks}
              onChange={(e) => setTransferTasks(e.target.checked)}
              className="rounded text-brand focus:ring-brand/30 h-4 w-4 cursor-pointer"
            />
            Transfer all existing tasks to another employee
          </label>

          {transferTasks && (
            <div className="space-y-1 animate-in slide-in-from-top-1 duration-150">
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Select Target Employee (Same Department)
              </label>
              {otherEmployees.length === 0 ? (
                <p className="text-xs text-rose-500 font-semibold bg-rose-50 dark:bg-rose-955/20 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30">
                  No other active employees found in the "{employee.department || "General"}" department.
                </p>
              ) : (
                <select
                  value={targetEmployeeId}
                  onChange={(e) => setTargetEmployeeId(e.target.value)}
                  className="w-full h-9 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-semibold px-3 focus:outline-none text-text-primary"
                >
                  <option value="">Choose employee...</option>
                  {otherEmployees.map((e) => (
                    <option key={e.id} value={e.id} className="bg-surface text-text-primary">
                      {e.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-400 font-bold text-xs rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || (transferTasks && !targetEmployeeId)}
            className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all"
          >
            {deleting ? "Deactivating..." : "Deactivate"}
          </button>
        </div>
      </div>
    </>
  );
}

function StatusChangeConfirmModal({
  employee,
  newStatus,
  employees,
  onCancel,
  onConfirm,
}: {
  employee: UserType;
  newStatus: string;
  employees: UserType[];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [transferTasks, setTransferTasks] = useState(false);
  const [targetEmployeeId, setTargetEmployeeId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const statusRes = await fetch(`/api/users/${employee.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const statusPayload = await statusRes.json();
      if (!statusPayload.success) throw new Error(statusPayload.error || "Failed to update status.");

      if (transferTasks && targetEmployeeId) {
        const transferRes = await fetch("/api/tasks/transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromUserId: employee.id,
            toUserId: targetEmployeeId,
            reason: `Employee status changed to ${newStatus}`,
          }),
        });
        const transferPayload = await transferRes.json();
        if (!transferPayload.success) throw new Error(transferPayload.error || "Failed to transfer tasks.");
        toast.success(`Tasks successfully transferred.`);
      }

      toast.success(`${employee.name} status updated to ${newStatus}.`);
      onConfirm();
    } catch (err: any) {
      toast.error(err.message || "Failed to change status.");
    } finally {
      setSubmitting(false);
    }
  };

  const otherEmployees = employees.filter(
    (e) => e.id !== employee.id && e.isActive && e.department === employee.department
  );

  return (
    <>
      <div onClick={onCancel} className="fixed inset-0 bg-black/35 backdrop-blur-xs z-50 transition-opacity" />
      <div onClick={(e) => e.stopPropagation()} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-55 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100 mb-2">Change Employee Status?</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          You are changing the status of <strong>{employee.name}</strong> to <strong>{newStatus}</strong>. This will deactivate their active access.
        </p>

        <div className="space-y-4 mb-6">
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={transferTasks}
              onChange={(e) => setTransferTasks(e.target.checked)}
              className="rounded text-brand focus:ring-brand/30 h-4 w-4 cursor-pointer"
            />
            Transfer all existing tasks to another employee
          </label>

          {transferTasks && (
            <div className="space-y-1 animate-in slide-in-from-top-1 duration-150">
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Select Target Employee (Same Department)
              </label>
              {otherEmployees.length === 0 ? (
                <p className="text-xs text-rose-500 font-semibold bg-rose-50 dark:bg-rose-955/20 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30">
                  No other active employees found in the "{employee.department || "General"}" department.
                </p>
              ) : (
                <select
                  value={targetEmployeeId}
                  onChange={(e) => setTargetEmployeeId(e.target.value)}
                  className="w-full h-9 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-semibold px-3 focus:outline-none text-text-primary"
                >
                  <option value="">Choose employee...</option>
                  {otherEmployees.map((e) => (
                    <option key={e.id} value={e.id} className="bg-surface text-text-primary">
                      {e.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-855 pt-4">
          <button onClick={onCancel} className="px-4 py-2 border border-slate-200 dark:border-slate-850 text-slate-650 dark:text-slate-400 font-bold text-xs rounded-xl hover:bg-slate-50">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={submitting || (transferTasks && !targetEmployeeId)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-xs rounded-xl shadow-md transition-all animate-in zoom-in-95 duration-150"
          >
            {submitting ? "Updating..." : "Update Status"}
          </button>
        </div>
      </div>
    </>
  );
}

function ImportEmployeesModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const toast = useToast();

  const handleDownloadTemplate = () => {
    const headers = ["name", "email", "role", "department", "team", "phone", "job title"];
    const exampleRow = [
      "John Doe",
      "john.doe@example.com",
      "EMPLOYEE",
      "Engineering",
      "Frontend",
      "1234567890",
      "Senior Engineer"
    ];
    const csvContent = [
      headers.join(","),
      exampleRow.map(val => `"${val.replace(/"/g, '""')}"`).join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "employee_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV import template downloaded.");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setImporting(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        const parsed = data.map((row: any) => {
          const getVal = (keys: string[]) => {
            const key = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
            return key ? row[key] : null;
          };

          return {
            name: getVal(["name", "full name", "employee name", "username", "employee"]),
            email: getVal(["email", "email address", "email id", "mail"]),
            role: getVal(["role", "access level", "type"]) || "EMPLOYEE",
            department: getVal(["department", "dept"]),
            team: getVal(["team", "team name"]),
            phone: getVal(["phone", "phone number", "contact", "mobile"]),
            jobTitle: getVal(["job title", "title", "designation"]),
          };
        }).filter(emp => emp.name && emp.email);

        if (parsed.length === 0) {
          toast.error("No valid employees found. Make sure to have 'name' and 'email' columns.");
          setImporting(false);
          return;
        }

        const res = await fetch("/api/employees/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employees: parsed }),
        });

        const payload = await res.json();
        if (payload.success) {
          toast.success(`Successfully imported ${payload.data.importedCount} employees!`);
          
          const imported = payload.data.imported || [];
          for (const imp of imported) {
            try {
              await fetch("/api/employees/send-welcome-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: imp.email,
                  name: imp.name,
                  tempPassword: imp.tempPassword,
                }),
              });
            } catch (err) {
              console.error("Welcome email error:", err);
            }
          }

          onImported();
          onClose();
        } else {
          toast.error(payload.error || "Failed to import employees.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error parsing file.");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-[3px] z-50" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-55 w-full max-w-[400px] bg-surface rounded-xl shadow-lg p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
          <h3 className="text-[14px] font-medium text-text-primary">Import Employees</h3>
          <button onClick={onClose} className="p-1 hover:bg-bg rounded-md text-text-tertiary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-xs text-text-secondary leading-relaxed">
            Select a CSV or Excel (.xlsx/.xls) file containing employee details. Column headers must include <strong>name</strong> and <strong>email</strong>.
          </p>

          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
                className="w-full text-xs text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border file:border-border-strong file:text-xs file:font-semibold file:bg-bg file:text-text-primary file:cursor-pointer"
              />
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold border border-indigo-100 dark:border-indigo-900/50 active:scale-95 transition-all whitespace-nowrap"
              title="Download CSV Template"
            >
              <Download className="w-3.5 h-3.5" />
              Template
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button onClick={onClose} variant="secondary" className="h-[34px] px-4">Cancel</Button>
          <Button onClick={handleUpload} disabled={importing || !file} variant="primary" className="h-[34px] px-4">
            {importing ? "Importing..." : "Upload & Import"}
          </Button>
        </div>
      </div>
    </>
  );
}

function EmployeesContent() {
  const timeTheme = useTimeTheme();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const departmentParam = searchParams.get("department");
  
  const [employees, setEmployees] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);

  // Modals state
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editTarget, setEditTarget] = useState<UserType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserType | null>(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{ employee: UserType; newStatus: string } | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const url = departmentParam 
        ? `/api/users?department=${encodeURIComponent(departmentParam)}` 
        : "/api/users";
      const res = await fetch(url, { cache: "no-store" });
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
  }, [departmentParam, toast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) setDepartments(payload.data || []);
      })
      .catch(console.error);
  }, []);

  const handleStatusChange = async (emp: UserType, newStatus: string) => {
    if (newStatus === "ACTIVE") {
      try {
        const res = await fetch(`/api/users/${emp.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        const payload = await res.json();
        if (payload.success) {
          toast.success(`${emp.name} is now active.`);
          fetchEmployees();
        } else {
          toast.error(payload.error || "Failed to update status.");
        }
      } catch (err) {
        console.error(err);
        toast.error("An error occurred.");
      }
    } else {
      setStatusChangeTarget({ employee: emp, newStatus });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between p-6 bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl backdrop-blur-md flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Users className="w-5 h-5" style={{ color: timeTheme.accentColor }} />
            <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Team Management {departmentParam ? `— ${departmentParam}` : ""}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Manage your organization team members, profiles, job roles, and login access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={departmentParam || "ALL"}
            onChange={(e) => {
              const val = e.target.value;
              const params = new URLSearchParams(window.location.search);
              if (val === "ALL") {
                params.delete("department");
              } else {
                params.set("department", val);
              }
              router.push(`/employees?${params.toString()}`);
            }}
            className="h-9 px-3 border border-slate-200 dark:border-slate-855 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-none cursor-pointer text-text-primary"
          >
            <option value="ALL">All Employees</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.name} className="bg-surface text-text-primary">
                {dept.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setLoading(true);
              fetchEmployees();
            }}
            className="p-2 border border-slate-200 dark:border-slate-855 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-550 active:scale-95 transition-all"
            title="Refresh team list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-bg rounded-xl text-xs font-bold active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4" />
            Import Employees
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
            onStatusChange={handleStatusChange}
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
          employees={employees}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            setDeleteTarget(null);
            fetchEmployees();
          }}
        />
      )}

      {/* Status Change Confirm Modal */}
      {statusChangeTarget && (
        <StatusChangeConfirmModal
          employee={statusChangeTarget.employee}
          newStatus={statusChangeTarget.newStatus}
          employees={employees}
          onCancel={() => setStatusChangeTarget(null)}
          onConfirm={() => {
            setStatusChangeTarget(null);
            fetchEmployees();
          }}
        />
      )}

      {/* Import Employees Modal */}
      {showImport && (
        <ImportEmployeesModal
          onClose={() => setShowImport(false)}
          onImported={fetchEmployees}
        />
      )}
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
        <div className="w-6 h-6 border-2 border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-2" />
        Loading team profiles...
      </div>
    }>
      <EmployeesContent />
    </Suspense>
  );
}

