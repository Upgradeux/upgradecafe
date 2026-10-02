"use client";

import React from "react";

export type StampIconType =
  | "coffee"
  | "latte"
  | "croissant"
  | "beans"
  | "leaf"
  | "takeaway"
  | "gift";

interface IconProps {
  className?: string;
  size?: number | string;
}

/**
 * 1. Steaming Ceramic Coffee Cup with Saucer
 * Matching the exact silhouette in Reference Stamp 1
 */
export function CoffeeStampIcon({ className = "w-7 h-7 sm:w-8 sm:h-8", size }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="currentColor"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* 3 Steam waves */}
      <path
        d="M17 6 C15.5 8 18 10 16.5 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M23 5 C21.5 7.5 24 9.5 22.5 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M29 6 C27.5 8 30 10 28.5 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Cup Body with handle */}
      <path
        d="M11 15 H32 V26 C32 31.5 27.5 35 21.5 35 C15.5 35 11 31.5 11 26 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      {/* Cup Inner solid fill with subtle opacity for depth */}
      <path
        d="M13 17 H30 V26 C30 30.5 26.5 33 21.5 33 C16.5 33 13 30.5 13 26 Z"
        fill="currentColor"
        fillOpacity="0.25"
      />
      {/* Cup Handle */}
      <path
        d="M32 18 H36 C39.5 18 41 20 41 23 C41 26 39.5 28 32 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Saucer */}
      <path
        d="M7 39 C14 41 29 41 36 39"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * 2. Latte Art Rosetta / Tulip Pour
 * Matching the exact silhouette in Reference Stamp 2
 */
export function LatteStampIcon({ className = "w-7 h-7 sm:w-8 sm:h-8", size }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="currentColor"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Central Stem Line */}
      <path
        d="M24 39 V10"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Layer 1: Top Heart / Rosetta Tip */}
      <path
        d="M24 9 C21 12 16 13 16 18 C16 22 20 24 24 24 C28 24 32 22 32 18 C32 13 27 12 24 9 Z"
        fill="currentColor"
        fillOpacity="0.9"
      />

      {/* Layer 2: Mid Petals */}
      <path
        d="M24 18 C18 20 14 23 15 27 C16 30 20 32 24 32 C28 32 32 30 33 27 C34 23 30 20 24 18 Z"
        fill="currentColor"
        fillOpacity="0.8"
      />

      {/* Layer 3: Bottom Tulip Base Petals */}
      <path
        d="M24 26 C17 27 13 31 14 34 C15 37 19 38 24 38 C29 38 33 37 34 34 C35 31 31 27 24 26 Z"
        fill="currentColor"
        fillOpacity="0.75"
      />

      {/* Side Leaf Accents */}
      <path
        d="M24 15 C20 13 15 16 15 20"
        fill="none"
        stroke="#FFF8EC"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M24 15 C28 13 33 16 33 20"
        fill="none"
        stroke="#FFF8EC"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M24 24 C19 23 15 26 16 30"
        fill="none"
        stroke="#FFF8EC"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M24 24 C29 23 33 26 32 30"
        fill="none"
        stroke="#FFF8EC"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * 3. Artisan Crescent Croissant
 * Matching the exact silhouette in Reference Stamp 3
 */
export function CroissantStampIcon({ className = "w-7 h-7 sm:w-8 sm:h-8", size }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="currentColor"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Croissant Silhouette Body */}
      <path
        d="M8 29 C7 24 11 17 21 16 C25 15.5 29 16 33 18 C38 20 41 24 40 29 C39 33 36 36 32 35 C28 34 26 31 24 31 C22 31 20 34 16 35 C12 36 9 33 8 29 Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      {/* Inner Pastry Layer Ribs / Folds */}
      <path
        d="M17 17 C15 21 15 27 18 33"
        fill="none"
        stroke="#7A361C"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M31 17 C33 21 33 27 30 33"
        fill="none"
        stroke="#7A361C"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M24 16 C23.5 21 23.5 26 24 31"
        fill="none"
        stroke="#7A361C"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Golden Highlight Arc */}
      <path
        d="M12 25 C16 19 28 19 36 24"
        fill="none"
        stroke="#FFF8EC"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 3"
      />
    </svg>
  );
}

/**
 * 4. Trio of Roasted Coffee Beans
 * Matching the exact silhouette in Reference Stamp 4
 */
export function BeansStampIcon({ className = "w-7 h-7 sm:w-8 sm:h-8", size }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="currentColor"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Bean 1 (Top Left) */}
      <g transform="rotate(-25 17 20)">
        <ellipse cx="17" cy="20" rx="6.5" ry="10" fill="currentColor" fillOpacity="0.95" />
        <path
          d="M17 11 C18.5 15 15.5 21 17 29"
          fill="none"
          stroke="#946522"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* Bean 2 (Top Right) */}
      <g transform="rotate(35 30 22)">
        <ellipse cx="30" cy="22" rx="6.5" ry="9.5" fill="currentColor" fillOpacity="0.95" />
        <path
          d="M30 13 C31.5 17 28.5 22 30 31"
          fill="none"
          stroke="#946522"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* Bean 3 (Bottom Center) */}
      <g transform="rotate(65 24 32)">
        <ellipse cx="24" cy="32" rx="5.5" ry="8.5" fill="currentColor" fillOpacity="0.95" />
        <path
          d="M24 24 C25 28 23 32 24 40"
          fill="none"
          stroke="#946522"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/**
 * 5. Botanical Coffee Plant Leaves
 * Matching the exact silhouette in Reference Stamp 5
 */
export function LeafStampIcon({ className = "w-7 h-7 sm:w-8 sm:h-8", size }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="currentColor"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Main Central Stem */}
      <path
        d="M24 39 C24 33 23 27 22 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Left Leaf */}
      <path
        d="M22 24 C14 23 10 16 11 11 C17 10 24 14 22 24 Z"
        fill="currentColor"
        fillOpacity="0.95"
      />
      {/* Left Leaf Center Vein */}
      <path
        d="M21 22 C17 18 15 15 13 12"
        fill="none"
        stroke="#3F4832"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Right Leaf (Slightly higher & fuller) */}
      <path
        d="M23 23 C25 15 32 11 37 13 C38 19 32 26 23 23 Z"
        fill="currentColor"
        fillOpacity="0.95"
      />
      {/* Right Leaf Center Vein */}
      <path
        d="M24 21 C28 18 32 16 35 14"
        fill="none"
        stroke="#3F4832"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Small Berry / Bud Cluster */}
      <circle cx="21" cy="27" r="2.2" fill="currentColor" />
      <circle cx="25" cy="29" r="1.8" fill="currentColor" fillOpacity="0.8" />
    </svg>
  );
}

/**
 * 6. Barista Takeaway Cup with Sip Lid and Heat Sleeve
 * Matching the exact silhouette in Reference Stamp 6
 */
export function TakeawayStampIcon({ className = "w-7 h-7 sm:w-8 sm:h-8", size }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="currentColor"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Sip Lid */}
      <path
        d="M17 10 H31 V13 H17 Z"
        fill="currentColor"
        fillOpacity="0.95"
      />
      {/* Sip Stopper Ridge */}
      <path
        d="M15 13 H33 V16 C33 16.5 32.5 17 32 17 H16 C15.5 17 15 16.5 15 16 Z"
        fill="currentColor"
      />

      {/* Cup Body (Tapered) */}
      <path
        d="M16 17 L19 38 C19.2 39 20 40 21 40 H27 C28 40 28.8 39 29 38 L32 17 Z"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <path
        d="M16 17 L19 38 C19.2 39 20 40 21 40 H27 C28 40 28.8 39 29 38 L32 17 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Ribbed Cardboard Heat Sleeve */}
      <path
        d="M17.5 23 H30.5 L29.5 32 H18.5 Z"
        fill="currentColor"
        fillOpacity="0.95"
      />
      {/* Sleeve subtle vertical ridges */}
      <path d="M21 24 V31" stroke="#482F24" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M24 24 V31" stroke="#482F24" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M27 24 V31" stroke="#482F24" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * 7. Gift Box (For Unlocked Reward Stamp Slot)
 * Matching the exact outline in Reference Stamp 7
 */
export function GiftStampIcon({ className = "w-7 h-7 sm:w-8 sm:h-8", size }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Box Base */}
      <rect x="13" y="21" width="22" height="17" rx="2" />
      {/* Lid */}
      <rect x="11" y="16" width="26" height="6" rx="1.5" />
      {/* Vertical Ribbon */}
      <line x1="24" y1="16" x2="24" y2="38" strokeWidth="2.2" />
      {/* Ribbon Bow Loops */}
      <path d="M24 16 C22 11 16 11 18 14 C19.5 16 23 16 24 16 Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M24 16 C26 11 32 11 30 14 C28.5 16 25 16 24 16 Z" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

/**
 * Registry to look up and render any stamp illustration
 */
export function StampIconRegistry({
  type,
  className,
  size,
}: {
  type: StampIconType;
  className?: string;
  size?: number | string;
}) {
  switch (type) {
    case "coffee":
      return <CoffeeStampIcon className={className} size={size} />;
    case "latte":
      return <LatteStampIcon className={className} size={size} />;
    case "croissant":
      return <CroissantStampIcon className={className} size={size} />;
    case "beans":
      return <BeansStampIcon className={className} size={size} />;
    case "leaf":
      return <LeafStampIcon className={className} size={size} />;
    case "takeaway":
      return <TakeawayStampIcon className={className} size={size} />;
    case "gift":
      return <GiftStampIcon className={className} size={size} />;
    default:
      return null;
  }
}
