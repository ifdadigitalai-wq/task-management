"use client";

import React, { useState, useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { ActivityIcon, Search, Calendar, User, SlidersHorizontal, RefreshCw } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useToast } from "@/hooks/useToast";

export default function ActivitiesPage() {
  const { currentUser } = useTaskStore();
  const toast = useToast();

  const [activities, setActivities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedUser, setSelectedUser] = useState("ALL");
  const [selectedAction, setSelectedAction] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  
  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedUser !== "ALL") params.append("userId", selectedUser);
      if (selectedAction !== "ALL") params.append("action", selectedAction);
      if (selectedType !== "ALL") params.append("entityType", selectedType);

      const res = await fetch(`/api/activities?${params.toString()}`);
      const payload = await res.json();
      if (payload.success) {
        setActivities(payload.data || []);
      }
    } catch (err) {
      toast.error("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    // Fetch users list for filter (Admin only)
    if (currentUser?.role === "ADMIN") {
      fetch("/api/users")
        .then((res) => res.json())
        .then((payload) => {
          if (payload.success) setUsers(payload.data || []);
        })
        .catch(console.error);
    }
  }, [currentUser, selectedUser, selectedAction, selectedType]);

  const isAdmin = currentUser?.role === "ADMIN";

  const getActionBadgeStyle = (action: string) => {
    if (action.includes("CREATE")) return "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400";
    if (action.includes("DELETE")) return "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-455";
    if (action.includes("UPDATE")) return "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400";
    return "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-450";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ActivityIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Audit Logs & Activities
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Review security-related and task-related mutation records in the organization.
          </p>
        </div>

        <button
          onClick={fetchActivities}
          className="p-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 active:scale-95 transition-all"
          title="Refresh activities feed"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter strip */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-xs backdrop-blur-md">
        <SlidersHorizontal className="w-4 h-4 text-slate-400 pointer-events-none" />

        {/* User filter (Admin only) */}
        {isAdmin && (
          <div className="relative">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="appearance-none px-3.5 py-1.5 pr-8 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Team Members</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action filter */}
        <div className="relative">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="appearance-none px-3.5 py-1.5 pr-8 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Operations</option>
            <option value="CREATE_TASK">Create Task</option>
            <option value="UPDATE_TASK">Update Task</option>
            <option value="DELETE_TASK">Delete Task</option>
            <option value="CREATE_USER">Create User</option>
            <option value="UPDATE_USER">Update User</option>
            <option value="SOFT_DELETE_USER">Soft Delete User</option>
            <option value="CREATE_TEMPLATE">Create Template</option>
            <option value="CREATE_HOLIDAY">Create Holiday</option>
          </select>
        </div>

        {/* Entity type filter */}
        <div className="relative">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="appearance-none px-3.5 py-1.5 pr-8 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Targets</option>
            <option value="TASK">Tasks</option>
            <option value="USER">Users</option>
            <option value="TEMPLATE">Templates</option>
            <option value="HOLIDAY">Holidays</option>
          </select>
        </div>
      </div>

      {/* Activity List */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-2" />
            Loading activities feed...
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">⚡</div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-350">
              No Activities Logged
            </p>
            <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1">
              No action history corresponds to the chosen filters.
            </p>
          </div>
        ) : (
          <div className="relative border-l border-slate-100 dark:border-slate-850 pl-5 space-y-6">
            {activities.map((act) => (
              <div key={act.id} className="relative">
                {/* Timeline node dot */}
                <div className="absolute -left-[26px] top-1 bg-white dark:bg-slate-900 rounded-full p-0.5 border border-slate-200 dark:border-slate-800">
                  <UserAvatar src={act.user?.avatarUrl} name={act.user?.name} size="sm" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-850 dark:text-slate-100">
                      {act.user?.name || "System"}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wide uppercase ${getActionBadgeStyle(act.action)}`}>
                      {act.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-650 dark:text-slate-350 font-medium leading-relaxed">
                    Performed action targeting {act.entityType.toLowerCase()}{" "}
                    <span className="font-mono bg-slate-50 dark:bg-slate-950 px-1 py-0.5 rounded border border-slate-100 dark:border-slate-850 text-[10px]">
                      #{act.entityId?.slice(0, 8).toUpperCase() || "SYSTEM"}
                    </span>
                    {act.task && (
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 ml-1">
                        &bull; Task: "{act.task.title}"
                      </span>
                    )}
                  </p>

                  {/* Metadata display */}
                  {act.meta && Object.keys(act.meta).length > 0 && (
                    <div className="mt-1.5 bg-slate-50/70 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-850 overflow-hidden max-w-xl">
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {Object.entries(act.meta).map(([key, value]) => {
                          const label = key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/_/g, " ")
                            .replace(/^\w/, (c: string) => c.toUpperCase())
                            .trim();

                          let renderedValue: React.ReactNode;
                          if (Array.isArray(value)) {
                            renderedValue = (
                              <div className="flex flex-wrap gap-1">
                                {(value as string[]).map((item, i) => (
                                  <span
                                    key={i}
                                    className="inline-block px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold"
                                  >
                                    {String(item)}
                                  </span>
                                ))}
                              </div>
                            );
                          } else if (value !== null && typeof value === "object") {
                            renderedValue = (
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                                  <span key={k} className="text-[10px] text-slate-500 dark:text-slate-400">
                                    <span className="font-semibold text-slate-600 dark:text-slate-350">{k}:</span>{" "}
                                    {String(v)}
                                  </span>
                                ))}
                              </div>
                            );
                          } else {
                            renderedValue = (
                              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                {String(value ?? "—")}
                              </span>
                            );
                          }

                          return (
                            <div key={key} className="flex items-start gap-3 px-3 py-2">
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide min-w-[80px] shrink-0 pt-0.5">
                                {label}
                              </span>
                              <div className="flex-1 min-w-0">{renderedValue}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
