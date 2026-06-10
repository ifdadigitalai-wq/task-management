"use client";

import React from "react";
import { Send } from "lucide-react";
import { TaskComment } from "@/types";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface TaskCommentsTabProps {
  directComments: TaskComment[];
  newDirectComment: string;
  setNewDirectComment: (val: string) => void;
  handlePostDirectComment: (e: React.FormEvent) => void;
}

export function TaskCommentsTab({
  directComments,
  newDirectComment,
  setNewDirectComment,
  handlePostDirectComment,
}: TaskCommentsTabProps) {
  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Add Comment Input Form */}
      <form onSubmit={handlePostDirectComment} className="flex gap-2">
        <input
          type="text"
          placeholder="Write a direct comment on this task..."
          value={newDirectComment}
          onChange={(e) => setNewDirectComment(e.target.value)}
          className="block w-full px-3 py-2 border border-border-strong rounded bg-bg text-text-primary text-[13px] focus:outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={!newDirectComment.trim()}
          className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded font-medium text-[13px] disabled:opacity-50 active:scale-95 transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </button>
      </form>

      {/* Comments Feed list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {directComments.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary text-[13px]">
            No direct comments yet. Write one above.
          </div>
        ) : (
          directComments.map((comment) => (
            <div key={comment.id} className="p-3 bg-bg/40 border border-border rounded-lg flex gap-3 items-start">
              <UserAvatar src={comment.user?.avatarUrl} name={comment.user?.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-text-primary">{comment.user?.name || "Member"}</span>
                  <span className="text-[10px] text-text-tertiary">{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-xs text-text-primary mt-1 leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
