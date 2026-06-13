"use client";

import React from "react";
import { X, Calendar, Edit, Check } from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/rbac";
import { useTaskDetail } from "./useTaskDetail";

// Sub-components
import { TaskDetailsTab } from "./TaskDetailsTab";
import { TaskCommentsTab } from "./TaskCommentsTab";
import { TaskSubtasksTab } from "./TaskSubtasksTab";
import { TaskUpdatesTab } from "./TaskUpdatesTab";
import { TaskDetailSidebar } from "./TaskDetailSidebar";

export function TaskDetailPanel({ onClose }: { onClose: () => void }) {
  const {
    task,
    activeTab,
    setActiveTab,
    editMode,
    setEditMode,
    loading,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editPriority,
    setEditPriority,
    editDueDate,
    setEditDueDate,
    editAssigneeId,
    setEditAssigneeId,
    editEstimatedHours,
    setEditEstimatedHours,
    editEstimatedMins,
    setEditEstimatedMins,
    editDepartment,
    setEditDepartment,
    editFrequency,
    setEditFrequency,
    editCustomFrequency,
    setEditCustomFrequency,
    selectedColleagueId,
    setSelectedColleagueId,
    updates,
    updateSelectedFiles,
    setUpdateSelectedFiles,
    updateVoiceRecordings,
    setUpdateVoiceRecordings,
    showUpdateVoiceModal,
    setShowUpdateVoiceModal,
    updateFileInputRef,
    newRemark,
    setNewRemark,
    newCommentText,
    setNewCommentText,
    newSubtaskTitle,
    setNewSubtaskTitle,
    subtasks,
    employees,
    departments,
    directComments,
    newDirectComment,
    setNewDirectComment,
    directAttachmentLoading,
    directAttachmentInputRef,
    handleUpdateFileChange,
    handleUpdateVoiceSave,
    handleChecklistToggle,
    handleSaveChanges,
    handleProgressChange,
    handleDelegateAssignee,
    handleDelegationAction,
    handleUploadDirectAttachments,
    handlePostUpdate,
    handlePostComment,
    handlePostDirectComment,
    handleAddSubtask,
    handleDeleteTask,
    handleUpdateStatus,
    handleToggleSubtaskStatus,
    handleSaveSubtaskRemark,
    currentUser,
  } = useTaskDetail(onClose);

  if (!task) return null;

  const canEdit = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER" || currentUser?.role === "TEAM_LEADER";
  const canDelegate = currentUser ? hasPermission(currentUser.role, "delegate") : false;
  const canCreateSubtask = currentUser ? hasPermission(currentUser.role, "create_subtask") : false;

  return (
    <>
      {/* Centered Modal Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-[3px] transition-all duration-300 flex items-center justify-center z-[50] p-4 max-sm:p-0"
      >
        {/* Modal Container */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "bg-surface border border-border shadow-2xl flex flex-col transition-all duration-200 ease-in-out",
            "w-full max-w-5xl h-[90vh] max-h-[850px] rounded-xl overflow-hidden animate-in zoom-in-95 max-sm:h-full max-sm:rounded-none"
          )}
        >
          {/* Header */}
          <div className="p-4 px-6 border-b border-border flex items-center justify-between gap-4 shrink-0 bg-bg/10">
            <div className="flex-1 min-w-0">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                  {task.department || "General"}
                </span>
                {task.frequency && task.frequency !== "ONE_TIME" && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">
                    🔄 {task.frequency === "CUSTOM" ? (task.customFrequency || "Custom") : task.frequency}
                  </span>
                )}
                {task.dueDate && (
                  <span className="flex items-center gap-1 text-text-tertiary text-[11px] ml-2">
                    <Calendar className="w-3.5 h-3.5" />
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Title / Edit Title */}
              {editMode ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border-strong rounded bg-bg text-text-primary text-[16px] font-semibold focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none"
                />
              ) : (
                <h2 className="text-text-primary font-semibold tracking-tight text-lg truncate">
                  {task.title}
                </h2>
              )}
            </div>

            {/* Close & Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {canEdit && (
                <button
                  onClick={() => (editMode ? handleSaveChanges() : setEditMode(true))}
                  disabled={loading}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-bg hover:text-text-primary transition-all focus:outline-none border border-border"
                  title={editMode ? "Save Changes" : "Edit Fields"}
                >
                  {editMode ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Edit className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-bg hover:text-text-primary transition-all focus:outline-none border border-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Columns */}
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
            {/* Left Area (2/3 size) */}
            <div className="md:col-span-2 overflow-y-auto p-6 space-y-6 border-r border-border flex flex-col min-h-0">
              {/* Tab Selector */}
              <div className="h-9 flex border-b border-border shrink-0 bg-bg/5 rounded-t-md">
                {(["details", "updates", "subtasks", "comments"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "h-full flex items-center font-normal px-4 text-text-secondary border-b-2 border-transparent transition-all cursor-pointer hover:text-text-primary uppercase tracking-[0.05em]",
                      activeTab === tab && "border-brand text-text-primary font-semibold"
                    )}
                    style={{ fontSize: "0.75rem" }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Scrollable tab panel contents */}
              <div className="flex-1 min-h-0 space-y-5">
                {activeTab === "details" && (
                  <TaskDetailsTab
                    task={task}
                    editMode={editMode}
                    editDescription={editDescription}
                    setEditDescription={setEditDescription}
                    editAssigneeId={editAssigneeId}
                    setEditAssigneeId={setEditAssigneeId}
                    editPriority={editPriority}
                    setEditPriority={setEditPriority}
                    editDepartment={editDepartment}
                    setEditDepartment={setEditDepartment}
                    editFrequency={editFrequency}
                    setEditFrequency={setEditFrequency}
                    editCustomFrequency={editCustomFrequency}
                    setEditCustomFrequency={setEditCustomFrequency}
                    editDueDate={editDueDate}
                    setEditDueDate={setEditDueDate}
                    editEstimatedHours={editEstimatedHours}
                    setEditEstimatedHours={setEditEstimatedHours}
                    editEstimatedMins={editEstimatedMins}
                    setEditEstimatedMins={setEditEstimatedMins}
                    employees={employees}
                    departments={departments}
                  />
                )}

                {activeTab === "comments" && (
                  <TaskCommentsTab
                    directComments={directComments}
                    newDirectComment={newDirectComment}
                    setNewDirectComment={setNewDirectComment}
                    handlePostDirectComment={handlePostDirectComment}
                  />
                )}

                {activeTab === "updates" && (
                  <TaskUpdatesTab
                    updates={updates}
                    newRemark={newRemark}
                    setNewRemark={setNewRemark}
                    handlePostUpdate={handlePostUpdate}
                    updateSelectedFiles={updateSelectedFiles}
                    setUpdateSelectedFiles={setUpdateSelectedFiles}
                    updateVoiceRecordings={updateVoiceRecordings}
                    setUpdateVoiceRecordings={setUpdateVoiceRecordings}
                    showUpdateVoiceModal={showUpdateVoiceModal}
                    setShowUpdateVoiceModal={setShowUpdateVoiceModal}
                    updateFileInputRef={updateFileInputRef}
                    newCommentText={newCommentText}
                    setNewCommentText={setNewCommentText}
                    handlePostComment={handlePostComment}
                    handleUpdateFileChange={handleUpdateFileChange}
                    handleUpdateVoiceSave={handleUpdateVoiceSave}
                  />
                )}

                {activeTab === "subtasks" && (
                  <TaskSubtasksTab
                    task={task}
                    canCreateSubtask={canCreateSubtask}
                    newSubtaskTitle={newSubtaskTitle}
                    setNewSubtaskTitle={setNewSubtaskTitle}
                    handleAddSubtask={handleAddSubtask}
                    handleChecklistToggle={handleChecklistToggle}
                    subtasks={subtasks}
                    handleToggleSubtaskStatus={handleToggleSubtaskStatus}
                    handleSaveSubtaskRemark={handleSaveSubtaskRemark}
                  />
                )}
              </div>
            </div>

            {/* Right Area Sidebar (1/3 size) */}
            <TaskDetailSidebar
              task={task}
              subtasks={subtasks}
              currentUser={currentUser}
              employees={employees}
              canDelegate={canDelegate}
              handleProgressChange={handleProgressChange}
              handleDelegateAssignee={handleDelegateAssignee}
              directAttachmentLoading={directAttachmentLoading}
              directAttachmentInputRef={directAttachmentInputRef}
              handleUploadDirectAttachments={handleUploadDirectAttachments}
              handleDeleteTask={handleDeleteTask}
              handleDelegationAction={handleDelegationAction}
              selectedColleagueId={selectedColleagueId}
              setSelectedColleagueId={setSelectedColleagueId}
              handleUpdateStatus={handleUpdateStatus}
            />
          </div>
        </div>
      </div>
    </>
  );
}
