"use client";

import React, { useState, useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { FileText, Plus, Trash2, X, AlertTriangle, Layers, ListTodo } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { TaskTemplate, Priority } from "@/types";

export default function TaskTemplatesPage() {
  const { currentUser } = useTaskStore();
  const toast = useToast();

  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Template Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultPriority, setDefaultPriority] = useState<Priority>("MEDIUM");
  
  // Checklist builder
  const [checklist, setChecklist] = useState<string[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");

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
        }),
      });

      const payload = await res.json();
      if (payload.success) {
        toast.success("Template created successfully.");
        setTemplates([...templates, payload.data]);
        setIsOpen(false);
        // reset
        setName("");
        setDescription("");
        setDefaultPriority("MEDIUM");
        setChecklist([]);
      } else {
        toast.error(payload.error || "Failed to create template.");
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
            onClick={() => setIsOpen(true)}
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
                    <button
                      onClick={() => handleDeleteTemplate(t.id)}
                      className="p-1 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
      </div>

      {/* Add Blueprint Modal */}
      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/35 backdrop-blur-xs z-50 transition-opacity" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-55 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-150 dark:border-slate-850">
              <span className="text-sm font-extrabold text-slate-850 dark:text-slate-100">Create Task Blueprint</span>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-slate-450">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider mb-1.5">
                  Blueprint Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Server Maintenance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider mb-1.5">
                  Default Description
                </label>
                <textarea
                  placeholder="Enter details that should populate by default when this template is loaded..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider mb-1.5">
                  Default Priority
                </label>
                <select
                  value={defaultPriority}
                  onChange={(e) => setDefaultPriority(e.target.value as any)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              {/* Checklist rows builder */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-555 uppercase tracking-wider">
                  Checklist Blueprints
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add checklist sub-task item..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddChecklistItem(); } }}
                    className="w-full px-4 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none"
                  />
                  <button type="button" onClick={handleAddChecklistItem} className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {checklist.length > 0 && (
                  <div className="space-y-1.5 mt-2 max-h-24 overflow-y-auto">
                    {checklist.map((item) => (
                      <div key={item} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-850">
                        <span className="text-xs text-slate-700 dark:text-slate-350">{item}</span>
                        <button type="button" onClick={() => handleRemoveChecklistItem(item)} className="text-slate-400 hover:text-slate-650">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-400 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  Save Blueprint
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
