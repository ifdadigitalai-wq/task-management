"use client";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastEvent {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

type ToastListener = (toasts: ToastEvent[]) => void;
let listeners: ToastListener[] = [];
let toasts: ToastEvent[] = [];

const notify = () => {
  listeners.forEach((l) => l([...toasts]));
};

export const toast = {
  success: (title: string, message?: string) => {
    // If only one argument is passed, treat it as the title and keep message undefined
    const id = Math.random().toString(36).substring(2, 9);
    toasts = [...toasts, { id, type: "success", title, message }];
    notify();
    setTimeout(() => toast.dismiss(id), 3500);
  },
  error: (title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    toasts = [...toasts, { id, type: "error", title, message }];
    notify();
    setTimeout(() => toast.dismiss(id), 3500);
  },
  warning: (title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    toasts = [...toasts, { id, type: "warning", title, message }];
    notify();
    setTimeout(() => toast.dismiss(id), 3500);
  },
  info: (title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    toasts = [...toasts, { id, type: "info", title, message }];
    notify();
    setTimeout(() => toast.dismiss(id), 3500);
  },
  dismiss: (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  },
  subscribe: (listener: ToastListener) => {
    listeners.push(listener);
    listener([...toasts]);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};

export function useToast() {
  return toast;
}
export default useToast;
