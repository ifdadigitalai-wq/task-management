"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, Search, Filter, Calendar, ChevronLeft, ChevronRight, Eye, Info, Database } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { useToast } from "@/hooks/useToast";
import { AuditLog } from "@/types";
import { Button } from "@/components/ui/Button";

export default function AuditLogPage() {
  const { currentUser } = useTaskStore();
  const toast = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Filter states
  const [actionFilter, setActionFilter] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 15;

  // Selected log for detailed view modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (actionFilter !== "ALL") params.append("action", actionFilter);
      if (entityFilter !== "ALL") params.append("entityType", entityFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/audit-log?${params.toString()}`);
      const payload = await res.json();
      if (payload.success && payload.data) {
        setLogs(payload.data.logs || []);
        setTotal(payload.data.total || 0);
        setTotalPages(payload.data.totalPages || 1);
      } else {
        toast.error(payload.error || "Failed to load audit logs.");
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      toast.error("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "ADMIN") {
      fetchAuditLogs();
    } else {
      setLoading(false);
    }
  }, [currentUser, page, actionFilter, entityFilter, startDate, endDate]);

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center max-w-md mx-auto select-none space-y-4">
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-full text-rose-500 border border-rose-200 dark:border-rose-900/50">
          <ShieldAlert className="w-10 h-10 stroke-1.5" />
        </div>
        <h3 className="text-md font-bold text-text-primary">Security Access Denied</h3>
        <p className="text-xs text-text-secondary leading-normal">
          You do not have permission to view security audit logs. Please contact your system administrator for access inquiries.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-5 h-5 text-rose-600 dark:text-rose-455" />
            <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Security Audit Trail
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Immutable log trail of all user actions, security status updates, and modifications across the system.
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-900/55">
          {total} Operations Recorded
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-xs backdrop-blur-md">
        {/* Action Type Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-text-tertiary uppercase">Operation Action</label>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE_TASK">Create Task</option>
            <option value="UPDATE_TASK">Update Task</option>
            <option value="DELETE_TASK">Delete Task</option>
            <option value="DELEGATE_TASK">Delegate Task</option>
            <option value="ADD_COMMENT">Add Comment</option>
            <option value="UPDATE_PROGRESS">Update Progress</option>
            <option value="CHANGE_STATUS">Employee Status Change</option>
            <option value="IMPORT_EMPLOYEES">Import Employees</option>
            <option value="TRANSFER_TASKS">Transfer Tasks</option>
          </select>
        </div>

        {/* Entity Type Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-text-tertiary uppercase">Scope entity</label>
          <select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Entities</option>
            <option value="TASK">Task Scope</option>
            <option value="USER">Employee Scope</option>
            <option value="DEPARTMENT">Department Scope</option>
          </select>
        </div>

        {/* Start date */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-text-tertiary uppercase">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-250 text-xs font-semibold focus:outline-none"
          />
        </div>

        {/* End date */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-text-tertiary uppercase">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-250 text-xs font-semibold focus:outline-none"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/65 dark:border-slate-800/65 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary text-xs">
            <div className="w-6 h-6 border-[3px] border-white/10 border-t-brand rounded-full animate-spin mb-2.5" />
            Querying audit repository...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px] text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-850 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/10">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Entity</th>
                  <th className="px-6 py-4">Details Preview</th>
                  <th className="px-6 py-4 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors"
                  >
                    <td className="px-6 py-3.5 text-xs font-mono text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-semibold text-text-primary">
                      {log.performedBy}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 text-[9px] font-bold uppercase tracking-wider">
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-text-secondary font-medium">
                      {log.entityType} {log.entityId && `(${log.entityId.substring(0, 8)})`}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-text-tertiary truncate max-w-[280px]">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 border border-border rounded-lg text-text-secondary hover:text-brand hover:border-brand transition-all active:scale-95 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {!loading && logs.length === 0 && (
          <div className="text-center py-16 text-text-tertiary text-xs">
            No audit logs matched your query.
          </div>
        )}

        {/* Pagination controls footer */}
        {totalPages > 1 && (
          <div className="p-4 px-6 border-t border-border flex items-center justify-between bg-bg/5 shrink-0 text-xs">
            <span className="text-text-secondary">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> (Total {total} logs)
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 font-bold"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 font-bold"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Log detailed inspector Modal */}
      {selectedLog && (
        <>
          <div
            onClick={() => setSelectedLog(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center"
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-xl shadow-2xl p-6 w-full max-w-[500px] z-[51] animate-in zoom-in-95 duration-150">
            <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 border-b border-border pb-2.5">
              🔍 Inspect Audit Record Details
            </h2>
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 border-b border-border/50 pb-2">
                <span className="font-semibold text-text-tertiary">Log ID</span>
                <span className="col-span-2 text-text-primary font-mono">{selectedLog.id}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-border/50 pb-2">
                <span className="font-semibold text-text-tertiary">Timestamp</span>
                <span className="col-span-2 text-text-primary">{new Date(selectedLog.createdAt).toString()}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-border/50 pb-2">
                <span className="font-semibold text-text-tertiary">Operation Actor</span>
                <span className="col-span-2 text-text-primary font-semibold">{selectedLog.performedBy}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-border/50 pb-2">
                <span className="font-semibold text-text-tertiary">Action Type</span>
                <span className="col-span-2"><span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 font-bold uppercase text-[9px]">{selectedLog.action}</span></span>
              </div>
              <div className="grid grid-cols-3 border-b border-border/50 pb-2">
                <span className="font-semibold text-text-tertiary">Target Entity</span>
                <span className="col-span-2 text-text-primary">{selectedLog.entityType} ({selectedLog.entityId || "N/A"})</span>
              </div>

              {/* JSON parameters inspector */}
              <div className="flex flex-col gap-1.5 pt-2">
                <span className="font-semibold text-text-tertiary">Operation Details Payload</span>
                <pre className="p-3 bg-bg rounded-lg border border-border font-mono text-[10.5px] overflow-auto max-h-48 text-text-primary leading-normal whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border mt-4">
              <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
