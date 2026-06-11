"use client";

import React, { useState, useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { FileText, Plus, Trash2, X, AlertTriangle, Layers, ListTodo, Pencil, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { TaskTemplate, Priority } from "@/types";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";
import * as XLSX from "xlsx";

export default function TaskTemplatesPage() {
  const { currentUser } = useTaskStore();
  const toast = useToast();

  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);

  // New States for Filtering & Bulk Assignment
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");
  const [selectedTemplateForDetails, setSelectedTemplateForDetails] = useState<TaskTemplate | null>(null);
  const [showAssignBulkModal, setShowAssignBulkModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [dueDate, setDueDate] = useState<string>("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [assigningBulk, setAssigningBulk] = useState(false);

  // Add/Edit Template Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultPriority, setDefaultPriority] = useState<Priority>("MEDIUM");
  const [department, setDepartment] = useState("General");
  const [frequency, setFrequency] = useState("ONE_TIME");
  const [customFrequency, setCustomFrequency] = useState("");
  const [recurrenceRule, setRecurrenceRule] = useState("NONE");
  const [remindWhatsApp, setRemindWhatsApp] = useState(false);
  const [remindEmail, setRemindEmail] = useState(false);

  // Checklist builder
  const [checklist, setChecklist] = useState<string[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setDefaultPriority("MEDIUM");
    setChecklist([]);
    setNewChecklistItem("");
    setDepartment("General");
    setFrequency("ONE_TIME");
    setCustomFrequency("");
    setRecurrenceRule("NONE");
    setRemindWhatsApp(false);
    setRemindEmail(false);
  };

  const handleStartEdit = (t: TaskTemplate) => {
    setEditingTemplate(t);
    setName(t.name);
    setDescription(t.description || "");
    setDefaultPriority(t.defaultPriority);
    setChecklist(Array.isArray(t.checklistItems) ? (t.checklistItems as string[]) : []);
    setNewChecklistItem("");
    setDepartment(t.department || "General");
    setFrequency(t.frequency || "ONE_TIME");
    setCustomFrequency(t.customFrequency || "");
    setRecurrenceRule(t.recurrence?.rule || "NONE");
    setRemindWhatsApp(Array.isArray(t.remindVia) ? t.remindVia.includes("whatsapp") : false);
    setRemindEmail(Array.isArray(t.remindVia) ? t.remindVia.includes("email") : false);
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/task-templates");
      const payload = await res.json();
      if (payload.success) {
        setTemplates(payload.data || []);
      }
    } catch (err) {
      toast.error("Failed to load templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetch("/api/departments")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) setDepartments(payload.data || []);
      })
      .catch(console.error);

    fetch("/api/users")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) setEmployees(payload.data || []);
      })
      .catch(console.error);
  }, []);

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim() && !checklist.includes(newChecklistItem.trim())) {
      setChecklist([...checklist, newChecklistItem.trim()]);
      setNewChecklistItem("");
    }
  };

  const handleRemoveChecklistItem = (text: string) => {
    setChecklist(checklist.filter((item) => item !== text));
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Template name is required.");
      return;
    }

    try {
      const res = await fetch("/api/task-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          defaultPriority,
          checklistItems: checklist,
          department,
          frequency,
          customFrequency: frequency === "CUSTOM" ? customFrequency.trim() : null,
          recurrence: { rule: recurrenceRule },
          remindVia: [
            remindWhatsApp && "whatsapp",
            remindEmail && "email",
          ].filter(Boolean),
        }),
      });

      const payload = await res.json();
      if (payload.success) {
        toast.success("Template created successfully.");
        setTemplates([...templates, payload.data]);
        setIsOpen(false);
        resetForm();
      } else {
        toast.error(payload.error || "Failed to create template.");
      }
    } catch (err) {
      toast.error("Something went wrong.");
    }
  };

  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    if (!name.trim()) {
      toast.error("Template name is required.");
      return;
    }

    try {
      const res = await fetch(`/api/task-templates/${editingTemplate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          defaultPriority,
          checklistItems: checklist,
          department,
          frequency,
          customFrequency: frequency === "CUSTOM" ? customFrequency.trim() : null,
          recurrence: { rule: recurrenceRule },
          remindVia: [
            remindWhatsApp && "whatsapp",
            remindEmail && "email",
          ].filter(Boolean),
        }),
      });

      const payload = await res.json();
      if (payload.success) {
        toast.success("Template updated successfully.");
        setTemplates(templates.map((t) => (t.id === editingTemplate.id ? payload.data : t)));
        setEditingTemplate(null);
        resetForm();
      } else {
        toast.error(payload.error || "Failed to update template.");
      }
    } catch (err) {
      toast.error("Something went wrong.");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const res = await fetch(`/api/task-templates/${id}`, { method: "DELETE" });
      const payload = await res.json();
      if (payload.success) {
        toast.success("Template deleted.");
        setTemplates(templates.filter((t) => t.id !== id));
      } else {
        toast.error(payload.error || "Failed to delete template.");
      }
    } catch (err) {
      toast.error("Something went wrong.");
    }
  };

  const toggleEmployeeSelection = (empId: string) => {
    if (selectedEmployeeIds.includes(empId)) {
      setSelectedEmployeeIds(selectedEmployeeIds.filter((id) => id !== empId));
    } else {
      setSelectedEmployeeIds([...selectedEmployeeIds, empId]);
    }
  };

  const handleSelectAll = (deptEmployees: any[]) => {
    const allIds = deptEmployees.map(e => e.id);
    const areAllSelected = deptEmployees.every(e => selectedEmployeeIds.includes(e.id));
    if (areAllSelected) {
      setSelectedEmployeeIds(selectedEmployeeIds.filter(id => !allIds.includes(id)));
    } else {
      setSelectedEmployeeIds([...new Set([...selectedEmployeeIds, ...allIds])]);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedEmployeeIds.length === 0) {
      toast.error("Please select at least one employee.");
      return;
    }
    setAssigningBulk(true);
    try {
      const res = await fetch("/api/tasks/bulk-assign-from-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplateForDetails?.id,
          employeeIds: selectedEmployeeIds,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        }),
      });
      const payload = await res.json();
      if (payload.success) {
        toast.success(`Task blueprint successfully assigned to ${selectedEmployeeIds.length} employees!`);
        setShowAssignBulkModal(false);
        setSelectedTemplateForDetails(null);
        setSelectedEmployeeIds([]);
        setDueDate("");
      } else {
        toast.error(payload.error || "Failed to assign tasks.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setAssigningBulk(false);
    }
  };

  const isAdmin = currentUser?.role === "ADMIN";

  const getPriorityColor = (p: Priority) => {
    if (p === "CRITICAL") return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400";
    if (p === "HIGH") return "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400";
    if (p === "MEDIUM") return "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400";
    return "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl backdrop-blur-md flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Task Blueprints & Templates
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Manage reusable blueprint templates containing descriptions, checklist items, and default priorities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="h-9 px-3 border border-slate-200 dark:border-slate-855 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-none cursor-pointer text-text-primary"
          >
            <option value="ALL">All Departments</option>
            <option value="General">General</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>

          {isAdmin && (
            <>
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-bg dark:hover:bg-slate-800 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Import Templates
              </button>

              <button
                onClick={() => { resetForm(); setIsOpen(true); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Template
              </button>
            </>
          )}
        </div>
      </div>

      {/* Templates List */}
      {(() => {
        const filteredTemplates = templates.filter(t => 
          selectedDeptFilter === "ALL" || t.department === selectedDeptFilter
        );

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              <div className="col-span-full text-center py-20 text-slate-400 text-xs">
                <div className="w-6 h-6 border-2 border-indigo-50 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
                Loading blueprints...
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-350">No Templates Found</p>
                <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1 max-w-[280px]">
                  Blueprints help team leaders assign standard processes quickly.
                </p>
              </div>
            ) : (
              filteredTemplates.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTemplateForDetails(t)}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl flex flex-col justify-between shadow-xs relative hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getPriorityColor(t.defaultPriority)}`}>
                        {t.defaultPriority}
                      </span>

                      {isAdmin && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStartEdit(t); }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                            title="Edit template"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }}
                            className="p-1 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                            title="Delete template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        {t.name}
                      </h4>
                      {t.description && (
                        <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-1 line-clamp-2">
                          {t.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 py-1 text-[10px] font-semibold text-slate-500 dark:text-slate-455 border-t border-slate-100 dark:border-slate-850 pt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 uppercase font-bold text-[9px] tracking-wider">Dept:</span>
                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-350">{t.department || "General"}</span>
                      </div>
                      {t.recurrence?.rule && t.recurrence.rule !== "NONE" && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 uppercase font-bold text-[9px] tracking-wider">Recurrence:</span>
                          <span className="text-slate-600 dark:text-slate-350">{t.recurrence.rule.toLowerCase()}</span>
                        </div>
                      )}
                      {t.frequency && t.frequency !== "ONE_TIME" && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 uppercase font-bold text-[9px] tracking-wider">Frequency:</span>
                          <span className="text-slate-600 dark:text-slate-350">
                            {t.frequency === "CUSTOM" && t.customFrequency ? t.customFrequency : t.frequency.toLowerCase()}
                          </span>
                        </div>
                      )}
                      {t.remindVia && Array.isArray(t.remindVia) && t.remindVia.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 uppercase font-bold text-[9px] tracking-wider">Remind:</span>
                          <span className="text-slate-600 dark:text-slate-350">{t.remindVia.join(", ")}</span>
                        </div>
                      )}
                    </div>

                    {t.checklistItems && Array.isArray(t.checklistItems) && t.checklistItems.length > 0 && (
                      <div className="space-y-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-855">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <ListTodo className="w-3 h-3" />
                          Blueprints Checklist ({t.checklistItems.length})
                        </p>
                        <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 font-semibold max-h-24 overflow-y-auto pr-1">
                          {t.checklistItems.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-slate-350 dark:bg-slate-600 flex-shrink-0" />
                              <span className="truncate">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 mt-4 pt-2.5 border-t border-slate-150 dark:border-slate-850 font-medium">
                    Created {new Date(t.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        );
      })()}
      {(isOpen || !!editingTemplate) && (
        <>
          <div
            onClick={() => { setIsOpen(false); setEditingTemplate(null); resetForm(); }}
            className="fixed inset-0 bg-black/35 backdrop-blur-xs z-50 transition-opacity"
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-55 w-full max-w-lg max-h-[85vh] overflow-y-auto bg-surface border border-border rounded-3xl shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-border">
              <span className="text-sm font-extrabold text-text-primary">
                {editingTemplate ? "Edit Task Blueprint" : "Create Task Blueprint"}
              </span>
              <button
                onClick={() => { setIsOpen(false); setEditingTemplate(null); resetForm(); }}
                className="p-1 hover:bg-bg rounded-xl text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5">
                  Blueprint Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Server Maintenance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-raised text-text-primary border border-border-strong rounded-xl text-xs font-semibold focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5">
                  Default Description
                </label>
                <textarea
                  placeholder="Enter details that should populate by default when this template is loaded..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-raised text-text-primary border border-border-strong rounded-xl text-xs font-semibold focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5">
                  Default Priority
                </label>
                <select
                  value={defaultPriority}
                  onChange={(e) => setDefaultPriority(e.target.value as any)}
                  className="w-full bg-surface-raised text-text-primary border border-border-strong rounded-xl text-xs font-semibold focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none cursor-pointer"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-surface-raised text-text-primary border border-border-strong rounded-xl text-xs font-semibold focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none cursor-pointer"
                >
                  <option value="General">General</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5">
                    Recurrence
                  </label>
                  <select
                    value={recurrenceRule}
                    onChange={(e) => setRecurrenceRule(e.target.value)}
                    className="w-full bg-surface-raised text-text-primary border border-border-strong rounded-xl text-xs font-semibold focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none cursor-pointer"
                  >
                    <option value="NONE">No Recurrence</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5">
                    Task Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full bg-surface-raised text-text-primary border border-border-strong rounded-xl text-xs font-semibold focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none cursor-pointer"
                  >
                    <option value="ONE_TIME">One Time</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="CUSTOM">Custom Frequency</option>
                  </select>
                </div>
              </div>

              {frequency === "CUSTOM" && (
                <div>
                  <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5">
                    Custom Frequency Rule *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Every 2 weeks on Tuesday"
                    value={customFrequency}
                    onChange={(e) => setCustomFrequency(e.target.value)}
                    className="w-full bg-surface-raised text-text-primary border border-border-strong rounded-xl text-xs font-semibold focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5">
                  Remind Employee Via
                </label>
                <div className="flex items-center gap-6 py-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary font-medium select-none">
                    <input
                      type="checkbox"
                      checked={remindWhatsApp}
                      onChange={(e) => setRemindWhatsApp(e.target.checked)}
                      className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
                    />
                    WhatsApp Message
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary font-medium select-none">
                    <input
                      type="checkbox"
                      checked={remindEmail}
                      onChange={(e) => setRemindEmail(e.target.checked)}
                      className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
                    />
                    Email Notification
                  </label>
                </div>
              </div>

              {/* Checklist rows builder */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                  Checklist Blueprints
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add checklist sub-task item..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddChecklistItem(); } }}
                    className="w-full bg-surface-raised text-text-primary border border-border-strong rounded-xl text-xs font-semibold focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none"
                  />
                  <button type="button" onClick={handleAddChecklistItem} className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl cursor-pointer">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {checklist.length > 0 && (
                  <div className="space-y-1.5 mt-2 max-h-24 overflow-y-auto">
                    {checklist.map((item) => (
                      <div key={item} className="flex items-center justify-between p-2 rounded-xl bg-bg border border-border">
                        <span className="text-xs text-text-secondary pr-4 truncate">{item}</span>
                        <button type="button" onClick={() => handleRemoveChecklistItem(item)} className="text-text-tertiary hover:text-text-primary cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); setEditingTemplate(null); resetForm(); }}
                  className="px-5 py-2.5 border border-border-strong hover:bg-bg text-text-secondary hover:text-text-primary font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {editingTemplate ? "Update Blueprint" : "Save Blueprint"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Template Details Modal */}
      {selectedTemplateForDetails && !showAssignBulkModal && (
        <>
          <div
            onClick={() => setSelectedTemplateForDetails(null)}
            className="fixed inset-0 bg-black/35 backdrop-blur-xs z-50 transition-opacity"
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-55 w-full max-w-lg bg-surface border border-border rounded-3xl shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-border">
              <span className="text-sm font-extrabold text-text-primary">
                Blueprint Specifications
              </span>
              <button
                onClick={() => setSelectedTemplateForDetails(null)}
                className="p-1 hover:bg-bg rounded-xl text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <h3 className="text-sm font-bold text-text-primary">{selectedTemplateForDetails.name}</h3>
                {selectedTemplateForDetails.description ? (
                  <p className="text-xs text-text-secondary mt-1 whitespace-pre-wrap">{selectedTemplateForDetails.description}</p>
                ) : (
                  <p className="text-xs text-text-tertiary mt-1 italic">No description provided</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                <div>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Priority</span>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityColor(selectedTemplateForDetails.defaultPriority)}`}>
                    {selectedTemplateForDetails.defaultPriority}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Department</span>
                  <span className="inline-block mt-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 px-2 py-0.5 rounded text-xs font-semibold">
                    {selectedTemplateForDetails.department || "General"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                <div>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Frequency</span>
                  <span className="inline-block mt-1 text-xs text-text-secondary font-semibold">
                    {selectedTemplateForDetails.frequency === "CUSTOM" && selectedTemplateForDetails.customFrequency
                      ? selectedTemplateForDetails.customFrequency
                      : (selectedTemplateForDetails.frequency || "ONE_TIME").toLowerCase()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Recurrence Rule</span>
                  <span className="inline-block mt-1 text-xs text-text-secondary font-semibold">
                    {(selectedTemplateForDetails.recurrence?.rule || "NONE").toLowerCase()}
                  </span>
                </div>
              </div>

              {selectedTemplateForDetails.checklistItems && Array.isArray(selectedTemplateForDetails.checklistItems) && selectedTemplateForDetails.checklistItems.length > 0 && (
                <div className="pt-3 border-t border-border space-y-2">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                    Checklist Items ({selectedTemplateForDetails.checklistItems.length})
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedTemplateForDetails.checklistItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-bg border border-border rounded-xl">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span className="text-xs text-text-secondary truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-border mt-5">
              <button
                onClick={() => setSelectedTemplateForDetails(null)}
                className="px-5 py-2.5 border border-border-strong hover:bg-bg text-text-secondary hover:text-text-primary font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close Blueprint
              </button>
              {(currentUser?.role === "ADMIN" || currentUser?.role === "EMPLOYEE") && (
                <button
                  onClick={() => {
                    setSelectedEmployeeIds([]);
                    setDueDate("");
                    setShowAssignBulkModal(true);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Assign the task now
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Bulk Assign Modal */}
      {selectedTemplateForDetails && showAssignBulkModal && (
        <>
          <div
            onClick={() => setShowAssignBulkModal(false)}
            className="fixed inset-0 bg-black/35 backdrop-blur-xs z-50 transition-opacity"
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-55 w-full max-w-md bg-surface border border-border rounded-3xl shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between pb-3 mb-4 border-b border-border shrink-0">
              <div>
                <span className="text-sm font-extrabold text-text-primary block">
                  Bulk Assignment Blueprint
                </span>
                <span className="text-[11px] text-text-tertiary font-semibold block mt-0.5">
                  Template: {selectedTemplateForDetails.name}
                </span>
              </div>
              <button
                onClick={() => setShowAssignBulkModal(false)}
                className="p-1 hover:bg-bg rounded-xl text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form & List */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1 pb-4">
              {/* Due Date picker */}
              <div>
                <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5">
                  Task Due Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-surface-raised text-text-primary border border-border-strong rounded-xl text-xs font-semibold focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none p-2"
                />
              </div>

              {/* Employees List */}
              <div className="space-y-2">
                {(() => {
                  const deptEmployees = employees.filter((e) =>
                    e.isActive &&
                    (selectedTemplateForDetails.department === "General" ||
                      e.department === selectedTemplateForDetails.department)
                  );

                  if (deptEmployees.length === 0) {
                    return (
                      <div className="text-center py-8 text-xs text-rose-500 font-semibold bg-rose-50 dark:bg-rose-955/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30">
                        No active employees found in the "{selectedTemplateForDetails.department || "General"}" department to assign this blueprint to.
                      </div>
                    );
                  }

                  const allSelected = deptEmployees.every((e) => selectedEmployeeIds.includes(e.id));

                  return (
                    <>
                      <div className="flex items-center justify-between py-1 px-1 border-b border-border">
                        <label className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={() => handleSelectAll(deptEmployees)}
                            className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
                          />
                          Select All ({deptEmployees.length})
                        </label>
                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wide">
                          {selectedEmployeeIds.length} Checked
                        </span>
                      </div>

                      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                        {deptEmployees.map((emp) => {
                          const isChecked = selectedEmployeeIds.includes(emp.id);
                          return (
                            <label
                              key={emp.id}
                              className={cn(
                                "flex items-center gap-3 p-2 border border-border rounded-xl cursor-pointer hover:bg-bg/40 transition-colors select-none",
                                isChecked ? "bg-bg/60 border-brand/20" : ""
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleEmployeeSelection(emp.id)}
                                className="rounded text-brand focus:ring-brand/30 h-3.5 w-3.5 cursor-pointer"
                              />
                              <UserAvatar src={emp.avatarUrl} name={emp.name} size="sm" />
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-text-primary block truncate">
                                  {emp.name}
                                </span>
                                <span className="text-[10px] text-text-tertiary block truncate">
                                  {emp.jobTitle || "Staff"} &bull; {emp.department || "General"}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border shrink-0 bg-bg/15">
              <button
                type="button"
                onClick={() => setShowAssignBulkModal(false)}
                className="px-5 py-2.5 border border-border-strong hover:bg-bg text-text-secondary hover:text-text-primary font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Back to Specs
              </button>
              <button
                type="button"
                disabled={assigningBulk || selectedEmployeeIds.length === 0}
                onClick={handleBulkAssign}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {assigningBulk ? "Assigning..." : `Assign tasks (${selectedEmployeeIds.length})`}
              </button>
            </div>
          </div>
        </>
      )}
      {showImport && (
        <ImportTemplatesModal
          onClose={() => setShowImport(false)}
          onImported={fetchTemplates}
        />
      )}
    </div>
  );
}

function ImportTemplatesModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const toast = useToast();

  const handleDownloadTemplate = () => {
    const headers = [
      "name",
      "description",
      "defaultPriority",
      "department",
      "frequency",
      "customFrequency",
      "recurrence",
      "remindVia",
      "checklistItems"
    ];
    const exampleRow = [
      "Weekly Server Maintenance",
      "Perform routine database optimization and security scans",
      "MEDIUM",
      "Engineering",
      "WEEKLY",
      "",
      "WEEKLY",
      "whatsapp,email",
      "Check disk usage|Run apt-get update|Verify backup integrity|Restart services"
    ];
    const csvContent = [
      headers.join(","),
      exampleRow.map(val => `"${val.replace(/"/g, '""')}"`).join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "task_template_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV import template downloaded.");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setImporting(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        const parsed = data.map((row: any) => {
          const getVal = (keys: string[]) => {
            const key = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
            return key ? row[key] : null;
          };

          return {
            name: getVal(["name", "template name", "title", "blueprint name"]),
            description: getVal(["description", "desc", "details"]),
            defaultPriority: getVal(["defaultpriority", "priority", "default priority"]) || "MEDIUM",
            department: getVal(["department", "dept"]) || "General",
            frequency: getVal(["frequency", "task frequency"]) || "ONE_TIME",
            customFrequency: getVal(["customfrequency", "custom frequency"]),
            recurrence: getVal(["recurrence", "recurrence rule", "recurrenceRule"]) || "NONE",
            remindVia: getVal(["remindvia", "remind via", "remind"]),
            checklistItems: getVal(["checklistitems", "checklist items", "checklist", "subtasks"]),
          };
        }).filter(t => t.name && String(t.name).trim());

        if (parsed.length === 0) {
          toast.error("No valid templates found. Make sure to have a 'name' column.");
          setImporting(false);
          return;
        }

        const res = await fetch("/api/task-templates/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templates: parsed }),
        });

        const payload = await res.json();
        if (payload.success) {
          toast.success(`Successfully imported ${payload.data.importedCount} task templates!`);
          onImported();
          onClose();
        } else {
          toast.error(payload.error || "Failed to import templates.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error parsing file.");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-[3px] z-50" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-55 w-full max-w-[420px] bg-surface border border-border rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
          <h3 className="text-sm font-extrabold text-text-primary">Import Task Blueprints</h3>
          <button onClick={onClose} className="p-1 hover:bg-bg rounded-xl text-text-tertiary hover:text-text-primary transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-xs text-text-secondary leading-relaxed">
            Select a CSV or Excel (.xlsx/.xls) file containing task blueprints. Column headers must include <strong>name</strong>. Multiple sub-tasks should be pipe-separated (e.g. <code>Item 1|Item 2</code>).
          </p>

          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
                className="w-full text-xs text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border file:border-border-strong file:text-xs file:font-semibold file:bg-bg file:text-text-primary file:cursor-pointer"
              />
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold border border-indigo-100 dark:border-indigo-900/50 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
              title="Download CSV Template"
            >
              <Download className="w-3.5 h-3.5" />
              Template
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-border-strong hover:bg-bg text-text-secondary hover:text-text-primary font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={importing || !file}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            {importing ? "Importing..." : "Upload & Import"}
          </button>
        </div>
      </div>
    </>
  );
}
