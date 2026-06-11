"use client";

import React, { useRef, useState } from "react";
import { useBulkAssign } from "./useBulkAssign";
import { Paperclip, Mic, X, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VoiceRecordingModal } from "@/components/VoiceRecordingModal";
import { cn } from "@/lib/utils";

export function AttachmentsStep() {
  const {
    titles,
    files,
    voiceRecordings,
    activeTaskIndex,
    addFile,
    removeFile,
    addVoice,
    removeVoice,
    setActiveTaskIndex,
  } = useBulkAssign();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const activeTaskTitle = titles[activeTaskIndex] || `Task ${activeTaskIndex + 1}`;
  const activeTaskFiles = files[activeTaskIndex] || [];
  const activeTaskVoices = voiceRecordings[activeTaskIndex] || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => {
        addFile(activeTaskIndex, file);
      });
    }
  };

  const handleVoiceSave = (blob: Blob, name: string) => {
    addVoice(activeTaskIndex, blob, name);
  };

  const hasAttachments = (idx: number) => {
    const taskFiles = files[idx] || [];
    const taskVoices = voiceRecordings[idx] || [];
    return taskFiles.length > 0 || taskVoices.length > 0;
  };

  return (
    <div className="space-y-4">
      {/* Dropdown at top */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-tertiary block">
          Select Task to Add Attachments
        </label>
        <select
          value={activeTaskIndex}
          onChange={(e) => setActiveTaskIndex(parseInt(e.target.value))}
          className="w-full bg-surface-raised text-text-primary border border-border-strong rounded-xl text-xs font-semibold focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none p-2.5 cursor-pointer"
        >
          {titles.map((title, idx) => (
            <option key={idx} value={idx}>
              T{idx + 1} — {title || "(Untitled)"} {hasAttachments(idx) ? " (Has Attachments)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Attachments Card */}
      <div className="p-5 bg-surface-raised border border-border-strong rounded-2xl space-y-4 min-h-[160px] flex flex-col justify-between">
        <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
            Upload Files & Voice Notes for T{activeTaskIndex + 1}
          </span>

          {/* Files List */}
          {activeTaskFiles.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase font-bold text-text-secondary block">Files</span>
              <div className="flex flex-wrap gap-2">
                {activeTaskFiles.map((f, i) => (
                  <div key={i} className="inline-flex items-center gap-2 p-2 bg-bg border border-border rounded-lg text-xs">
                    <span className="text-text-primary font-medium truncate max-w-[120px]">{f.name}</span>
                    <span className="text-[9.5px] text-text-tertiary">({(f.size / 1024).toFixed(1)} KB)</span>
                    <button
                      type="button"
                      onClick={() => removeFile(activeTaskIndex, i)}
                      className="text-text-tertiary hover:text-text-primary focus-visible:outline-none cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voice Notes List */}
          {activeTaskVoices.length > 0 && (
            <div className="space-y-1.5 pt-1.5 border-t border-border/10">
              <span className="text-[9px] uppercase font-bold text-text-secondary block">Voice Notes</span>
              <div className="flex flex-wrap gap-2">
                {activeTaskVoices.map((v, i) => (
                  <div key={i} className="inline-flex items-center gap-2 p-2 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-[#EF4444] text-xs dark:bg-red-955/20 dark:border-red-900/40 dark:text-red-400">
                    <Mic className="w-3.5 h-3.5" />
                    <span className="font-medium">{v.name}</span>
                    <button
                      type="button"
                      onClick={() => removeVoice(activeTaskIndex, i)}
                      className="hover:opacity-75 focus-visible:outline-none cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {activeTaskFiles.length === 0 && activeTaskVoices.length === 0 && (
            <div className="text-center py-6 text-xs text-text-tertiary italic">
              No files or voice notes attached to this task.
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 border-t border-border pt-4 mt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Paperclip className="w-3.5 h-3.5" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Attach File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Mic className="w-3.5 h-3.5" />}
            onClick={() => setShowVoiceModal(true)}
            className="text-[#EF4444] border-[#FECACA] hover:bg-[#FEF2F2] dark:hover:bg-red-955/20"
          >
            Record voice note
          </Button>
        </div>
      </div>

      {/* Pill tabs shortcuts */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
          Task Shortcut Navigation
        </span>
        <div className="flex flex-wrap gap-2">
          {titles.map((title, idx) => {
            const isActive = activeTaskIndex === idx;
            const filled = hasAttachments(idx);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveTaskIndex(idx)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-extrabold transition-all cursor-pointer outline-none",
                  isActive
                    ? "bg-brand/10 border-brand text-brand"
                    : filled
                    ? "bg-surface-raised border-brand/25 text-brand"
                    : "bg-surface-raised border-border-strong text-text-disabled"
                )}
                style={{ minHeight: "unset", minWidth: "unset" }}
              >
                <span>T{idx + 1}</span>
                {filled && <Paperclip className="w-3 h-3" />}
              </button>
            );
          })}
        </div>
      </div>

      {showVoiceModal && (
        <VoiceRecordingModal
          onSave={handleVoiceSave}
          onClose={() => setShowVoiceModal(false)}
        />
      )}
    </div>
  );
}
