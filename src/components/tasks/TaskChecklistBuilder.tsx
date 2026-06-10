"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { FormField } from "@/components/ui/FormField";

interface ChecklistItem {
  text: string;
  completed: boolean;
}

interface TaskChecklistBuilderProps {
  checklist: ChecklistItem[];
  setChecklist: (items: ChecklistItem[]) => void;
}

export function TaskChecklistBuilder({ checklist, setChecklist }: TaskChecklistBuilderProps) {
  const [newChecklistItem, setNewChecklistItem] = useState("");

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklist([...checklist, { text: newChecklistItem.trim(), completed: false }]);
      setNewChecklistItem("");
    }
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  return (
    <FormField label="Checklist Items">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add checklist sub-task..."
          value={newChecklistItem}
          onChange={(e) => setNewChecklistItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddChecklistItem();
            }
          }}
          className="block w-full h-[34px] focus:border-brand focus:ring-2 focus:ring-brand/10"
        />
        <button
          type="button"
          onClick={handleAddChecklistItem}
          className="h-[34px] w-[34px] bg-bg hover:bg-surface-raised border border-border-strong rounded flex items-center justify-center text-text-secondary transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {checklist.length > 0 && (
        <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded bg-bg border border-border">
              <span className="text-[12px] text-text-primary font-medium">{item.text}</span>
              <button
                type="button"
                onClick={() => handleRemoveChecklistItem(i)}
                className="text-text-tertiary hover:text-text-primary focus-visible:outline-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </FormField>
  );
}
