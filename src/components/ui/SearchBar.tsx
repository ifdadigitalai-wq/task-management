"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search tasks, tags...",
  debounceMs = 300,
  className,
}: SearchBarProps) {
  const [innerValue, setInnerValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInnerValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInnerValue(val);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onChange(val);
    }, debounceMs);
  };

  const handleClear = () => {
    setInnerValue("");
    onChange("");
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className={cn("relative w-[200px] h-8 shrink-0", className)}>
      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-text-tertiary">
        <Search className="h-3.5 w-3.5" />
      </div>
      <input
        type="text"
        value={innerValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "block w-full h-full !pl-9 pr-7 !py-0 bg-bg text-text-primary placeholder:text-text-tertiary placeholder:text-[12px] text-base border border-border-strong rounded-md transition-all duration-200 outline-none",
          "focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none"
        )}
      />
      {innerValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-text-tertiary hover:text-text-primary transition-colors focus-visible:outline-none"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
