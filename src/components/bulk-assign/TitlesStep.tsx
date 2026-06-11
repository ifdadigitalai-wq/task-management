"use client";

import React from "react";
import { useBulkAssign } from "./useBulkAssign";
import { Plus, Trash2 } from "lucide-react";

export function TitlesStep() {
  const { titles, addTitle, removeTitle, setTitle } = useBulkAssign();

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-tertiary block mb-1">
          Enter Task Titles *
        </label>
        <p className="text-[10px] text-text-secondary">
          List the names of the tasks you wish to assign. Add rows as needed.
        </p>
      </div>

      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        {titles.map((title, idx) => (
          <div key={idx} className="flex items-center gap-2.5">
            {/* Task Row Label Badge */}
            <span className="shrink-0 w-8 h-8 rounded-lg bg-brand/5 border border-brand/10 text-brand text-[10px] font-extrabold flex items-center justify-center">
              T{idx + 1}
            </span>

            {/* Input Field */}
            <input
              type="text"
              required
              placeholder="e.g. Prepare quarterly briefing..."
              value={title}
              onChange={(e) => setTitle(idx, e.target.value)}
              className="flex-1 bg-surface-raised text-text-primary border border-border-strong rounded-xl text-xs font-semibold focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none p-2 h-9"
            />

            {/* Remove Row Button */}
            {titles.length > 1 && (
              <button
                type="button"
                onClick={() => removeTitle(idx)}
                className="shrink-0 w-9 h-9 border border-red-200 dark:border-red-900/40 bg-[#FEF2F2] dark:bg-red-950/20 text-[#EF4444] rounded-xl flex items-center justify-center hover:bg-[#FEE2E2] dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                title="Remove task row"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Row Button */}
      <button
        type="button"
        onClick={addTitle}
        className="flex items-center gap-1.5 px-3.5 py-2 border border-dashed border-border-strong text-text-secondary hover:text-brand hover:border-brand/50 hover:bg-brand/5 text-[11px] font-bold rounded-xl transition-all cursor-pointer"
        style={{ minHeight: "36px" }}
      >
        <Plus className="w-3.5 h-3.5" />
        Add another title
      </button>
    </div>
  );
}
