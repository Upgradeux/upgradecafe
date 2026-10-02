"use client";

import React, { useState, useRef, useEffect } from "react";

export interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: "default" | "danger";
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = "right",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute z-30 mt-1.5 w-48 rounded-[var(--radius-button)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-dropdown)] py-1 focus:outline-none ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item, index) => (
            <button
              key={index}
              disabled={item.disabled}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  setIsOpen(false);
                }
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                item.variant === "danger"
                  ? "text-[var(--color-danger)] hover:bg-[var(--color-danger-light)]"
                  : "text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)]"
              }`}
            >
              {item.icon && <span className="w-4 h-4 flex items-center">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
