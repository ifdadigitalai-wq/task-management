"use client";

import React from "react";
import { Paperclip, Mic, X, Send } from "lucide-react";
import { TaskUpdate } from "@/types";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { VoiceRecordingModal } from "@/components/VoiceRecordingModal";

interface TaskUpdatesTabProps {
  updates: TaskUpdate[];
  newRemark: string;
  setNewRemark: (val: string) => void;
  handlePostUpdate: (e: React.FormEvent) => void;
  updateSelectedFiles: File[];
  setUpdateSelectedFiles: (files: File[]) => void;
  updateVoiceRecordings: { name: string; blob: Blob }[];
  setUpdateVoiceRecordings: (val: { name: string; blob: Blob }[]) => void;
  showUpdateVoiceModal: boolean;
  setShowUpdateVoiceModal: (val: boolean) => void;
  updateFileInputRef: React.RefObject<HTMLInputElement | null>;
  newCommentText: Record<string, string>;
  setNewCommentText: (val: Record<string, string>) => void;
  handlePostComment: (updateId: string) => void;
  handleUpdateFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpdateVoiceSave: (blob: Blob, name: string) => void;
}

export function TaskUpdatesTab({
  updates,
  newRemark,
  setNewRemark,
  handlePostUpdate,
  updateSelectedFiles,
  setUpdateSelectedFiles,
  updateVoiceRecordings,
  setUpdateVoiceRecordings,
  showUpdateVoiceModal,
  setShowUpdateVoiceModal,
  updateFileInputRef,
  newCommentText,
  setNewCommentText,
  handlePostComment,
  handleUpdateFileChange,
  handleUpdateVoiceSave,
}: TaskUpdatesTabProps) {
  return (
    <div className="space-y-4">
      {/* Add Update Input */}
      <form onSubmit={handlePostUpdate} className="space-y-2.5">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Post progress update or comment..."
            value={newRemark}
            onChange={(e) => setNewRemark(e.target.value)}
            className="block w-full px-3 py-1.5 border border-border-strong rounded bg-bg text-text-primary text-[12px] focus:outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded font-medium text-[12px] active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            Send
          </button>
        </div>
        
        {/* File Attachment & Voice Note controls for Updates */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateFileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded border border-border bg-transparent text-[11px] text-text-secondary hover:bg-bg hover:text-text-primary transition-colors cursor-pointer select-none font-medium"
          >
            <Paperclip className="w-3.5 h-3.5" />
            Attach File
          </button>
          <input
            ref={updateFileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUpdateFileChange}
          />

          <button
            type="button"
            onClick={() => setShowUpdateVoiceModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded border border-[#FECACA] bg-transparent text-[11px] text-[#EF4444] hover:bg-[#FEF2F2] transition-colors cursor-pointer select-none font-medium"
          >
            <Mic className="w-3.5 h-3.5" />
            Record audio
          </button>
        </div>

        {/* Update Files Preview */}
        {updateSelectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {updateSelectedFiles.map((f, i) => (
              <div key={i} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-bg border border-border text-[10.5px]">
                <span className="truncate max-w-[100px] font-medium text-text-primary">{f.name}</span>
                <button
                  type="button"
                  onClick={() => setUpdateSelectedFiles(updateSelectedFiles.filter((_, idx) => idx !== i))}
                  className="hover:opacity-75 text-text-tertiary hover:text-text-primary"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Update Voice Notes Preview */}
        {updateVoiceRecordings.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {updateVoiceRecordings.map((v, i) => (
              <div key={i} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] text-[10.5px] font-medium dark:bg-red-955/20 dark:border-red-900/40 dark:text-red-400">
                <Mic className="w-3.5 h-3.5" />
                <span>Voice note {i + 1}</span>
                <button
                  type="button"
                  onClick={() => setUpdateVoiceRecordings(updateVoiceRecordings.filter((_, idx) => idx !== i))}
                  className="hover:opacity-75"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </form>

      {/* Updates Feed */}
      <div className="space-y-3.5">
        {updates.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary text-[12px]">
            No status updates posted yet.
          </div>
        ) : (
          updates.map((up) => (
            <div key={up.id} className="p-3.5 bg-bg/40 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserAvatar src={up.user?.avatarUrl} name={up.user?.name} size="sm" />
                  <div>
                    <p className="text-[12px] font-medium text-text-primary">{up.user?.name || "System"}</p>
                    <p className="text-[10px] text-text-tertiary">{new Date(up.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {up.type !== "COMMENT" && (
                  <span className="px-2 py-0.5 rounded bg-brand-light text-brand-text text-[9px] font-medium uppercase tracking-wider">
                    {up.type.replace("_", " ")}
                  </span>
                )}
              </div>

              <p className="text-[12px] text-text-primary leading-relaxed font-medium pl-1">
                {up.content}
              </p>

              {/* Update Attachments */}
              {up.attachments && Array.isArray(up.attachments) && up.attachments.length > 0 && (
                <div className="grid grid-cols-1 gap-1.5 mt-1.5 pl-1">
                  {up.attachments.map((file: any, fileIdx: number) => {
                    const isAudio = file.type === "audio" || file.name.endsWith(".webm") || file.name.startsWith("recording-");
                    return (
                      <div key={fileIdx} className="flex flex-col gap-1 p-2 rounded bg-surface border border-border text-[11px] text-text-primary">
                        <div className="flex items-center justify-between">
                          <span className="truncate pr-4 font-semibold">{file.name}</span>
                          {file.url && (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#6366F1] dark:text-[#818CF8] hover:underline font-bold text-[10px]"
                            >
                              Open
                            </a>
                          )}
                        </div>
                        {isAudio && file.url && (
                          <audio controls src={file.url} className="w-full mt-1 h-7 rounded" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Threaded Nested Comments */}
              <div className="pl-5 border-l border-border space-y-2">
                {up.comments && up.comments.map((c) => (
                  <div key={c.id} className="p-2 bg-surface border border-border rounded space-y-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] font-medium text-text-primary">{c.user?.name || "System"}</p>
                      <span className="text-[8px] text-text-tertiary">{new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary">{c.body}</p>
                  </div>
                ))}

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Reply to update..."
                    value={newCommentText[up.id] || ""}
                    onChange={(e) => setNewCommentText({ ...newCommentText, [up.id]: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") handlePostComment(up.id); }}
                    className="block w-full px-3 py-1 border border-border-strong rounded bg-surface text-text-primary text-[11px] focus:outline-none focus:border-brand"
                  />
                  <button
                    onClick={() => handlePostComment(up.id)}
                    className="px-2.5 py-1 bg-bg hover:bg-bg/60 rounded text-text-secondary hover:text-text-primary text-[10px] font-medium"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showUpdateVoiceModal && (
        <VoiceRecordingModal
          onSave={handleUpdateVoiceSave}
          onClose={() => setShowUpdateVoiceModal(false)}
          zIndexBackdrop={9999}
          zIndexModal={10000}
        />
      )}
    </div>
  );
}
