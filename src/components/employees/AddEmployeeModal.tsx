"use client";

import React, { useState } from "react";
import { X, User, Mail, Phone, Briefcase, Lock, Calendar } from "lucide-react";
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

interface AddEmployeeModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function AddEmployeeModal({ onClose, onCreated }: AddEmployeeModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [password, setPassword] = useState("");
  const [joinedAt, setJoinedAt] = useState("");
  const [role, setRole] = useState<"EMPLOYEE" | "ADMIN">("EMPLOYEE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Name, email, and password are required.");
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
          jobTitle: jobTitle.trim() || undefined,
          password: password,
          joinedAt: joinedAt || undefined,
          role,
        }),
      });

      const payload = await res.json();
      if (!payload.success) {
        throw new Error(payload.error || "Failed to create employee.");
      }

      try {
        await fetch("/api/employees/send-welcome-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            name: name.trim(),
            tempPassword: password,
          }),
        });
      } catch (welErr) {
        console.error("Welcome email error:", welErr);
      }

      onCreated();
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
            <h2 className="text-[15px] font-medium text-text-primary">Add New Employee</h2>
            <p className="text-[12px] text-text-secondary mt-0.5">Create a new user account in the organization.</p>
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
                placeholder="e.g. John Doe"
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
                placeholder="e.g. john@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full !pl-10 h-[34px] focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-text-tertiary mt-1">Your Email ID will be your User ID.</p>
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
            <FormField label="Password *" required>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-text-tertiary" />
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
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
              </select>
            </FormField>
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
            {submitting ? "Adding..." : "Add Employee"}
          </Button>
        </div>
      </div>
    </>
  );
}
