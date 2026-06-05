"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  required,
  hint,
  error,
  className,
  children,
}: FormFieldProps) {
  // If the child is a valid input/select/textarea, we can optionally inject error styles
  const clonedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && error) {
      const childProps = child.props as any;
      return React.cloneElement(child, {
        className: cn(
          childProps.className,
          "border-priority-critical-text! focus:ring-priority-critical-text/10! focus:border-priority-critical-text!"
        ),
      } as any);
    }
    return child;
  });

  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      {label && (
        <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-tertiary">
          {label}
          {required && <span className="text-brand ml-0.5">*</span>}
        </label>
      )}
      
      {clonedChildren}
      
      {error ? (
        <span className="text-[10px] text-priority-critical-text font-medium mt-1">
          {error}
        </span>
      ) : hint ? (
        <span className="text-[10px] text-text-tertiary mt-1">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export default FormField;
