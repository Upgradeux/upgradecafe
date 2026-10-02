"use client";

import React from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      className = "",
      id,
      disabled,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-semibold text-[var(--color-foreground)] tracking-wide"
          >
            {label}
            {props.required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          className={`w-full text-sm bg-[var(--color-surface)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] border rounded-[var(--radius-input)] p-3 transition-colors duration-150 focus:outline-none focus:ring-1 ${
            error
              ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]"
              : "border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]"
          } ${disabled ? "opacity-60 bg-[var(--color-background)] cursor-not-allowed" : ""} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-[var(--color-danger)] font-medium mt-0.5">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-[var(--color-muted)] mt-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
