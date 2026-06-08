"use client";

import React, { useState, useEffect } from "react";
import { Folder, Plus, Users, BarChart3, AlertTriangle, CheckCircle, Clock, Info, ShieldAlert } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface DepartmentData {
  id: string;
  name: string;
  memberCount: number;
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  description?: string;
}

export default function DepartmentsPage() {
  const { currentUser } = useTaskStore();
  const toast = useToast();
  
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for creating department
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptDesc, setNewDeptDesc] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchDepartmentsData = async () => {
    try {
      // 1. Fetch departments detailed info
      const listRes = await fetch("/api/departments");
      const listPayload = await listRes.json();
      const detailsMap: Record<string, string> = {};
      if (listPayload.success && Array.isArray(listPayload.data)) {
        listPayload.data.forEach((d: any) => {
          detailsMap[d.name] = d.description || "";
        });
      }

      // 2. Fetch stats containing member counts and task counts
      const statsRes = await fetch("/api/dashboard/stats");
      const statsPayload = await statsRes.json();
      if (statsPayload.success && statsPayload.data?.departmentStats) {
        const stats = statsPayload.data.departmentStats.map((dept: any) => ({
          ...dept,
          description: detailsMap[dept.name] || "Standard operational department.",
        }));
        setDepartments(stats);
      }
    } catch (err) {
      console.error("Failed to load departments stats:", err);
      toast.error("Failed to load departments data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentsData();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setSubmitLoading(true);

    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDeptName.trim(),
          description: newDeptDesc.trim(),
        }),
      });
      const payload = await res.json();
      if (payload.success) {
        toast.success("Department created successfully!");
        setNewDeptName("");
        setNewDeptDesc("");
        setShowAddModal(false);
        fetchDepartmentsData();
      } else {
        toast.error(payload.error || "Failed to create department.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while creating department.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-text-secondary text-xs">
        <div className="w-6 h-6 border-[3px] border-white/10 border-t-brand rounded-full animate-spin mb-2.5" />
        Syncing departments...
      </div>
    );
  }

  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Folder className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Operational Departments
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Manage corporate departments, track member distribution, task workloads and overall performance index.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Department
          </button>
        )}
      </div>

      {/* Grid of Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const completionRate = dept.total === 0 ? 0 : Math.round((dept.completed / dept.total) * 100);
          return (
            <div
              key={dept.id || dept.name}
              className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-brand/40 transition-all group"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary group-hover:text-brand transition-colors">
                      🏢 {dept.name}
                    </h3>
                    <p className="text-[11px] text-text-tertiary mt-1.5 leading-relaxed line-clamp-2">
                      {dept.description}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 bg-brand-light px-2.5 py-1 rounded-full text-brand-text text-[10px] font-bold">
                    <Users className="w-3.5 h-3.5" />
                    {dept.memberCount}
                  </span>
                </div>

                {/* Progress KPI */}
                <div className="space-y-1.5 pt-3 border-t border-border mt-3">
                  <div className="flex justify-between text-[11px] font-semibold text-text-secondary">
                    <span>Task Completion Rate</span>
                    <span className="text-brand">{completionRate}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-bg/40 p-2 rounded-xl border border-border/50">
                    <span className="text-[10px] font-semibold text-text-tertiary block">Total</span>
                    <span className="text-xs font-bold text-text-primary">{dept.total}</span>
                  </div>
                  <div className="bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10">
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">Completed</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{dept.completed}</span>
                  </div>
                  <div className="bg-rose-500/5 p-2 rounded-xl border border-rose-500/10">
                    <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-450 block">Overdue</span>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-450">{dept.overdue}</span>
                  </div>
                </div>
              </div>

              {/* View Directory action button */}
              <div className="pt-5 mt-4 border-t border-border">
                <Button
                  onClick={() => {
                    // Direct to company tasks filtered by department
                    window.location.href = `/all-tasks?dept=${encodeURIComponent(dept.name)}`;
                  }}
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  View Department Tasks
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {departments.length === 0 && (
        <div className="text-center py-12 bg-surface border border-dashed rounded-2xl max-w-md mx-auto">
          <Info className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
          <h3 className="text-xs font-bold text-text-primary">No Departments</h3>
          <p className="text-[11px] text-text-secondary mt-1">Configure your corporate departments to start organizing tasks.</p>
        </div>
      )}

      {/* Create Department Modal overlay */}
      {showAddModal && (
        <>
          <div
            onClick={() => setShowAddModal(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center"
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-xl shadow-2xl p-6 w-full max-w-[420px] z-[51] animate-in zoom-in-95 duration-150">
            <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
              🏢 Create New Department
            </h2>
            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-text-tertiary uppercase">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales & Account Management"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full px-3 py-2 border border-border-strong rounded-lg bg-bg text-text-primary text-xs focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-text-tertiary uppercase">Description (Optional)</label>
                <textarea
                  placeholder="Summarize the core focus of this business function..."
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-border-strong rounded-lg bg-bg text-text-primary text-xs focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitLoading}>
                  {submitLoading ? "Creating..." : "Confirm"}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
