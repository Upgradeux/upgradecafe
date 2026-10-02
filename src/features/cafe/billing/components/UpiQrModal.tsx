"use client";

import React, { useState, useEffect } from "react";
import {
  IconQrcode,
  IconCheck,
  IconX,
  IconCopy,
} from "@tabler/icons-react";

interface UpiQrModalProps {
  isOpen: boolean;
  amount?: number;
  totalPayable?: number;
  orderNumber?: string;
  cafeName: string;
  cafeSlug?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const UpiQrModal: React.FC<UpiQrModalProps> = ({
  isOpen,
  amount,
  totalPayable,
  orderNumber,
  cafeName,
  cafeSlug,
  onConfirm,
  onClose,
}) => {
  const payableAmount = amount ?? totalPayable ?? 0;
  const [copied, setCopied] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      setSecondsElapsed(0);
      timer = setInterval(() => {
        setSecondsElapsed((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const upiId = `${cafeName.toLowerCase().replace(/[^a-z0-9]/g, "")}@upi`;
  const upiPayload = `upi://pay?pa=${encodeURIComponent(
    upiId
  )}&pn=${encodeURIComponent(cafeName)}&am=${payableAmount}&cu=INR&tn=${encodeURIComponent(
    orderNumber ? `Bill ${orderNumber}` : "Café Order"
  )}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiPayload
  )}&margin=1`;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-xs rounded-lg bg-[var(--color-surface,#FFFFFF)] border border-[var(--color-border,#E7E4DD)] shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-[var(--color-border,#E7E4DD)] flex items-center justify-between bg-[var(--color-surface,#FFFFFF)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[var(--color-primary-light,#FAF7F2)] text-[var(--color-primary,#8B5E3C)] flex items-center justify-center">
              <IconQrcode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[var(--color-foreground,#242321)]">UPI QR Terminal</h3>
              <p className="text-[10px] text-[var(--color-muted,#73716B)]">Dynamic instant payment</p>
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
        <div className="p-4 space-y-3 text-center">
          {/* Amount Badge */}
          <div className="p-2 rounded-md bg-[var(--color-background,#F7F6F2)] border border-[var(--color-border,#E7E4DD)]">
            <span className="text-[10.5px] text-[var(--color-muted,#73716B)] font-medium block">
              Scan to Pay Amount
            </span>
            <span className="text-xl font-bold text-[var(--color-foreground,#242321)] font-mono">
              ₹{payableAmount.toLocaleString("en-IN")}
            </span>
          </div>

          {/* QR Code Container */}
          <div className="w-48 h-48 mx-auto p-2 bg-white rounded-md border border-[var(--color-border,#E7E4DD)] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl}
              alt="UPI QR Code"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Supported Apps Note */}
          <p className="text-[10px] text-[var(--color-muted,#73716B)]">
            Scan with Google Pay, PhonePe, Paytm, or any BHIM UPI app
          </p>

          {/* UPI ID & Timer */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[var(--color-background,#F7F6F2)] border border-[var(--color-border,#E7E4DD)] text-xs">
            <div className="flex items-center gap-1.5 text-[var(--color-foreground,#242321)] font-mono text-[11px]">
              <span>{upiId}</span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="text-[var(--color-primary,#8B5E3C)] hover:underline"
              >
                <IconCopy className="w-3.5 h-3.5" />
              </button>
              {copied && <span className="text-[9.5px] text-[#66805F] font-medium">Copied!</span>}
            </div>
            <span className="text-[10px] text-[var(--color-muted,#73716B)] font-mono">
              {formatTimer(secondsElapsed)}
            </span>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-2 rounded-md bg-[var(--color-primary,#8B5E3C)] hover:bg-[var(--color-primary-hover,#754C30)] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <IconCheck className="w-4 h-4" />
            <span>Confirm Payment Received</span>
          </button>
        </div>
      </div>
    </div>
  );
};
