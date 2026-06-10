"use client";

import React, { useState, useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { FileText, Plus, Trash2, X, AlertTriangle, Layers, ListTodo, Pencil } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { TaskTemplate, Priority } from "@/types";

export default function TaskTemplatesPage() {
  const { currentUser } = useTaskStore();
  const toast = useToast();

  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

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

        {isAdmin && (
          <button
            onClick={() => { resetForm(); setIsOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        )}
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full text-center py-20 text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-indigo-50 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
            Loading blueprints...
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-350">No Templates Defined</p>
            <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1 max-w-[280px]">
              Blueprints help team leaders assign standard processes quickly.
            </p>
          </div>
        ) : (
          templates.map((t) => (
            <div key={t.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl flex flex-col justify-between shadow-xs relative hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getPriorityColor(t.defaultPriority)}`}>
                    {t.defaultPriority}
                  </span>

                  {isAdmin && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartEdit(t)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                        title="Edit template"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(t.id)}
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

                <div className="flex flex-col gap-1.5 py-1 text-[10px] font-semibold text-slate-500 dark:text-slate-450 border-t border-slate-100 dark:border-slate-850 pt-2">
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
                  <div className="space-y-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-850">
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
      </div>   {/* Add/Edit Blueprint Modal */}
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
    </div>
  );
}
