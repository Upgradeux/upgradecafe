import React from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-10 text-center rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-[var(--color-border-subtle)] text-[var(--color-primary)] flex items-center justify-center mb-3 text-xl">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-semibold text-[var(--color-foreground)] tracking-tight">
        {title}
      </h4>
      <p className="text-xs text-[var(--color-muted)] max-w-sm mt-1 mb-4 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
