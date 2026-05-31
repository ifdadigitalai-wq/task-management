"use client";

import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventContentArg } from "@fullcalendar/core";
import { useTimeTheme } from "@/hooks/useTimeTheme";
import { X as XIcon, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

// --- Types & Data ---
type EventColor = { bg: string; text: string; border: string; label: string };

const EVENT_COLORS: EventColor[] = [
  { label: "Primary (Blue)", bg: "#eff6ff", text: "#3b82f6", border: "#3b82f6" },
  { label: "Danger (Red)", bg: "#fef2f2", text: "#ef4444", border: "#ef4444" },
  { label: "Success (Green)", bg: "#f0fdf4", text: "#22c55e", border: "#22c55e" },
  { label: "Warning (Orange)", bg: "#fff7ed", text: "#f97316", border: "#f97316" },
  { label: "Purple", bg: "#faf5ff", text: "#a855f7", border: "#a855f7" },
];

interface AppEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  extendedProps: { color: EventColor; description: string };
}

// Generate some dynamic dates for the demo
const today = new Date();
const ymd = (offsetDays: number = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
};

const INITIAL_EVENTS: AppEvent[] = [
  { id: "1", title: "Redesign Website Homepage", start: ymd(-3), end: ymd(0), allDay: true, extendedProps: { color: EVENT_COLORS[0], description: "Update UI/UX" } },
  { id: "2", title: "App Release V2.0.1", start: `${ymd(4)}T10:00:00`, end: `${ymd(4)}T12:00:00`, allDay: false, extendedProps: { color: EVENT_COLORS[3], description: "Deploy to stores" } },
  { id: "3", title: "Client Meeting with Marketing Team", start: `${ymd(12)}T14:30:00`, end: `${ymd(12)}T15:30:00`, allDay: false, extendedProps: { color: EVENT_COLORS[2], description: "Discuss Q3 goals" } },
];

// --- TailAdmin Specific Event Renderer ---
function renderEventContent(eventInfo: EventContentArg) {
  const props = eventInfo.event.extendedProps;
  const color = props.color || EVENT_COLORS[0];
  const timeText = eventInfo.timeText;

  return (
    <div
      style={{
        backgroundColor: color.bg,
        color: color.text,
        borderLeft: `3px solid ${color.border}`,
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: 600,
        width: "100%",
        /* Fixed text disappearing by allowing text wrapping */
        whiteSpace: "normal", 
        wordBreak: "break-word",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
      }}
      title={eventInfo.event.title}
    >
      {timeText && <span style={{ fontSize: "10px", fontWeight: 700, opacity: 0.8 }}>{timeText}</span>}
      <span style={{ lineHeight: 1.4 }}>{eventInfo.event.title}</span>
    </div>
  );
}

// --- Shared Inputs ---
function FieldLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: color, marginBottom: 8 }}>{children}</label>;
}

const inputBase: React.CSSProperties = {
  width: "100%", height: 42, borderRadius: 6, border: "1px solid #e5e7eb", padding: "0 14px",
  fontSize: 14, fontWeight: 400, color: "#1c2434", outline: "none", boxSizing: "border-box",
  backgroundColor: "#ffffff", fontFamily: "inherit", transition: "all 0.2s ease"
};

// --- Main Component ---
export default function TailAdminCalendarPage() {
  const timeTheme = useTimeTheme();
  const calendarRef = useRef<FullCalendar>(null);
  
  const [events, setEvents] = useState<AppEvent[]>(INITIAL_EVENTS);
  const [currentDateTitle, setCurrentDateTitle] = useState("");
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ 
    title: "", description: "", startDate: "", endDate: "", 
    startTime: "10:00", endTime: "12:00", isAllDay: false, colorIndex: 0 
  });

  // View/Delete Modal State
  const [viewEvent, setViewEvent] = useState<AppEvent | null>(null);

  useEffect(() => {
    if (calendarRef.current) setCurrentDateTitle(calendarRef.current.getApi().view.title);
  }, []);

  const handlePrev = () => { const api = calendarRef.current?.getApi(); if (api) { api.prev(); setCurrentDateTitle(api.view.title); } };
  const handleNext = () => { const api = calendarRef.current?.getApi(); if (api) { api.next(); setCurrentDateTitle(api.view.title); } };
  const handleToday = () => { const api = calendarRef.current?.getApi(); if (api) { api.today(); setCurrentDateTitle(api.view.title); } };

  // Triggered when dragging across empty days or clicking an empty day
  const handleDateSelect = (selectInfo: any) => {
    const startStr = selectInfo.startStr;
    const endStr = new Date(new Date(selectInfo.endStr).getTime() - 1).toISOString().split("T")[0];

    setModalData({ 
      title: "", description: "", 
      startDate: startStr, endDate: endStr, 
      startTime: "10:00", endTime: "12:00", 
      isAllDay: false, colorIndex: 0 
    });
    setIsModalOpen(true);
    selectInfo.view.calendar.unselect();
  };

  // Triggered when clicking an EXISTING event
  const handleEventClick = (clickInfo: any) => {
    const clickedEventId = clickInfo.event.id;
    const existingEvent = events.find(e => e.id === clickedEventId);
    if (existingEvent) {
      setViewEvent(existingEvent);
    }
  };

  // Delete an event
  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
    setViewEvent(null);
  };

  // Triggered from the "Add Event +" Button
  const handleAddEventClick = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    setModalData({ 
      title: "", description: "", 
      startDate: todayStr, endDate: todayStr, 
      startTime: "10:00", endTime: "12:00", 
      isAllDay: false, colorIndex: 0 
    });
    setIsModalOpen(true);
  };

  const handleSaveEvent = () => {
    if (!modalData.title.trim()) return;

    const startDateTime = modalData.isAllDay ? modalData.startDate : `${modalData.startDate}T${modalData.startTime}:00`;
    const endDateTime = modalData.isAllDay ? modalData.endDate : `${modalData.endDate}T${modalData.endTime}:00`;

    const newEvent: AppEvent = {
      id: Date.now().toString(),
      title: modalData.title,
      start: startDateTime,
      end: endDateTime,
      allDay: modalData.isAllDay,
      extendedProps: { color: EVENT_COLORS[modalData.colorIndex], description: modalData.description }
    };

    setEvents([...events, newEvent]);
    setIsModalOpen(false);
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", padding: "28px", backgroundColor: timeTheme.background, display: "flex", flexDirection: "column", boxSizing: "border-box", fontFamily: "inherit" }}>
      
      {/* Top Page Header like TailAdmin */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: timeTheme.textColor }}>Calendar</h2>
        <div style={{ fontSize: 14, fontWeight: 500, color: timeTheme.subTextColor }}>
          Dashboard / <span style={{ color: timeTheme.accentColor }}>Calendar</span>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div 
        style={{ 
          flex: 1, display: "flex", flexDirection: "column", 
          backgroundColor: timeTheme.cardBackground, 
          borderRadius: 4, 
          border: `1px solid ${timeTheme.cardBorder}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        
        {/* Custom Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: `1px solid ${timeTheme.dividerColor}` }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: timeTheme.textColor }}>
              {currentDateTitle}
            </h3>
            
            {/* The New Add Event Button */}
            <button 
              onClick={handleAddEventClick}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                backgroundColor: timeTheme.accentColor, color: "#ffffff",
                border: "none", borderRadius: 4, padding: "0 12px", height: 32,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                transition: "opacity 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              <Plus size={16} /> Add Event
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={handleToday} style={{ height: 36, padding: "0 16px", borderRadius: 4, border: `1px solid ${timeTheme.inputBorder}`, backgroundColor: timeTheme.inputBackground, color: timeTheme.textColor, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              Today
            </button>
            <div style={{ display: "flex", backgroundColor: timeTheme.inputBackground, border: `1px solid ${timeTheme.inputBorder}`, borderRadius: 4, overflow: "hidden" }}>
              <button onClick={handlePrev} style={{ height: 36, width: 40, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRight: `1px solid ${timeTheme.inputBorder}`, backgroundColor: "transparent", color: timeTheme.textColor, cursor: "pointer" }}>
                <ChevronLeft size={18} />
              </button>
              <button onClick={handleNext} style={{ height: 36, width: 40, display: "flex", alignItems: "center", justifyContent: "center", border: "none", backgroundColor: "transparent", color: timeTheme.textColor, cursor: "pointer" }}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* FullCalendar Wrapper */}
        <div className="tailadmin-calendar" style={{ flex: 1, padding: 0 }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            select={handleDateSelect}
            eventClick={handleEventClick} // Handles clicking on existing events
            events={events}
            eventContent={renderEventContent}
            eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }} 
            height="100%"
            contentHeight="auto"
          />
        </div>
      </div>

      {/* --- View / Delete Event Modal --- */}
      {viewEvent && (
        <>
          <div onClick={() => setViewEvent(null)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 60 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 70, backgroundColor: "#ffffff", borderRadius: 6, width: 400, maxWidth: "calc(100vw - 32px)", padding: "24px 32px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: "#1c2434" }}>Event Details</span>
              <button onClick={() => setViewEvent(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <XIcon style={{ height: 20, width: 20 }} />
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>Title</div>
                <div style={{ fontSize: 15, color: "#1c2434", fontWeight: 600 }}>{viewEvent.title}</div>
              </div>
              
              <div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>Time / Date</div>
                <div style={{ fontSize: 14, color: "#1c2434", fontWeight: 500 }}>
                  {viewEvent.allDay 
                    ? new Date(viewEvent.start).toLocaleDateString()
                    : `${new Date(viewEvent.start).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`
                  }
                  {viewEvent.end && !viewEvent.allDay && ` - ${new Date(viewEvent.end).toLocaleTimeString([], { timeStyle: 'short' })}`}
                </div>
              </div>

              {viewEvent.extendedProps?.description && (
                <div>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>Description</div>
                  <div style={{ fontSize: 14, color: "#1c2434" }}>{viewEvent.extendedProps.description}</div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
              <button 
                onClick={() => handleDeleteEvent(viewEvent.id)} 
                style={{ display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 16px", borderRadius: 4, border: "none", backgroundColor: "#fee2e2", fontSize: 13, fontWeight: 600, color: "#ef4444", cursor: "pointer" }}
              >
                <Trash2 size={16} /> Delete Event
              </button>
              <button onClick={() => setViewEvent(null)} style={{ height: 38, padding: "0 20px", borderRadius: 4, border: "1px solid #e5e7eb", backgroundColor: "#ffffff", fontSize: 13, fontWeight: 500, color: "#1c2434", cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* --- Add Event Modal --- */}
      {isModalOpen && (
        <>
          <div onClick={() => setIsModalOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 60 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 70, backgroundColor: "#ffffff", borderRadius: 4, width: 500, maxWidth: "calc(100vw - 32px)", padding: "24px 32px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <span style={{ fontSize: 20, fontWeight: 600, color: "#1c2434" }}>Add Event</span>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <XIcon style={{ height: 20, width: 20 }} />
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <FieldLabel color="#1c2434">Event Title</FieldLabel>
                <input type="text" value={modalData.title} onChange={(e) => setModalData({...modalData, title: e.target.value})} style={inputBase} placeholder="Enter title" autoFocus />
              </div>

              {/* All Day Toggle */}
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#1c2434" }}>
                <input 
                  type="checkbox" 
                  checked={modalData.isAllDay} 
                  onChange={(e) => setModalData({...modalData, isAllDay: e.target.checked})} 
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                All Day Event
              </label>
              
              {/* Dates & Times */}
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <FieldLabel color="#1c2434">Start Date</FieldLabel>
                  <input type="date" value={modalData.startDate} onChange={(e) => setModalData({...modalData, startDate: e.target.value})} style={inputBase} />
                </div>
                {!modalData.isAllDay && (
                  <div style={{ flex: 1 }}>
                    <FieldLabel color="#1c2434">Start Time</FieldLabel>
                    <input type="time" value={modalData.startTime} onChange={(e) => setModalData({...modalData, startTime: e.target.value})} style={inputBase} />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <FieldLabel color="#1c2434">End Date</FieldLabel>
                  <input type="date" value={modalData.endDate} onChange={(e) => setModalData({...modalData, endDate: e.target.value})} style={inputBase} />
                </div>
                {!modalData.isAllDay && (
                  <div style={{ flex: 1 }}>
                    <FieldLabel color="#1c2434">End Time</FieldLabel>
                    <input type="time" value={modalData.endTime} onChange={(e) => setModalData({...modalData, endTime: e.target.value})} style={inputBase} />
                  </div>
                )}
              </div>

              <div>
                <FieldLabel color="#1c2434">Event Category Color</FieldLabel>
                <div style={{ display: "flex", gap: 12 }}>
                  {EVENT_COLORS.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => setModalData({...modalData, colorIndex: idx})}
                      style={{
                        width: 32, height: 32, borderRadius: "50%",
                        backgroundColor: color.border,
                        border: modalData.colorIndex === idx ? `3px solid #1c2434` : `2px solid transparent`,
                        cursor: "pointer", padding: 0, outline: "none", transition: "all 0.2s"
                      }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32 }}>
              <button onClick={() => setIsModalOpen(false)} style={{ height: 42, padding: "0 24px", borderRadius: 4, border: "1px solid #e5e7eb", backgroundColor: "#ffffff", fontSize: 14, fontWeight: 500, color: "#1c2434", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSaveEvent} style={{ height: 42, padding: "0 24px", borderRadius: 4, border: "none", backgroundColor: "#3c50e0", fontSize: 14, fontWeight: 500, color: "#ffffff", cursor: "pointer" }}>Save Event</button>
            </div>
          </div>
        </>
      )}

      {/* Deep CSS Override to Match TailAdmin Grid & Spacing */}
      <style>{`
        .tailadmin-calendar .fc {
          font-family: inherit;
        }
        
        .tailadmin-calendar .fc-theme-standard td, 
        .tailadmin-calendar .fc-theme-standard th {
          border-color: ${timeTheme.dividerColor} !important;
        }

        .tailadmin-calendar .fc-col-header-cell {
          background-color: ${timeTheme.inputBackground};
          padding: 16px 0 !important;
        }
        .tailadmin-calendar .fc-col-header-cell-cushion {
          color: ${timeTheme.textColor} !important;
          font-weight: 600 !important;
          font-size: 15px !important;
          text-decoration: none !important;
        }

        .tailadmin-calendar .fc-daygrid-day {
          transition: background-color 0.2s ease;
        }
        .tailadmin-calendar .fc-daygrid-day:hover {
          background-color: ${timeTheme.inputBackground};
          cursor: pointer;
        }

        .tailadmin-calendar .fc-daygrid-day-top {
          display: flex;
          justify-content: flex-start !important;
          padding: 8px 12px;
        }
        
        .tailadmin-calendar .fc-daygrid-day-number {
          font-size: 16px !important;
          font-weight: 600 !important;
          color: ${timeTheme.textColor} !important;
          text-decoration: none !important;
          padding: 0 !important;
        }

        .tailadmin-calendar .fc-day-today {
          background-color: transparent !important;
        }
        .tailadmin-calendar .fc-day-today .fc-daygrid-day-number {
          background-color: ${timeTheme.accentColor};
          color: #ffffff !important;
          border-radius: 4px;
          padding: 2px 8px !important;
        }

        .tailadmin-calendar .fc-event {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          margin-bottom: 6px !important;
          margin-left: 8px !important;
          margin-right: 8px !important;
          cursor: pointer !important;
        }
        .tailadmin-calendar .fc-event:hover {
          filter: brightness(0.95);
        }

        .tailadmin-calendar .fc-daygrid-more-link {
          color: ${timeTheme.accentColor} !important;
          font-size: 12px;
          font-weight: 600;
          margin-left: 8px;
        }
      `}</style>
    </div>
  );
}