"use client";

import React, { useState, useEffect } from "react";
import {
  IconChartBar,
  IconX,
  IconPrinter,
  IconCash,
  IconQrcode,
  IconCreditCard,
  IconReceipt,
  IconPercentage,
  IconClock,
  IconLoader2,
} from "@tabler/icons-react";
import type { ShiftSummary } from "../services/billing.service";

interface ShiftSummaryModalProps {
  isOpen: boolean;
  cafeSlug: string;
  cafeName: string;
  onClose: () => void;
}

export const ShiftSummaryModal: React.FC<ShiftSummaryModalProps> = ({
  isOpen,
  cafeSlug,
  cafeName,
  onClose,
}) => {
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch(`/api/cafe/${cafeSlug}/billing/shift-summary`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setSummary(json.data);
          }
        })
        .catch((err) => console.error("Failed to load shift summary", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, cafeSlug]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
      <div className="w-full max-w-md rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[var(--color-border-subtle)] flex items-center justify-between bg-[var(--color-surface)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center shadow-xs">
              <IconChartBar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--color-foreground)]">
                Daily Register & Shift Close
              </h3>
              <p className="text-[11px] text-[var(--color-muted)]">{todayStr}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] transition-colors shadow-xs"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[var(--color-muted)]">
              <IconLoader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
              <span>Calculating register collections...</span>
            </div>
          ) : summary ? (
            <>
              {/* Gross Revenue Callout */}
              <div className="p-4 rounded-lg bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 text-center space-y-1 shadow-xs">
                <span className="text-[11px] font-medium text-[var(--color-primary)] uppercase tracking-wider">
                  Total Gross Revenue (Settled)
                </span>
                <div className="text-2xl font-semibold text-[var(--color-primary)] tracking-tight">
                  ₹{summary.todayGrossSales.toLocaleString("en-IN")}
                </div>
                <p className="text-[11px] text-[var(--color-muted)]">
                  Across {summary.paidOrdersCount} completed orders today
                </p>
              </div>

              {/* Tender Breakdown Matrix */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-[var(--color-muted)] uppercase tracking-wider block">
                  Payment Tender Breakdown
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-md border border-emerald-500/20 bg-emerald-500/5 space-y-1 shadow-xs">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      <IconCash className="w-3.5 h-3.5" />
                      <span>Cash In Drawer</span>
                    </div>
                    <div className="text-base font-semibold text-[var(--color-foreground)]">
                      ₹{summary.cashTotal.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="p-3 rounded-md border border-purple-500/20 bg-purple-500/5 space-y-1 shadow-xs">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-purple-700 dark:text-purple-400">
                      <IconQrcode className="w-3.5 h-3.5" />
                      <span>UPI Received</span>
                    </div>
                    <div className="text-base font-semibold text-[var(--color-foreground)]">
                      ₹{summary.upiTotal.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="p-3 rounded-md border border-blue-500/20 bg-blue-500/5 space-y-1 shadow-xs">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-blue-700 dark:text-blue-400">
                      <IconCreditCard className="w-3.5 h-3.5" />
                      <span>Card / EDC</span>
                    </div>
                    <div className="text-base font-semibold text-[var(--color-foreground)]">
                      ₹{summary.cardTotal.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Deductions & Tax */}
              <div className="p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] space-y-2 text-xs shadow-xs">
                <div className="flex justify-between text-[var(--color-muted)]">
                  <span className="flex items-center gap-1">
                    <IconPercentage className="w-3.5 h-3.5" />
                    <span>Discounts & Comps Given</span>
                  </span>
                  <span className="font-medium text-[var(--color-foreground)]">
                    ₹{summary.discountsTotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between text-[var(--color-muted)]">
                  <span>GST Collected (5%)</span>
                  <span className="font-medium text-[var(--color-foreground)]">
                    ₹{summary.taxTotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between pt-1 border-t border-[var(--color-border-subtle)] text-amber-700 dark:text-amber-400 font-medium">
                  <span>Open Unpaid Dining Tabs ({summary.openTabsCount})</span>
                  <span>₹{summary.openTabsTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-xs font-medium bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] transition-colors shadow-xs"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all shadow-xs"
          >
            <IconPrinter className="w-4 h-4" />
            <span>Print Shift Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
