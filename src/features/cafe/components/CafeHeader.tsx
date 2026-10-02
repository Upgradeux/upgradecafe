"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import {
  IconToolsKitchen2,
  IconArmchair,
  IconQrcode,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { AccessState } from "@/server/services/access-state.service";

interface CafeHeaderProps {
  cafeSlug: string;
  cafeName: string;
  accessState: AccessState;
  cafeLogoKey?: string | null;
  onNewMenuItem?: () => void;
  onNewTable?: () => void;
}

export const CafeHeader: React.FC<CafeHeaderProps> = ({
  cafeSlug,
  cafeName,
  accessState,
  cafeLogoKey,
  onNewMenuItem,
  onNewTable,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-xs">
      {/* Grace Period Alert Banner if applicable */}
      {accessState.status === "GRACE" && (
        <div className="bg-[var(--color-warning-light)] text-[var(--color-warning)] px-6 py-2 text-xs font-semibold flex items-center justify-between border-b border-[var(--color-warning)]/20">
          <div className="flex items-center gap-2">
            <IconAlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              Subscription in Grace Period: {accessState.graceDaysRemaining} day(s) remaining before automatic suspension.
            </span>
          </div>
          <span className="text-[11px] font-normal underline">
            Contact UpgradeCafe Platform Admin to renew
          </span>
        </div>
      )}

      <div className="h-16 px-6 flex items-center justify-between gap-4">
        {/* Left: Tenant Identity & Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-md overflow-hidden bg-white p-0.5 border border-[var(--color-border-subtle)] flex-shrink-0 flex items-center justify-center shadow-2xs">
            {cafeLogoKey ? (
              <img
                src={cafeLogoKey}
                alt={cafeName}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-xs font-bold text-[var(--color-primary)]">
                {cafeName.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--color-foreground)] truncate">
              {cafeName}
            </h1>
            <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
              <span>/cafe/{cafeSlug}</span>
              <span>•</span>
              <Badge
                variant={
                  accessState.status === "ACTIVE"
                    ? "success"
                    : accessState.status === "GRACE"
                    ? "warning"
                    : "danger"
                }
                size="sm"
              >
                {accessState.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Right: Quick Operational Actions */}
        <div className="flex items-center gap-2">
          {onNewMenuItem ? (
            <button
              onClick={onNewMenuItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-button)] text-xs font-semibold bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
            >
              <IconToolsKitchen2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Item</span>
            </button>
          ) : (
            <Link
              href={`/cafe/${cafeSlug}/menu`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-button)] text-xs font-semibold bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
            >
              <IconToolsKitchen2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Menu</span>
            </Link>
          )}

          {onNewTable ? (
            <button
              onClick={onNewTable}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-button)] text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] transition-colors"
            >
              <IconArmchair className="w-3.5 h-3.5 text-[var(--color-muted)]" />
              <span className="hidden sm:inline">Add Table</span>
            </button>
          ) : (
            <Link
              href={`/cafe/${cafeSlug}/tables`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-button)] text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] transition-colors"
            >
              <IconArmchair className="w-3.5 h-3.5 text-[var(--color-muted)]" />
              <span className="hidden sm:inline">Tables</span>
            </Link>
          )}

          <Link
            href={`/cafe/${cafeSlug}/qr`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-button)] text-xs font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-[var(--shadow-subtle)]"
          >
            <IconQrcode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">QR Codes</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
