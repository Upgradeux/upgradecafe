"use client";

import React, { useState, useEffect } from "react";
import {
  IconUsers,
  IconCheck,
  IconX,
  IconCash,
  IconQrcode,
  IconCreditCard,
} from "@tabler/icons-react";
import type { PaymentMethod } from "@/features/cafe/orders/types";
import type { SplitPaymentRecord } from "../services/billing.service";

interface SplitBillModalProps {
  isOpen: boolean;
  totalPayable?: number;
  total?: number;
  orderNumber?: string;
  onConfirm?: (records: SplitPaymentRecord[]) => void;
  onPaid?: () => void;
  onClose: () => void;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({
  isOpen,
  totalPayable,
  total,
  orderNumber,
  onConfirm,
  onPaid,
  onClose,
}) => {
  const resolvedTotal = totalPayable ?? total ?? 0;
  const [guestCount, setGuestCount] = useState<number>(2);
  const [splits, setSplits] = useState<
    Array<{
      guestNumber: number;
      amount: number;
      paymentMethod: PaymentMethod;
    }>
  >([]);

  useEffect(() => {
    if (isOpen && guestCount > 0) {
      const baseShare = Math.floor(resolvedTotal / guestCount);
      const remainder = resolvedTotal - baseShare * guestCount;

      const newSplits = Array.from({ length: guestCount }, (_, i) => ({
        guestNumber: i + 1,
        amount: i === 0 ? baseShare + remainder : baseShare,
        paymentMethod: (i === 0 ? "CASH" : "UPI") as PaymentMethod,
      }));
      setSplits(newSplits);
    }
  }, [isOpen, guestCount, resolvedTotal]);

  if (!isOpen) return null;

  const currentSum = splits.reduce((sum, s) => sum + s.amount, 0);
  const isBalanced = currentSum === resolvedTotal;

  const handleMethodChange = (index: number, method: PaymentMethod) => {
    setSplits((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, paymentMethod: method } : s))
    );
  };

  const handleAmountChange = (index: number, val: number) => {
    setSplits((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, amount: val } : s))
    );
  };

  const handleConfirm = () => {
    if (!isBalanced) return;
    if (onConfirm) onConfirm(splits);
    if (onPaid) onPaid();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-lg bg-[var(--color-surface,#FFFFFF)] border border-[var(--color-border,#E7E4DD)] shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-[var(--color-border,#E7E4DD)] flex items-center justify-between bg-[var(--color-surface,#FFFFFF)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[var(--color-primary-light,#FAF7F2)] text-[var(--color-primary,#8B5E3C)] flex items-center justify-center">
              <IconUsers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[var(--color-foreground,#242321)]">
                Split Bill Settlement
              </h3>
              <p className="text-[10px] text-[var(--color-muted,#73716B)]">
                Divide bill equally or assign custom shares with separate tenders
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
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Guest Count Stepper */}
          <div className="flex items-center justify-between p-2.5 rounded-md bg-[var(--color-background,#F7F6F2)] border border-[var(--color-border,#E7E4DD)]">
            <div>
              <span className="text-xs font-semibold text-[var(--color-foreground,#242321)] block">
                Number of Guests
              </span>
              <span className="text-[10.5px] text-[var(--color-muted,#73716B)]">
                Evenly splits ₹{resolvedTotal.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-[var(--color-surface,#FFFFFF)] border border-[var(--color-border,#E7E4DD)] p-0.5 rounded-md">
              <button
                type="button"
                onClick={() => setGuestCount((g) => Math.max(2, g - 1))}
                className="w-6 h-6 rounded-md text-xs font-medium text-[var(--color-foreground,#242321)] hover:bg-[var(--color-background,#F7F6F2)]"
              >
                -
              </button>
              <span className="w-5 text-center text-xs font-semibold text-[var(--color-primary,#8B5E3C)] font-mono">
                {guestCount}
              </span>
              <button
                type="button"
                onClick={() => setGuestCount((g) => Math.min(8, g + 1))}
                className="w-6 h-6 rounded-md text-xs font-medium text-[var(--color-foreground,#242321)] hover:bg-[var(--color-background,#F7F6F2)]"
              >
                +
              </button>
            </div>
          </div>

          {/* Guest Shares List */}
          <div className="space-y-1.5">
            {splits.map((s, idx) => (
              <div
                key={s.guestNumber}
                className="p-2.5 rounded-md border border-[var(--color-border,#E7E4DD)] bg-[var(--color-surface,#FFFFFF)] flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-md bg-[var(--color-primary-light,#FAF7F2)] text-[var(--color-primary,#8B5E3C)] text-[10px] font-medium flex items-center justify-center flex-shrink-0">
                    {s.guestNumber}
                  </div>
                  <span className="text-xs font-medium text-[var(--color-foreground,#242321)] truncate">
                    Guest {s.guestNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Payment Mode */}
                  <div className="flex items-center bg-[var(--color-background,#F7F6F2)] p-0.5 rounded-md border border-[var(--color-border,#E7E4DD)]">
                    <button
                      type="button"
                      onClick={() => handleMethodChange(idx, "CASH")}
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                        s.paymentMethod === "CASH"
                          ? "bg-[var(--color-surface,#FFFFFF)] text-[#66805F] shadow-xs"
                          : "text-[var(--color-muted,#73716B)]"
                      }`}
                    >
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMethodChange(idx, "UPI")}
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                        s.paymentMethod === "UPI"
                          ? "bg-[var(--color-surface,#FFFFFF)] text-[var(--color-primary,#8B5E3C)] shadow-xs"
                          : "text-[var(--color-muted,#73716B)]"
                      }`}
                    >
                      UPI
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMethodChange(idx, "CARD")}
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                        s.paymentMethod === "CARD"
                          ? "bg-[var(--color-surface,#FFFFFF)] text-[#C4934A] shadow-xs"
                          : "text-[var(--color-muted,#73716B)]"
                      }`}
                    >
                      Card
                    </button>
                  </div>

                  {/* Share Amount Input */}
                  <div className="relative w-20">
                    <span className="absolute left-2 top-1.5 text-xs text-[var(--color-muted,#73716B)]">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={s.amount}
                      onChange={(e) =>
                        handleAmountChange(idx, parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-5 pr-2 py-1 text-xs rounded-md border border-[var(--color-border,#E7E4DD)] bg-[var(--color-background,#F7F6F2)] text-[var(--color-foreground,#242321)] font-medium font-mono focus:outline-none focus:border-[var(--color-primary,#8B5E3C)]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Balance Indicator */}
          <div
            className={`p-2 rounded-md border flex items-center justify-between text-xs ${
              isBalanced
                ? "bg-[#66805F]/10 border-[#66805F]/30 text-[#66805F]"
                : "bg-[#B65D54]/10 border-[#B65D54]/30 text-[#B65D54]"
            }`}
          >
            <span className="font-medium">
              {isBalanced ? "Shares Balanced" : "Mismatch with Total Bill"}
            </span>
            <span className="font-semibold font-mono">
              Sum: ₹{currentSum.toLocaleString("en-IN")} / ₹
              {resolvedTotal.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            disabled={!isBalanced}
            onClick={handleConfirm}
            className="w-full py-2.5 rounded-md bg-[var(--color-primary,#8B5E3C)] hover:bg-[var(--color-primary-hover,#754C30)] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-40"
          >
            <IconCheck className="w-4 h-4" />
            <span>Confirm Split Settlement</span>
          </button>
        </div>
      </div>
    </div>
  );
};
