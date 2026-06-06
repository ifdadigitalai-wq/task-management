"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventContentArg } from "@fullcalendar/core";
import { useTimeTheme } from "@/hooks/useTimeTheme";
import { useTaskStore } from "@/store/useTaskStore";
import { useToast } from "@/hooks/useToast";
import {
  X as XIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  Pencil,
  Save,
  Briefcase,
  Palmtree,
  Layers3,
  Building2,
  ChevronDown,
  Users,
  UserCheck,
  Repeat,
} from "lucide-react";
import { Holiday, CalendarEvent, EventType } from "@/types";

// ─── Type Config ───────────────────────────────────────────────────────────────

const EVENT_TYPE_CONFIG: Record<
  EventType | "holiday",
  { bg: string; text: string; border: string; label: string; Icon: React.ElementType; hasTime: boolean }
> = {
  LEAVE: {
    bg: "#fffbeb",
    text: "#d97706",
    border: "#f59e0b",
    label: "Leave",
    Icon: Palmtree,
    hasTime: false,
  },
  EVENT: {
    bg: "#f5f3ff",
    text: "#7c3aed",
    border: "#8b5cf6",
    label: "Meeting / Event",
    Icon: Layers3,
    hasTime: true,
  },
  OFFICIAL: {
    bg: "#eff6ff",
    text: "#2563eb",
    border: "#3b82f6",
    label: "Official",
    Icon: Building2,
    hasTime: true,
  },
  holiday: {
    bg: "#fef2f2",
    text: "#dc2626",
    border: "#ef4444",
    label: "Holiday",
    Icon: Briefcase,
    hasTime: false,
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toInputDate(d: string | Date) {
  return new Date(d).toISOString().split("T")[0];
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function formatDateShort(d: string | Date) {
  return new Date(d).toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatDateRange(from: string | Date, to: string | Date) {
  const f = new Date(from);
  const t = new Date(to);
  if (f.toDateString() === t.toDateString()) return formatDate(f);
  return `${formatDateShort(f)} – ${formatDateShort(t)}, ${t.getFullYear()}`;
}

/** Format 24h time string "14:30" → "2:30 PM" */
function formatTime(t?: string | null) {
  if (!t) return null;
  const [hh, mm] = t.split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h = hh % 12 || 12;
  return `${h}:${String(mm).padStart(2, "0")} ${ampm}`;
}

/** Build the human-readable sentence for admin team activity */
function buildActivitySentence(ev: CalendarEvent): string {
  const name = ev.user?.name ?? "Someone";
  const time = formatTime(ev.time);
  const timeStr = time ? ` at ${time}` : "";

  switch (ev.type) {
    case "LEAVE":
      return `${name} is on leave from ${formatDateShort(ev.fromDate)} to ${formatDateShort(ev.toDate)}`;
    case "EVENT":
      return time
        ? `${name} marked a meeting "${ev.title}" on ${formatDateShort(ev.fromDate)}${timeStr}`
        : `${name} marked a meeting "${ev.title}" on ${formatDateRange(ev.fromDate, ev.toDate)}`;
    case "OFFICIAL":
      return time
        ? `${name} marked an official engagement "${ev.title}" on ${formatDateShort(ev.fromDate)}${timeStr}`
        : `${name} marked an official engagement "${ev.title}" on ${formatDateRange(ev.fromDate, ev.toDate)}`;
    default:
      return `${name} added "${ev.title}" on ${formatDateRange(ev.fromDate, ev.toDate)}`;
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: EventType | "holiday" }) {
  const cfg = EVENT_TYPE_CONFIG[type];
  const Icon = cfg.Icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide flex-shrink-0"
      style={{ backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}40` }}
    >
      <Icon className="w-2.5 h-2.5" />
      {type === "EVENT" ? "Event" : cfg.label}
    </span>
  );
}

function renderEventContent(eventInfo: EventContentArg) {
  const props = eventInfo.event.extendedProps as {
    typeKey: EventType | "holiday";
    time?: string | null;
  };
  const cfg = EVENT_TYPE_CONFIG[props.typeKey] || EVENT_TYPE_CONFIG.EVENT;
  const timeLabel = formatTime(props.time);

  return (
    <div
      style={{
        backgroundColor: cfg.bg,
        color: cfg.text,
        borderLeft: `3px solid ${cfg.border}`,
        padding: "3px 7px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 700,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "1px",
      }}
      title={eventInfo.event.title}
    >
      <span className="line-clamp-1 leading-tight">{eventInfo.event.title}</span>
      {timeLabel && (
        <span style={{ fontSize: "9px", fontWeight: 600, opacity: 0.75 }}>⏰ {timeLabel}</span>
      )}
    </div>
  );
}

// ─── Popup state type ──────────────────────────────────────────────────────────

interface PopupState {
  open: boolean;
  mode: "add" | "edit";
  editingEvent?: CalendarEvent;
  title: string;
  fromDate: string;
  toDate: string;
  time: string;
  type: EventType;
  saving: boolean;
}

const EMPTY_POPUP: PopupState = {
  open: false,
  mode: "add",
  title: "",
  fromDate: "",
  toDate: "",
  time: "",
  type: "EVENT",
  saving: false,
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DayTrackerPage() {
  const timeTheme = useTimeTheme();
  const toast = useToast();
  const { currentUser } = useTaskStore();
  const calendarRef = useRef<FullCalendar>(null);
  const isAdmin = currentUser?.role === "ADMIN";

  // My own events (used for calendar rendering for BOTH admin and employee)
  const [myEvents, setMyEvents] = useState<CalendarEvent[]>([]);
  // Employee events visible only to admin (for team activity sidebar)
  const [teamEvents, setTeamEvents] = useState<CalendarEvent[]>([]);
  // Company holidays (visible to all on calendar)
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const [loading, setLoading] = useState(true);
  const [currentDateTitle, setCurrentDateTitle] = useState("");

  const [popup, setPopup] = useState<PopupState>(EMPTY_POPUP);
  const [typeDropOpen, setTypeDropOpen] = useState(false);

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const requests: Promise<Response>[] = [
        fetch("/api/holidays"),
        fetch("/api/calendar-events?scope=own"),
      ];
      if (isAdmin) requests.push(fetch("/api/calendar-events?scope=team"));

      const responses = await Promise.all(requests);
      const [hPayload, ownPayload, teamPayload] = await Promise.all(
        responses.map((r) => r.json())
      );

      if (hPayload.success) setHolidays(hPayload.data ?? []);
      if (ownPayload.success) setMyEvents(ownPayload.data ?? []);
      if (isAdmin && teamPayload?.success) setTeamEvents(teamPayload.data ?? []);
    } catch {
      toast.error("Failed to load calendar data.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (calendarRef.current && !loading) {
      setCurrentDateTitle(calendarRef.current.getApi().view.title);
    }
  }, [loading]);

  // ── Calendar nav ─────────────────────────────────────────────────────────────

  const handlePrev = () => {
    const api = calendarRef.current?.getApi();
    if (api) { api.prev(); setCurrentDateTitle(api.view.title); }
  };
  const handleNext = () => {
    const api = calendarRef.current?.getApi();
    if (api) { api.next(); setCurrentDateTitle(api.view.title); }
  };
  const handleToday = () => {
    const api = calendarRef.current?.getApi();
    if (api) { api.today(); setCurrentDateTitle(api.view.title); }
  };

  // ── Open popup ───────────────────────────────────────────────────────────────

  const openAddPopup = (dateStr?: string) => {
    const today = new Date().toISOString().split("T")[0];
    setTypeDropOpen(false);
    setPopup({
      ...EMPTY_POPUP,
      open: true,
      fromDate: dateStr ?? today,
      toDate: dateStr ?? today,
    });
  };

  const handleDateClick = (info: any) => openAddPopup(info.dateStr);

  const handleEventClick = (clickInfo: any) => {
    const extProps = clickInfo.event.extendedProps as { typeKey: string; isHoliday?: boolean };
    if (extProps.isHoliday) return;

    const ev = myEvents.find((e) => e.id === clickInfo.event.id);
    if (!ev) return;

    setTypeDropOpen(false);
    setPopup({
      open: true,
      mode: "edit",
      editingEvent: ev,
      title: ev.title,
      fromDate: toInputDate(ev.fromDate),
      toDate: toInputDate(ev.toDate),
      time: ev.time ?? "",
      type: ev.type,
      saving: false,
    });
  };

  const closePopup = () => { setPopup(EMPTY_POPUP); setTypeDropOpen(false); };

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!popup.title.trim()) { toast.error("Please enter a title."); return; }
    if (!popup.fromDate || !popup.toDate) { toast.error("Please select dates."); return; }
    if (new Date(popup.toDate) < new Date(popup.fromDate)) {
      toast.error("End date must be on or after start date.");
      return;
    }

    const cfg = EVENT_TYPE_CONFIG[popup.type];
    const bodyPayload = {
      title: popup.title.trim(),
      fromDate: new Date(popup.fromDate).toISOString(),
      toDate: new Date(popup.toDate).toISOString(),
      time: cfg.hasTime && popup.time ? popup.time : null,
      type: popup.type,
    };

    setPopup((p) => ({ ...p, saving: true }));

    try {
      let res: Response;
      if (popup.mode === "add") {
        res = await fetch("/api/calendar-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
        });
      } else {
        res = await fetch(`/api/calendar-events/${popup.editingEvent!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
        });
      }

      const payload = await res.json();
      if (payload.success) {
        toast.success(popup.mode === "add" ? "Event added." : "Event updated.");
        setMyEvents((prev) =>
          popup.mode === "add"
            ? [...prev, payload.data]
            : prev.map((e) => (e.id === payload.data.id ? payload.data : e))
        );
        closePopup();
      } else {
        toast.error(payload.error || "Failed to save event.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setPopup((p) => ({ ...p, saving: false }));
    }
  };

  const handleDelete = async () => {
    if (!popup.editingEvent) return;
    if (!confirm("Delete this event?")) return;
    try {
      const res = await fetch(`/api/calendar-events/${popup.editingEvent.id}`, { method: "DELETE" });
      const payload = await res.json();
      if (payload.success) {
        toast.success("Event removed.");
        setMyEvents((prev) => prev.filter((e) => e.id !== popup.editingEvent!.id));
        closePopup();
      } else {
        toast.error(payload.error || "Failed to delete.");
      }
    } catch {
      toast.error("Something went wrong.");
    }
  };

  // ── Calendar event objects (only my own events + holidays on calendar) ────────

  const calendarEvents = [
    ...holidays.map((h) => ({
      id: h.id,
      title: h.name,
      start: toInputDate(h.date),
      allDay: true,
      extendedProps: { typeKey: "holiday" as const, isHoliday: true },
    })),
    ...myEvents.map((e) => {
      const endDate = new Date(e.toDate);
      endDate.setDate(endDate.getDate() + 1);
      return {
        id: e.id,
        title: e.title,
        start: toInputDate(e.fromDate),
        end: endDate.toISOString().split("T")[0],
        allDay: true,
        extendedProps: { typeKey: e.type as EventType, isHoliday: false, time: e.time },
      };
    }),
  ];

  // ── Sidebar data ─────────────────────────────────────────────────────────────

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const myUpcoming = [...myEvents]
    .filter((e) => new Date(e.toDate) >= today)
    .sort((a, b) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime())
    .slice(0, 10);

  const teamUpcoming = [...teamEvents]
    .filter((e) => new Date(e.toDate) >= today)
    .sort((a, b) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime())
    .slice(0, 15);

  const upcomingHolidays = [...holidays]
    .filter((h) => { const d = new Date(h.date); d.setHours(0,0,0,0); return d >= today; })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const showTimeInput = EVENT_TYPE_CONFIG[popup.type]?.hasTime;

  // ─── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-[1440px] mx-auto gap-4 p-1">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <CalendarIcon className="text-white" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none">
              DayTracker
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {isAdmin ? "Your personal calendar — employee activity in sidebar" : "Mark your leaves, meetings & tasks on any day"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-2">
            {(["LEAVE", "EVENT", "OFFICIAL", "holiday"] as (EventType | "holiday")[]).map((key) => {
              const cfg = EVENT_TYPE_CONFIG[key];
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
                  style={{ backgroundColor: cfg.bg, color: cfg.text }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.border }} />
                  {key === "EVENT" ? "Event" : cfg.label}
                </span>
              );
            })}
          </div>

          <button
            onClick={() => openAddPopup()}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Event
          </button>
        </div>
      </div>

      {/* ── Body: Calendar + Sidebar ── */}
      <div className="flex flex-1 gap-4 min-h-0">

        {/* ── Calendar ── */}
        <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              {currentDateTitle || "Calendar View"}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToday}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Today
              </button>
              <div className="flex bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button onClick={handlePrev} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={handleNext} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="flex-1 tailadmin-calendar p-3 overflow-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400 font-medium">Loading calendar…</p>
              </div>
            ) : (
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={false}
                selectable={false}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                events={calendarEvents}
                eventContent={renderEventContent}
                height="100%"
                contentHeight="auto"
                dayMaxEvents={3}
              />
            )}
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <div className="w-[272px] flex-shrink-0 flex flex-col gap-3 overflow-auto">

          {/* ── My Upcoming Events ── */}
          <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm flex-shrink-0">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                {isAdmin ? "My Events" : "Upcoming Events"}
              </span>
              {myUpcoming.length > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full px-1.5 py-0.5">
                  {myUpcoming.length}
                </span>
              )}
            </div>

            {myUpcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                <CalendarIcon className="w-6 h-6 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-xs text-slate-400 font-medium">No upcoming events</p>
                <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-0.5">Click any day to add one</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[280px] overflow-auto">
                {myUpcoming.map((ev) => {
                  const cfg = EVENT_TYPE_CONFIG[ev.type];
                  const timeLabel = formatTime(ev.time);
                  return (
                    <div
                      key={ev.id}
                      className="relative w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => {
                        setTypeDropOpen(false);
                        setPopup({
                          open: true,
                          mode: "edit",
                          editingEvent: ev,
                          title: ev.title,
                          fromDate: toInputDate(ev.fromDate),
                          toDate: toInputDate(ev.toDate),
                          time: ev.time ?? "",
                          type: ev.type,
                          saving: false,
                        });
                      }}
                    >
                      <div className="flex items-start justify-between gap-1.5 mb-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate flex-1">{ev.title}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!confirm(`Delete "${ev.title}"?`)) return;
                              try {
                                const res = await fetch(`/api/calendar-events/${ev.id}`, { method: "DELETE" });
                                const payload = await res.json();
                                if (payload.success) {
                                  toast.success("Event deleted.");
                                  setMyEvents((prev) => prev.filter((e) => e.id !== ev.id));
                                } else {
                                  toast.error(payload.error || "Failed to delete.");
                                }
                              } catch {
                                toast.error("Something went wrong.");
                              }
                            }}
                            className="w-5 h-5 rounded flex items-center justify-center text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                            title="Delete event"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <TypeBadge type={ev.type} />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {formatDateRange(ev.fromDate, ev.toDate)}
                        {timeLabel && <span className="ml-1.5 text-indigo-500 font-semibold">⏰ {timeLabel}</span>}
                      </p>
                      <div className="mt-1.5 h-0.5 rounded-full" style={{ backgroundColor: `${cfg.border}30` }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Team Activity (Admin only) ── */}
          {isAdmin && (
            <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm flex-shrink-0">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Team Activity</span>
                {teamUpcoming.length > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full px-1.5 py-0.5">
                    {teamUpcoming.length}
                  </span>
                )}
              </div>

              {teamUpcoming.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                  <Users className="w-6 h-6 text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No employee activity</p>
                  <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-0.5">Employee markings appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[340px] overflow-auto">
                  {teamUpcoming.map((ev) => {
                    const cfg = EVENT_TYPE_CONFIG[ev.type];
                    const Icon = cfg.Icon;
                    const sentence = buildActivitySentence(ev);
                    return (
                      <div key={ev.id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        {/* Icon + sentence */}
                        <div className="flex gap-2.5">
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: cfg.bg }}
                          >
                            <Icon className="w-3 h-3" style={{ color: cfg.text }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-snug">
                              {sentence}
                            </p>
                            {/* date range pill */}
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <TypeBadge type={ev.type} />
                              {ev.time && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 rounded-full px-2 py-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {formatTime(ev.time)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Upcoming Holidays ── */}
          <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm flex-shrink-0">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Company Holidays</span>
            </div>
            {upcomingHolidays.length === 0 ? (
              <div className="py-5 px-4 text-center">
                <p className="text-xs text-slate-400 font-medium">No upcoming holidays</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingHolidays.map((h) => (
                  <div key={h.id} className="px-4 py-3">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{h.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{formatDate(h.date)}</p>
                      {h.isRecurring && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-400 uppercase tracking-wide">
                          <Repeat className="w-2.5 h-2.5" /> Annual
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          Add / Edit Popup Modal
      ───────────────────────────────────────────────────────────────────────── */}
      {popup.open && (
        <>
          <div onClick={closePopup} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />

          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[55] w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            style={{ animation: "modalIn 0.18s ease-out" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(124,58,237,0.06))" }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600">
                  {popup.mode === "edit"
                    ? <Pencil className="w-3.5 h-3.5 text-white" />
                    : <Plus className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {popup.mode === "edit" ? "Edit Event" : "New Event"}
                </span>
              </div>
              <button onClick={closePopup} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">

              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Title</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Annual Leave, Sprint Review…"
                  value={popup.title}
                  onChange={(e) => setPopup((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
              </div>

              {/* Date row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">From</label>
                  <input
                    type="date"
                    value={popup.fromDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPopup((p) => ({ ...p, fromDate: val, toDate: p.toDate < val ? val : p.toDate }));
                    }}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 cursor-pointer transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">To</label>
                  <input
                    type="date"
                    value={popup.toDate}
                    min={popup.fromDate}
                    onChange={(e) => setPopup((p) => ({ ...p, toDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 cursor-pointer transition-all"
                  />
                </div>
              </div>

              {/* Type + Time row */}
              <div className={`grid gap-3 ${showTimeInput ? "grid-cols-2" : "grid-cols-1"}`}>
                {/* Type dropdown */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Type</label>
                  <button
                    type="button"
                    onClick={() => setTypeDropOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 hover:border-slate-300 transition-all"
                    style={{ color: EVENT_TYPE_CONFIG[popup.type].text }}
                  >
                    <span className="flex items-center gap-2">
                      {React.createElement(EVENT_TYPE_CONFIG[popup.type].Icon, { className: "w-3.5 h-3.5" })}
                      {popup.type === "EVENT" ? "Event" : EVENT_TYPE_CONFIG[popup.type].label}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${typeDropOpen ? "rotate-180" : ""}`} />
                  </button>

                  {typeDropOpen && (
                    <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                      {(["LEAVE", "EVENT", "OFFICIAL"] as EventType[]).map((t) => {
                        const cfg = EVENT_TYPE_CONFIG[t];
                        const Icon = cfg.Icon;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => { setPopup((p) => ({ ...p, type: t, time: "" })); setTypeDropOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                            style={{ color: cfg.text }}
                          >
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                              <Icon className="w-3.5 h-3.5" />
                            </span>
                            {t === "EVENT" ? "Meeting / Event" : cfg.label}
                            {cfg.hasTime && (
                              <span className="ml-auto text-[9px] text-slate-400 font-normal">+ time</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Time input — only for EVENT / OFFICIAL */}
                {showTimeInput && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Time <span className="normal-case text-slate-300 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      <input
                        type="time"
                        value={popup.time}
                        onChange={(e) => setPopup((p) => ({ ...p, time: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 cursor-pointer transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              {popup.mode === "edit" ? (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              ) : (
                <button
                  onClick={closePopup}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
              )}

              <div className="flex items-center gap-2">
                {popup.mode === "edit" && (
                  <button
                    onClick={closePopup}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={popup.saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  {popup.saving
                    ? <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    : <Save className="w-3.5 h-3.5" />}
                  {popup.mode === "edit" ? "Save Changes" : "Save Event"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── FullCalendar styles ── */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .tailadmin-calendar .fc { font-family: inherit; }
        .tailadmin-calendar .fc-theme-standard td,
        .tailadmin-calendar .fc-theme-standard th {
          border-color: ${timeTheme.cardBorder} !important;
        }
        .dark .tailadmin-calendar .fc-theme-standard td,
        .dark .tailadmin-calendar .fc-theme-standard th {
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        .tailadmin-calendar .fc-col-header-cell {
          background-color: ${timeTheme.inputBackground};
          padding: 10px 0 !important;
          border-top: none !important; border-left: none !important; border-right: none !important;
        }
        .dark .tailadmin-calendar .fc-col-header-cell {
          background-color: rgba(30, 41, 59, 0.5) !important;
        }
        .tailadmin-calendar .fc-col-header-cell-cushion {
          color: ${timeTheme.textColor}99 !important;
          font-weight: 800 !important; font-size: 10px !important;
          text-transform: uppercase !important; letter-spacing: 0.08em !important;
          text-decoration: none !important;
        }
        .dark .tailadmin-calendar .fc-col-header-cell-cushion {
          color: rgba(241, 245, 249, 0.8) !important;
        }
        .tailadmin-calendar .fc-daygrid-day {
          transition: background-color 0.12s ease; cursor: pointer;
        }
        .tailadmin-calendar .fc-daygrid-day:hover {
          background-color: ${timeTheme.accentColor}08 !important;
        }
        .tailadmin-calendar .fc-daygrid-day-top {
          display: flex; justify-content: flex-start !important; padding: 5px 8px;
        }
        .tailadmin-calendar .fc-daygrid-day-number {
          font-size: 12px !important; font-weight: 700 !important;
          color: ${timeTheme.textColor}55 !important; text-decoration: none !important;
        }
        .dark .tailadmin-calendar .fc-daygrid-day-number {
          color: rgba(241, 245, 249, 0.5) !important;
        }
        .tailadmin-calendar .fc-day-today {
          background-color: ${timeTheme.accentColor}0d !important;
        }
        .dark .tailadmin-calendar .fc-day-today {
          background-color: rgba(99, 102, 241, 0.15) !important;
        }
        .tailadmin-calendar .fc-day-today .fc-daygrid-day-number {
          background: ${timeTheme.accentColor}; color: #fff !important;
          width: 22px; height: 22px; border-radius: 50%;
          display: flex !important; align-items: center; justify-content: center;
          font-weight: 900 !important; font-size: 11px !important;
        }
        .tailadmin-calendar .fc-event {
          background: transparent !important; border: none !important; box-shadow: none !important;
          margin-bottom: 3px !important; margin-left: 3px !important; margin-right: 3px !important;
          cursor: pointer !important;
        }
        .tailadmin-calendar .fc-event:hover { filter: brightness(0.93); }
        .tailadmin-calendar .fc-more-link {
          font-size: 10px !important; font-weight: 700 !important;
          color: ${timeTheme.accentColor} !important; padding: 1px 5px !important;
        }
        .tailadmin-calendar .fc-popover {
          border-radius: 12px !important; border: 1px solid ${timeTheme.cardBorder} !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important; overflow: hidden !important;
        }
        .dark .tailadmin-calendar .fc-popover {
          border-color: rgba(255, 255, 255, 0.08) !important;
          background: #0f172a !important;
        }
        .tailadmin-calendar .fc-popover-header {
          background: ${timeTheme.inputBackground} !important;
          font-size: 11px !important; font-weight: 800 !important; padding: 8px 12px !important;
        }
        .dark .tailadmin-calendar .fc-popover-header {
          background: #1e293b !important;
          color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
}