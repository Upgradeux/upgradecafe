"use client";

import React from "react";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center gap-1 border-b border-[var(--color-border)] ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-xs font-semibold tracking-wide transition-colors cursor-pointer select-none -mb-px ${
              isActive
                ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                  isActive
                    ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                    : "bg-[var(--color-border-subtle)] text-[var(--color-muted)]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
