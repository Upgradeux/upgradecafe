"use client";

import React, { useMemo } from "react";
import { StampBadge, type StampVariant } from "./StampBadge";
import { StampIconRegistry, type StampIconType } from "./StampIcons";

export interface StampItemConfig {
  id: string;
  icon: StampIconType;
  variant: StampVariant;
  title?: string;
  collected?: boolean;
}

export interface StampCardProps {
  cafeName?: string;
  collected?: number;
  total?: number;
  stamps?: StampItemConfig[];
  className?: string;
  onCardClick?: () => void;
  // Compatibility props with existing codebase
  stampsCollected?: number;
  stampsRequired?: number;
}

const DEFAULT_STAMP_PRESETS: Array<{
  icon: StampIconType;
  variant: StampVariant;
  title: string;
}> = [
  { icon: "coffee", variant: "coffee", title: "Espresso Brew" },
  { icon: "latte", variant: "chocolate", title: "Latte Art Rosetta" },
  { icon: "croissant", variant: "terracotta", title: "Artisan Croissant" },
  { icon: "beans", variant: "gold", title: "Roasted Coffee Beans" },
  { icon: "leaf", variant: "olive", title: "Botanical Cherry Leaves" },
  { icon: "takeaway", variant: "brown", title: "Barista Takeaway Cup" },
  { icon: "gift", variant: "brown", title: "Complimentary Artisan Brew" },
];

/**
 * StampCard Header (Clean typography & minimal bean mark matching reference)
 */
export function StampCardHeader({
  cafeName,
  total,
}: {
  cafeName: string;
  total: number;
}) {
  return (
    <div className="relative z-10 flex items-start justify-between gap-3">
      {/* Title & Subtitle */}
      <div>
        <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#1F1813] tracking-tight leading-tight">
          {cafeName} Pass
        </h3>
        <p className="text-[9px] sm:text-[10.5px] font-bold text-[#8C7D70] tracking-[0.28em] uppercase mt-0.5">
          {total} STAMP CARD
        </p>
      </div>

      {/* Minimalist Coffee Bean Icon & Cafe Name Tag */}
      <div className="flex items-center gap-1.5 flex-shrink-0 pt-1">
        <svg
          viewBox="0 0 24 24"
          className="w-4.5 h-4.5 text-[#2E241B]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <ellipse cx="12" cy="12" rx="6.5" ry="9.5" transform="rotate(-35 12 12)" />
          <path d="M12 4.5 C14 8 10 14 12 19.5" />
        </svg>
        <span className="text-[8.5px] sm:text-[9.5px] font-semibold text-[#3C3228] tracking-[0.22em] uppercase">
          {cafeName}
        </span>
      </div>
    </div>
  );
}

/**
 * StampGrid (2-Row Layout matching the reference image)
 */
export function StampGrid({
  stamps,
}: {
  stamps: StampItemConfig[];
}) {
  // If exactly 7 stamps, layout Row 1 (4 stamps) + Row 2 (3 stamps centered)
  if (stamps.length === 7) {
    const row1 = stamps.slice(0, 4);
    const row2 = stamps.slice(4, 7);

    return (
      <div className="relative z-10 pt-4 sm:pt-6 space-y-3 sm:space-y-4">
        {/* ROW 1: 4 Stamps */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3.5 justify-items-center">
          {row1.map((s) => (
            <StampBadge
              key={s.id}
              variant={s.variant}
              collected={s.collected}
              title={s.title}
              icon={
                <StampIconRegistry
                  type={s.icon}
                  className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8"
                />
              }
            />
          ))}
        </div>

        {/* ROW 2: 3 Stamps Centered/Staggered */}
        <div className="flex items-center justify-center gap-3.5 sm:gap-6">
          {row2.map((s) => (
            <StampBadge
              key={s.id}
              variant={s.variant}
              collected={s.collected}
              title={s.title}
              icon={
                <StampIconRegistry
                  type={s.icon}
                  className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8"
                />
              }
            />
          ))}
        </div>
      </div>
    );
  }

  // Generic dynamic layout for other stamp counts (e.g. 6, 8, 10)
  return (
    <div className="relative z-10 pt-4 sm:pt-6">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 justify-items-center">
        {stamps.map((s) => (
          <StampBadge
            key={s.id}
            variant={s.variant}
            collected={s.collected}
            title={s.title}
            icon={
              <StampIconRegistry
                type={s.icon}
                className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8"
              />
            }
          />
        ))}
      </div>
    </div>
  );
}

/**
 * StampCard Description / Footer (Exact 2-line copy from reference)
 */
export function StampCardDescription({
  total,
}: {
  total: number;
}) {
  const ordinal =
    total === 7
      ? "7th"
      : total === 8
      ? "8th"
      : total === 10
      ? "10th"
      : `${total}th`;

  return (
    <div className="relative z-10 text-center pt-3.5 sm:pt-5 space-y-0.5">
      <p className="text-xs sm:text-[13px] text-[#4F4439] font-medium tracking-tight leading-snug">
        Collect 1 stamp with every qualifying barista order.
      </p>
      <p className="text-xs sm:text-[13px] text-[#4F4439] font-medium tracking-tight leading-snug">
        {ordinal} stamp unlocks a complimentary artisan brew!
      </p>
    </div>
  );
}

/**
 * Full StampCard Component with antique parchment aesthetics, botanical branch watermark,
 * coffee bean sketches, and custom illustrated SVG wax seal badges.
 */
export function StampCard({
  cafeName = "The Roasted Bean",
  collected,
  total,
  stamps: customStamps,
  className = "",
  onCardClick,
  stampsCollected,
  stampsRequired,
}: StampCardProps) {
  // Resolve collected count and total count with backwards-compatibility
  const effectiveCollected =
    collected !== undefined
      ? collected
      : stampsCollected !== undefined
      ? stampsCollected
      : 6;

  const effectiveTotal =
    total !== undefined
      ? total
      : stampsRequired !== undefined
      ? stampsRequired
      : 7;

  // Build stamp items configuration dynamically
  const stamps: StampItemConfig[] = useMemo(() => {
    if (customStamps && customStamps.length > 0) {
      return customStamps.map((item, idx) => ({
        ...item,
        collected: item.collected !== undefined ? item.collected : idx < effectiveCollected,
      }));
    }

    return Array.from({ length: effectiveTotal }).map((_, idx) => {
      const isFinal = idx === effectiveTotal - 1;
      const isCollected = idx < effectiveCollected;

      if (isFinal) {
        return {
          id: `stamp-${idx + 1}`,
          icon: "gift" as StampIconType,
          variant: "brown" as StampVariant,
          title: "Complimentary Artisan Brew",
          collected: isCollected,
        };
      }

      const preset = DEFAULT_STAMP_PRESETS[idx % (DEFAULT_STAMP_PRESETS.length - 1)];
      return {
        id: `stamp-${idx + 1}`,
        icon: preset.icon,
        variant: preset.variant,
        title: preset.title,
        collected: isCollected,
      };
    });
  }, [customStamps, effectiveCollected, effectiveTotal]);

  return (
    <div
      onClick={onCardClick}
      className={`relative w-full rounded-[28px] p-5 sm:p-7 overflow-hidden border border-[#E8DEC9] select-none transition-all ${
        onCardClick ? "cursor-pointer hover:shadow-md active:scale-[0.99]" : ""
      } ${className}`}
      style={{
        backgroundColor: "#FAF7EE",
        backgroundImage: `
          radial-gradient(#E8DFC9 0.75px, transparent 0.75px),
          radial-gradient(#E8DFC9 0.75px, #FAF7EE 0.75px)
        `,
        backgroundSize: "28px 28px",
        backgroundPosition: "0 0, 14px 14px",
        boxShadow:
          "0 4px 20px -2px rgba(92, 61, 38, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(255, 255, 255, 0.8)",
      }}
    >
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          AUTHENTIC BOTANICAL COFFEE WATERMARKS (MATCHING REFERENCE IMAGE)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

      {/* Bottom Left: Botanical Coffee Branch with Leaves & Cherries */}
      <svg
        viewBox="0 0 160 180"
        fill="none"
        stroke="#8A7761"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute -bottom-6 -left-6 w-36 h-40 sm:w-44 sm:h-48 opacity-[0.16] pointer-events-none select-none"
        aria-hidden="true"
      >
        <path d="M10 170 C40 140 70 100 95 30" strokeWidth="1.6" />
        <path d="M45 135 C30 120 20 105 25 85 C40 90 55 110 50 130 Z" />
        <path d="M30 100 C37 105 45 115 48 128" />
        <path d="M60 115 C75 105 95 105 105 120 C90 135 70 135 60 115 Z" />
        <path d="M72 115 C85 120 95 122 102 122" />
        <path d="M75 80 C60 65 55 45 68 35 C80 48 85 68 75 80 Z" />
        <path d="M66 50 C70 58 75 66 74 76" />
        <path d="M85 65 C100 50 120 52 130 65 C118 78 98 80 85 65 Z" />
        {/* Coffee berries cluster */}
        <circle cx="55" cy="120" r="4.5" fill="#8A7761" fillOpacity="0.12" />
        <circle cx="62" cy="126" r="4" fill="#8A7761" fillOpacity="0.12" />
        <circle cx="65" cy="118" r="4.2" fill="#8A7761" fillOpacity="0.12" />
        <circle cx="78" cy="78" r="4.5" fill="#8A7761" fillOpacity="0.12" />
        <circle cx="83" cy="85" r="4" fill="#8A7761" fillOpacity="0.12" />
      </svg>

      {/* Bottom Right: Scattered Botanical Coffee Beans Watermark */}
      <svg
        viewBox="0 0 120 120"
        fill="none"
        stroke="#8A7761"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute -bottom-4 -right-4 w-28 h-28 sm:w-36 sm:h-36 opacity-[0.16] pointer-events-none select-none"
        aria-hidden="true"
      >
        <g transform="rotate(-30 35 65)">
          <ellipse cx="35" cy="65" rx="7" ry="11" fill="#8A7761" fillOpacity="0.08" />
          <path d="M35 55 C37 60 33 67 35 75" />
        </g>
        <g transform="rotate(45 85 80)">
          <ellipse cx="85" cy="80" rx="6.5" ry="10" fill="#8A7761" fillOpacity="0.08" />
          <path d="M85 72 C87 77 84 82 85 88" />
        </g>
        <g transform="rotate(15 95 35)">
          <ellipse cx="95" cy="35" rx="5" ry="8" fill="#8A7761" fillOpacity="0.08" />
          <path d="M95 28 C96 32 94 37 95 42" />
        </g>
      </svg>

      {/* Header */}
      <StampCardHeader cafeName={cafeName} total={effectiveTotal} />

      {/* Grid of Custom Illustrated SVG Wax Seals */}
      <StampGrid stamps={stamps} />

      {/* Footer Copy */}
      <StampCardDescription total={effectiveTotal} />
    </div>
  );
}
