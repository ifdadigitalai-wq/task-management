"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";

interface DateRangePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  showTime?: boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Select date & time",
  showTime = true,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(value ? new Date(value) : new Date());
  const [selectedTime, setSelectedTime] = useState<string>(
    value 
      ? `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`
      : "12:00"
  );
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setViewDate(new Date(value));
      setSelectedTime(
        `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`
      );
    }
  }, [value]);

  // Click outside close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleMonthChange = (direction: "prev" | "next") => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + (direction === "prev" ? -1 : 1));
    setViewDate(newDate);
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate);
    newDate.setDate(day);
    
    if (showTime) {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
    }
    
    onChange(newDate);
    setIsOpen(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeVal = e.target.value;
    setSelectedTime(timeVal);
    
    if (value) {
      const newDate = new Date(value);
      const [hours, minutes] = timeVal.split(":").map(Number);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      onChange(newDate);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setIsOpen(false);
  };

  // Generate calendar grid
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  
  const daysArray: (number | null)[] = [
    ...Array(firstDayIndex).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1)
  ];

  const formatDate = (date: Date) => {
    const dateStr = `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
    if (showTime) {
      const hours = String(date.getHours()).padStart(2, "0");
      const mins = String(date.getMinutes()).padStart(2, "0");
      return `${dateStr} at ${hours}:${mins}`;
    }
    return dateStr;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (day: number) => {
    return value && value.getDate() === day && value.getMonth() === month && value.getFullYear() === year;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Input Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span>{value ? formatDate(value) : placeholder}</span>
        </div>
        {value ? (
          <button type="button" onClick={handleClear} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 rotate-90" />
        )}
      </div>

      {/* Dropdown Calendar Panel */}
      {isOpen && (
        <div className="relative mt-2 z-10 p-4 w-full max-w-[280px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm animate-fade-in">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => handleMonthChange("prev")}
              className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => handleMonthChange("next")}
              className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysArray.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} />;
              }
              const selected = isSelected(day);
              const today = isToday(day);
              return (
                <button
                  type="button"
                  key={`day-${day}`}
                  onClick={() => handleDateSelect(day)}
                  className={`h-8 w-8 rounded-lg text-xs font-medium transition-all duration-150 ${
                    selected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : today
                      ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time Picker */}
          {showTime && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                Time
              </span>
              <input
                type="time"
                value={selectedTime}
                onChange={handleTimeChange}
                className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
