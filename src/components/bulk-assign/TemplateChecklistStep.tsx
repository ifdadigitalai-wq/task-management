"use client";

import React, { useEffect, useState } from "react";
import { useBulkAssign } from "./useBulkAssign";
import { TaskTemplate } from "@/types";
import { AlertCircle, CheckSquare, Square } from "lucide-react";

export function TemplateChecklistStep() {
  const { dept, selectedTemplates, toggleTemplate } = useBulkAssign();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/task-templates")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) {
          setTemplates(payload.data || []);
        }
      })
      .catch((err) => console.error("Failed to fetch templates:", err))
      .finally(() => setLoading(false));
  }, []);

  // Filter templates by the selected department
  const filteredTemplates = templates.filter((t) => t.department === dept);

  if (loading) {
    return (
      <div className="py-10 text-center text-xs text-text-tertiary">
        <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading templates...
      </div>
    );
  }

  if (filteredTemplates.length === 0) {
    return (
      <div className="py-8 text-center bg-surface-raised rounded-2xl border border-border p-6">
        <AlertCircle className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
        <p className="text-xs font-bold text-text-primary">No Templates Available</p>
        <p className="text-[10px] text-text-tertiary mt-1">
          There are no task templates saved for the <strong>{dept}</strong> department yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-tertiary block mb-1">
          Select Task Templates
        </label>
        <p className="text-[10px] text-text-secondary">
          Choose one or more blueprints saved under the <strong>{dept}</strong> department.
        </p>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {filteredTemplates.map((t) => {
          const isChecked = selectedTemplates.has(t.id);
          // Calculate task count. If the template has related items, use items.length. If items is empty or not loaded, use 1.
          const taskCount = t.items && t.items.length > 0 ? t.items.length : 1;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleTemplate(t.id)}
              className="w-full flex items-center justify-between p-3.5 bg-surface-raised border border-border-strong rounded-xl hover:border-brand/50 hover:bg-white/5 transition-all text-left group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
              style={{ minHeight: "unset" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-brand shrink-0">
                  {isChecked ? (
                    <CheckSquare className="w-4.5 h-4.5 text-brand" />
                  ) : (
                    <Square className="w-4.5 h-4.5 text-text-tertiary group-hover:text-text-secondary" />
                  )}
                </span>
                <div>
                  <span className="text-xs font-extrabold text-text-primary block leading-tight">
                    {t.name}
                  </span>
                  {t.description && (
                    <span className="text-[10.5px] text-text-tertiary block mt-0.5 line-clamp-1">
                      {t.description}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 bg-brand/5 border border-brand/10 text-brand text-[9.5px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {taskCount} {taskCount === 1 ? "task" : "tasks"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
