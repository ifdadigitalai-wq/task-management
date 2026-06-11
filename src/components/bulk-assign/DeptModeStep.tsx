"use client";

import React, { useEffect, useState } from "react";
import { useBulkAssign } from "./useBulkAssign";
import { Layers, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeptModeStep() {
  const { dept, deptId, mode, setDept, setMode } = useBulkAssign();
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) {
          setDepartments(payload.data || []);
        }
      })
      .catch((err) => console.error("Failed to load departments:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Department Selection */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-tertiary">
          Select Department *
        </label>
        {loading ? (
          <div className="h-[38px] flex items-center justify-center bg-surface-raised rounded-xl border border-border-strong text-xs text-text-tertiary">
            Loading departments...
          </div>
        ) : (
          <select
            value={`${deptId}|${dept}`}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                const [id, name] = val.split("|");
                setDept(name, id);
              } else {
                setDept("", "");
              }
            }}
            className="w-full bg-surface-raised text-text-primary border border-border-strong rounded-xl text-xs font-semibold focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none p-2.5 cursor-pointer"
          >
            <option value="">Choose a department...</option>
            {departments.map((d) => (
              <option key={d.id} value={`${d.id}|${d.name}`}>
                {d.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Mode Selection */}
      <div className="space-y-3">
        <label className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-tertiary">
          Assignment Mode *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Use Template Option */}
          <button
            type="button"
            onClick={() => setMode("template")}
            className={cn(
              "flex flex-col items-center justify-center p-6 bg-surface-raised border rounded-2xl text-center transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand/30 hover:scale-[1.02]",
              mode === "template"
                ? "border-brand bg-brand/5 shadow-sm text-brand"
                : "border-border-strong hover:bg-white/5 text-text-secondary"
            )}
            style={{ minHeight: "130px" }}
          >
            <Layers className={cn("w-7 h-7 mb-3", mode === "template" ? "text-brand" : "text-text-tertiary")} />
            <span className="text-xs font-extrabold block text-text-primary">Use Template</span>
            <span className="text-[10px] text-text-tertiary font-medium mt-1 max-w-[180px]">
              Select multiple saved templates to assign pre-defined workflows
            </span>
          </button>

          {/* Custom Tasks Option */}
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={cn(
              "flex flex-col items-center justify-center p-6 bg-surface-raised border rounded-2xl text-center transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand/30 hover:scale-[1.02]",
              mode === "custom"
                ? "border-brand bg-brand/5 shadow-sm text-brand"
                : "border-border-strong hover:bg-white/5 text-text-secondary"
            )}
            style={{ minHeight: "130px" }}
          >
            <ListTodo className={cn("w-7 h-7 mb-3", mode === "custom" ? "text-brand" : "text-text-tertiary")} />
            <span className="text-xs font-extrabold block text-text-primary">Custom Tasks</span>
            <span className="text-[10px] text-text-tertiary font-medium mt-1 max-w-[180px]">
              Create tasks from scratch by adding custom names and parameters
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
