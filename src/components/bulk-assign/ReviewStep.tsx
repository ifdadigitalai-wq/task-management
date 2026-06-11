"use client";

import React, { useEffect, useState } from "react";
import { useBulkAssign } from "./useBulkAssign";
import { TaskTemplate, User as UserType } from "@/types";
import { PriorityBadge } from "@/components/ui/Badge";
import { Check, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/useToast";

export function ReviewStep() {
  const {
    dept,
    deptId,
    mode,
    selectedTemplates,
    titles,
    descriptions,
    details,
    savedAsTemplate,
    setSavedAsTemplate,
  } = useBulkAssign();

  const toast = useToast();

  const [employees, setEmployees] = useState<UserType[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [templateName, setTemplateName] = useState(`${dept} Tasks Template`);
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    // Fetch users for mapping assignee names
    fetch("/api/users")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) setEmployees(payload.data || []);
      })
      .catch(console.error);

    // Fetch templates for mapping names in template mode
    if (mode === "template") {
      fetch("/api/task-templates")
        .then((res) => res.json())
        .then((payload) => {
          if (payload.success) setTemplates(payload.data || []);
        })
        .catch(console.error);
    }
  }, [mode]);

  const getAssigneeName = (id: string) => {
    if (!id) return "Unassigned";
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.name : "Unassigned";
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name.");
      return;
    }
    setSavingTemplate(true);

    try {
      const taskObjects = titles.map((title, idx) => ({
        title,
        description: descriptions[idx] || "",
        priority: details[idx]?.priority || "MEDIUM",
      }));

      const res = await fetch("/api/templates/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName.trim(),
          tasks: taskObjects,
          department: dept,
          departmentId: deptId,
        }),
      });

      const payload = await res.json();
      if (payload.success) {
        setSavedAsTemplate(true);
        toast.success("Tasks saved as template successfully!");
      } else {
        toast.error(payload.error || "Failed to save template.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("An error occurred while saving the template.");
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Step Header */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-tertiary block mb-1">
          Review Assignment Details
        </label>
        <p className="text-[10px] text-text-secondary">
          Confirm the details below before assigning tasks to the department.
        </p>
      </div>

      {/* Meta Information */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-surface-raised border border-border-strong rounded-2xl text-xs">
        <div>
          <span className="text-text-tertiary block font-bold uppercase text-[9.5px]">Department</span>
          <span className="text-text-primary font-extrabold mt-0.5 block">{dept}</span>
        </div>
        <div>
          <span className="text-text-tertiary block font-bold uppercase text-[9.5px]">Assignment Type</span>
          <span className="text-text-primary font-extrabold mt-0.5 block capitalize">
            {mode === "template" ? "From Templates" : "Custom Tasks"}
          </span>
        </div>
      </div>

      {/* Template Summary Header (if in Template mode) */}
      {mode === "template" && selectedTemplates.size > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase text-text-tertiary block">
            Selected Templates
          </span>
          <div className="flex flex-wrap gap-1.5">
            {templates
              .filter((t) => selectedTemplates.has(t.id))
              .map((t) => (
                <span
                  key={t.id}
                  className="px-2 py-0.5 bg-brand/5 border border-brand/10 text-brand text-[10px] font-extrabold rounded-md"
                >
                  {t.name}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Tasks List (Unified for both Custom and Template flows!) */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase text-text-tertiary block">
          Tasks to Assign ({titles.length})
        </span>
        <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
          {titles.map((title, idx) => {
            const detail = details[idx] || { priority: "MEDIUM", assigneeId: "", dueDate: null };
            return (
              <div
                key={idx}
                className="p-3.5 bg-surface-raised border border-border-strong rounded-2xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0 w-5 h-5 rounded bg-brand/5 border border-brand/10 text-brand text-[9px] font-extrabold flex items-center justify-center">
                      T{idx + 1}
                    </span>
                    <span className="font-extrabold text-text-primary truncate">{title || "(Untitled)"}</span>
                  </div>
                  <PriorityBadge priority={detail.priority} showDot={false} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary pt-1.5 border-t border-border/50">
                  <div>
                    <span className="text-text-tertiary block text-[9.5px] uppercase font-bold">Assignee</span>
                    <span className="font-semibold text-text-primary block mt-0.5">{getAssigneeName(detail.assigneeId)}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary block text-[9.5px] uppercase font-bold">Due Date</span>
                    <span className="font-semibold text-text-primary block mt-0.5">
                      {detail.dueDate ? new Date(detail.dueDate).toLocaleString() : "None"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save as Template block (Custom mode only) */}
      {mode === "custom" && (
        <div className="p-4 bg-brand/5 border border-brand/15 rounded-2xl space-y-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase text-brand tracking-wider">
              Save as Reusable Blueprint Template
            </span>
            <span className="text-[10px] text-text-tertiary font-medium">
              Save this set of tasks to quickly assign them again in the future.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Template name..."
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              disabled={savedAsTemplate}
              className="flex-1 bg-surface text-text-primary border border-border-strong rounded-xl text-xs font-semibold focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none p-2 h-9 disabled:opacity-50"
            />
            {savedAsTemplate ? (
              <button
                type="button"
                disabled
                className="shrink-0 h-9 px-4 bg-success-bg border border-success-text/20 text-success-text text-xs font-bold rounded-xl flex items-center gap-1.5 opacity-90"
              >
                <Check className="w-4 h-4" />
                Saved
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                disabled={savingTemplate}
                className="shrink-0 h-9 px-4 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                style={{ minHeight: "unset" }}
              >
                {savingTemplate ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Template
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
