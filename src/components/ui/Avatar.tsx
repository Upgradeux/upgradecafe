import React from "react";

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = "md",
  className = "",
}) => {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "UC";

  const sizeStyles = {
    sm: "w-7 h-7 text-[11px]",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden font-semibold border border-[var(--color-border)] select-none bg-[var(--color-border-subtle)] text-[var(--color-foreground)] flex-shrink-0 ${sizeStyles[size]} ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};
