"use client";

import React, { useState } from "react";
import { X, User, Mail, Phone, Briefcase, Lock, Calendar, ToggleLeft, ToggleRight } from "lucide-react";
import type { User as UserType } from "@/types";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

const DEPARTMENTS = [
  "Admin department",
  "Centre head / Management",
  "Sales / counselling department",
  "Academics department",
  "Faculty department",
  "Backend department",
  "Accounts & Finance department",
  "IT department",
  "HR & Placement department"
];

function toDateInput(iso?: string | Date | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

interface EditEmployeeModalProps {
  employee: UserType;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditEmployeeModal({ employee, onClose, onUpdated }: EditEmployeeModalProps) {
  const [name, setName] = useState(employee.name);
  const [email, setEmail] = useState(employee.email);
  const [phone, setPhone] = useState(employee.phone ?? "");
  const [department, setDepartment] = useState(employee.department ?? "");
  const [jobTitle, setJobTitle] = useState(employee.jobTitle ?? "");
  const [password, setPassword] = useState("");
  const [joinedAt, setJoinedAt] = useState(toDateInput(employee.joinedAt));
  const [role, setRole] = useState<UserType["role"]>(employee.role);
  const [isActive, setIsActive] = useState(employee.isActive);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/users/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          department: department || undefined,
          jobTitle: jobTitle.trim() || undefined,
          password: password.trim() ? password : undefined,
          joinedAt: joinedAt || undefined,
          role,
          isActive,
        }),
      });

      const payload = await res.json();
      if (!payload.success) {
        throw new Error(payload.error || "Failed to update employee.");
      }

      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop — z-modal-backdrop = 70 */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center"
        style={{ zIndex: "var(--z-modal-backdrop)" }}
      />

      {/* Modal Container — z-modal = 80 */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[480px] bg-surface rounded-xl shadow-lg flex flex-col animate-in zoom-in-95 duration-150" style={{ zIndex: "var(--z-modal)" }}>
        {/* Header */}
        <div className="p-4 px-6 border-b border-border flex items-start justify-between shrink-0 relative">
          <div>
            <h2 className="text-[15px] font-medium text-text-primary">Edit Employee Details</h2>
            <p className="text-[12px] text-text-secondary mt-0.5">Update organization profile details for {employee.name}.</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 w-6 h-6 rounded-full hover:bg-bg flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors focus-visible:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Name */}
          <FormField label="Full Name *" required>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full !pl-10 h-[34px] focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none"
              />
            </div>
          </FormField>

          {/* Email */}
          <FormField label="Email Address *" required>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-text-tertiary" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full !pl-10 h-[34px] focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none"
              />
            </div>
          </FormField>

          {/* Phone & Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Phone Number">
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-text-tertiary" />
                <input
                  type="tel"
                  placeholder="e.g. +1 555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full !pl-10 h-[34px] focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none"
                />
              </div>
            </FormField>

            <FormField label="Department">
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-text-tertiary pointer-events-none" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full !pl-10 h-[34px] cursor-pointer focus:border-brand focus:ring-2 focus:ring-brand/10"
                >
                  <option value="">Select Department...</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>
          </div>

          {/* Job Title & Joined Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Job Title">
              <input
                type="text"
                placeholder="e.g. UI/UX Designer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full h-[34px] focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none"
              />
            </FormField>

            <FormField label="Joined Date">
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-text-tertiary pointer-events-none" />
                <input
                  type="date"
                  value={joinedAt}
                  onChange={(e) => setJoinedAt(e.target.value)}
                  className="w-full !pl-10 h-[34px] cursor-pointer focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </div>
            </FormField>
          </div>

          {/* Password & Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Password" hint="Leave blank to keep same">
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-text-tertiary" />
                <input
                  type="password"
                  placeholder="Leave blank to keep same"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full !pl-10 h-[34px] focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none"
                />
              </div>
            </FormField>

            <FormField label="Access Level">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full h-[34px] cursor-pointer focus:border-brand focus:ring-2 focus:ring-brand/10"
              >
                <option value="EMPLOYEE">Employee (Restricted)</option>
                <option value="ADMIN">Admin (Full Control)</option>
                <option value="MANAGER">Manager</option>
                <option value="TEAM_LEADER">Team Leader</option>
              </select>
            </FormField>
          </div>

          {/* Active status */}
          <div className="flex items-center justify-between p-3.5 rounded border border-border bg-bg/25">
            <div>
              <p className="text-[12px] font-medium text-text-primary">
                Account Status
              </p>
              <p className="text-[10px] text-text-secondary mt-0.5">
                Inactive users cannot log in or be assigned tasks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className="p-1 focus-visible:outline-none shrink-0"
            >
              {isActive ? (
                <ToggleRight className="w-8 h-8 text-brand" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-text-tertiary" />
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] text-priority-critical-text rounded text-[11px] font-medium flex items-center gap-1.5 dark:bg-red-955/20 dark:border-red-900/40">
              <span className="w-1.5 h-1.5 rounded-full bg-priority-critical-text" />
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-border flex items-center justify-end gap-3 shrink-0 bg-bg/15">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            className="h-[34px] px-4"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            onClick={handleSubmit}
            variant="primary"
            className="h-[34px] px-4"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </>
  );
}
