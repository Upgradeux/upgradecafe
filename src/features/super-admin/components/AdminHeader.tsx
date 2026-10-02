"use client";

import React from "react";
import Link from "next/link";
import { IconPlus, IconReceipt, IconShieldCheck } from "@tabler/icons-react";
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
    <header className="h-16 px-8 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between sticky top-0 z-20">
      <div>
        {title && (
          <h1 className="text-base font-semibold text-[var(--color-foreground)] tracking-tight">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-xs text-[var(--color-muted)] leading-normal">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-border-subtle)] text-[11px] font-medium text-[var(--color-muted)]">
          <IconShieldCheck className="w-3.5 h-3.5 text-[var(--color-success)]" />
          <span>Tenant Isolation Active</span>
        </div>

        {onRecordPaymentClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRecordPaymentClick}
            leftIcon={<IconReceipt className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
          >
            Record Payment
          </Button>
        )}

        <Link href="/admin/cafes/new">
          <Button
            size="sm"
            leftIcon={<IconPlus className="w-3.5 h-3.5" />}
          >
            Add Café
          </Button>
        </Link>
      </div>
    </header>
  );
};
