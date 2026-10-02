import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "active" | "grace" | "warning" | "suspended" | "archived" | "primary" | "neutral" | "success" | "danger";
  size?: "sm" | "md";
  showDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "sm",
  showDot = false,
  className = "",
  ...props
}) => {
  const variantStyles = {
    active:
      "bg-[var(--color-success-light)] text-[var(--color-success)] border border-[var(--color-success)]/20",
    success:
      "bg-[var(--color-success-light)] text-[var(--color-success)] border border-[var(--color-success)]/20",
    grace:
      "bg-[var(--color-warning-light)] text-[var(--color-warning)] border border-[var(--color-warning)]/20",
    warning:
      "bg-[var(--color-warning-light)] text-[var(--color-warning)] border border-[var(--color-warning)]/20",
    suspended:
      "bg-[var(--color-danger-light)] text-[var(--color-danger)] border border-[var(--color-danger)]/20",
    danger:
      "bg-[var(--color-danger-light)] text-[var(--color-danger)] border border-[var(--color-danger)]/20",
    archived:
      "bg-[var(--color-border-subtle)] text-[var(--color-muted)] border border-[var(--color-border)]",
    primary:
      "bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20",
    neutral:
      "bg-[var(--color-border-subtle)] text-[var(--color-foreground)] border border-[var(--color-border)]",
  };

  const dotColors = {
    active: "bg-[var(--color-success)]",
    success: "bg-[var(--color-success)]",
    grace: "bg-[var(--color-warning)]",
    warning: "bg-[var(--color-warning)]",
    suspended: "bg-[var(--color-danger)]",
    danger: "bg-[var(--color-danger)]",
    archived: "bg-[var(--color-muted)]",
    primary: "bg-[var(--color-primary)]",
    neutral: "bg-[var(--color-muted)]",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 font-medium tracking-wide",
    md: "text-xs px-2.5 py-1 font-medium tracking-wide",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} flex-shrink-0 animate-pulse`}
        />
      )}
      {children}
    </span>
  );
};
