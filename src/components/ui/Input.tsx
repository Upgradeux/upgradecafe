"use client";

import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = "",
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[var(--color-foreground)] tracking-wide"
          >
            {label}
            {props.required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[var(--color-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full text-sm bg-[var(--color-surface)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]/70 border rounded-[var(--radius-input)] shadow-xs px-3 py-2 transition-colors duration-150 focus:outline-none focus:ring-1 ${
              leftIcon ? "pl-9" : ""
            } ${rightIcon ? "pr-9" : ""} ${
              error
                ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20"
                : "border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
            } ${disabled ? "opacity-60 bg-[var(--color-background)] cursor-not-allowed" : ""} ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-[var(--color-muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-[var(--color-danger)] font-medium mt-0.5">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-[var(--color-muted)] mt-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
