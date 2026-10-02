"use client";

import React, { useState, useEffect } from "react";
import {
  IconCash,
  IconCheck,
  IconX,
  IconArrowBackUp,
} from "@tabler/icons-react";

interface CashTenderModalProps {
  isOpen: boolean;
  totalPayable: number;
  onConfirm: (amountTendered: number, changeDue: number) => void;
  onClose: () => void;
}

export const CashTenderModal: React.FC<CashTenderModalProps> = ({
  isOpen,
  totalPayable,
  onConfirm,
  onClose,
}) => {
  const [tenderedStr, setTenderedStr] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setTenderedStr(totalPayable.toString());
    }
  }, [isOpen, totalPayable]);

  if (!isOpen) return null;

  const tendered = parseFloat(tenderedStr) || 0;
  const changeDue = Math.max(0, tendered - totalPayable);
  const remainingDue = Math.max(0, totalPayable - tendered);
  const isSufficient = tendered >= totalPayable;

  const handleNumClick = (val: string) => {
    setTenderedStr((prev) => {
      if (prev === "0" && val !== ".") return val;
      return prev + val;
    });
  };

  const handleBackspace = () => {
    setTenderedStr((prev) => prev.slice(0, -1) || "0");
  };

  const handleAddAmount = (amount: number) => {
    setTenderedStr((prev) => {
      const current = parseFloat(prev) || 0;
      return (current + amount).toString();
    });
  };

  const handleSetAmount = (amount: number) => {
    setTenderedStr(amount.toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-lg bg-white border border-[#E7E4DD] shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-[var(--color-border,#E7E4DD)] flex items-center justify-between bg-[var(--color-surface,#FFFFFF)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#66805F]/10 text-[#66805F] flex items-center justify-center">
              <IconCash className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[var(--color-foreground,#242321)]">
                Cash Tender & Change
              </h3>
              <p className="text-[10px] text-[var(--color-muted,#73716B)]">
                Calculate cash tendered and exact change due
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)] hover:bg-[var(--color-background,#F7F6F2)] transition-colors"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Bill Summary */}
          <div className="flex items-center justify-between p-2.5 rounded-md bg-[var(--color-background,#F7F6F2)] border border-[var(--color-border,#E7E4DD)]">
            <span className="text-xs font-medium text-[var(--color-muted,#73716B)]">
              Total Payable Bill
            </span>
            <span className="text-base font-bold text-[var(--color-foreground,#242321)] font-mono">
              ₹{totalPayable.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Tendered Input Display */}
          <div className="p-2.5 rounded-md bg-[var(--color-background,#F7F6F2)] border border-[var(--color-border,#E7E4DD)] space-y-1">
            <div className="flex justify-between text-[11px] text-[var(--color-muted,#73716B)]">
              <span>Amount Received from Customer</span>
              {tendered > 0 && !isSufficient && (
                <span className="text-[#B65D54] font-medium">
                  Short by ₹{remainingDue.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-[var(--color-foreground,#242321)] tracking-tight font-mono">
              ₹{tenderedStr || "0"}
            </div>
          </div>

          {/* Change Due Banner */}
          <div
            className={`p-2.5 rounded-md border flex items-center justify-between transition-colors ${
              isSufficient
                ? "bg-[#66805F]/10 border-[#66805F]/30 text-[#66805F]"
                : "bg-[var(--color-background,#F7F6F2)] border-[var(--color-border,#E7E4DD)] text-[var(--color-muted,#73716B)]"
            }`}
          >
            <span className="text-xs font-semibold">
              {isSufficient ? "Change to Return" : "Awaiting Sufficient Tender"}
            </span>
            <span className="text-lg font-bold font-mono">
              ₹{changeDue.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Quick Denomination Chips */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted,#73716B)]">
              Quick Notes
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[100, 200, 500].map((note) => (
                <button
                  key={note}
                  type="button"
                  onClick={() => handleSetAmount(note)}
                  className="py-1 px-2 rounded-md border border-[var(--color-border,#E7E4DD)] bg-white hover:bg-[var(--color-background,#F7F6F2)] text-xs font-medium text-[var(--color-foreground,#242321)] transition-colors"
                >
                  ₹{note}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleSetAmount(totalPayable)}
                className="py-1 px-2 rounded-md border border-[var(--color-primary,#8B5E3C)]/30 bg-[var(--color-primary-light,#FAF7F2)] text-xs font-medium text-[var(--color-primary,#8B5E3C)] transition-colors"
              >
                Exact
              </button>
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0"].map(
              (key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleNumClick(key)}
                  className="py-2 rounded-md border border-[var(--color-border,#E7E4DD)] bg-white hover:bg-[var(--color-background,#F7F6F2)] text-sm font-medium text-[var(--color-foreground,#242321)] active:scale-95 transition-all font-mono"
                >
                  {key}
                </button>
              )
            )}
            <button
              type="button"
              onClick={handleBackspace}
              className="py-2 rounded-md border border-[var(--color-border,#E7E4DD)] bg-[var(--color-background,#F7F6F2)] hover:bg-[var(--color-border,#E7E4DD)] text-[var(--color-muted,#73716B)] flex items-center justify-center active:scale-95 transition-all"
            >
              <IconArrowBackUp className="w-4 h-4" />
            </button>
          </div>

          {/* Action Button */}
          <button
            type="button"
            disabled={!isSufficient}
            onClick={() => onConfirm(tendered, changeDue)}
            className="w-full py-2.5 rounded-md bg-[var(--color-primary,#8B5E3C)] hover:bg-[var(--color-primary-hover,#754C30)] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-40"
          >
            <IconCheck className="w-4 h-4" />
            <span>Complete Cash Settlement</span>
          </button>
        </div>
      </div>
    </div>
  );
};
