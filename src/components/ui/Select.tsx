"use client";

import React from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      error,
      helperText,
      placeholder,
      className = "",
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-[var(--color-foreground)] tracking-wide"
          >
            {label}
            {props.required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`w-full appearance-none text-sm bg-[var(--color-surface)] text-[var(--color-foreground)] border rounded-[var(--radius-input)] px-3 py-2 pr-8 transition-colors duration-150 focus:outline-none focus:ring-1 cursor-pointer ${
              error
                ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]"
                : "border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            } ${disabled ? "opacity-60 bg-[var(--color-background)] cursor-not-allowed" : ""} ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 pointer-events-none text-[var(--color-muted)] flex items-center">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error && <p className="text-xs text-[var(--color-danger)] font-medium mt-0.5">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-[var(--color-muted)] mt-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
