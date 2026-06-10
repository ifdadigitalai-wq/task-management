"use client";

import React, { useState } from "react";

interface AutoReminderSettingsProps {
  reminderBeforeDue: boolean;
  setReminderBeforeDue: (val: boolean) => void;
  reminderOnDue: boolean;
  setReminderOnDue: (val: boolean) => void;
  reminderRecurring: boolean;
  setReminderRecurring: (val: boolean) => void;
  reminderEmail: boolean;
  setReminderEmail: (val: boolean) => void;
  reminderInApp: boolean;
  setReminderInApp: (val: boolean) => void;
}

export function AutoReminderSettings({
  reminderBeforeDue,
  setReminderBeforeDue,
  reminderOnDue,
  setReminderOnDue,
  reminderRecurring,
  setReminderRecurring,
  reminderEmail,
  setReminderEmail,
  reminderInApp,
  setReminderInApp,
}: AutoReminderSettingsProps) {
  const [showReminders, setShowReminders] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-bg/5">
      <button
        type="button"
        onClick={() => setShowReminders(!showReminders)}
        className="w-full flex items-center justify-between p-3.5 text-[12px] font-medium text-text-primary hover:bg-bg/40 transition-colors select-none"
      >
        <span>Auto Reminder Settings</span>
        <span className="text-text-tertiary">{showReminders ? "▲" : "▼"}</span>
      </button>
      {showReminders && (
        <div className="p-4 border-t border-border bg-surface space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-primary font-medium select-none">
              <input
                type="checkbox"
                checked={reminderBeforeDue}
                onChange={(e) => setReminderBeforeDue(e.target.checked)}
                className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
              />
              Before Due Date
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-primary font-medium select-none">
              <input
                type="checkbox"
                checked={reminderOnDue}
                onChange={(e) => setReminderOnDue(e.target.checked)}
                className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
              />
              On Due Date
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-primary font-medium select-none">
              <input
                type="checkbox"
                checked={reminderRecurring}
                onChange={(e) => setReminderRecurring(e.target.checked)}
                className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
              />
              Recurring
            </label>
          </div>
          <div className="flex gap-x-6 pt-2 border-t border-border-strong/5">
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-primary font-medium select-none">
              <input
                type="checkbox"
                checked={reminderEmail}
                onChange={(e) => setReminderEmail(e.target.checked)}
                className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
              />
              Email Reminders
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-primary font-medium select-none">
              <input
                type="checkbox"
                checked={reminderInApp}
                onChange={(e) => setReminderInApp(e.target.checked)}
                className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
              />
              In-App Notifications
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
