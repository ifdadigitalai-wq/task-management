"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { FormField } from "@/components/ui/FormField";

interface TaskTagsBuilderProps {
  tags: string[];
  setTags: (tags: string[]) => void;
}

export function TaskTagsBuilder({ tags, setTags }: TaskTagsBuilderProps) {
  const [tagsInput, setTagsInput] = useState("");

  const handleAddTag = () => {
    if (tagsInput.trim() && !tags.includes(tagsInput.trim())) {
      setTags([...tags, tagsInput.trim()]);
      setTagsInput("");
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((tag) => tag !== t));
  };

  return (
    <FormField label="Tags (Comma-separated)">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="E.g., bug, billing"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "," || e.key === "Enter") {
              e.preventDefault();
              handleAddTag();
            }
          }}
          className="block w-full h-[34px] focus:border-brand focus:ring-2 focus:ring-brand/10"
        />
        <button
          type="button"
          onClick={handleAddTag}
          className="h-[34px] px-3 bg-bg hover:bg-surface-raised border border-border-strong rounded text-[12px] font-medium text-text-secondary transition-colors"
        >
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-light text-brand-text text-[11px] font-medium border border-brand/10"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:opacity-75 focus-visible:outline-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </FormField>
  );
}
