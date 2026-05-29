"use client";

import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import bcrypt from "bcryptjs";

// ── Constants ────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  "Admin Department","Centre Head/ Management","Sales/counseling",
  "Academic","Faculty","Backend","Account & Finance","HR & Placement","IT Support",
];

// ── Shared sub-components ────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 12,
        fontWeight: 600,
        color: "#374151",
        marginBottom: 6,
      }}
    >
      {children}
    </label>
  );
}

const inputBase: React.CSSProperties = {
  width: "100%",
  height: 40,
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  padding: "0 14px",
  fontSize: 13,
  fontWeight: 500,
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
  backgroundColor: "#fafafa",
  fontFamily: "inherit",
};

function focusRing(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "#4f46e5";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.08)";
}

function blurRing(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "#e5e7eb";
  e.currentTarget.style.boxShadow = "none";
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function AddEmployeeModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [joinedAt, setJoinedAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          department: department || undefined,
          joinedAt: joinedAt || undefined,
          password: await bcrypt.hash(password, 12),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to create employee.");
      }
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.25)",
          zIndex: 60,
        }}
      />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 70,
          backgroundColor: "#ffffff",
          borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          width: 480,
          maxWidth: "calc(100vw - 32px)",
          padding: 28,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
            Add new employee
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              padding: 4,
              borderRadius: 6,
              display: "flex",
            }}
          >
            <X style={{ height: 17, width: 17 }} />
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Name */}
          <div>
            <FieldLabel>Full Name *</FieldLabel>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={focusRing}
              onBlur={blurRing}
              style={inputBase}
            />
          </div>

          {/* Email */}
          <div>
            <FieldLabel>Email *</FieldLabel>
            <input
              type="email"
              placeholder="john@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={focusRing}
              onBlur={blurRing}
              style={inputBase}
            />
          </div>

          {/* Phone + Department row */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <FieldLabel>Phone</FieldLabel>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onFocus={focusRing}
                onBlur={blurRing}
                style={inputBase}
              />
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <FieldLabel>Department</FieldLabel>
              <div style={{ position: "relative" }}>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  onFocus={(e) => focusRing(e)}
                  onBlur={(e) => blurRing(e)}
                  style={{
                    ...inputBase,
                    appearance: "none",
                    paddingRight: 36,
                    cursor: "pointer",
                    color: department ? "#111827" : "#9ca3af",
                  }}
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    height: 14,
                    width: 14,
                    color: "#9ca3af",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
          </div>
          {/* Password */}
          <div>
            <FieldLabel>Password *</FieldLabel>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={focusRing}
              onBlur={blurRing}
              style={inputBase}
            />
          </div>

          {/* Joined date */}
          <div>
            <FieldLabel>Joined Date</FieldLabel>
            <input
              type="date"
              value={joinedAt}
              onChange={(e) => setJoinedAt(e.target.value)}
              onFocus={focusRing}
              onBlur={blurRing}
              style={{
                ...inputBase,
                cursor: "pointer",
                color: joinedAt ? "#111827" : "#9ca3af",
              }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              fontSize: 13,
              color: "#ef4444",
            }}
          >
            {error}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 24,
          }}
        >
          <button
            onClick={onClose}
            style={{
              height: 36,
              padding: "0 18px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
              fontSize: 13,
              fontWeight: 500,
              color: "#374151",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              height: 36,
              padding: "0 18px",
              borderRadius: 8,
              border: "none",
              backgroundColor: submitting ? "#a5b4fc" : "#4f46e5",
              fontSize: 13,
              fontWeight: 500,
              color: "#ffffff",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Adding…" : "Add employee"}
          </button>
        </div>
      </div>
    </>
  );
}
