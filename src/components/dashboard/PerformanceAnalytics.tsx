"use client";

import { useEffect, useState, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type HML = { H: number; M: number; L: number };
type FilterMode = "employee" | "department" | "priority";
type ViewMode = "table" | "chart";

interface EmployeeStat {
  id: string;
  name: string;
  dept: string;
  total: number;
  due: HML;
  completed: HML;
  maxScore: number;
  score: number;
}
interface DeptStat {
  name: string;
  total: number;
  due: HML;
  completed: HML;
  maxScore: number;
  score: number;
}
interface PriorityStat {
  total: number;
  due: number;
  completed: number;
}
interface StatsData {
  employees: EmployeeStat[];
  departments: DeptStat[];
  priorities: Record<"HIGH" | "MEDIUM" | "LOW", PriorityStat>;
}

// ── SVG Icons ────────────────────────────────────────────────────────────────

const Icon = {
  User: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Building: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h1v1H9zM14 9h1v1h-1zM9 14h1v1H9zM14 14h1v1h-1z"/>
    </svg>
  ),
  Flag: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  Table: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
    </svg>
  ),
  BarChart: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Refresh: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Tasks: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  Trend: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function scorePct(score: number, max: number) {
  return max === 0 ? 0 : Math.round((score / max) * 100);
}

// ── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score, max }: { score: number; max: number }) {
  const p = scorePct(score, max);
  const isHigh = p >= 75;
  const isMed = p >= 40;
  
  const textClass = isHigh ? "text-emerald-600 dark:text-emerald-400" : isMed ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";
  const bgClass = isHigh ? "bg-emerald-500" : isMed ? "bg-amber-500" : "bg-rose-500";
  const trackClass = isHigh ? "bg-emerald-100 dark:bg-emerald-950/30" : isMed ? "bg-amber-100 dark:bg-amber-950/30" : "bg-rose-100 dark:bg-rose-950/30";

  return (
    <div className="flex flex-col gap-0.5 w-full">
      <div className="flex justify-between items-center text-[10px] font-semibold">
        <span className={textClass}>{p}%</span>
        <span className="text-slate-400 dark:text-slate-500">{score}/{max}pts</span>
      </div>
      <div className={`h-1 w-full rounded-full overflow-hidden ${trackClass}`}>
        <div 
          className={`h-full rounded-full transition-all duration-500 ${bgClass}`} 
          style={{ width: `${p}%` }} 
        />
      </div>
    </div>
  );
}

// ── HML chips ────────────────────────────────────────────────────────────────

function HMLChips({ obj, variant }: { obj: HML; variant: "due" | "done" }) {
  const chipsConfig = variant === "due"
    ? {
        H: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/35",
        M: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-450 border border-amber-100 dark:border-amber-900/35",
        L: "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-750"
      }
    : {
        H: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/35",
        M: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-450 border border-blue-100 dark:border-blue-900/35",
        L: "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-750"
      };

  return (
    <div className="flex gap-1 justify-center">
      {(["H", "M", "L"] as const).map((k) => (
        <span 
          key={k} 
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${chipsConfig[k]}`}
        >
          {obj[k]}
        </span>
      ))}
    </div>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

function Avatar({ name, idx }: { name: string; idx: number }) {
  const bg = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  return (
    <div 
      className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
      style={{
        background: bg + "22",
        border: `1px solid ${bg}44`,
        color: bg,
      }}
    >
      {initials(name)}
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KPI({ label, value, icon, accent }: { label: string; value: string | number; icon: React.ReactNode; accent: string }) {
  return (
    <div className="flex-1 min-w-[110px] bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850/80 rounded-lg p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.015)]">
      <div className="flex items-center justify-between gap-1.5 mb-0.5">
        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</span>
        <span style={{ color: accent }} className="opacity-80">{icon}</span>
      </div>
      <p style={{ color: accent }} className="text-lg font-extrabold tracking-tight mt-0.5 leading-none">{value}</p>
    </div>
  );
}

// ── Toggle Button Group ───────────────────────────────────────────────────────

function ToggleGroup<T extends string>({
  options, value, onChange,
}: { options: { key: T; label: string; icon: React.ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex bg-slate-100 dark:bg-slate-950 rounded-lg p-0.5 gap-0.5 border border-slate-200/30 dark:border-slate-800/40">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button 
            key={o.key} 
            onClick={() => onChange(o.key)} 
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border-none cursor-pointer outline-none min-h-0 min-w-0 ${
              active 
                ? "bg-white dark:bg-slate-850 text-slate-900 dark:text-white shadow-xs" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 bg-transparent"
            }`}
          >
            {o.icon}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Inline Bar Chart ─────────────────────────────────────────────────────────

function BarChartInline({ rows }: { rows: { label: string; value: number; max: number; color: string; sub?: string }[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row, i) => {
        const p = row.max === 0 ? 0 : Math.round((row.value / row.max) * 100);
        return (
          <div key={i} className="space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-medium text-slate-650 dark:text-slate-350 truncate pr-3">{row.label}</span>
              <span style={{ color: row.color }} className="font-bold shrink-0">{row.sub ?? `${p}%`}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-700" 
                style={{ width: `${p}%`, backgroundColor: row.color }} 
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Chart View ───────────────────────────────────────────────────────────────

function ChartPanel({ data, filter }: { data: StatsData; filter: FilterMode }) {
  const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4"];

  if (filter === "employee") {
    const emps = data.employees;
    const maxScore = Math.max(...emps.map((e) => e.score), 1);
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850/80 rounded-lg p-3.5 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Score by employee</p>
          <BarChartInline rows={emps.map((e, i) => ({
            label: e.name, value: e.score, max: maxScore,
            color: COLORS[i % COLORS.length], sub: `${e.score}pts`,
          }))} />
        </div>
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850/80 rounded-lg p-3.5 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Performance index %</p>
          <BarChartInline rows={emps.map((e) => {
            const p = scorePct(e.score, e.maxScore);
            return { label: e.name, value: p, max: 100, color: p >= 75 ? "#10b981" : p >= 40 ? "#f59e0b" : "#ef4444" };
          })} />
        </div>
      </div>
    );
  }

  if (filter === "department") {
    const depts = data.departments;
    const maxScore = Math.max(...depts.map((d) => d.score), 1);
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850/80 rounded-lg p-3.5 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Score by department</p>
          <BarChartInline rows={depts.map((d, i) => ({
            label: d.name, value: d.score, max: maxScore,
            color: COLORS[i % COLORS.length], sub: `${d.score}pts`,
          }))} />
        </div>
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850/80 rounded-lg p-3.5 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Completion % by dept</p>
          <BarChartInline rows={depts.map((d) => {
            const p = scorePct(d.score, d.maxScore);
            return { label: d.name, value: p, max: 100, color: p >= 75 ? "#10b981" : p >= 40 ? "#f59e0b" : "#ef4444" };
          })} />
        </div>
      </div>
    );
  }

  const pri = data.priorities;
  const rows = [
    { label: "High priority",   key: "HIGH"   as const, color: "#ef4444" },
    { label: "Medium priority", key: "MEDIUM" as const, color: "#f59e0b" },
    { label: "Low priority",    key: "LOW"    as const, color: "#10b981" },
  ];
  const maxTotal = Math.max(...rows.map((r) => pri[r.key].total), 1);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850/80 rounded-lg p-3.5 shadow-xs">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Total tasks by priority</p>
        <BarChartInline rows={rows.map((r) => ({
          label: r.label, value: pri[r.key].total, max: maxTotal,
          color: r.color, sub: `${pri[r.key].total} tasks`,
        }))} />
      </div>
      <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850/80 rounded-lg p-3.5 shadow-xs">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Completion rate by priority</p>
        <BarChartInline rows={rows.map((r) => {
          const p = pri[r.key].total === 0 ? 0 : Math.round((pri[r.key].completed / pri[r.key].total) * 100);
          return { label: r.label, value: p, max: 100, color: r.color };
        })} />
      </div>
    </div>
  );
}

// ── Table: Employee ──────────────────────────────────────────────────────────

function EmployeeTable({ employees }: { employees: EmployeeStat[] }) {
  if (!employees.length) return <EmptyState />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[680px]">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-850/80">
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-left w-12">#</th>
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-left">Employee</th>
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-left">Department</th>
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-center w-20">Total</th>
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-center w-36">Due (H·M·L)</th>
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-center w-36">Done (H·M·L)</th>
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-center w-20">Max</th>
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-left min-w-[140px]">Score</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, i) => (
            <tr key={emp.id} className="border-b border-slate-50 dark:border-slate-850/40 hover:bg-slate-50/40 dark:hover:bg-slate-850/20 odd:bg-slate-50/10 dark:odd:bg-slate-900/5">
              <td className="px-3 py-2 text-xs font-mono text-slate-450 dark:text-slate-550">{i + 1}</td>
              <td className="px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <Avatar name={emp.name} idx={i} />
                  <span className="truncate max-w-[140px] font-semibold">{emp.name}</span>
                </div>
              </td>
              <td className="px-3 py-2 text-xs">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-900/25">
                  {emp.dept || "Team"}
                </span>
              </td>
              <td className="px-3 py-2 text-xs text-center font-bold text-slate-800 dark:text-slate-200">{emp.total}</td>
              <td className="px-3 py-2 text-xs text-center"><HMLChips obj={emp.due} variant="due" /></td>
              <td className="px-3 py-2 text-xs text-center"><HMLChips obj={emp.completed} variant="done" /></td>
              <td className="px-3 py-2 text-xs text-center font-semibold text-slate-500 dark:text-slate-450">{emp.maxScore}</td>
              <td className="px-3 py-2 text-xs"><ScoreBar score={emp.score} max={emp.maxScore} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Table: Department ─────────────────────────────────────────────────────────

function DeptTable({ departments }: { departments: DeptStat[] }) {
  if (!departments.length) return <EmptyState />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[620px]">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-850/80">
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-left w-12">#</th>
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-left">Department</th>
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-center w-20">Total</th>
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-center w-36">Due (H·M·L)</th>
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-center w-36">Done (H·M·L)</th>
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-center w-20">Max</th>
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-left min-w-[140px]">Score</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((dept, i) => (
            <tr key={dept.name} className="border-b border-slate-50 dark:border-slate-850/40 hover:bg-slate-50/40 dark:hover:bg-slate-850/20 odd:bg-slate-50/10 dark:odd:bg-slate-900/5">
              <td className="px-3 py-2 text-xs font-mono text-slate-450 dark:text-slate-550">{i + 1}</td>
              <td className="px-3 py-2 text-xs font-semibold text-slate-850 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150/40 dark:border-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    <Icon.Building />
                  </div>
                  <span className="truncate">{dept.name}</span>
                </div>
              </td>
              <td className="px-3 py-2 text-xs text-center font-bold text-slate-800 dark:text-slate-200">{dept.total}</td>
              <td className="px-3 py-2 text-xs text-center"><HMLChips obj={dept.due} variant="due" /></td>
              <td className="px-3 py-2 text-xs text-center"><HMLChips obj={dept.completed} variant="done" /></td>
              <td className="px-3 py-2 text-xs text-center font-semibold text-slate-500 dark:text-slate-450">{dept.maxScore}</td>
              <td className="px-3 py-2 text-xs"><ScoreBar score={dept.score} max={dept.maxScore} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Table: Priority ───────────────────────────────────────────────────────────

function PriorityTable({ priorities }: { priorities: Record<"HIGH" | "MEDIUM" | "LOW", PriorityStat> }) {
  const rows = [
    { key: "HIGH"   as const, label: "High",   dot: "bg-rose-500", bg: "bg-rose-50 dark:bg-rose-950/20", fg: "text-rose-600 dark:text-rose-400 border border-rose-100/40 dark:border-rose-900/20" },
    { key: "MEDIUM" as const, label: "Medium", dot: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20", fg: "text-amber-600 dark:text-amber-400 border border-amber-100/40 dark:border-amber-900/20" },
    { key: "LOW"    as const, label: "Low",    dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", fg: "text-emerald-600 dark:text-emerald-400 border border-emerald-100/40 dark:border-emerald-900/20" },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-850/80">
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-left">Priority</th>
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-center w-24">Total</th>
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-center w-28">Overdue</th>
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-center w-28">Completed</th>
            <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-left min-w-[180px]">Completion rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, label, dot, bg, fg }, i) => {
            const s = priorities[key];
            return (
              <tr key={key} className="border-b border-slate-50 dark:border-slate-850/40 hover:bg-slate-50/40 dark:hover:bg-slate-850/20 odd:bg-slate-50/10 dark:odd:bg-slate-900/5">
                <td className="px-3 py-2 text-xs">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${bg} ${fg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                    {label}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-center font-bold text-slate-800 dark:text-slate-200">{s.total}</td>
                <td className="px-3 py-2 text-xs text-center">
                  {s.due > 0 ? (
                    <span className="inline-block px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/35 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-100/50 dark:border-rose-900/25">
                      {s.due}
                    </span>
                  ) : (
                    <span className="text-slate-300 dark:text-slate-700">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-center font-semibold text-emerald-600 dark:text-emerald-450">{s.completed}</td>
                <td className="px-3 py-2 text-xs">
                  <div className="min-w-[150px]">
                    <ScoreBar score={s.completed} max={s.total} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="py-10 text-center flex flex-col items-center justify-center gap-1.5 text-slate-400 dark:text-slate-650">
      <Icon.BarChart />
      <p className="text-xs font-semibold">No analytics data recorded yet.</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PerformanceAnalytics() {
  const [data, setData]       = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<FilterMode>("employee");
  const [view, setView]       = useState<ViewMode>("table");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(() => {
    setLoading(true);
    fetch("/api/tasks/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: StatsData) => { 
        setData(d); 
        setLastUpdated(new Date()); 
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Poll statistics every 15s to keep the dashboard real-time and synced
  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 15000);
    return () => clearInterval(id);
  }, [fetchStats]);

  const totals = data
    ? Object.values(data.priorities).reduce((acc, p) => ({
        total: acc.total + p.total,
        completed: acc.completed + p.completed,
        due: acc.due + p.due,
      }), { total: 0, completed: 0, due: 0 })
    : { total: 0, completed: 0, due: 0 };

  const rate = totals.total === 0 ? "—" : `${Math.round((totals.completed / totals.total) * 100)}%`;

  return (
    <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-xl p-4 mt-6">

      {/* Header row */}
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-slate-850 dark:text-slate-100 mb-0.5 leading-tight">Performance Analytics</h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-none">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Syncing details…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-xs font-semibold cursor-pointer select-none transition-colors min-h-0 min-w-0"
          >
            <Icon.Refresh />
            <span>Refresh</span>
          </button>
          <ToggleGroup
            value={view}
            onChange={setView}
            options={[
              { key: "table" as ViewMode, label: "Table", icon: <Icon.Table /> },
              { key: "chart" as ViewMode, label: "Chart", icon: <Icon.BarChart /> },
            ]}
          />
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
        <KPI label="Total Tasks"  value={totals.total}     icon={<Icon.Tasks />}       accent="#64748b" />
        <KPI label="Completed"    value={totals.completed} icon={<Icon.CheckCircle />} accent="#10b981" />
        <KPI label="Overdue"      value={totals.due}       icon={<Icon.AlertCircle />} accent={totals.due > 0 ? "#ef4444" : "#94a3b8"} />
        <KPI label="Completion %" value={rate}             icon={<Icon.Trend />}       accent="#6366f1" />
      </div>

      {/* Filter toggle */}
      <div className="mb-3">
        <ToggleGroup
          value={filter}
          onChange={setFilter}
          options={[
            { key: "employee"   as FilterMode, label: "Employee",   icon: <Icon.User /> },
            { key: "department" as FilterMode, label: "Department", icon: <Icon.Building /> },
            { key: "priority"   as FilterMode, label: "Priority",   icon: <Icon.Flag /> },
          ]}
        />
      </div>

      {/* Legend */}
      {filter !== "priority" && (
        <div className="flex gap-4 mb-2.5 text-[10px] text-slate-400 dark:text-slate-550 select-none">
          <span>H = High &nbsp;·&nbsp; M = Medium &nbsp;·&nbsp; L = Low</span>
          <span>Scoring: High = 3 pts &nbsp;·&nbsp; Medium = 2 pts &nbsp;·&nbsp; Low = 1 pt</span>
        </div>
      )}

      {/* Content card */}
      <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850/80 rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
        {loading && !data ? (
          <div className="py-12 text-center text-[11px] text-slate-400 dark:text-slate-650 flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-slate-100 border-t-indigo-500 rounded-full animate-spin" />
            <span>Loading stats…</span>
          </div>
        ) : !data ? (
          <EmptyState />
        ) : view === "chart" ? (
          <div className="p-3.5 bg-slate-50/20 dark:bg-slate-900/10">
            <ChartPanel data={data} filter={filter} />
          </div>
        ) : filter === "employee" ? (
          <EmployeeTable employees={data.employees} />
        ) : filter === "department" ? (
          <DeptTable departments={data.departments} />
        ) : (
          <PriorityTable priorities={data.priorities} />
        )}
      </div>

      <p className="text-[10px] text-slate-350 dark:text-slate-600 mt-2 text-right select-none font-medium">
        Score % = earned pts ÷ max pts × 100 &nbsp;·&nbsp; Auto-refreshes every 15s
      </p>
    </div>
  );
}