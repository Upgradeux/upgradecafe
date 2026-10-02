"use client";

import React, { useId, type ReactNode } from "react";

export type StampVariant =
  | "coffee"
  | "chocolate"
  | "terracotta"
  | "gold"
  | "olive"
  | "brown";

export interface StampBadgeProps {
  variant: StampVariant;
  icon: ReactNode;
  collected?: boolean;
  className?: string;
  sizeClassName?: string;
  title?: string;
}

export const STAMP_COLORS: Record<
  StampVariant,
  { base: string; dark: string; light: string; shadow: string }
> = {
  coffee: {
    base: "#A96632",
    dark: "#875021",
    light: "#C17B3D",
    shadow: "rgba(135, 80, 33, 0.45)",
  },
  chocolate: {
    base: "#60402F",
    dark: "#412A1E",
    light: "#76513B",
    shadow: "rgba(65, 42, 30, 0.5)",
  },
  terracotta: {
    base: "#B75B32",
    dark: "#8F4224",
    light: "#CE7143",
    shadow: "rgba(143, 66, 36, 0.45)",
  },
  gold: {
    base: "#D7A44D",
    dark: "#B77E2E",
    light: "#E8C16C",
    shadow: "rgba(183, 126, 46, 0.45)",
  },
  olive: {
    base: "#687254",
    dark: "#4D583D",
    light: "#7E8A68",
    shadow: "rgba(77, 88, 61, 0.45)",
  },
  brown: {
    base: "#65483A",
    dark: "#493126",
    light: "#795646",
    shadow: "rgba(73, 49, 38, 0.45)",
  },
};

export function StampBadge({
  variant,
  icon,
  collected = true,
  className = "",
  sizeClassName = "size-[68px] xs:size-[76px] sm:size-[86px] md:size-[94px]",
  title,
}: StampBadgeProps) {
  const color = STAMP_COLORS[variant] || STAMP_COLORS.coffee;
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");

  if (!collected) {
    return (
      <div
        className={`relative ${sizeClassName} flex-shrink-0 transition-transform hover:scale-105 active:scale-95 duration-200 select-none ${className}`}
        title={title || "Collect with your next barista order"}
      >
        <svg
          viewBox="0 0 120 120"
          className="absolute inset-0 size-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.04)]"
          aria-hidden="true"
        >
          {/* Dashed outer perimeter */}
          <circle
            cx="60"
            cy="60"
            r="49"
            fill="none"
            stroke="#CFC4B5"
            strokeWidth="2.8"
            strokeDasharray="7 7"
          />

          {/* Pale inner cream circle */}
          <circle
            cx="60"
            cy="60"
            r="38"
            fill="#F8F4ED"
          />
        </svg>

        {/* Outline / muted icon centered */}
        <div className="absolute inset-0 grid place-items-center text-[#B9AD9D]">
          {icon}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative ${sizeClassName} flex-shrink-0 transition-transform hover:scale-105 active:scale-95 duration-200 select-none ${className}`}
      title={title || "Stamp Collected"}
    >
      <svg
        viewBox="0 0 120 120"
        className="absolute inset-0 size-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)]"
        aria-hidden="true"
      >
        <defs>
          {/* Main stamp radial gradient for organic wax convexity */}
          <radialGradient
            id={`stamp-grad-${safeId}`}
            cx="35%"
            cy="25%"
            r="65%"
          >
            <stop offset="0%" stopColor={color.light} />
            <stop offset="65%" stopColor={color.base} />
            <stop offset="100%" stopColor={color.dark} />
          </radialGradient>

          {/* Paper / printed ink wax texture filter */}
          <filter
            id={`texture-filt-${safeId}`}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves="3"
              seed="8"
            />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.14" />
            </feComponentTransfer>
            <feBlend mode="multiply" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Outer Irregular Wax Seal Contour */}
        <path
          d="
            M60 7
            C66 11 71 10 76 8
            C80 14 86 16 92 16
            C93 22 97 27 103 30
            C101 36 104 42 110 46
            C107 52 108 58 113 63
            C109 68 109 74 112 80
            C106 84 104 90 105 96
            C98 97 94 101 92 107
            C86 105 80 108 76 113
            C70 110 64 112 60 116
            C55 112 49 110 44 113
            C40 108 34 105 28 107
            C26 101 21 97 15 96
            C16 90 14 85 8 80
            C11 74 11 68 7 63
            C12 58 13 52 10 46
            C16 42 19 36 17 30
            C23 27 27 22 28 16
            C34 16 40 14 44 8
            C50 10 55 11 60 7
            Z
          "
          fill={`url(#stamp-grad-${safeId})`}
          filter={`url(#texture-filt-${safeId})`}
        />

        {/* Tactile Bevel Highlight on Rim */}
        <path
          d="
            M60 11
            C65 14 70 13 75 11
            C78 17 84 19 89 19
            C90 24 94 28 99 31
            C97 36 100 42 105 45
            C102 50 103 55 107 60
          "
          fill="none"
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Inner Scalloped Pressed Basin Ridge */}
        <path
          d="
            M60 15
            C66 18 72 17 77 15
            C80 21 86 23 92 23
            C91 29 96 34 101 36
            C98 42 101 48 106 51
            C102 57 103 63 108 67
            C103 72 103 78 106 83
            C100 87 98 92 99 98
            C92 97 87 101 84 106
            C78 102 72 104 68 108
            C63 104 57 104 52 108
            C48 104 42 102 36 106
            C33 101 28 97 21 98
            C22 92 20 87 14 83
            C17 78 17 72 12 67
            C17 63 18 57 14 51
            C19 48 22 42 19 36
            C24 34 29 29 28 23
            C34 23 40 21 43 15
            C49 17 55 18 60 15
            Z
          "
          fill="none"
          stroke="rgba(255, 255, 255, 0.28)"
          strokeWidth="1.6"
        />

        {/* Inner Basin Shade Depth */}
        <circle
          cx="60"
          cy="60"
          r="37"
          fill="none"
          stroke="rgba(0, 0, 0, 0.16)"
          strokeWidth="1.5"
        />
      </svg>

      {/* Custom Illustrated Icon Embossed in Center */}
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-[#FFF8EC] drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.35)] flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}
