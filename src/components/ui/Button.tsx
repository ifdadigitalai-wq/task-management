"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", icon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center font-medium transition-all duration-120 select-none outline-none cursor-pointer",
          "active:scale-98",
          "disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100",
          "focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none",
          
          // Variants
          variant === "primary" && "bg-brand text-white hover:bg-brand-hover border-none",
          variant === "secondary" && "bg-bg text-text-primary border border-border-strong hover:bg-surface-raised",
          variant === "ghost" && "bg-transparent text-text-secondary border-none hover:bg-bg hover:text-text-primary",
          variant === "danger" && "bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA] hover:bg-[#FEE2E2] dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40 dark:hover:bg-red-950/30",
          
          // Sizes
          size === "sm" && "h-7 px-2.5 text-sm rounded-md gap-1.5",
          size === "md" && "h-[34px] px-[14px] text-base rounded-md gap-1.5",
          size === "lg" && "h-10 px-[18px] text-md rounded-md gap-1.5",
          className
        )}
        {...props}
      >
        {icon && <span className="flex items-center justify-center shrink-0 w-4 h-4">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
