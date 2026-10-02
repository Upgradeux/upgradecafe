"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  IconTicket,
  IconX,
  IconBell,
  IconArmchair,
} from "@tabler/icons-react";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import { WaitlistSubmissionData } from "./CustomerWaitlistModal";

export interface WaitingPassTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  waitlistData: WaitlistSubmissionData | null;
  queueNumber: number | null;
  onLeaveWaitlist: () => void;
  isTableReady?: boolean;
  holdSecondsRemaining?: number | null;
  onOpenTableReady?: () => void;
  digitalMenuTheme?: string;
}

export const WaitingPassTicketModal: React.FC<WaitingPassTicketModalProps> = ({
  isOpen,
  onClose,
  waitlistData,
  queueNumber,
  onLeaveWaitlist,
  isTableReady,
  holdSecondsRemaining,
  onOpenTableReady,
  digitalMenuTheme,
}) => {
  const visualTheme = useMemo(
    () => getDigitalMenuVisualTheme(digitalMenuTheme || "roast"),
    [digitalMenuTheme]
  );

  const themeRgb = useMemo(() => {
    const hex = (visualTheme.avatarFallbackBg || "#E57B24").replace("#", "");
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
      };
    }
    return { r: 229, g: 123, b: 36 };
  }, [visualTheme.avatarFallbackBg]);

  if (!isOpen || !waitlistData || !queueNumber) return null;

  const holdFormatted =
    holdSecondsRemaining !== null && holdSecondsRemaining !== undefined
      ? `${Math.floor(holdSecondsRemaining / 60)}:${String(
          holdSecondsRemaining % 60
        ).padStart(2, "0")}`
      : "5:00";

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 pointer-events-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          transition={{ type: "spring", stiffness: 450, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-white rounded-3xl shadow-2xl relative overflow-hidden text-left"
        >
          {/* UPPER TICKET SECTION */}
          <div className="p-4 sm:p-5 pb-3 space-y-3">
            {/* Header: WAITING PASS + Active badge + Close X */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-stone-400">
                <IconTicket className="w-4 h-4 stroke-[1.8]" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Waiting Pass
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-stone-600">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: `rgb(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b})` }}
                  />
                  Active
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                  title="Close"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Hero Numbers: Big Queue Position & Seating */}
            <div className="flex items-end justify-between pt-1">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                  Queue Position
                </span>
                <div className="text-4xl sm:text-5xl font-black text-[#1C1D1A] font-mono tracking-tight leading-none">
                  #{queueNumber}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                  Seating
                </span>
                <div className="text-base sm:text-lg font-bold text-[#1C1D1A] tracking-tight leading-none">
                  {waitlistData.preferredTableName &&
                  waitlistData.preferredTableName !== "Any available table"
                    ? waitlistData.preferredTableName
                    : "Dine-In"}
                </div>
              </div>
            </div>

            {/* Flat Borderless 2-Column Info Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2.5 text-xs">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block">
                  Party Size
                </span>
                <span className="font-semibold text-[#1C1D1A]">
                  {waitlistData.guests} {waitlistData.guests === 1 ? "Guest" : "Guests"}
                </span>
              </div>

              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block">
                  Preference
                </span>
                <span className="font-semibold text-[#1C1D1A] truncate block">
                  {waitlistData.preferredTableName || "Any available"}
                </span>
              </div>

              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block">
                  Guest Name
                </span>
                <span className="font-semibold text-[#1C1D1A] truncate block">
                  {waitlistData.name}
                </span>
              </div>

              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block">
                  Contact
                </span>
                <span className="font-mono font-semibold text-[#1C1D1A] truncate block">
                  {waitlistData.phone}
                </span>
              </div>
            </div>
          </div>

          {/* TICKET PERFORATION WITH NOTCHES */}
          <div className="relative py-1.5 flex items-center">
            <div className="absolute -left-3 w-6 h-6 rounded-full bg-black/50 z-20 pointer-events-none" />
            <div className="flex-1 border-b border-dashed border-stone-200" />
            <div className="absolute -right-3 w-6 h-6 rounded-full bg-black/50 z-20 pointer-events-none" />
          </div>

          {/* LOWER STUB SECTION */}
          <div className="p-4 sm:p-5 pt-2 space-y-3">
            {/* Borderless Notice Line */}
            <div className="flex items-center gap-2 text-[11px] text-stone-500 leading-tight">
              <IconBell className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>
                We&apos;ll chime & alert your screen once your table is ready. Held for 5 mins.
              </span>
            </div>

            <div className="space-y-2">
              {isTableReady && onOpenTableReady ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTableReady();
                  }}
                  style={{
                    boxShadow:
                      "inset 0 1.5px 2px rgba(255, 255, 255, 0.35), inset 0 -2px 4px rgba(0, 0, 0, 0.4), 0 4px 14px rgba(0, 0, 0, 0.22)",
                  }}
                  className="w-full py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm text-white ring-1 ring-white/20 active:scale-[0.98] active:translate-y-0.5 transition-all cursor-pointer bg-gradient-to-b from-[#2C2D28] via-[#1C1D1A] to-[#11120F] flex items-center justify-center gap-2"
                >
                  <IconArmchair className="w-4 h-4 text-amber-400 stroke-[2.2]" />
                  <span>Claim Table Now ({holdFormatted})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    boxShadow:
                      "inset 0 1.5px 2px rgba(255, 255, 255, 0.35), inset 0 -2px 4px rgba(0, 0, 0, 0.4), 0 4px 14px rgba(0, 0, 0, 0.22)",
                  }}
                  className="w-full py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm text-white ring-1 ring-white/20 active:scale-[0.98] active:translate-y-0.5 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] transition-all cursor-pointer bg-gradient-to-b from-[#2C2D28] via-[#1C1D1A] to-[#11120F] flex items-center justify-center gap-2"
                >
                  <span>Keep Browsing Menu</span>
                </button>
              )}

              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    onLeaveWaitlist();
                    onClose();
                  }}
                  className="text-xs text-stone-400 hover:text-rose-600 transition-colors cursor-pointer font-medium"
                >
                  Leave Waiting List
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
