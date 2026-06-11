"use client";

import React, { useState, useEffect } from "react";
import { useBulkAssign } from "./useBulkAssign";
import { useTaskStore } from "@/store/useTaskStore";
import { useToast } from "@/hooks/useToast";
import { Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { TaskTemplate, Priority } from "@/types";
import { uploadFiles } from "@/lib/uploadthing-client";

// Step Components
import { DeptModeStep } from "./DeptModeStep";
import { TemplateChecklistStep } from "./TemplateChecklistStep";
import { TitlesStep } from "./TitlesStep";
import { DescriptionsStep } from "./DescriptionsStep";
import { TaskDetailsStep } from "./TaskDetailsStep";
import { AttachmentsStep } from "./AttachmentsStep";
import { ReviewStep } from "./ReviewStep";

interface BulkAssignModalProps {
  onClose: () => void;
}

export function BulkAssignModal({ onClose }: BulkAssignModalProps) {
  const {
    dept,
    mode,
    selectedTemplates,
    titles,
    descriptions,
    details,
    files,
    voiceRecordings,
    setTasks,
    reset,
  } = useBulkAssign();

  const { fetchTasks } = useTaskStore();
  const toast = useToast();

  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);

  // Fetch templates list on mount to resolve template items to tasks on the fly
  useEffect(() => {
    fetch("/api/task-templates")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) {
          setTemplates(payload.data || []);
        }
      })
      .catch((err) => console.error("Failed to fetch templates:", err));
  }, []);

  // Dynamic step definitions based on chosen mode (now 6 steps!)
  const getSteps = () => {
    if (mode === "template") {
      return [
        { key: "dept", label: "Department" },
        { key: "templates", label: "Templates" },
        { key: "descriptions", label: "Descriptions" },
        { key: "details", label: "Details" },
        { key: "attachments", label: "Attachments" },
        { key: "review", label: "Review" },
      ];
    }
    // Default or custom mode
    return [
      { key: "dept", label: "Department" },
      { key: "titles", label: "Titles" },
      { key: "descriptions", label: "Descriptions" },
      { key: "details", label: "Details" },
      { key: "attachments", label: "Attachments" },
      { key: "review", label: "Review" },
    ];
  };

  const steps = getSteps();
  const totalSteps = steps.length;
  const currentStep = steps[stepIndex];

  const handleNext = () => {
    setError(null);

    // 1. Validation & Resolution
    if (currentStep.key === "dept") {
      if (!dept) {
        setError("Please select a department.");
        return;
      }
      if (!mode) {
        setError("Please select an assignment mode.");
        return;
      }
    }

    if (currentStep.key === "templates") {
      if (selectedTemplates.size === 0) {
        setError("Please select at least one task template.");
        return;
      }

      // Resolve selected templates into customized task list in the store
      const selected = templates.filter((t) => selectedTemplates.has(t.id));
      const resolvedTasks: any[] = [];
      for (const t of selected) {
        if (t.items && t.items.length > 0) {
          for (const item of t.items) {
            resolvedTasks.push({
              title: item.title,
              description: item.description || "",
              priority: (item.priority as Priority) || "MEDIUM",
              assigneeId: "",
              dueDate: null,
            });
          }
        } else {
          // Fallback compatibility with single task templates
          resolvedTasks.push({
            title: t.name,
            description: t.description || "",
            priority: t.defaultPriority || "MEDIUM",
            assigneeId: "",
            dueDate: null,
          });
        }
      }
      setTasks(resolvedTasks);
    }

    if (currentStep.key === "titles") {
      const hasValidTitle = titles.some((t) => t.trim() !== "");
      if (!hasValidTitle) {
        setError("Please enter at least one task title.");
        return;
      }
    }

    // Move to next step
    if (stepIndex < totalSteps - 1) {
      setStepIndex(stepIndex + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handleAssign = async () => {
    setError(null);
    setSubmitting(true);

    try {
      // Upload attachments per task first
      const tasksPayload = [];
      for (let i = 0; i < titles.length; i++) {
        if (titles[i].trim()) {
          const taskFiles = files[i] || [];
          const taskVoices = voiceRecordings[i] || [];
          const filesToUpload: File[] = [];

          taskFiles.forEach((file) => filesToUpload.push(file));
          taskVoices.forEach((v) => {
            const file = new File([v.blob], v.name, { type: v.blob.type });
            filesToUpload.push(file);
          });

          let uploadedAttachments: any[] = [];
          if (filesToUpload.length > 0) {
            toast.info(`Uploading attachments for Task T${i + 1}...`);
            const uploadRes = await uploadFiles("taskAttachment", {
              files: filesToUpload,
            });
            uploadedAttachments = uploadRes.map((res) => ({
              url: res.url,
              filename: res.name,
            }));
          }

          tasksPayload.push({
            title: titles[i].trim(),
            description: descriptions[i]?.trim() || null,
            priority: details[i]?.priority || "MEDIUM",
            assigneeId: details[i]?.assigneeId || null,
            dueDate: details[i]?.dueDate || null,
            frequency: details[i]?.frequency || "ONE_TIME",
            customFrequency: details[i]?.customFrequency || "",
            recurrenceRule: details[i]?.recurrenceRule || "NONE",
            reminderSettings: details[i]?.reminderSettings || null,
            remindVia: [
              details[i]?.remindWhatsApp && "whatsapp",
              details[i]?.remindEmail && "email",
            ].filter(Boolean),
            attachments: uploadedAttachments,
          });
        }
      }

      if (tasksPayload.length === 0) {
        setError("No tasks found to assign.");
        setSubmitting(false);
        return;
      }

      const payload: any = {
        department: dept,
        mode: mode,
        tasks: tasksPayload,
      };

      if (mode === "template") {
        payload.selectedTemplates = Array.from(selectedTemplates);
      }

      const res = await fetch("/api/tasks/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Successfully assigned ${data.data?.count || "all"} tasks!`);
        fetchTasks(); // Refresh dashboard
        reset(); // Clear store state
        onClose(); // Close modal
      } else {
        setError(data.error || "Failed to bulk assign tasks.");
      }
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred during assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep.key) {
      case "dept":
        return <DeptModeStep />;
      case "templates":
        return <TemplateChecklistStep />;
      case "titles":
        return <TitlesStep />;
      case "descriptions":
        return <DescriptionsStep />;
      case "details":
        return <TaskDetailsStep />;
      case "attachments":
        return <AttachmentsStep />;
      case "review":
        return <ReviewStep />;
      default:
        return null;
    }
  };

  const handleModalClose = () => {
    reset();
    onClose();
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={handleModalClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center animate-in fade-in duration-150"
        style={{ zIndex: "var(--z-modal-backdrop)" }}
      />

      {/* Main modal container */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[650px] max-h-[85vh] overflow-y-auto bg-surface rounded-xl shadow-lg flex flex-col animate-in zoom-in-95 duration-150 border border-border"
        style={{ zIndex: "var(--z-modal)" }}
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-border flex flex-col gap-3 shrink-0 relative">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[15px] font-medium text-text-primary">Bulk Assign Tasks</h2>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Step {stepIndex + 1} of {totalSteps} — {currentStep.label}
              </p>
            </div>
            <button
              onClick={handleModalClose}
              type="button"
              className="absolute top-4 right-4 w-6 h-6 rounded-full hover:bg-bg flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors focus-visible:outline-none cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stepper Horizontal Indicator */}
          <div className="flex items-center gap-1.5 py-1">
            {steps.map((s, idx) => {
              const isActive = idx === stepIndex;
              const isCompleted = idx < stepIndex;

              return (
                <React.Fragment key={s.key}>
                  {idx > 0 && (
                    <div
                      className={cn(
                        "h-[2px] flex-1 min-w-[12px] rounded-full",
                        isCompleted ? "bg-[#10B981]" : "bg-border-strong"
                      )}
                    />
                  )}
                  <div className="flex items-center gap-1">
                    {/* Circle */}
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 border transition-all",
                        isActive
                          ? "bg-brand/10 border-brand text-brand"
                          : isCompleted
                          ? "bg-[#10B981] border-[#10B981] text-white"
                          : "bg-surface-raised border-border-strong text-text-disabled"
                      )}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    {/* Step label (hidden on narrow screens to look perfect) */}
                    <span
                      className={cn(
                        "text-[10px] font-extrabold hidden sm:inline tracking-wider uppercase",
                        isActive
                          ? "text-brand"
                          : isCompleted
                          ? "text-[#10B981]"
                          : "text-text-disabled"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Inline Error Banner */}
          {error && (
            <div className="p-3 bg-[#FEF2F2] dark:bg-red-955/20 text-[#EF4444] dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-900/40 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="shrink-0 text-red-400 hover:text-red-600 font-bold ml-1.5 focus:outline-none"
              >
                ×
              </button>
            </div>
          )}

          {renderStepContent()}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-border flex items-center justify-between shrink-0 bg-bg/15">
          {/* Back button */}
          <div>
            {stepIndex > 0 && (
              <Button
                type="button"
                onClick={handleBack}
                variant="secondary"
                size="md"
                className="h-[34px] px-4"
              >
                Back
              </Button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleModalClose}
              variant="ghost"
              size="md"
              className="h-[34px] px-4"
            >
              Cancel
            </Button>
            {stepIndex === totalSteps - 1 ? (
              <Button
                type="button"
                onClick={handleAssign}
                disabled={submitting}
                variant="primary"
                size="md"
                className="h-[34px] px-4 bg-brand hover:bg-brand-hover text-white font-bold"
              >
                {submitting ? "Assigning..." : "Assign Tasks"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                variant="primary"
                size="md"
                className="h-[34px] px-4 bg-brand hover:bg-brand-hover text-white font-bold"
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
