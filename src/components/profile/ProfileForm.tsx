"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTimeTheme } from "@/hooks/useTimeTheme";
import { ChevronDown, LogOut } from "lucide-react"; 

const DEPARTMENTS = [
  "Admin Department","Centre Head/ Management","Sales/counseling",
  "Academic","Faculty","Backend","Account & Finance","HR & Placement","IT Support",
];

type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  department?: string | null;
  joinedAt?: Date | string | null;
  avatarUrl?: string | null;
  role?: string | null;
};

// ── Shared sub-components ──────────────────────────────────────────────────

function FieldLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 12,
        fontWeight: 600,
        color: color, 
        marginBottom: 8,
      }}
    >
      {children}
    </label>
  );
}

const inputBase: React.CSSProperties = {
  width: "100%",
  height: 52, // Slightly taller for a wider layout
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
  transition: "all 0.2s ease"
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

export default function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const timeTheme = useTimeTheme();
  
  const formattedDate = user.joinedAt 
    ? new Date(user.joinedAt).toISOString().split('T')[0] 
    : "";

  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    department: user.department || "",
    joinedAt: formattedDate,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          joinedAt: formData.joinedAt ? new Date(formData.joinedAt).toISOString() : undefined
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");
      
      router.refresh();
      alert("Profile updated successfully!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div
      style={{
        backgroundColor: timeTheme.cardBackground,
        border: `1px solid ${timeTheme.cardBorder}`,
        borderRadius: 14,
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        width: "100%", // Takes full width of the container
        height: "100%", // Stretches to fill available height
        padding: "32px 40px",
        display: "flex",
        flexDirection: "column",
        transition: "background 0.5s ease, border-color 0.5s ease",
      }}
    >
      {/* Header / Avatar Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: `1px solid ${timeTheme.dividerColor}`,
        }}
      >
        <UserAvatar src={user.avatarUrl} name={user.name || "User"} size="lg" />
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: timeTheme.textColor, margin: 0 }}>
            {user.name || "Unnamed User"}
          </h2>
          <p style={{ fontSize: 14, fontWeight: 500, color: timeTheme.subTextColor, margin: "6px 0 0 0" }}>
            {user.department ? `${user.department} • ` : ""}{user.role || "Employee"}
          </p>
        </div>
      </div>

      {/* Fields Container - Using Grid for wide layout */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
          gap: 24,
          flex: 1 // Pushes footer to the bottom
        }}
      >
        
        {/* Name */}
        <div>
          <FieldLabel color={timeTheme.subTextColor}>Full Name *</FieldLabel>
          <input
            type="text"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            onFocus={focusRing}
            onBlur={blurRing}
            style={inputBase}
          />
        </div>

        {/* Email */}
        <div>
          <FieldLabel color={timeTheme.subTextColor}>Email *</FieldLabel>
          <input
            type="email"
            name="email"
            placeholder="john@company.com"
            value={formData.email}
            onChange={handleChange}
            onFocus={focusRing}
            onBlur={blurRing}
            style={inputBase}
          />
        </div>

        {/* Phone */}
        <div>
          <FieldLabel color={timeTheme.subTextColor}>Phone Number</FieldLabel>
          <input
            type="tel"
            name="phone"
            placeholder="+91 98765 43210"
            value={formData.phone}
            onChange={handleChange}
            onFocus={focusRing}
            onBlur={blurRing}
            style={inputBase}
          />
        </div>
        
        {/* Department */}
        <div>
          <FieldLabel color={timeTheme.subTextColor}>Department</FieldLabel>
          <div style={{ position: "relative" }}>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              onFocus={focusRing}
              onBlur={blurRing}
              style={{
                ...inputBase,
                appearance: "none",
                paddingRight: 36,
                cursor: "pointer",
                color: formData.department ? "#111827" : "#9ca3af",
              }}
            >
              <option value="" disabled>Select…</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                height: 16,
                width: 16,
                color: "#9ca3af",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* Joined date */}
        <div>
          <FieldLabel color={timeTheme.subTextColor}>Joined Date</FieldLabel>
          <input
            type="date"
            name="joinedAt"
            value={formData.joinedAt}
            onChange={handleChange}
            onFocus={focusRing}
            onBlur={blurRing}
            style={{
              ...inputBase,
              cursor: "pointer",
              color: formData.joinedAt ? "#111827" : "#9ca3af",
            }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            marginTop: 20,
            padding: "12px 16px",
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

      {/* Footer / Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between", // Pushes logout left, save/cancel right
          alignItems: "center",
          marginTop: 40,
          paddingTop: 24,
          borderTop: `1px solid ${timeTheme.dividerColor}`,
        }}
      >
        {/* Logout Button (Left Side) */}
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 38,
            padding: "0 16px",
            borderRadius: 8,
            border: "1px solid #fca5a5",
            backgroundColor: "#fef2f2",
            fontSize: 13,
            fontWeight: 600,
            color: "#ef4444",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#fee2e2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#fef2f2";
          }}
        >
          <LogOut style={{ width: 16, height: 16 }} />
          Logout
        </button>

        {/* Save / Cancel (Right Side) */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{
              height: 38,
              padding: "0 20px",
              borderRadius: 8,
              border: `1px solid ${timeTheme.inputBorder}`,
              backgroundColor: timeTheme.inputBackground,
              fontSize: 13,
              fontWeight: 500,
              color: timeTheme.subTextColor,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              height: 38,
              padding: "0 24px",
              borderRadius: 8,
              border: "none",
              backgroundColor: submitting ? "#a5b4fc" : "#4f46e5", 
              fontSize: 13,
              fontWeight: 500,
              color: "#ffffff",
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "background-color 0.2s"
            }}
          >
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}