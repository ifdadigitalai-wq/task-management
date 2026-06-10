"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Users, X, Eye } from "lucide-react";
import { User, Task } from "@/types";
import { useTimeTheme } from "@/hooks/useTimeTheme";
import { useToast } from "@/hooks/useToast";
import { useTaskStore } from "@/store/useTaskStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/Button";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

function MyTeamContent() {
  const timeTheme = useTimeTheme();
  const toast = useToast();
  const searchParams = useSearchParams();
  const taskIdFromUrl = searchParams.get("taskId");

  const { selectedTask, setSelectedTask, currentUser, fetchCurrentUser } = useTaskStore();

  const [colleagues, setColleagues] = useState<User[]>([]);
  const [loadingColleagues, setLoadingColleagues] = useState(true);

  const [selectedColleague, setSelectedColleague] = useState<User | null>(null);
  const [colleagueTasks, setColleagueTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Load current user
  useEffect(() => {
    if (!currentUser) {
      fetchCurrentUser();
    }
  }, [currentUser, fetchCurrentUser]);

  // Load colleagues
  useEffect(() => {
    const fetchColleagues = async () => {
      try {
        const res = await fetch("/api/users", { cache: "no-store" });
        const payload = await res.json();
        if (payload.success) {
          setColleagues(payload.data || []);
        } else {
          toast.error(payload.error || "Failed to load colleagues.");
        }
      } catch (err) {
        console.error("Fetch colleagues error:", err);
        toast.error("Failed to load department colleagues.");
      } finally {
        setLoadingColleagues(false);
      }
    };

    fetchColleagues();
  }, [toast]);

  // Handle auto-open task from notification link
  useEffect(() => {
    if (taskIdFromUrl) {
      fetch(`/api/tasks/${taskIdFromUrl}`)
        .then((res) => res.json())
        .then((payload) => {
          if (payload.success && payload.data) {
            setSelectedTask(payload.data);
          }
        })
        .catch(console.error);
    }
  }, [taskIdFromUrl, setSelectedTask]);

  const handleColleagueClick = async (colleague: User) => {
    setSelectedColleague(colleague);
    setLoadingTasks(true);
    setColleagueTasks([]);
    try {
      const res = await fetch(`/api/tasks?assigneeId=${colleague.id}`);
      const payload = await res.json();
      if (payload.success) {
        setColleagueTasks(payload.data || []);
      } else {
        toast.error(payload.error || "Failed to load tasks.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred loading tasks.");
    } finally {
      setLoadingTasks(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between p-6 bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl backdrop-blur-md flex-wrap gap-4 select-none">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Users className="w-5 h-5" style={{ color: timeTheme.accentColor }} />
            <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              My Department Team
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {currentUser?.department
              ? `You are in the ${currentUser.department}. Here are your department colleagues:`
              : "Collaborate with colleagues in your department, view their tasks, and comment on updates."}
          </p>
        </div>
      </div>

      {/* Colleagues Grid */}
      {loadingColleagues ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
          <div className="w-6 h-6 border-2 border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-2" />
          Loading your team members...
        </div>
      ) : colleagues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-surface border border-border rounded-xl text-center max-w-md mx-auto shadow-sm select-none">
          <span className="text-3xl mb-2">👥</span>
          <h3 className="text-md font-medium text-text-primary mb-1.5">No Colleagues Found</h3>
          <p className="text-xs text-text-secondary leading-normal">
            No other employees were found in your department. Contact your administrator to assign team members.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {colleagues.map((colleague) => (
            <div
              key={colleague.id}
              onClick={() => handleColleagueClick(colleague)}
              className="flex items-center gap-4 p-4 bg-surface border border-border hover:border-brand/40 rounded-xl cursor-pointer hover:shadow-sm transition-all"
            >
              <div className="shrink-0">
                <UserAvatar src={colleague.avatarUrl} name={colleague.name} size="md" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-text-primary truncate">{colleague.name}</h3>
                <p className="text-xs text-text-secondary truncate mt-0.5">{colleague.jobTitle || "Staff"}</p>
                <p className="text-[11px] text-text-tertiary truncate">{colleague.email}</p>
              </div>
              {colleague.id === currentUser?.id && (
                <span className="text-[10px] bg-brand-light text-brand-text px-2 py-0.5 rounded-full font-semibold shrink-0 select-none">
                  You
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Colleague Tasks Modal */}
      {selectedColleague && (
        <>
          <div
            onClick={() => setSelectedColleague(null)}
            className="fixed inset-0 bg-black/20 backdrop-blur-[3px] z-[60] flex items-center justify-center"
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[65] w-full max-w-[520px] bg-surface border border-border rounded-xl shadow-lg p-6 md:p-8 animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border flex-shrink-0 relative">
              <div className="flex items-center gap-3">
                <UserAvatar src={selectedColleague.avatarUrl} name={selectedColleague.name} size="sm" />
                <div className="min-w-0">
                  <h3 className="text-[15px] font-medium text-text-primary truncate pr-6">
                    Tasks for {selectedColleague.name}
                  </h3>
                  <p className="text-[11px] text-text-secondary mt-0.5 truncate pr-6">
                    {selectedColleague.jobTitle || "Staff"} &bull; {selectedColleague.department || "No Department"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedColleague(null)}
                className="absolute top-0 right-0 w-6 h-6 rounded-full hover:bg-bg flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors focus-visible:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tasks List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {loadingTasks ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-2" />
                  Loading colleague tasks...
                </div>
              ) : colleagueTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center select-none">
                  <span className="text-3xl mb-2">🤝</span>
                  <p className="text-[13px] font-medium text-text-primary">
                    No Tasks Assigned
                  </p>
                  <p className="text-[11px] text-text-secondary mt-1 max-w-[280px]">
                    This colleague doesn't have any tasks assigned to them currently.
                  </p>
                </div>
              ) : (
                colleagueTasks.map((task) => {
                  const priorityDotColor =
                    task.priority === "CRITICAL"
                      ? "bg-priority-critical-text"
                      : task.priority === "HIGH"
                      ? "bg-priority-high-text"
                      : task.priority === "MEDIUM"
                      ? "bg-priority-medium-text"
                      : "bg-priority-low-text";

                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedTask(task);
                        setSelectedColleague(null);
                      }}
                      className="flex items-center justify-between p-3.5 bg-bg/30 hover:bg-bg border border-border rounded-lg cursor-pointer hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", priorityDotColor)} />
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-text-primary truncate pr-4 leading-snug group-hover:text-brand-text transition-colors">
                            {task.title}
                          </p>
                          <p className="text-[10px] text-text-tertiary mt-0.5 flex items-center gap-1.5">
                            <span className="font-mono">#{task.id.slice(0, 8).toUpperCase()}</span>
                            {task.dueDate && (
                              <span>&bull; Due {new Date(task.dueDate).toLocaleDateString()}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-[0.02em] bg-surface text-text-secondary border border-border select-none">
                          {task.status.replace("_", " ").toLowerCase()}
                        </span>
                        <Eye className="w-3.5 h-3.5 text-text-tertiary group-hover:text-text-primary transition-colors" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-4 mt-4 border-t border-border flex-shrink-0">
              <Button
                onClick={() => setSelectedColleague(null)}
                variant="secondary"
                size="sm"
                className="h-[34px] px-4"
              >
                Close Window
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Task Details Panel */}
      {selectedTask && (
        <TaskDetailPanel onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}

export default function MyTeamPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
        <div className="w-6 h-6 border-2 border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-2" />
        Loading your team...
      </div>
    }>
      <MyTeamContent />
    </Suspense>
  );
}
