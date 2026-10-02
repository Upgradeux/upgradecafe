"use client";

import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-[var(--radius-button)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

    const sizeStyles = {
      sm: "text-xs px-2.5 py-1.5 gap-1.5 h-8",
      md: "text-sm px-3.5 py-2 gap-2 h-9",
      lg: "text-base px-4 py-2.5 gap-2.5 h-10",
    };

    const variantStyles = {
      primary:
        "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:opacity-95 shadow-[var(--shadow-subtle)] focus-visible:ring-[var(--color-primary)]",
      secondary:
        "bg-[var(--color-border-subtle)] text-[var(--color-foreground)] hover:bg-[var(--color-border)] active:opacity-90 focus-visible:ring-[var(--color-muted)]",
      outline:
        "border border-[var(--color-border)] bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] focus-visible:ring-[var(--color-primary)]",
      danger:
        "bg-[var(--color-danger)] text-white hover:opacity-90 active:opacity-95 shadow-[var(--shadow-subtle)] focus-visible:ring-[var(--color-danger)]",
      ghost:
        "bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] hover:text-[var(--color-foreground)] focus-visible:ring-[var(--color-muted)]",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-0.5 mr-1.5 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
