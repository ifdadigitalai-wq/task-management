import React from "react";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({ src, name = "User", size = "md" }: UserAvatarProps) {
  // 1. Map sizes to Tailwind dimensions
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
  };

  // 2. Generate initials from the name (e.g., "John Doe" -> "JD", "Admin" -> "AD")
  const getInitials = (fullName: string) => {
    const parts = fullName.split(" ").filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const initials = getInitials(name || "User");

  return (
    <div
      className={`${sizeClasses[size]} relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 border border-blue-200 dark:bg-slate-700 dark:border-slate-600 text-blue-700 dark:text-blue-100 font-semibold`}
    >
      {src ? (
        <img
          src={src}
          alt={name || "User avatar"}
          className="h-full w-full object-cover"
          onError={(e) => {
            // If the image link is broken, hide the image and show the initials instead
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}