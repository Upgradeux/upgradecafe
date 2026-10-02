"use client";

import React from "react";
import Link from "next/link";
import { IconPlus, IconReceipt } from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";

export interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  onRecordPaymentClick?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  onRecordPaymentClick,
}) => {
  return (
    <header className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {title && (
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-2xl">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--color-muted)] sm:text-sm">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {onRecordPaymentClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRecordPaymentClick}
            leftIcon={<IconReceipt className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            Record payment
          </Button>
        )}

        <Link
          href="/admin/cafes/new"
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-[var(--color-primary)] px-3 text-xs font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-muted)] focus-visible:ring-offset-2"
        >
          <IconPlus className="h-3.5 w-3.5" aria-hidden="true" />
          Add cafe
        </Link>
      </div>
    </header>
  );
};
