"use client";

import React, { useState, useEffect } from "react";
import { FolderPlus, Users, Plus, Check, Info, Trash2, Calendar, ClipboardList } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { useToast } from "@/hooks/useToast";
import { User, TaskTemplate, Priority } from "@/types";
import { Button } from "@/components/ui/Button";

export default function OnboardingPage() {
  const { currentUser } = useTaskStore();
  const toast = useToast();

  const [employees, setEmployees] = useState<User[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Form onboarding states
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [onboardDueDate, setOnboardDueDate] = useState("");
  const [onboardDept, setOnboardDept] = useState("Onboarding");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form template creation states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");
  const [newTemplatePriority, setNewTemplatePriority] = useState<Priority>("MEDIUM");
  const [newChecklistText, setNewChecklistText] = useState("");
  const [newChecklistItems, setNewChecklistItems] = useState<string[]>([]);
  const [templateSubmitLoading, setTemplateSubmitLoading] = useState(false);

  const fetchOnboardingData = async () => {
    try {
      // 1. Fetch active employees
      const empRes = await fetch("/api/users");
      const empPayload = await empRes.json();
      if (empPayload.success) {
        setEmployees((empPayload.data || []).filter((e: User) => e.isActive));
      }

      // 2. Fetch task templates
      const tempRes = await fetch("/api/task-templates");
      const tempPayload = await tempRes.json();
      if (tempRes.ok && tempPayload.success) {
        setTemplates(tempPayload.data || []);
      } else if (Array.isArray(tempPayload)) {
        setTemplates(tempPayload);
      }
    } catch (err) {
      console.error("Failed to load onboarding data:", err);
      toast.error("Failed to fetch page data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboardingData();
  }, []);

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setNewChecklistItems([...newChecklistItems, newChecklistText.trim()]);
    setNewChecklistText("");
  };

  const handleRemoveChecklistItem = (idx: number) => {
    setNewChecklistItems(newChecklistItems.filter((_, i) => i !== idx));
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;
    setTemplateSubmitLoading(true);

    try {
      const res = await fetch("/api/task-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          description: newTemplateDesc.trim(),
          defaultPriority: newTemplatePriority,
          checklistItems: newChecklistItems,
        }),
      });
      const payload = await res.json();
      const success = payload.success || (res.ok && !payload.error);
      if (success) {
        toast.success("Task template created successfully!");
        setNewTemplateName("");
        setNewTemplateDesc("");
        setNewTemplatePriority("MEDIUM");
        setNewChecklistItems([]);
        setShowTemplateModal(false);
        fetchOnboardingData();
      } else {
        toast.error(payload.error || "Failed to create template.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create template.");
    } finally {
      setTemplateSubmitLoading(false);
    }
  };

  const handleOnboardEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !selectedTemplateId) {
      toast.error("Please select both employee and template.");
      return;
    }
    setSubmitLoading(true);

    const employee = employees.find((emp) => emp.id === selectedEmpId);
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (!employee || !template) return;

    // Build checklistItems as JSON formatted text list
    const checklistItems = Array.isArray(template.checklistItems)
      ? template.checklistItems.map((item: any) => {
          const text = typeof item === "string" ? item : (item.text || "");
          return { text, completed: false };
        })
      : [];

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Onboarding: ${employee.name} - ${template.name}`,
          description: template.description || `Onboarding workflow using ${template.name} template.`,
          priority: template.defaultPriority,
          assigneeId: selectedEmpId,
          templateId: selectedTemplateId,
          dueDate: onboardDueDate ? new Date(onboardDueDate).toISOString() : undefined,
          department: onboardDept,
          frequency: "ONE_TIME",
          checklistItems,
        }),
      });
      const payload = await res.json();
      if (payload.success) {
        toast.success(`Successfully assigned onboarding tasks to ${employee.name}!`);
        setSelectedEmpId("");
        setSelectedTemplateId("");
        setOnboardDueDate("");
      } else {
        toast.error(payload.error || "Failed to onboard employee.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign onboarding tasks.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-text-secondary text-xs">
        <div className="w-6 h-6 border-[3px] border-white/10 border-t-brand rounded-full animate-spin mb-2.5" />
        Loading onboarding manager...
      </div>
    );
  }

  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Onboarding Manager
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Setup standardized task lists and onboarding flows for newly joined team members.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Custom Template
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form panel: Onboard Employee */}
        <div className="lg:col-span-1 bg-surface border border-border rounded-2xl p-5 shadow-xs">
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-border pb-2.5">
            <ClipboardList className="w-4.5 h-4.5 text-brand" />
            Assign Onboarding Checklist
          </h2>

          <form onSubmit={handleOnboardEmployee} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-tertiary uppercase">Select New Employee</label>
              <select
                required
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="block w-full px-3 py-2 border border-border-strong rounded-lg bg-bg text-text-primary text-xs focus:outline-none focus:border-brand"
              >
                <option value="">Choose employee...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department || "No Department"})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-tertiary uppercase">Select Template</label>
              <select
                required
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="block w-full px-3 py-2 border border-border-strong rounded-lg bg-bg text-text-primary text-xs focus:outline-none focus:border-brand"
              >
                <option value="">Choose template...</option>
                {templates.map((temp) => (
                  <option key={temp.id} value={temp.id}>
                    {temp.name} ({temp.defaultPriority} Priority)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-tertiary uppercase">Department</label>
              <input
                type="text"
                value={onboardDept}
                onChange={(e) => setOnboardDept(e.target.value)}
                className="w-full px-3 py-2 border border-border-strong rounded-lg bg-bg text-text-primary text-xs focus:outline-none focus:border-brand"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-tertiary uppercase">Target Completion Date</label>
              <input
                type="date"
                value={onboardDueDate}
                onChange={(e) => setOnboardDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-border-strong rounded-lg bg-bg text-text-primary text-xs focus:outline-none focus:border-brand"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full py-2 text-xs font-bold text-center"
                disabled={submitLoading || !isAdmin}
              >
                {submitLoading ? "Assigning Tasks..." : "Onboard Employee"}
              </Button>
            </div>
          </form>
        </div>

        {/* Templates List display panel */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider block border-b border-border pb-2.5">
            Predefined Task Templates ({templates.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((temp) => (
              <div
                key={temp.id}
                className="bg-surface border border-border rounded-xl p-4 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-xs font-bold text-text-primary">{temp.name}</h3>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-text-secondary">
                      {temp.defaultPriority}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-text-tertiary mt-1 leading-relaxed">
                    {temp.description || "No description provided."}
                  </p>

                  {/* Checklist display */}
                  {Array.isArray(temp.checklistItems) && temp.checklistItems.length > 0 && (
                    <div className="space-y-1.5 mt-3 pt-3 border-t border-border">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-text-tertiary block">
                        Included Checklist Subtasks:
                      </span>
                      <div className="space-y-1 pl-1">
                        {temp.checklistItems.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[10.5px] text-text-secondary">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                            <span className="truncate">{typeof item === "string" ? item : item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-12 bg-surface border rounded-xl max-w-sm mx-auto">
              <Info className="w-6 h-6 text-text-tertiary mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-text-primary">No onboarding templates</p>
              <p className="text-[10px] text-text-secondary mt-0.5">Use the create button to add a template.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Template Modal */}
      {showTemplateModal && (
        <>
          <div
            onClick={() => setShowTemplateModal(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center"
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-xl shadow-2xl p-6 w-full max-w-[480px] z-[51] animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
              📋 Create Task Template
            </h2>
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-text-tertiary uppercase">Template Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Onboarding Week 1"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border border-border-strong rounded-lg bg-bg text-text-primary text-xs focus:outline-none focus:border-brand"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-text-tertiary uppercase">Description</label>
                <textarea
                  placeholder="Briefly describe what this onboarding flow accomplishes..."
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-border-strong rounded-lg bg-bg text-text-primary text-xs focus:outline-none focus:border-brand resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-text-tertiary uppercase">Default Priority</label>
                <select
                  value={newTemplatePriority}
                  onChange={(e) => setNewTemplatePriority(e.target.value as Priority)}
                  className="block w-full px-3 py-2 border border-border-strong rounded-lg bg-bg text-text-primary text-xs focus:outline-none focus:border-brand"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-tertiary uppercase block">Checklist Items</label>
                
                {/* Items display list */}
                {newChecklistItems.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto border border-border p-2.5 rounded-lg bg-bg/20">
                    {newChecklistItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 text-xs text-text-primary">
                        <span className="truncate flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-brand shrink-0" />
                          {item}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklistItem(idx)}
                          className="text-red-400 hover:text-red-500 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline item input form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter checklist item text..."
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    className="block w-full px-3 py-1.5 border border-border-strong rounded-lg bg-bg text-text-primary text-xs focus:outline-none focus:border-brand"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddChecklistItem(); } }}
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddChecklistItem}>
                    Add
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowTemplateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={templateSubmitLoading}>
                  {templateSubmitLoading ? "Saving..." : "Save Template"}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
