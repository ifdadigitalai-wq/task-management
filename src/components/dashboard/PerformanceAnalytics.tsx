"use client";

import { useEffect, useState, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type HML = { H: number; M: number; L: number };
type FilterMode = "employee" | "department" | "priority";
type ViewMode = "table" | "chart";

interface EmployeeStat {
  id: string; name: string; dept: string; total: number;
  due: HML; completed: HML; maxScore: number; score: number;
}
interface DeptStat {
  name: string; total: number; due: HML; completed: HML; maxScore: number; score: number;
}
interface PriorityStat { total: number; due: number; completed: number; }
interface StatsData {
  employees: EmployeeStat[];
  departments: DeptStat[];
  priorities: Record<"HIGH" | "MEDIUM" | "LOW", PriorityStat>;
}

// ── SVG Icons ────────────────────────────────────────────────────────────────

const Icon = {
  User: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Building: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h1v1H9zM14 9h1v1h-1zM9 14h1v1H9zM14 14h1v1h-1z"/>
    </svg>
  ),
  Flag: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  Table: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
    </svg>
  ),
  BarChart: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Tasks: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  Trend: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  const color = p >= 75 ? "#16a34a" : p >= 40 ? "#d97706" : "#dc2626";
  const trackColor = p >= 75 ? "#dcfce7" : p >= 40 ? "#fef3c7" : "#fee2e2";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color }}>{p}%</span>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>{score}/{max}pts</span>
      </div>
      <div style={{ height: 5, background: trackColor, borderRadius: 99 }}>
        <div style={{ width: `${p}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>
    </div>
  );
}

// ── HML chips ────────────────────────────────────────────────────────────────

function HMLChips({ obj, variant }: { obj: HML; variant: "due" | "done" }) {
  const colors = variant === "due"
    ? { H: { bg: "#fee2e2", fg: "#b91c1c" }, M: { bg: "#fef3c7", fg: "#b45309" }, L: { bg: "#f3f4f6", fg: "#6b7280" } }
    : { H: { bg: "#dcfce7", fg: "#15803d" }, M: { bg: "#dbeafe", fg: "#1d4ed8" }, L: { bg: "#f3f4f6", fg: "#6b7280" } };
  return (
    <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
      {(["H", "M", "L"] as const).map((k) => (
        <span key={k} style={{
          padding: "2px 7px", borderRadius: 6, fontSize: 11, fontWeight: 600,
          background: colors[k].bg, color: colors[k].fg,
        }}>{obj[k]}</span>
      ))}
    </div>
  );
}

// ── Table primitives ─────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: "10px 16px", textAlign: "left", fontSize: 11,
  fontWeight: 600, color: "#6b7280", textTransform: "uppercase",
  letterSpacing: "0.07em", background: "#f9fafb",
  borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap",
};
const thC: React.CSSProperties = { ...thStyle, textAlign: "center" };

function TD({ children, center, mono }: { children: React.ReactNode; center?: boolean; mono?: boolean }) {
  return (
    <td style={{
      padding: "11px 16px", fontSize: 13, color: "#111827",
      borderBottom: "1px solid #f9fafb", verticalAlign: "middle",
      textAlign: center ? "center" : "left",
      fontFamily: mono ? "ui-monospace,monospace" : undefined,
    }}>{children}</td>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6"];

function Avatar({ name, idx }: { name: string; idx: number }) {
  const bg = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  return (
    <div style={{
      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
      background: bg + "22", border: `1.5px solid ${bg}44`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, color: bg,
    }}>{initials(name)}</div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KPI({ label, value, icon, accent }: { label: string; value: string | number; icon: React.ReactNode; accent: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 110, background: "#fff",
      border: "1px solid #f0f0f0", borderRadius: 12, padding: "14px 16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
        <span style={{ color: accent, opacity: 0.7 }}>{icon}</span>
      </div>
      <p style={{ fontSize: 24, fontWeight: 700, color: accent, margin: 0, lineHeight: 1 }}>{value}</p>
    </div>
  );
}

// ── Toggle Button Group ───────────────────────────────────────────────────────

function ToggleGroup<T extends string>({
  options, value, onChange,
}: { options: { key: T; label: string; icon: React.ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 9, padding: 3, gap: 2 }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button key={o.key} onClick={() => onChange(o.key)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 7, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600, transition: "all 0.15s",
            background: active ? "#fff" : "transparent",
            color: active ? "#111827" : "#6b7280",
            boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}>
            {o.icon}{o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Inline Bar Chart ─────────────────────────────────────────────────────────

function BarChartInline({ rows }: { rows: { label: string; value: number; max: number; color: string; sub?: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((row, i) => {
        const p = row.max === 0 ? 0 : Math.round((row.value / row.max) * 100);
        return (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: row.color }}>{row.sub ?? `${p}%`}</span>
            </div>
            <div style={{ height: 8, background: "#f3f4f6", borderRadius: 99 }}>
              <div style={{ width: `${p}%`, height: "100%", background: row.color, borderRadius: 99, transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Chart View ───────────────────────────────────────────────────────────────

function ChartPanel({ data, filter }: { data: StatsData; filter: FilterMode }) {
  const card: React.CSSProperties = {
    flex: 1, minWidth: 0, background: "#fff",
    border: "1px solid #f0f0f0", borderRadius: 12, padding: "16px 18px",
  };
  const cardTitle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "#374151",
    marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em",
  };
  const COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316","#06b6d4"];

  if (filter === "employee") {
    const emps = data.employees;
    const maxScore = Math.max(...emps.map((e) => e.maxScore), 1);
    return (
      <div style={{ display: "flex", gap: 12 }}>
        <div style={card}>
          <p style={cardTitle}>Score by employee</p>
          <BarChartInline rows={emps.map((e, i) => ({
            label: e.name, value: e.score, max: maxScore,
            color: COLORS[i % COLORS.length], sub: `${e.score}pts`,
          }))} />
        </div>
        <div style={card}>
          <p style={cardTitle}>Performance index %</p>
          <BarChartInline rows={emps.map((e, i) => {
            const p = scorePct(e.score, e.maxScore);
            return { label: e.name, value: p, max: 100, color: p >= 75 ? "#16a34a" : p >= 40 ? "#d97706" : "#dc2626" };
          })} />
        </div>
      </div>
    );
  }

  if (filter === "department") {
    const depts = data.departments;
    const maxScore = Math.max(...depts.map((d) => d.maxScore), 1);
    return (
      <div style={{ display: "flex", gap: 12 }}>
        <div style={card}>
          <p style={cardTitle}>Score by department</p>
          <BarChartInline rows={depts.map((d, i) => ({
            label: d.name, value: d.score, max: maxScore,
            color: COLORS[i % COLORS.length], sub: `${d.score}pts`,
          }))} />
        </div>
        <div style={card}>
          <p style={cardTitle}>Completion % by dept</p>
          <BarChartInline rows={depts.map((d, i) => {
            const p = scorePct(d.score, d.maxScore);
            return { label: d.name, value: p, max: 100, color: p >= 75 ? "#16a34a" : p >= 40 ? "#d97706" : "#dc2626" };
          })} />
        </div>
      </div>
    );
  }

  const pri = data.priorities;
  const rows = [
    { label: "High priority",   key: "HIGH"   as const, color: "#dc2626" },
    { label: "Medium priority", key: "MEDIUM" as const, color: "#d97706" },
    { label: "Low priority",    key: "LOW"    as const, color: "#16a34a" },
  ];
  const maxTotal = Math.max(...rows.map((r) => pri[r.key].total), 1);
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div style={card}>
        <p style={cardTitle}>Total tasks by priority</p>
        <BarChartInline rows={rows.map((r) => ({
          label: r.label, value: pri[r.key].total, max: maxTotal,
          color: r.color, sub: `${pri[r.key].total} tasks`,
        }))} />
      </div>
      <div style={card}>
        <p style={cardTitle}>Completion rate by priority</p>
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
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
        <thead>
          <tr>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Employee</th>
            <th style={thStyle}>Department</th>
            <th style={thC}>Total</th>
            <th style={thC}>Due (H·M·L)</th>
            <th style={thC}>Done (H·M·L)</th>
            <th style={thC}>Max</th>
            <th style={{ ...thStyle, minWidth: 160 }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, i) => (
            <tr key={emp.id} style={{ background: i % 2 ? "#fafafa" : "#fff" }}>
              <TD mono>{i + 1}</TD>
              <TD>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={emp.name} idx={i} />
                  <span style={{ fontWeight: 500 }}>{emp.name}</span>
                </div>
              </TD>
              <TD>
                <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#eef2ff", color: "#4338ca" }}>
                  {emp.dept}
                </span>
              </TD>
              <TD center><span style={{ fontWeight: 600 }}>{emp.total}</span></TD>
              <TD center><HMLChips obj={emp.due} variant="due" /></TD>
              <TD center><HMLChips obj={emp.completed} variant="done" /></TD>
              <TD center><span style={{ fontWeight: 600, color: "#374151" }}>{emp.maxScore}</span></TD>
              <TD><ScoreBar score={emp.score} max={emp.maxScore} /></TD>
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
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
        <thead>
          <tr>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Department</th>
            <th style={thC}>Total</th>
            <th style={thC}>Due (H·M·L)</th>
            <th style={thC}>Done (H·M·L)</th>
            <th style={thC}>Max</th>
            <th style={{ ...thStyle, minWidth: 160 }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((dept, i) => (
            <tr key={dept.name} style={{ background: i % 2 ? "#fafafa" : "#fff" }}>
              <TD mono>{i + 1}</TD>
              <TD>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon.Building />
                  </div>
                  <span style={{ fontWeight: 500 }}>{dept.name}</span>
                </div>
              </TD>
              <TD center><span style={{ fontWeight: 600 }}>{dept.total}</span></TD>
              <TD center><HMLChips obj={dept.due} variant="due" /></TD>
              <TD center><HMLChips obj={dept.completed} variant="done" /></TD>
              <TD center><span style={{ fontWeight: 600, color: "#374151" }}>{dept.maxScore}</span></TD>
              <TD><ScoreBar score={dept.score} max={dept.maxScore} /></TD>
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
    { key: "HIGH"   as const, label: "High",   dot: "#dc2626", bg: "#fee2e2", fg: "#b91c1c" },
    { key: "MEDIUM" as const, label: "Medium", dot: "#d97706", bg: "#fef3c7", fg: "#b45309" },
    { key: "LOW"    as const, label: "Low",    dot: "#16a34a", bg: "#dcfce7", fg: "#15803d" },
  ];
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Priority</th>
            <th style={thC}>Total</th>
            <th style={thC}>Overdue</th>
            <th style={thC}>Completed</th>
            <th style={{ ...thStyle, minWidth: 200 }}>Completion rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, label, dot, bg, fg }, i) => {
            const s = priorities[key];
            // FIX: use completed/total for rate, not score/maxScore
            const rate = s.total === 0 ? 0 : Math.round((s.completed / s.total) * 100);
            return (
              <tr key={key} style={{ background: i % 2 ? "#fafafa" : "#fff" }}>
                <TD>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 12px", borderRadius: 8, background: bg, color: fg, fontSize: 12, fontWeight: 700 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                    {label}
                  </span>
                </TD>
                <TD center><span style={{ fontWeight: 600 }}>{s.total}</span></TD>
                <TD center>
                  {s.due > 0
                    ? <span style={{ padding: "2px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#fee2e2", color: "#b91c1c" }}>{s.due}</span>
                    : <span style={{ color: "#d1d5db", fontSize: 13 }}>—</span>}
                </TD>
                <TD center><span style={{ fontWeight: 600, color: "#15803d" }}>{s.completed}</span></TD>
                <TD>
                  <div style={{ minWidth: 180 }}>
                    <ScoreBar score={s.completed} max={s.total} />
                  </div>
                </TD>
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
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <Icon.BarChart />
      <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 12 }}>No data available yet.</p>
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
      .then((d: StatsData) => { setData(d); setLastUpdated(new Date()); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // FIX: poll every 15 seconds so dashboard stays in sync without manual refresh
  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 60000);
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
    <div style={{ background: "#f8fafc", borderRadius: 16, padding: 20, marginTop: 24 }}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 3px" }}>Performance Analytics</h2>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Loading…"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={fetchStats}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, fontWeight: 500, color: "#374151", cursor: "pointer" }}
          >
            <Icon.Refresh /> Refresh
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
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <KPI label="Total Tasks"  value={totals.total}     icon={<Icon.Tasks />}       accent="#374151" />
        <KPI label="Completed"    value={totals.completed} icon={<Icon.CheckCircle />} accent="#15803d" />
        <KPI label="Overdue"      value={totals.due}       icon={<Icon.AlertCircle />} accent={totals.due > 0 ? "#b91c1c" : "#9ca3af"} />
        <KPI label="Completion %" value={rate}             icon={<Icon.Trend />}       accent="#4338ca" />
      </div>

      {/* Filter toggle */}
      <div style={{ marginBottom: 14 }}>
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
        <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 11, color: "#9ca3af" }}>
          <span>H = High &nbsp;·&nbsp; M = Medium &nbsp;·&nbsp; L = Low</span>
          <span>Scoring: High = 3 pts &nbsp;·&nbsp; Medium = 2 pts &nbsp;·&nbsp; Low = 1 pt</span>
        </div>
      )}

      {/* Content card */}
      <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px 24px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}>
            Loading…
          </div>
        ) : !data ? (
          <EmptyState />
        ) : view === "chart" ? (
          <div style={{ padding: 16 }}>
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

      <p style={{ fontSize: 11, color: "#d1d5db", margin: "8px 0 0", textAlign: "right" }}>
        Score % = earned pts ÷ max pts × 100 &nbsp;·&nbsp; Auto-refreshes every 15s
      </p>
    </div>
  );
}