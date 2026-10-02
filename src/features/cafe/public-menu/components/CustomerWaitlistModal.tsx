"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Table } from "@/lib/db/schema/tables";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import {
  IconX,
  IconClock,
  IconUsers,
  IconArmchair,
  IconMinus,
  IconPlus,
} from "@tabler/icons-react";

export interface WaitlistSubmissionData {
  id?: string;
  name: string;
  phone: string;
  guests: number;
  preferredTableId: string | null;
  preferredTableName: string | null;
}

export interface CustomerWaitlistModalProps {
  isOpen: boolean;
  cafeName: string;
  cafeSlug: string;
  tablesList?: Table[];
  defaultName?: string;
  defaultPhone?: string;
  digitalMenuTheme?: string;
  onClose: () => void;
  onJoinedWaitlist: (data: WaitlistSubmissionData, queueNumber: number) => void;
}

export const CustomerWaitlistModal: React.FC<CustomerWaitlistModalProps> = ({
  isOpen,
  cafeName,
  cafeSlug,
  tablesList = [],
  defaultName = "",
  defaultPhone = "",
  digitalMenuTheme,
  onClose,
  onJoinedWaitlist,
}) => {
  const [guests, setGuests] = useState(2);
  const [preferenceType, setPreferenceType] = useState<"ANY" | "SPECIFIC">("ANY");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync default name and phone if provided
  useEffect(() => {
    if (defaultName && !name) setName(defaultName);
    if (defaultPhone && !phone) setPhone(defaultPhone);
  }, [defaultName, defaultPhone]);

  // Reset error when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const visualTheme = useMemo(
    () => getDigitalMenuVisualTheme(digitalMenuTheme || "roast"),
    [digitalMenuTheme]
  );

  // Parse primary RGB for center-bend gradient & accents
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
    return { r: 229, g: 123, b: 36 }; // warm cafe amber fallback
  }, [visualTheme.avatarFallbackBg]);

  // Clean, subtle themed colors (delicate whisper at top bend, crisp white body)
  const themeOpaqueColors = useMemo(() => {
    const { r, g, b } = themeRgb;
    const blend = (weight: number) => {
      const red = Math.round(r * weight + 255 * (1 - weight));
      const green = Math.round(g * weight + 255 * (1 - weight));
      const blue = Math.round(b * weight + 255 * (1 - weight));
      return `rgb(${red}, ${green}, ${blue})`;
    };

    return {
      topTint: blend(0.08), // subtle whisper at top
      midTint: blend(0.02),
      bottomTint: "#FFFFFF",
      accent: `rgb(${r}, ${g}, ${b})`,
    };
  }, [themeRgb]);

  // Compatible occupied tables based on party size
  const compatibleOccupiedTables = useMemo(() => {
    return tablesList.filter((t) => {
      const cap = t.capacity || 2;
      return cap >= guests;
    });
  }, [tablesList, guests]);

  // Auto-select first compatible table if specific mode is chosen and none selected
  useEffect(() => {
    if (preferenceType === "SPECIFIC") {
      if (!selectedTableId || !compatibleOccupiedTables.some((t) => t.id === selectedTableId)) {
        if (compatibleOccupiedTables.length > 0) {
          setSelectedTableId(compatibleOccupiedTables[0].id);
        } else {
          setSelectedTableId(null);
        }
      }
    }
  }, [preferenceType, compatibleOccupiedTables, selectedTableId]);

  const selectedTableObj = useMemo(() => {
    if (preferenceType === "SPECIFIC" && selectedTableId) {
      return tablesList.find((t) => t.id === selectedTableId) || null;
    }
    return null;
  }, [preferenceType, selectedTableId, tablesList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setError("Please enter a valid mobile number.");
      return;
    }
    if (preferenceType === "SPECIFIC" && !selectedTableId) {
      setError("Please select a specific table or choose 'Any available table'.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch(`/api/cafe/${cafeSlug}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          name: name.trim(),
          phone: phone.trim(),
          guests,
          preferenceType,
          preferredTableId: preferenceType === "SPECIFIC" ? selectedTableId : null,
          preferredTableName:
            preferenceType === "SPECIFIC" && selectedTableObj
              ? selectedTableObj.tableNumber
              : "Any available table",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to join waiting list");
      }

      const queueNum = json.data?.queueNumber || 1;
      const entryId = json.data?.entry?.id;

      const submission: WaitlistSubmissionData = {
        id: entryId,
        name: name.trim(),
        phone: phone.trim(),
        guests,
        preferredTableId: preferenceType === "SPECIFIC" ? selectedTableId : null,
        preferredTableName:
          preferenceType === "SPECIFIC" && selectedTableObj
            ? selectedTableObj.tableNumber
            : "Any available table",
      };

      onJoinedWaitlist(submission, queueNum);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Could not join waiting list. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target !== e.currentTarget) return;
          onClose();
        }}
        className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:pb-5 bg-black/40 backdrop-blur-xs pointer-events-auto"
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
              onClose();
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm sm:max-w-md relative flex flex-col pointer-events-auto max-h-[82vh] drop-shadow-[0_12px_28px_rgba(0,0,0,0.18)] touch-pan-y"
        >
          {/* SINGLE UNIFIED CONTINUOUS SURFACE (Signature Center Bend Curve & Clean Subtle Tint) */}
          <svg
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="waitlistModalSingleSurfaceGrad"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={themeOpaqueColors.topTint} />
                <stop offset="12%" stopColor={themeOpaqueColors.midTint} />
                <stop offset="25%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
            </defs>
            <path
              d="M 0,22 C 0,10 18,0 48,0 C 90,0 120,14 200,14 C 280,14 310,0 352,0 C 382,0 400,10 400,22 L 400,372 C 400,388 388,400 372,400 L 28,400 C 12,400 0,388 0,372 Z"
              fill="url(#waitlistModalSingleSurfaceGrad)"
              stroke="rgba(0, 0, 0, 0.10)"
              strokeWidth="1.2"
            />
          </svg>

          {/* Top Grab Pill nestled right inside Center Bend Dip */}
          <div className="absolute top-2 inset-x-0 z-30 flex justify-center pointer-events-none">
            <div
              className="w-8 h-1 rounded-full shadow-2xs select-none bg-stone-300/80"
              title="Drag down to close"
            />
          </div>

          {/* Modal Content Scroll Area */}
          <div className="px-4.5 sm:px-5 pt-3 pb-3.5 sm:pb-4 space-y-2.5 relative z-20 flex-1 overflow-y-auto no-scrollbar">
            {/* Header: Compact Icon + Title/Subtitle + Close Button */}
            <div className="flex items-center justify-between gap-2 pt-3 pb-0.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-2xs"
                  style={{
                    backgroundColor: `rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.12)`,
                    color: themeOpaqueColors.accent,
                  }}
                >
                  <IconClock className="w-4 h-4 stroke-[2.3]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-extrabold text-[#1C1D1A] tracking-tight leading-none">
                    Join Waiting List
                  </h2>
                  <p className="text-[11px] text-[#73716B] leading-tight truncate mt-0.5">
                    We&apos;ll notify you when a table becomes available.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full hover:bg-black/5 text-[#73716B] hover:text-[#1C1D1A] transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5 text-left">
                {/* 1. Compact Single-Row Party Size Stepper */}
                <div className="px-3 py-2 rounded-xl bg-stone-50/80 border border-stone-200/80 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconUsers
                      className="w-4 h-4 stroke-[2.2]"
                      style={{ color: themeOpaqueColors.accent }}
                    />
                    <div>
                      <span className="text-xs font-bold text-[#1C1D1A] block leading-none">
                        Party Size
                      </span>
                      <span className="text-[9.5px] text-[#73716B] leading-none">
                        How many guests?
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={guests <= 1}
                      onClick={() => {
                        const newG = Math.max(1, guests - 1);
                        setGuests(newG);
                        if (selectedTableObj && (selectedTableObj.capacity || 2) < newG) {
                          setSelectedTableId(null);
                        }
                      }}
                      className="w-7 h-7 rounded-lg bg-white border border-stone-200/90 text-[#1C1D1A] flex items-center justify-center shadow-2xs hover:bg-stone-50 active:scale-95 disabled:opacity-30 transition-all cursor-pointer"
                      aria-label="Decrease party size"
                    >
                      <IconMinus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <span className="font-bold text-xs text-[#1C1D1A] min-w-16 text-center select-none font-mono">
                      {guests} {guests === 1 ? "Guest" : "Guests"}
                    </span>
                    <button
                      type="button"
                      disabled={guests >= 12}
                      onClick={() => {
                        const newG = Math.min(12, guests + 1);
                        setGuests(newG);
                        if (selectedTableObj && (selectedTableObj.capacity || 2) < newG) {
                          setSelectedTableId(null);
                        }
                      }}
                      className="w-7 h-7 rounded-lg bg-white border border-stone-200/90 text-[#1C1D1A] flex items-center justify-center shadow-2xs hover:bg-stone-50 active:scale-95 disabled:opacity-30 transition-all cursor-pointer"
                      aria-label="Increase party size"
                    >
                      <IconPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* 2. Compact Table Preference */}
                <div className="space-y-1.5 text-left">
                  <span className="text-[9.5px] font-bold text-[#73716B] uppercase tracking-wider block">
                    Table Preference
                  </span>

                  <div className="space-y-1.5">
                    {/* Option 1: Any available table (Fastest seating) */}
                    <div
                      onClick={() => {
                        setPreferenceType("ANY");
                        setSelectedTableId(null);
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                        preferenceType === "ANY"
                          ? "shadow-2xs"
                          : "border-stone-200/80 bg-white/70 hover:border-stone-300 hover:bg-white"
                      }`}
                      style={
                        preferenceType === "ANY"
                          ? {
                              borderColor: themeOpaqueColors.accent,
                              backgroundColor: `rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.04)`,
                            }
                          : undefined
                      }
                    >
                      {/* Radio Circle */}
                      <div className="mt-0.5 shrink-0">
                        <div
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all ${
                            preferenceType === "ANY"
                              ? "border-transparent"
                              : "border-stone-300 bg-white"
                          }`}
                          style={
                            preferenceType === "ANY"
                              ? { backgroundColor: themeOpaqueColors.accent }
                              : undefined
                          }
                        >
                          {preferenceType === "ANY" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-[#1C1D1A] leading-snug">
                          Any available table (Fastest seating)
                        </div>
                        <p className="text-[10.5px] text-[#73716B] leading-tight mt-0.5">
                          Notify me as soon as any table for {guests}{" "}
                          {guests === 1 ? "guest" : "guests"} becomes available.
                        </p>
                      </div>
                    </div>

                    {/* Option 2: Choose a specific table */}
                    <div
                      onClick={() => setPreferenceType("SPECIFIC")}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none space-y-1.5 ${
                        preferenceType === "SPECIFIC"
                          ? "shadow-2xs"
                          : "border-stone-200/80 bg-white/70 hover:border-stone-300 hover:bg-white"
                      }`}
                      style={
                        preferenceType === "SPECIFIC"
                          ? {
                              borderColor: themeOpaqueColors.accent,
                              backgroundColor: `rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.04)`,
                            }
                          : undefined
                      }
                    >
                      <div className="flex items-start gap-2.5">
                        {/* Radio Circle */}
                        <div className="mt-0.5 shrink-0">
                          <div
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all ${
                              preferenceType === "SPECIFIC"
                                ? "border-transparent"
                                : "border-stone-300 bg-white"
                            }`}
                            style={
                              preferenceType === "SPECIFIC"
                                ? { backgroundColor: themeOpaqueColors.accent }
                                : undefined
                            }
                          >
                            {preferenceType === "SPECIFIC" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-[#1C1D1A] leading-snug">
                            Choose a specific table
                          </div>
                          <p className="text-[10.5px] text-[#73716B] leading-tight mt-0.5">
                            Only seat me when my chosen table becomes free.
                          </p>
                        </div>
                      </div>

                      {/* Horizontal pill list of compatible tables when Specific Table is active */}
                      {preferenceType === "SPECIFIC" && (
                        <div className="pl-6 pt-0.5">
                          {compatibleOccupiedTables.length === 0 ? (
                            <p className="text-[10.5px] text-stone-500 italic">
                              No tables fit {guests} guests. Please choose &quot;Any available table&quot;.
                            </p>
                          ) : (
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                              {compatibleOccupiedTables.map((t) => {
                                const isSelected = selectedTableId === t.id;
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTableId(t.id);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg border text-[10.5px] whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                                      isSelected
                                        ? "bg-white font-bold text-[#1C1D1A] shadow-xs"
                                        : "bg-white/80 border-stone-200 text-[#73716B] hover:text-[#1C1D1A]"
                                    }`}
                                    style={
                                      isSelected
                                        ? {
                                            borderColor: themeOpaqueColors.accent,
                                            boxShadow: `0 0 0 1px ${themeOpaqueColors.accent}`,
                                          }
                                        : undefined
                                    }
                                  >
                                    <IconArmchair
                                      className="w-3 h-3 stroke-[2.2]"
                                      style={{ color: themeOpaqueColors.accent }}
                                    />
                                    <span>{t.tableNumber}</span>
                                    <span className="text-[9px] opacity-70">
                                      ({t.capacity || 2}s)
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Compact Your Details (Side-by-side) */}
                <div className="space-y-1 text-left">
                  <span className="text-[9.5px] font-bold text-[#73716B] uppercase tracking-wider block">
                    Your Details
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[8.5px] font-bold text-[#73716B] uppercase tracking-wider block mb-0.5">
                        Full Name
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Swapnil"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg border border-stone-200 bg-white/95 text-xs text-[#1C1D1A] placeholder:text-stone-400 focus:outline-none focus:ring-1.5 focus:border-transparent shadow-2xs transition-all"
                        style={{ outlineColor: themeOpaqueColors.accent }}
                      />
                    </div>
                    <div>
                      <span className="text-[8.5px] font-bold text-[#73716B] uppercase tracking-wider block mb-0.5">
                        Mobile Number
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg border border-stone-200 bg-white/95 text-xs text-[#1C1D1A] placeholder:text-stone-400 focus:outline-none focus:ring-1.5 focus:border-transparent shadow-2xs transition-all"
                        style={{ outlineColor: themeOpaqueColors.accent }}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="text-[11px] text-rose-600 font-medium px-1">
                    {error}
                  </p>
                )}

                {/* 4. Action Button with Order Place Bevel & Inset Inner Shadow */}
                <div className="pt-0.5">
                  <button
                    type="submit"
                    style={{
                      boxShadow:
                        "inset 0 1.5px 2px rgba(255, 255, 255, 0.35), inset 0 -2px 4px rgba(0, 0, 0, 0.4), 0 4px 14px rgba(0, 0, 0, 0.22)",
                    }}
                    className="w-full py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm text-white ring-1 ring-white/20 active:scale-[0.98] active:translate-y-0.5 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] transition-all cursor-pointer bg-gradient-to-b from-[#2C2D28] via-[#1C1D1A] to-[#11120F] flex items-center justify-center gap-2"
                  >
                    <IconClock className="w-4 h-4 text-amber-400 stroke-[2.3]" />
                    <span>Join Waiting List</span>
                  </button>
                </div>
              </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
