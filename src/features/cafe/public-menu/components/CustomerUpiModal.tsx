"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconX,
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconChevronRight,
  IconLoader2,
  IconCash,
  IconQrcode,
  IconCoffee,
  IconInfoCircle,
} from "@tabler/icons-react";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTHENTIC BRAND LOGOS (Crisp Vector Mini Badges)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const UpiLogo: React.FC<{ className?: string }> = ({ className = "h-3 w-auto" }) => (
  <svg viewBox="0 0 32 20" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <title>UPI</title>
    <path d="M8 2L16 10L8 18H3L11 10L3 2H8Z" fill="#097939" />
    <path d="M19 2L27 10L19 18H14L22 10L14 2H19Z" fill="#ED7524" />
  </svg>
);

const GPayLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
    <title>Google Pay</title>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

const PhonePeLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={`${className} shrink-0`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <title>PhonePe</title>
    <circle cx="12" cy="12" r="12" fill="#5F259F" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.206 9.941h2.949v4.692c-.402.201-.938.268-1.34.268-1.072 0-1.609-.536-1.609-1.743V9.941zm7.233-1.072a.887.887 0 0 0-.871-.871h-1.609l-3.686-4.222c-.335-.402-.871-.536-1.407-.402l-1.274.401c-.201.067-.268.335-.134.469l4.021 3.82H6.386c-.201 0-.335.134-.335.335v.67c0 .469.402.871.871.871h.938v3.217c0 2.413 1.273 3.82 3.418 3.82.67 0 1.206-.067 1.877-.335v2.145c0 .603.469 1.072 1.072 1.072h.938a.432.432 0 0 0 .402-.402V9.874h1.542c.201 0 .335-.134.335-.335v-.67z"
      fill="#FFFFFF"
    />
  </svg>
);

const PaytmLogo: React.FC<{ className?: string }> = ({ className = "h-3 w-auto" }) => (
  <div className={`inline-flex items-center font-black text-[10px] tracking-tight leading-none ${className}`} title="Paytm">
    <span className="text-[#002970]">Pay</span>
    <span className="text-[#00b9f5]">tm</span>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROPS INTERFACE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface CustomerUpiModalProps {
  isOpen: boolean;
  amount: number;
  orderNumber?: string;
  orderId?: string;
  cafeSlug?: string;
  cafeName: string;
  cafeLogoUrl?: string | null;
  upiId?: string | null;
  merchantName?: string | null;
  upiQrUrl?: string | null;
  initialMode?: "UPI" | "CASH";
  digitalMenuTheme?: string | null;
  orderType?: string | null;
  tableName?: string | null;
  onClose: () => void;
  onConfirmPaid?: (method?: "UPI" | "CASH") => void | Promise<void>;
}

export const CustomerUpiModal: React.FC<CustomerUpiModalProps> = ({
  isOpen,
  amount,
  orderNumber = "",
  orderId,
  cafeSlug,
  cafeName,
  cafeLogoUrl,
  upiId: propUpiId,
  merchantName: propMerchantName,
  upiQrUrl: propUpiQrUrl,
  initialMode = "UPI",
  digitalMenuTheme,
  orderType = "DINE_IN",
  tableName,
  onClose,
  onConfirmPaid,
}) => {
  const [activeMode, setActiveMode] = useState<"UPI" | "CASH">(initialMode);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync mode whenever modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setActiveMode(initialMode || "UPI");
    }
  }, [isOpen, initialMode]);

  const visualTheme = getDigitalMenuVisualTheme(digitalMenuTheme || "roast");

  // Dynamic Theme RGB and opaque soft gradient stops
  const themeRgb = useMemo(() => {
    const fallback = visualTheme.avatarFallbackBg || "#3B82F6";
    if (fallback.startsWith("#")) {
      const hex = fallback.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) || 48;
      const g = parseInt(hex.substring(2, 4), 16) || 175;
      const b = parseInt(hex.substring(4, 6), 16) || 255;
      return { r, g, b };
    }
    return { r: 48, g: 175, b: 255 };
  }, [visualTheme.avatarFallbackBg]);

  const themeOpaqueColors = useMemo(() => {
    const { r, g, b } = themeRgb;
    const blend = (weight: number) => {
      const red = Math.round(r * weight + 255 * (1 - weight));
      const green = Math.round(g * weight + 255 * (1 - weight));
      const blue = Math.round(b * weight + 255 * (1 - weight));
      return `rgb(${red}, ${green}, ${blue})`;
    };

    return {
      topTint: blend(0.26),
      midTint: blend(0.08),
      bottomTint: "#FFFFFF",
      lightButtonBg: blend(0.12),
      lightButtonText: `rgb(${Math.round(r * 0.7)}, ${Math.round(g * 0.7)}, ${Math.round(b * 0.7)})`,
    };
  }, [themeRgb]);

  const effectiveUpiId =
    propUpiId?.trim() || `${cafeName.toLowerCase().replace(/[^a-z0-9]/g, "")}@upi`;
  const effectiveMerchantName = propMerchantName?.trim() || cafeName;

  const orderNote = orderNumber ? `Order ${orderNumber.replace(/^#+/, "")}` : `${cafeName} Order`;
  const upiPayload = `upi://pay?pa=${encodeURIComponent(
    effectiveUpiId
  )}&pn=${encodeURIComponent(effectiveMerchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(
    orderNote
  )}`;

  const qrImageUrl =
    propUpiQrUrl?.trim() ||
    `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
      upiPayload
    )}&margin=0`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(effectiveUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmUpiPaid = async () => {
    setIsSubmitting(true);
    try {
      if (cafeSlug && orderId) {
        await fetch(`/api/cafe/${cafeSlug}/orders/${orderId}/confirm-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethod: "UPI" }),
        });
      }
      if (onConfirmPaid) {
        await onConfirmPaid("UPI");
      }
    } catch (e) {
      // Non-blocking fallback
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCash = async () => {
    setIsSubmitting(true);
    try {
      if (cafeSlug && orderId) {
        await fetch(`/api/cafe/${cafeSlug}/orders/${orderId}/confirm-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethod: "CASH" }),
        });
      }
      if (onConfirmPaid) {
        await onConfirmPaid("CASH");
      }
    } catch (e) {
      // Non-blocking fallback
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const cleanOrderNum = (orderNumber || "").replace(/^#+/, "");

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ type: "spring", stiffness: 460, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[370px] sm:max-w-[395px] relative flex flex-col pointer-events-auto drop-shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
        >
          {/* SINGLE UNIFIED CONTINUOUS SURFACE (Signature Center Bend Curve & Themed Gradient) */}
          <svg
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="upiModalSingleSurfaceGrad"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={themeOpaqueColors.topTint} />
                <stop offset="28%" stopColor={themeOpaqueColors.midTint} />
                <stop offset="68%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
            </defs>
            <path
              d="M 0,22 C 0,10 18,0 48,0 C 90,0 120,14 200,14 C 280,14 310,0 352,0 C 382,0 400,10 400,22 L 400,372 C 400,388 388,400 372,400 L 28,400 C 12,400 0,388 0,372 Z"
              fill="url(#upiModalSingleSurfaceGrad)"
              stroke="rgba(0, 0, 0, 0.10)"
              strokeWidth="1.2"
            />
          </svg>

          {/* Content Body (Cleanly Spaced Inside Center Bend Surface, NO Center Pill) */}
          <div className="px-4 sm:px-5 pt-7 pb-4 relative z-20 flex flex-col space-y-3">
            {/* Header Bar */}
            <div className="flex items-center justify-between gap-3">
              {/* Left: Real Cafe Logo & Cafe Name + Subtitle */}
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {/* Cafe Logo Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#FAF5EE] ring-1 ring-black/5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                  {cafeLogoUrl ? (
                    <img
                      src={cafeLogoUrl}
                      alt={cafeName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <IconCoffee className="w-5 h-5 text-[#3D2314] stroke-[1.8]" />
                  )}
                </div>

                {/* Cafe Name & Subtitle */}
                <div className="min-w-0 text-left">
                  <h3 className="text-sm sm:text-[15px] font-bold text-stone-900 truncate leading-tight tracking-tight">
                    {cafeName}
                  </h3>
                  <p className="text-[11px] text-stone-500 font-normal truncate leading-tight mt-0.5">
                    Scan, pay and place your order
                  </p>
                </div>
              </div>

              {/* Right: Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {/* Total to Pay Hero */}
            <div className="pt-0.5 pb-1 text-center">
              <span className="text-xs text-stone-500 font-medium block">
                Total to Pay
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-stone-900 tracking-tight mt-0.5">
                ₹{amount.toLocaleString("en-IN")}
              </div>
            </div>

            {/* Mode Switcher (UPI Pay vs Cash at Counter) */}
            <div>
              <div className="grid grid-cols-2 p-1 rounded-full bg-black/[0.04] ring-1 ring-black/5 text-xs font-semibold relative select-none">
                <button
                  type="button"
                  onClick={() => setActiveMode("UPI")}
                  className={`relative py-2 rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer select-none z-10 ${
                    activeMode === "UPI"
                      ? "text-stone-900 font-bold"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  {activeMode === "UPI" && (
                    <motion.div
                      layoutId="payModeActivePill"
                      className="absolute inset-0 rounded-full bg-white shadow-xs z-[-1] ring-1 ring-black/5"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <IconQrcode className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
                  <span>UPI Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMode("CASH")}
                  className={`relative py-2 rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer select-none z-10 ${
                    activeMode === "CASH"
                      ? "text-stone-900 font-bold"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  {activeMode === "CASH" && (
                    <motion.div
                      layoutId="payModeActivePill"
                      className="absolute inset-0 rounded-full bg-white shadow-xs z-[-1] ring-1 ring-black/5"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <IconCash className="w-4 h-4 text-amber-600 stroke-[2]" />
                  <span>Cash at Counter</span>
                </button>
              </div>
            </div>

            {/* Tab Body */}
            <div className="overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                {activeMode === "UPI" ? (
                  <motion.div
                    key="upi-tab"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="space-y-3 p-1"
                  >
                    {/* Main Card (Image 2: Left QR Code, Right Details & Brand Logos) */}
                    <div className="p-3 sm:p-3.5 rounded-lg  bg-stone-50/90  ring-1 ring-black/5 flex items-center gap-3 sm:gap-3.5 text-left">
                      {/* Left: QR Code Box */}
                      <div className="w-28 h-28 sm:w-30 sm:h-30 shrink-0 bg-white p-1  ring-1 ring-black/5 flex items-center justify-center shadow-2xs">
                        <img
                          src={qrImageUrl}
                          alt="UPI QR Code"
                          className="w-full h-full object-contain "
                        />
                      </div>

                      {/* Right: Info & Supported App Badges */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-sm font-bold text-stone-900 leading-tight">
                          Scan with any UPI app
                        </h4>
                        <p className="text-[11px] text-stone-500 leading-snug">
                          Use Google Pay, PhonePe, Paytm or any UPI app
                        </p>

                        {/* Supported Apps Strip with Clean Badges */}
                        <div className="flex items-center  pt-1 relative">
                          <div className="w-6 h-6  flex items-center bg-white border-[0.5px] border-neutral-200 rounded-full justify-center shrink-0">
                            <GPayLogo className="w-3.5 h-3.5" />
                          </div>
                          <div className="w-6 h-6  flex items-center bg-white border-[0.5px] border-neutral-200 rounded-full justify-center relative right-2 shrink-0">
                            <PhonePeLogo className="w-3.5 h-3.5" />
                          </div>
                          <div className="h-6 px-1.5  flex items-center bg-white border-[0.5px] border-neutral-200 rounded-full justify-center relative right-4 shrink-0">
                            <UpiLogo className="w-4 h-2.5" />
                          </div>
                          <div className="h-6 px-1.5  flex items-center bg-white border-[0.5px] border-neutral-200 rounded-full justify-center relative right-6 shrink-0">
                            <PaytmLogo className="h-2.5" />
                          </div>
                          
                        </div>
                      </div>
                    </div>

                    {/* OR Divider */}
                    <div className="relative flex items-center justify-center py-1">
                      <div className="border-t border-stone-200/80 w-full" />
                      <span className="bg-white/90 backdrop-blur-xs px-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest absolute">
                        OR
                      </span>
                    </div>

                    {/* UPI ID Row (Image 2: Text Left, Copy Button Right) */}
                    <div className="flex items-center justify-between gap-2 px-1 ">
                      <div className=" gap-2 flex justify-center items-center min-w-0">
                        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block leading-tight">
                          UPI ID:
                        </span>
                        <span className="text-xs sm:text-sm font-mono  text-stone-900 truncate block ">
                          {effectiveUpiId}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        style={{
                          backgroundColor: themeOpaqueColors.lightButtonBg,
                          color: themeOpaqueColors.lightButtonText,
                        }}
                        className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer shrink-0"
                      >
                        {copied ? (
                          <>
                            <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) :
                          <>
                            <IconCopy className="w-3.5 h-3.5" />
                            
                          </>
                        }
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-1 space-y-2">
                      {/* 1. Open in UPI App */}
                      <a
                        href={upiPayload}
                        style={{
                          boxShadow: `inset 0 1.5px 2px rgba(255, 255, 255, 0.35), inset 0 -1.5px 2px rgba(0, 0, 0, 0.12), 0 3px 10px ${visualTheme.buttonShadow || "rgba(0,0,0,0.12)"}`,
                        }}
                        className={`w-full py-2.5 sm:py-3 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r ${visualTheme.buttonGradient} hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer select-none`}
                      >
                        <IconExternalLink className="w-4 h-4 stroke-[2.2]" />
                        <span>Open in UPI App</span>
                        <IconChevronRight className="w-4 h-4 stroke-[2.2] -ml-0.5" />
                      </a>

                      {/* 2. I've Paid • Place Order */}
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleConfirmUpiPaid}
                        style={{
                          backgroundColor: themeOpaqueColors.lightButtonBg,
                          color: themeOpaqueColors.lightButtonText,
                          boxShadow: `inset 0 1px 1.5px rgba(255, 255, 255, 0.6), 0 2px 6px rgba(0, 0, 0, 0.04)`,
                        }}
                        className="w-full py-2.5 sm:py-3 rounded-2xl font-bold text-xs sm:text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <>
                            <IconLoader2 className="w-4 h-4 animate-spin" />
                            <span>{orderId ? "Notifying Staff..." : "Placing Order..."}</span>
                          </>
                        ) : (
                          <>
                            <IconCheck className="w-4 h-4 stroke-[2.5]" />
                            <span>
                              {orderId
                                ? `I've Sent ₹${amount.toLocaleString("en-IN")}`
                                : `I've Paid ₹${amount.toLocaleString("en-IN")} • Place Order`}
                            </span>
                          </>
                        )}
                      </button>

                      {/* Hint Below */}
                      <p className="text-[9px] text-stone-400 flex items-center justify-center gap-1 pt-0.5 text-center">
                        <IconInfoCircle className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                        <span>
                          {orderId
                            ? "Tap once paid. Staff will verify on dashboard & prepare your order."
                            : "after paying in your UPI app. Order will be sent to staff for confirmation."}
                        </span>
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="cash-tab"
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="space-y-3"
                  >
                    {/* Cash Content Card */}
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 ring-1 ring-black/5 flex items-center gap-3.5 text-left">
                      {/* Left: Cash Illustration Badge */}
                      {/* <div className="w-24 h-24 sm:w-26 sm:h-26 shrink-0 rounded-xl bg-amber-500/15 text-amber-700 flex flex-col items-center justify-center gap-1 shadow-2xs">
                        <IconCash className="w-8 h-8 stroke-[1.8]" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                          Cash
                        </span>
                      </div> */}

                      {/* Right: Info */}
                      <div className="flex-1 min-w-0 space-y-1.5 text-[11px] text-stone-600">
                        <h4 className="text-sm font-bold text-stone-900 leading-tight">
                          Pay Cash at Counter
                        </h4>
                        <p className="text-stone-500 leading-snug">
                          {orderType === "TAKEAWAY"
                            ? "Pay at the counter when you pick up your order"
                            : tableName
                            ? `Pay at counter or to your server at ${tableName}`
                            : "Pay in cash at the counter before you leave"}
                        </p>
                        <div className="space-y-1 pt-0.5">
                          <div className="flex items-center gap-1.5">
                            <IconCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Kitchen starts preparing immediately</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <IconCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>
                              {cleanOrderNum
                                ? `Show Order #${cleanOrderNum} at the counter`
                                : "Show your Order ID at the counter to pay"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <IconCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Staff marks order paid on dashboard</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cash Action Button */}
                    <div className="pt-2 space-y-2">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleConfirmCash}
                        style={{
                          boxShadow: `inset 0 1.5px 2px rgba(255, 255, 255, 0.4), inset 0 -1.5px 2px rgba(0, 0, 0, 0.14), 0 3px 8px ${visualTheme.buttonShadow || "rgba(0,0,0,0.1)"}`,
                        }}
                        className={`w-full py-2.5 sm:py-3 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r ${visualTheme.buttonGradient} hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60`}
                      >
                        {isSubmitting ? (
                          <>
                            <IconLoader2 className="w-4 h-4 animate-spin" />
                            <span>{orderId ? "Confirming..." : "Placing Order..."}</span>
                          </>
                        ) : (
                          <>
                            <IconCash className="w-4 h-4 stroke-[2]" />
                            <span>
                              {orderId
                                ? "I'll Pay Cash at Counter"
                                : "Pay Cash at Counter • Place Order"}
                            </span>
                          </>
                        )}
                      </button>

                      <p className="text-[9px] text-stone-400 flex items-center justify-center gap-1.5 pt-0.5 text-center">
                        <IconInfoCircle className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                        <span>
                          {orderId
                            ? `Show Order ID at counter. Staff will collect ₹${amount.toLocaleString("en-IN")} and confirm.`
                            : `Order is sent to kitchen right away. Show Order ID at counter to pay ₹${amount.toLocaleString("en-IN")}.`}
                        </span>
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const CustomerPaymentModal = CustomerUpiModal;
