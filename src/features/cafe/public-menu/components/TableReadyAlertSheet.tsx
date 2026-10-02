"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import {
  IconArmchair,
  IconCheck,
  IconX,
  IconClock,
  IconQrcode,
} from "@tabler/icons-react";

export interface TableReadyAlertProps {
  isOpen: boolean;
  tableNumber: string;
  tableId: string;
  guests: number;
  holdSeconds?: number;
  currentHoldSeconds?: number;
  digitalMenuTheme?: string;
  visualTheme?: any;
  onOpenScanner?: () => void;
  onConfirmReady: (tableNumber: string, tableId: string) => void;
  onCancelWaitlist?: () => void;
  onDismiss: () => void;
}

export const TableReadyAlertSheet: React.FC<TableReadyAlertProps> = ({
  isOpen,
  tableNumber,
  tableId,
  guests,
  holdSeconds = 300, // 5 minutes default
  currentHoldSeconds,
  digitalMenuTheme,
  onOpenScanner,
  onConfirmReady,
  onCancelWaitlist,
  onDismiss,
}) => {
  const [internalTimeLeft, setInternalTimeLeft] = useState(holdSeconds);

  const timeLeft = currentHoldSeconds !== undefined ? currentHoldSeconds : internalTimeLeft;

  const activeTheme = useMemo(
    () => getDigitalMenuVisualTheme(digitalMenuTheme || "roast"),
    [digitalMenuTheme]
  );

  const themeRgb = useMemo(() => {
    const hex = (activeTheme.avatarFallbackBg || "#E57B24").replace("#", "");
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
  }, [activeTheme.avatarFallbackBg]);

  const themeOpaqueColors = useMemo(() => {
    const { r, g, b } = themeRgb;
    const blend = (weight: number) => {
      const red = Math.round(r * weight + 255 * (1 - weight));
      const green = Math.round(g * weight + 255 * (1 - weight));
      const blue = Math.round(b * weight + 255 * (1 - weight));
      return `rgb(${red}, ${green}, ${blue})`;
    };

    return {
      topTint: blend(0.12),
      midTint: blend(0.04),
      bottomTint: "#FFFFFF",
      accent: `rgb(${r}, ${g}, ${b})`,
    };
  }, [themeRgb]);

  // Notification and vibration when sheet opens
  useEffect(() => {
    if (isOpen) {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate([150, 80, 180]);
        } catch {
          // Ignore
        }
      }

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification("✨ Your Table is Ready!", {
            body: `${tableNumber} is ready for ${guests} guests. Held for 5 minutes!`,
            icon: "/icons/icon-192x192.png",
          });
        } catch {
          // Ignore
        }
      }

      if (currentHoldSeconds === undefined) {
        setInternalTimeLeft(holdSeconds);
      }
    }
  }, [isOpen, holdSeconds, tableNumber, guests]);

  // Fallback internal countdown if not controlled by parent
  useEffect(() => {
    if (!isOpen || currentHoldSeconds !== undefined || internalTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setInternalTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, currentHoldSeconds, internalTimeLeft]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const handleSeatMeClick = () => {
    if (onOpenScanner) {
      onOpenScanner();
    } else {
      onConfirmReady(tableNumber, tableId);
    }
  };

  const handleCantMakeItClick = () => {
    if (onCancelWaitlist) {
      onCancelWaitlist();
    } else {
      onDismiss();
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:pb-5 bg-black/40 backdrop-blur-xs pointer-events-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onDismiss();
        }}
      >
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.05, bottom: 0.75 }}
          onDragEnd={(_e, info) => {
            if (info.offset.y > 75 || info.velocity.y > 350) {
              onDismiss();
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm sm:max-w-md relative flex flex-col pointer-events-auto max-h-[75vh] drop-shadow-[0_12px_28px_rgba(0,0,0,0.18)] touch-pan-y"
        >
          {/* SIGNATURE CONTINUOUS CENTER BEND SURFACE SVG */}
          <svg
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="tableReadySurfaceGrad"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={themeOpaqueColors.topTint} />
                <stop offset="16%" stopColor={themeOpaqueColors.midTint} />
                <stop offset="38%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
            </defs>
            <path
              d="M 0,22 C 0,10 18,0 48,0 C 90,0 120,14 200,14 C 280,14 310,0 352,0 C 382,0 400,10 400,22 L 400,372 C 400,388 388,400 372,400 L 28,400 C 12,400 0,388 0,372 Z"
              fill="url(#tableReadySurfaceGrad)"
              stroke="rgba(0, 0, 0, 0.10)"
              strokeWidth="1.2"
            />
          </svg>

          {/* Top Grab Pill nestled right in Center Bend Dip */}
          <div className="absolute top-3 inset-x-0 z-30 flex justify-center pointer-events-none">
            <div
              className="w-8 h-1 rounded-full shadow-2xs select-none bg-stone-300/80"
              title="Drag down to dismiss"
            />
          </div>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-3.5 right-4 z-30 p-1.5 rounded-full hover:bg-black/5 text-[#73716B] hover:text-[#1C1D1A] transition-colors cursor-pointer"
            title="Dismiss"
          >
            <IconX className="w-4 h-4" />
          </button>

          {/* Content Container (Clean, Non-Boxy, Compact) */}
          <div className="px-5 pt-5 pb-4 sm:pb-5 text-center space-y-2.5 relative z-20 flex-1 overflow-y-auto no-scrollbar">
            {/* Themed Icon Badge */}
            <div className="relative w-11 h-11 mx-auto flex items-center justify-center pt-0.5">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shadow-xs"
                style={{
                  backgroundColor: `rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.14)`,
                  color: themeOpaqueColors.accent,
                }}
              >
                <IconArmchair className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>

            {/* Title & Info */}
            <div className="space-y-0.5">
              <span
                className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block border"
                style={{
                  backgroundColor: `rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.08)`,
                  borderColor: `rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.22)`,
                  color: themeOpaqueColors.accent,
                }}
              >
                Your Table is Ready!
              </span>

              {/* Dynamic Re-prompt Banner */}
              {timeLeft <= 180 && timeLeft > 60 && (
                <div className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80 max-w-fit mx-auto mt-0.5">
                  Reminder: 3 minutes remaining to claim table
                </div>
              )}
              {timeLeft <= 60 && timeLeft > 0 && (
                <div className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/80 max-w-fit mx-auto mt-0.5">
                  Final Call: 1 minute remaining before release
                </div>
              )}

              <h2 className="text-xl sm:text-2xl font-black text-[#1C1D1A] tracking-tight leading-snug">
                {tableNumber}
              </h2>
              <p className="text-xs text-[#73716B] leading-tight max-w-xs mx-auto">
                We&apos;ve prepared a table for your party of{" "}
                <span className="font-bold text-[#1C1D1A]">{guests} guests</span>.
              </p>
            </div>

            {/* Clean Borderless Timer Row */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#73716B] py-0.5">
              <IconClock className="w-3.5 h-3.5 stroke-[2] text-stone-400" />
              <span>Held for:</span>
              <span className="font-mono font-bold text-[#1C1D1A]">{timeFormatted}</span>
            </div>

            {/* Action Buttons with Inner Shadow / Bevel Inset Effect */}
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={handleSeatMeClick}
                style={{
                  boxShadow:
                    "inset 0 1.5px 2px rgba(255, 255, 255, 0.35), inset 0 -2px 4px rgba(0, 0, 0, 0.4), 0 4px 14px rgba(0, 0, 0, 0.22)",
                }}
                className="w-full py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm text-white ring-1 ring-white/20 active:scale-[0.98] active:translate-y-0.5 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] transition-all cursor-pointer bg-gradient-to-b from-[#2C2D28] via-[#1C1D1A] to-[#11120F] flex items-center justify-center gap-2"
              >
                <IconQrcode className="w-4.5 h-4.5 stroke-[2.2] text-amber-400" />
                <span>I&apos;m Ready — Seat Me</span>
              </button>

              <button
                type="button"
                onClick={handleCantMakeItClick}
                className="w-full py-1 text-xs font-semibold text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                Can&apos;t make it right now
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
