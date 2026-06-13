"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Search, ArrowLeft, User as UserIcon } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Message, User } from "@/types";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { currentUser, fetchCurrentUser } = useTaskStore();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Ref to scroll messages container
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch current user if not loaded
  useEffect(() => {
    if (!currentUser) {
      fetchCurrentUser().catch(console.error);
    }
  }, [currentUser, fetchCurrentUser]);

  // Fetch all chat users
  useEffect(() => {
    fetch("/api/chat/users")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) {
          setUsers(payload.data || []);
        }
      })
      .catch((err) => console.error("Error fetching users:", err))
      .finally(() => setLoadingUsers(false));
  }, []);

  // Fetch messages when selected user changes
  useEffect(() => {
    if (!selectedUser) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    fetchMessages(selectedUser.id).finally(() => setLoadingMessages(false));
  }, [selectedUser]);

  // Polling for new messages
  useEffect(() => {
    if (!selectedUser) return;

    const interval = setInterval(() => {
      fetchMessages(selectedUser.id, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedUser]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (receiverId: string, isSilent = false) => {
    try {
      const res = await fetch(`/api/chat/messages?receiverId=${receiverId}`);
      const payload = await res.json();
      if (payload.success) {
        setMessages(payload.data || []);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newMessage.trim() || sending) return;

    const text = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content: text,
        }),
      });

      const payload = await res.json();
      if (payload.success) {
        setMessages((prev) => [...prev, payload.data]);
      } else {
        console.error("Failed to send message:", payload.error);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Filter users based on search
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.jobTitle && u.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group messages by date
  const formatMessageTime = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getMessageDateLabel = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    }
  };

  const renderMessages = () => {
    const elements: React.JSX.Element[] = [];
    let lastDateLabel = "";

    messages.forEach((msg, idx) => {
      const msgDateLabel = getMessageDateLabel(msg.createdAt);
      if (msgDateLabel !== lastDateLabel) {
        elements.push(
          <div key={`date-${msgDateLabel}-${idx}`} className="flex justify-center my-4">
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] text-text-tertiary rounded-full font-medium uppercase tracking-wider shadow-sm">
              {msgDateLabel}
            </span>
          </div>
        );
        lastDateLabel = msgDateLabel;
      }

      const isMe = msg.senderId === currentUser?.id;

      elements.push(
        <div
          key={msg.id}
          className={cn(
            "flex w-full mb-3",
            isMe ? "justify-end" : "justify-start"
          )}
        >
          <div
            className={cn(
              "max-w-[70%] rounded-xl px-4 py-2.5 shadow-sm text-[13px] leading-relaxed relative",
              isMe
                ? "bg-brand text-white rounded-br-none"
                : "bg-surface border border-border text-text-primary rounded-bl-none"
            )}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>
            <span
              className={cn(
                "block text-[9px] mt-1 text-right",
                isMe ? "text-indigo-200" : "text-text-tertiary"
              )}
            >
              {formatMessageTime(msg.createdAt)}
            </span>
          </div>
        </div>
      );
    });

    return elements;
  };

  return (
    <div className="flex h-[calc(100vh-100px)] max-h-[850px] border border-border rounded-xl overflow-hidden bg-surface shadow-md">
      {/* 1. Left Sidebar - Users list */}
      <div
        className={cn(
          "w-full md:w-80 border-r border-border flex flex-col bg-bg/10 shrink-0",
          selectedUser ? "max-md:hidden" : "block"
        )}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-border space-y-3 shrink-0">
          <h2 className="text-text-primary font-semibold text-[15px] tracking-tight flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand" />
            Direct Messages
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search colleagues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-border-strong rounded bg-bg text-text-primary text-[12px] focus:outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>

        {/* Users list scroll area */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingUsers ? (
            <div className="text-center py-8 text-text-tertiary text-[12px]">Loading colleagues...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-text-tertiary text-[12px]">No colleagues found.</div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = selectedUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={cn(
                    "flex items-center gap-3 w-full p-2.5 rounded-lg text-left transition-all hover:bg-bg-strong cursor-pointer",
                    isSelected && "bg-brand/10 border-l-4 border-brand hover:bg-brand/15"
                  )}
                >
                  <UserAvatar src={u.avatarUrl} name={u.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-text-primary font-medium text-[13px] truncate">{u.name}</p>
                      <span className="text-[10px] text-text-tertiary shrink-0 capitalize">
                        {u.role.toLowerCase()}
                      </span>
                    </div>
                    <p className="text-text-tertiary text-[11px] truncate mt-0.5">
                      {u.jobTitle || "Staff"} • {u.department || "General"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right Conversation Window */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 bg-bg/5",
          !selectedUser ? "max-md:hidden" : "block"
        )}
      >
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-3 px-6 border-b border-border flex items-center gap-4 shrink-0 bg-surface z-10 shadow-sm">
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 hover:bg-bg rounded-lg text-text-secondary md:hidden cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <UserAvatar src={selectedUser.avatarUrl} name={selectedUser.name} size="sm" />
              <div className="min-w-0 flex-1">
                <h3 className="text-text-primary font-semibold text-[14px] truncate">{selectedUser.name}</h3>
                <p className="text-text-tertiary text-[11px] truncate mt-0.5">
                  {selectedUser.jobTitle || "Staff"} • {selectedUser.department || "General"}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider shrink-0">
                {selectedUser.role}
              </span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-black/10">
              {loadingMessages ? (
                <div className="text-center py-8 text-text-tertiary text-[12px]">Loading conversation history...</div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2 p-6">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h4 className="text-text-primary font-medium text-[13px]">No messages yet</h4>
                  <p className="text-text-tertiary text-[11px] max-w-[240px]">
                    Say hello to {selectedUser.name} to start the conversation!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {renderMessages()}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-surface shrink-0 flex gap-2.5 items-center">
              <input
                type="text"
                placeholder={`Type a message to ${selectedUser.name}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-4 py-2 border border-border-strong rounded bg-bg text-text-primary text-[12.5px] focus:outline-none focus:border-brand transition-colors"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="p-2 bg-brand hover:bg-brand-hover text-white rounded-lg flex items-center justify-center transition-all disabled:opacity-50 shrink-0 cursor-pointer hover:shadow active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          /* Empty Chat State */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/20 dark:bg-black/5">
            <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center text-brand mb-4 shadow-sm animate-pulse">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-text-primary font-semibold text-[15px] tracking-tight">Direct Messages</h3>
            <p className="text-text-tertiary text-[12px] max-w-[280px] mt-1.5 leading-normal">
              Select a colleague from the list on the left to view the conversation history and start messaging them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
