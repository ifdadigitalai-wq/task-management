"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import {
  ActivityIcon,
  Search,
  Calendar,
  User,
  SlidersHorizontal,
  RefreshCw,
  PlusCircle,
  Edit2,
  Trash2,
  ArrowLeftRight,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  Play,
  Clock,
  ChevronRight,
  X,
  Copy,
  Check,
  Eye,
  BookOpen,
  Filter,
  ArrowRight
} from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useToast } from "@/hooks/useToast";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";

// Mapping for action card visual decorations
const ACTION_STYLING: Record<
  string,
  {
    icon: any;
    iconColor: string;
    bgColor: string;
    borderColor: string;
    glowColor: string;
  }
> = {
  CREATE_TASK: {
    icon: PlusCircle,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    borderColor: "border-emerald-100 dark:border-emerald-950/40",
    glowColor: "shadow-emerald-500/5",
  },
  UPDATE_TASK: {
    icon: Edit2,
    iconColor: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    borderColor: "border-blue-100 dark:border-blue-950/40",
    glowColor: "shadow-blue-500/5",
  },
  DELETE_TASK: {
    icon: Trash2,
    iconColor: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-500/10 dark:bg-rose-500/20",
    borderColor: "border-rose-100 dark:border-rose-950/40",
    glowColor: "shadow-rose-500/5",
  },
  DELEGATION_REQUESTED: {
    icon: ArrowLeftRight,
    iconColor: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
    borderColor: "border-amber-100 dark:border-amber-950/40",
    glowColor: "shadow-amber-500/5",
  },
  DELEGATION_ACCEPTED: {
    icon: CheckCircle2,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    borderColor: "border-emerald-100 dark:border-emerald-950/40",
    glowColor: "shadow-emerald-500/5",
  },
  DELEGATION_DECLINED: {
    icon: AlertTriangle,
    iconColor: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-500/10 dark:bg-rose-500/20",
    borderColor: "border-rose-100 dark:border-rose-950/40",
    glowColor: "shadow-rose-500/5",
  },
  ADD_COMMENT: {
    icon: MessageSquare,
    iconColor: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-500/10 dark:bg-indigo-500/20",
    borderColor: "border-indigo-100 dark:border-indigo-950/40",
    glowColor: "shadow-indigo-500/5",
  },
  ADD_TASK_UPDATE: {
    icon: Sparkles,
    iconColor: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-500/10 dark:bg-violet-500/20",
    borderColor: "border-violet-100 dark:border-violet-950/40",
    glowColor: "shadow-violet-500/5",
  },
  START_TASK_TIMER: {
    icon: Play,
    iconColor: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-500/10 dark:bg-indigo-500/20",
    borderColor: "border-indigo-100 dark:border-indigo-950/40",
    glowColor: "shadow-indigo-500/5",
  },
  STOP_TASK_TIMER: {
    icon: Clock,
    iconColor: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-500/10 dark:bg-cyan-500/20",
    borderColor: "border-cyan-100 dark:border-cyan-950/40",
    glowColor: "shadow-cyan-500/5",
  },
  DEFAULT: {
    icon: ActivityIcon,
    iconColor: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-500/10 dark:bg-slate-500/20",
    borderColor: "border-slate-200 dark:border-slate-800",
    glowColor: "shadow-slate-500/5",
  },
};

export default function ActivitiesPage() {
  const { currentUser, selectedTask, setSelectedTask } = useTaskStore();
  const toast = useToast();

  const [activities, setActivities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedUser, setSelectedUser] = useState("ALL");
  const [selectedAction, setSelectedAction] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState("ALL");

  // Inspect Drawer state
  const [inspectingActivity, setInspectingActivity] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [fetchingTaskId, setFetchingTaskId] = useState<string | null>(null);

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
      toast.error("Failed to load activities feed.");
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

  // Task inspector trigger helper
  const handleViewTask = async (taskId: string) => {
    setFetchingTaskId(taskId);
    try {
      const taskInStore = useTaskStore.getState().tasks.find((t) => t.id === taskId);
      if (taskInStore) {
        setSelectedTask(taskInStore);
      } else {
        const res = await fetch(`/api/tasks/${taskId}`);
        const payload = await res.json();
        if (payload.success && payload.data) {
          setSelectedTask(payload.data);
        } else {
          toast.error("Failed to load task details.");
        }
      }
    } catch (err) {
      toast.error("Failed to load task details.");
    } finally {
      setFetchingTaskId(null);
    }
  };

  // Helper: copy details JSON
  const handleCopyJSON = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Metadata copied to clipboard");
  };

  // Humanize relative timestamp
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return (
      date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
      " at " +
      date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Render descriptive text inside card body
  const renderActionInfo = (act: any) => {
    const taskTitle = act.task?.title || act.meta?.title || "Unknown Task";
    const taskLink = act.taskId ? (
      <button
        id={`activity-task-link-${act.id}`}
        onClick={() => handleViewTask(act.taskId)}
        disabled={fetchingTaskId === act.taskId}
        className="font-bold text-indigo-650 hover:text-indigo-850 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline transition-colors focus:outline-none inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 text-left"
      >
        "{taskTitle}"
        {fetchingTaskId === act.taskId && (
          <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin inline-block" />
        )}
      </button>
    ) : (
      <span className="font-bold text-slate-800 dark:text-slate-200">"{taskTitle}"</span>
    );

    switch (act.action) {
      case "CREATE_TASK":
        return (
          <span className="text-slate-600 dark:text-slate-350">
            created a new task {taskLink}
            {act.meta?.assignee && (
              <>
                {" "}
                and assigned it to{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {act.meta.assignee}
                </span>
              </>
            )}
          </span>
        );
      case "UPDATE_TASK":
        const fields = Array.isArray(act.meta?.fieldsUpdated)
          ? act.meta.fieldsUpdated
              .map((f: string) => f.replace(/([A-Z])/g, " $1").trim())
              .join(", ")
          : "";
        return (
          <span className="text-slate-600 dark:text-slate-350">
            updated {fields ? `[${fields}]` : "details"} on task {taskLink}
            {act.meta?.status && (
              <>
                {" "}
                (status changed to{" "}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-850 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 uppercase">
                  {act.meta.status}
                </span>
                )
              </>
            )}
          </span>
        );
      case "DELETE_TASK":
        return (
          <span className="text-slate-600 dark:text-slate-350">
            deleted task{" "}
            <span className="font-bold text-rose-600 dark:text-rose-455">
              "{taskTitle}"
            </span>
          </span>
        );
      case "DELEGATION_REQUESTED":
        return (
          <span className="text-slate-600 dark:text-slate-350">
            requested delegation of task {taskLink} to colleague{" "}
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {act.meta?.delegationTo || "someone"}
            </span>
          </span>
        );
      case "DELEGATION_ACCEPTED":
        return (
          <span className="text-slate-600 dark:text-slate-350">
            accepted delegation request for task {taskLink} from{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {act.meta?.delegationFrom || "someone"}
            </span>
          </span>
        );
      case "DELEGATION_DECLINED":
        return (
          <span className="text-slate-600 dark:text-slate-350">
            declined delegation request for task {taskLink} from{" "}
            <span className="font-semibold text-rose-600 dark:text-rose-455">
              {act.meta?.delegationFrom || "someone"}
            </span>
          </span>
        );
      case "ADD_COMMENT":
        return (
          <span className="text-slate-600 dark:text-slate-350">
            added a comment on task {taskLink}
          </span>
        );
      case "ADD_TASK_UPDATE":
        return (
          <span className="text-slate-600 dark:text-slate-350">
            posted progress update ({act.meta?.type || "remark"}) on task {taskLink}
          </span>
        );
      case "START_TASK_TIMER":
        return (
          <span className="text-slate-600 dark:text-slate-350">
            started tracking time for task {taskLink}
          </span>
        );
      case "STOP_TASK_TIMER":
        return (
          <span className="text-slate-600 dark:text-slate-350">
            stopped tracking time for task {taskLink}{" "}
            {act.meta?.durationMinutes && (
              <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-lg border border-indigo-200/50 dark:border-indigo-850/50 ml-1 text-[11px]">
                <Clock className="w-3 h-3 text-indigo-550 dark:text-indigo-400" />
                {act.meta.durationMinutes} min
              </span>
            )}
          </span>
        );
      default:
        return (
          <span className="text-slate-600 dark:text-slate-350">
            performed action targeting{" "}
            <span className="font-semibold">{act.entityType.toLowerCase()}</span>{" "}
            <span className="font-mono bg-slate-50 dark:bg-slate-950 px-1 py-0.5 rounded border border-slate-100 dark:border-slate-850 text-[10px]">
              #{act.entityId?.slice(0, 8).toUpperCase() || "SYSTEM"}
            </span>
          </span>
        );
    }
  };

  // Syntax highlighter for inspecting metadata JSON
  const renderPrettyJSON = (data: any) => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-slate-400 dark:text-slate-500 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/40 dark:bg-slate-950/20">
          <BookOpen className="w-5 h-5 mb-1 opacity-60" />
          No extended metadata available
        </div>
      );
    }
    const jsonStr = JSON.stringify(data, null, 2);
    const parts = [];
    let index = 0;
    const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

    let match;
    while ((match = regex.exec(jsonStr)) !== null) {
      const prevText = jsonStr.substring(index, match.index);
      if (prevText) parts.push(<span key={`text-${index}`}>{prevText}</span>);

      const token = match[0];
      index = regex.lastIndex;

      if (token.endsWith(":")) {
        parts.push(
          <span key={`key-${index}`} className="text-rose-500 dark:text-rose-400 font-semibold">
            {token}
          </span>
        );
      } else if (token.startsWith('"')) {
        parts.push(
          <span key={`str-${index}`} className="text-emerald-600 dark:text-emerald-400">
            {token}
          </span>
        );
      } else if (/true|false/.test(token)) {
        parts.push(
          <span key={`bool-${index}`} className="text-amber-600 dark:text-amber-400 font-bold">
            {token}
          </span>
        );
      } else if (token === "null") {
        parts.push(
          <span key={`null-${index}`} className="text-slate-400 dark:text-slate-500 italic">
            {token}
          </span>
        );
      } else {
        parts.push(
          <span key={`num-${index}`} className="text-indigo-500 dark:text-indigo-400 font-medium">
            {token}
          </span>
        );
      }
    }

    const postText = jsonStr.substring(index);
    if (postText) parts.push(<span key={`post-${index}`}>{postText}</span>);

    return (
      <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 bg-slate-950 p-4 rounded-xl overflow-x-auto max-h-[280px] border border-slate-800/80">
        {parts}
      </pre>
    );
  };

  // Perform search & date filtering client-side
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // 1. Search filter
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const actorName = (act.user?.name || "System").toLowerCase();
        const taskTitle = (act.task?.title || act.meta?.title || "").toLowerCase();
        const actionLabel = act.action.toLowerCase().replace(/_/g, " ");
        const metaStr = act.meta ? JSON.stringify(act.meta).toLowerCase() : "";

        const matches =
          actorName.includes(query) ||
          taskTitle.includes(query) ||
          actionLabel.includes(query) ||
          metaStr.includes(query);

        if (!matches) return false;
      }

      // 2. Date presets filter
      if (dateRangeFilter !== "ALL") {
        const time = new Date(act.createdAt).getTime();
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

        if (dateRangeFilter === "TODAY" && time < todayStart) return false;
        if (dateRangeFilter === "YESTERDAY" && (time < yesterdayStart || time >= todayStart)) return false;
        if (dateRangeFilter === "WEEK" && time < now.getTime() - 7 * 24 * 60 * 60 * 1000) return false;
        if (dateRangeFilter === "MONTH" && time < now.getTime() - 30 * 24 * 60 * 60 * 1000) return false;
      }

      return true;
    });
  }, [activities, searchTerm, dateRangeFilter]);

  // Group filtered results by day
  const groupedActivities = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredActivities.forEach((act) => {
      const date = new Date(act.createdAt);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let key = "";
      if (date.toDateString() === today.toDateString()) {
        key = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = "Yesterday";
      } else {
        key = date.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(act);
    });
    return groups;
  }, [filteredActivities]);

  // Compute dynamic stats from current view
  const stats = useMemo(() => {
    const total = filteredActivities.length;
    const myActions = filteredActivities.filter((a) => a.userId === currentUser?.id).length;
    const taskMutations = filteredActivities.filter(
      (a) => a.action === "CREATE_TASK" || a.action === "UPDATE_TASK" || a.action === "DELETE_TASK"
    ).length;
    const timeTrackedMinutes = filteredActivities
      .filter((a) => a.action === "STOP_TASK_TIMER")
      .reduce((sum, a) => sum + (Number(a.meta?.durationMinutes) || 0), 0);

    return {
      total,
      myActions,
      taskMutations,
      timeTrackedMinutes,
    };
  }, [filteredActivities, currentUser]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl backdrop-blur-md gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-xl">
              <ActivityIcon className="w-5 h-5 text-indigo-650 dark:text-indigo-455" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Audit Logs & Activities
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Review live activity records, security transitions, and operational audits.
          </p>
        </div>

        <button
          id="activity-refresh-btn"
          onClick={fetchActivities}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl text-xs font-semibold text-slate-650 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 active:scale-95 transition-all shadow-xs cursor-pointer"
          title="Refresh activities feed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Feed
        </button>
      </div>

      {/* Statistics dashboard row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="p-5 bg-white dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl shadow-xs relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-300" />
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Total Operations
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-850 dark:text-slate-50 tracking-tight">
              {stats.total}
            </span>
            <span className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold">
              recorded
            </span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="p-5 bg-white dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl shadow-xs relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-300" />
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            My Actions
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-850 dark:text-slate-50 tracking-tight">
              {stats.myActions}
            </span>
            <span className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold">
              operations
            </span>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="p-5 bg-white dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl shadow-xs relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-300" />
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Task Mutations
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-850 dark:text-slate-50 tracking-tight">
              {stats.taskMutations}
            </span>
            <span className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold">
              creates/updates
            </span>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="p-5 bg-white dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl shadow-xs relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-300" />
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Timer Sessions
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-850 dark:text-slate-50 tracking-tight">
              {stats.timeTrackedMinutes}
            </span>
            <span className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold">
              minutes tracked
            </span>
          </div>
        </div>
      </div>

      {/* Filter strip */}
      <div className="p-4 bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-xs backdrop-blur-md space-y-4">
        {/* Primary Controls: Search + Refresh */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              id="activity-search-input"
              type="text"
              placeholder="Search description, task, member, or metadata..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Filters:</span>
            </div>

            {/* Date preset filter */}
            <select
              id="activity-date-select"
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="WEEK">Last 7 Days</option>
              <option value="MONTH">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Secondary Scoped Database Filters */}
        <div className="flex flex-wrap gap-4 items-center pt-3 border-t border-slate-100 dark:border-slate-850">
          {/* User selector (Admin only) */}
          {isAdmin && (
            <div className="flex flex-col gap-1 min-w-[150px]">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                Team Member
              </span>
              <select
                id="activity-user-select"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
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

          {/* Action Operation Selector */}
          <div className="flex flex-col gap-1 min-w-[150px]">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              Operation Action
            </span>
            <select
              id="activity-action-select"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Operations</option>
              <option value="CREATE_TASK">Create Task</option>
              <option value="UPDATE_TASK">Update Task</option>
              <option value="DELETE_TASK">Delete Task</option>
              <option value="DELEGATION_REQUESTED">Delegate Requested</option>
              <option value="DELEGATION_ACCEPTED">Delegate Accepted</option>
              <option value="DELEGATION_DECLINED">Delegate Declined</option>
              <option value="ADD_COMMENT">Add Comment</option>
              <option value="ADD_TASK_UPDATE">Post Update</option>
              <option value="START_TASK_TIMER">Start Timer</option>
              <option value="STOP_TASK_TIMER">Stop Timer</option>
            </select>
          </div>

          {/* Entity Target Scope Selector */}
          <div className="flex flex-col gap-1 min-w-[150px]">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              Entity Scope Target
            </span>
            <select
              id="activity-entity-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Targets</option>
              <option value="TASK">Tasks</option>
              <option value="TASK_COMMENT">Comments</option>
              <option value="TASK_UPDATE">Updates</option>
              <option value="TASK_TIMER">Timers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main activities feed block */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 text-xs">
            <div className="w-7 h-7 border-2 border-indigo-50 border-t-indigo-650 rounded-full animate-spin mb-3" />
            Querying activity records...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-505 mb-4 border border-slate-200/50 dark:border-slate-805/50">
              <Filter className="w-5 h-5 opacity-60" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-350">
              No Activities Found
            </p>
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 max-w-sm">
              No matching activity records correspond to the chosen filters or keyword search query.
            </p>
          </div>
        ) : (
          <div className="space-y-8 relative pl-4 sm:pl-6">
            {/* Timeline vertical stem */}
            <div className="absolute left-[13px] sm:left-[21px] top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800/80" />

            {/* Render date groups */}
            {Object.entries(groupedActivities).map(([dateLabel, items]) => (
              <div key={dateLabel} className="space-y-4 relative">
                {/* Date Group Heading (Sticky separator node) */}
                <div className="sticky top-0 z-10 -ml-4 sm:-ml-6 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 bg-white dark:bg-slate-900 flex items-center justify-center ml-[8.5px] sm:ml-[16.5px]">
                    <div className="w-1 h-1 rounded-full bg-indigo-500 animate-ping" />
                  </div>
                  <span className="px-3 py-1 text-[11px] font-bold text-indigo-750 dark:text-indigo-350 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-full backdrop-blur-sm shadow-xs">
                    {dateLabel}
                  </span>
                </div>

                {/* Timeline Cards in Group */}
                <div className="space-y-4.5 pl-3">
                  {items.map((act) => {
                    const styling = ACTION_STYLING[act.action] || ACTION_STYLING.DEFAULT;
                    const Icon = styling.icon;

                    return (
                      <div
                        key={act.id}
                        className={`group p-4 bg-white dark:bg-slate-900/60 border ${styling.borderColor} rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 hover:scale-[1.008] active:scale-[0.998] relative flex items-start gap-4`}
                      >
                        {/* Status bar border tag */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${styling.iconColor.split(" ")[0].replace("text-", "bg-")}`}
                        />

                        {/* Actor avatar node */}
                        <div className="shrink-0 relative">
                          <UserAvatar src={act.user?.avatarUrl} name={act.user?.name} size="md" />
                          <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full ${styling.bgColor} border border-white dark:border-slate-900`}>
                            <Icon className={`w-3.5 h-3.5 ${styling.iconColor}`} />
                          </div>
                        </div>

                        {/* Card body detail */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                {act.user?.name || "System"}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">•</span>
                              <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-450 dark:text-slate-400">
                                {act.action.replace(/_/g, " ")}
                              </span>
                            </div>

                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              {getRelativeTime(act.createdAt)}
                            </span>
                          </div>

                          <div className="text-xs font-medium leading-relaxed">
                            {renderActionInfo(act)}
                          </div>
                        </div>

                        {/* Details drawer action */}
                        <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            id={`activity-inspect-btn-${act.id}`}
                            onClick={() => setInspectingActivity(act)}
                            className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 active:scale-90 transition-all cursor-pointer shadow-2xs"
                            title="Inspect metadata payload"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inspect Side-Drawer Panel */}
      {inspectingActivity && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setInspectingActivity(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 transition-opacity animate-in fade-in-0 duration-200"
          />

          {/* Sliding Panel */}
          <div className="fixed top-0 right-0 h-full w-full max-w-[500px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-[51] flex flex-col transition-transform duration-300 transform translate-x-0 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-lg">
                  <ActivityIcon className="w-4 h-4 text-indigo-650 dark:text-indigo-455" />
                </div>
                <h2 className="text-sm font-extrabold text-slate-850 dark:text-slate-100 tracking-tight uppercase">
                  Inspect Audit Record
                </h2>
              </div>
              <button
                id="activity-drawer-close-btn"
                onClick={() => setInspectingActivity(null)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-850 active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-100 dark:scrollbar-thumb-slate-800">
              {/* Actor details header */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850/80">
                <UserAvatar
                  src={inspectingActivity.user?.avatarUrl}
                  name={inspectingActivity.user?.name}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">
                    {inspectingActivity.user?.name || "System Actor"}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate">
                    {inspectingActivity.user?.email || "system@digitalai.internal"}
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/30 mt-1">
                    {inspectingActivity.userId ? "Team Member" : "System Process"}
                  </span>
                </div>
              </div>

              {/* Record Summary Details */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Audit Transaction Info
                </h4>

                <div className="divide-y divide-slate-100 dark:divide-slate-850 border border-slate-200/50 dark:border-slate-850/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/20">
                  {/* Action ID */}
                  <div className="grid grid-cols-3 gap-3 p-3 text-xs">
                    <span className="font-semibold text-slate-400 dark:text-slate-500">Record ID</span>
                    <span className="col-span-2 font-mono text-slate-800 dark:text-slate-200 select-all truncate text-[11px]">
                      {inspectingActivity.id}
                    </span>
                  </div>

                  {/* Operation Action */}
                  <div className="grid grid-cols-3 gap-3 p-3 text-xs">
                    <span className="font-semibold text-slate-400 dark:text-slate-500">Operation</span>
                    <span className="col-span-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wide uppercase bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {inspectingActivity.action.replace(/_/g, " ")}
                      </span>
                    </span>
                  </div>

                  {/* Entity target scope */}
                  <div className="grid grid-cols-3 gap-3 p-3 text-xs">
                    <span className="font-semibold text-slate-400 dark:text-slate-500">Target Type</span>
                    <span className="col-span-2 font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide text-[10px]">
                      {inspectingActivity.entityType}
                    </span>
                  </div>

                  {/* Entity target id */}
                  {inspectingActivity.entityId && (
                    <div className="grid grid-cols-3 gap-3 p-3 text-xs">
                      <span className="font-semibold text-slate-400 dark:text-slate-500">Target Entity ID</span>
                      <span className="col-span-2 font-mono text-slate-800 dark:text-slate-200 text-[11px]">
                        {inspectingActivity.entityId}
                      </span>
                    </div>
                  )}

                  {/* Logged timestamp */}
                  <div className="grid grid-cols-3 gap-3 p-3 text-xs">
                    <span className="font-semibold text-slate-400 dark:text-slate-500">Timestamp</span>
                    <span className="col-span-2 text-slate-850 dark:text-slate-200 font-semibold">
                      {new Date(inspectingActivity.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Metadata Inspector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Extended Metadata Properties
                  </h4>
                  {inspectingActivity.meta && Object.keys(inspectingActivity.meta).length > 0 && (
                    <button
                      id="activity-copy-json-btn"
                      onClick={() => handleCopyJSON(inspectingActivity.meta)}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors focus:outline-none cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500 animate-scale" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy JSON
                        </>
                      )}
                    </button>
                  )}
                </div>

                {renderPrettyJSON(inspectingActivity.meta)}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-850/80 bg-slate-50/50 dark:bg-slate-950/10 flex items-center justify-end gap-3 shrink-0">
              {inspectingActivity.taskId && (
                <button
                  onClick={() => {
                    handleViewTask(inspectingActivity.taskId);
                    setInspectingActivity(null);
                  }}
                  className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  Inspect Target Task
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setInspectingActivity(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-350 text-xs font-bold active:scale-95 transition-all cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </>
      )}

      {/* Global Task details drawer */}
      {selectedTask && (
        <TaskDetailPanel onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
