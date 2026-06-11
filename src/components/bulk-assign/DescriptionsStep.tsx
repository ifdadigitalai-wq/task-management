"use client";

import React from "react";
import { useBulkAssign } from "./useBulkAssign";

export function DescriptionsStep() {
  const { titles, descriptions, setDescription } = useBulkAssign();

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-tertiary block mb-1">
          Add Descriptions (Optional)
        </label>
        <p className="text-[10px] text-text-secondary">
          Provide detailed instructions or references for each task.
        </p>
      </div>

      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
        {titles.map((title, idx) => (
          <div key={idx} className="space-y-1.5 p-3.5 bg-surface-raised border border-border-strong rounded-2xl">
            {/* Task Badge & Title Label */}
            <div className="flex items-center gap-2">
              <span className="shrink-0 w-6 h-6 rounded-md bg-brand/5 border border-brand/10 text-brand text-[9.5px] font-extrabold flex items-center justify-center">
                T{idx + 1}
              </span>
              <span className="text-xs font-extrabold text-text-primary truncate">
                {title || <span className="italic text-text-tertiary font-medium">Untitled Task</span>}
              </span>
            </div>

            {/* Description Textarea */}
            <textarea
              placeholder="Enter comprehensive description..."
              value={descriptions[idx] || ""}
              onChange={(e) => setDescription(idx, e.target.value)}
              rows={2}
              className="w-full bg-surface text-text-primary border border-border-strong rounded-xl text-xs font-semibold focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none p-2 resize-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
