"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { toast, ToastEvent, ToastType } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  success: <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0" />,
  error: <XCircle className="w-4 h-4 text-[#EF4444] shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />,
  info: <Info className="w-4 h-4 text-[#3B82F6] shrink-0" />,
};

export function ToastItem({ item }: { item: ToastEvent }) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    setTimeout(() => {
      toast.dismiss(item.id);
    }, 200); // Allow exit transition
  };

  return (
    <div
      className={cn(
        "bg-surface border border-border shadow-lg rounded-xl p-3.5 flex items-start gap-3 max-w-[340px] w-full transition-all duration-200",
        "animate-in slide-in-from-right fade-in duration-200",
        isDismissed && "animate-out slide-out-to-right fade-out duration-200"
      )}
    >
      {ICON_MAP[item.type]}
      <div className="flex-1 min-w-0">
        {/* Minimum 15px for toast title — Problem 1 */}
        <h4 style={{ fontSize: "0.9375rem", fontWeight: 500 }} className="text-text-primary leading-tight">{item.title}</h4>
        {/* Secondary text — minimum 13px (Problem 1) */}
        {item.message && (
          <p style={{ fontSize: "0.8125rem" }} className="text-text-secondary mt-1 leading-normal">{item.message}</p>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="icon-only p-1 hover:bg-white/5 rounded-md text-text-tertiary hover:text-text-primary transition-colors shrink-0"
        style={{ minHeight: "unset", minWidth: "unset" }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastEvent[]>([]);

  useEffect(() => {
    return toast.subscribe((newToasts) => {
      setToasts(newToasts);
    });
  }, []);

  return (
    /* z-toast = 90 — above modals, above everything — Problem 7 */
    <div className="fixed bottom-4 right-4 flex flex-col gap-2.5 max-w-[340px] w-full pointer-events-none" style={{ zIndex: "var(--z-toast)" }}>
      <div className="flex flex-col gap-2.5 pointer-events-auto">
        {toasts.map((t) => (
          <ToastItem key={t.id} item={t} />
        ))}
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
export default ToastProvider;
