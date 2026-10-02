"use client";

import React from "react";
import { motion } from "motion/react";

interface AnimatedCelebrationIconProps {
  themeColor?: string;
  badgeBg?: string;
  className?: string;
}

export const AnimatedCelebrationIcon: React.FC<AnimatedCelebrationIconProps> = ({
  themeColor = "#30AFFF",
  badgeBg = "rgba(48, 175, 255, 0.12)",
  className = "",
}) => {
  return (
    <div
      className={`relative w-14 h-14 mx-auto flex items-center justify-center select-none ${className}`}
    >
      {/* 1. Pulsing Soft Ambient Wave */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0.4 }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ backgroundColor: themeColor }}
      />

      {/* 2. Soft Outer Badge Circle with Theme Tint & Inset Highlight */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
        className="w-14 h-14 rounded-full flex items-center justify-center border border-white/90 shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.9),0_4px_12px_rgba(0,0,0,0.06)] relative"
        style={{
          background: `linear-gradient(145deg, ${badgeBg} 0%, rgba(255,255,255,0.92) 100%)`,
        }}
      >
        {/* 3. Central Vibrant Theme Disc with Cloche Silhouette + Animated Checkmark */}
        <motion.div
          initial={{ scale: 0.75 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 450, damping: 20, delay: 0.08 }}
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-xs relative"
          style={{
            background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}E0 100%)`,
            boxShadow: `0 3px 10px ${themeColor}40, inset 0 1px 1.5px rgba(255,255,255,0.45)`,
          }}
        >
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 overflow-visible"
          >
            {/* Elegant Kitchen Platter / Cloche Silhouette Base */}
            <path
              d="M 6 23 C 6 22 9 20.5 16 20.5 C 23 20.5 26 22 26 23"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />

            {/* Smooth Animated Signature Order Placed Checkmark */}
            <motion.path
              d="M 9.5 15.5 L 14 20 L 22.5 11"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.16, duration: 0.45, ease: "easeOut" }}
            />
          </svg>
        </motion.div>

        {/* 4. Celebratory Twinkling Golden Star (Top Right) */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.3,
            type: "spring",
            stiffness: 380,
            damping: 14,
          }}
          className="absolute -top-1 -right-1 select-none pointer-events-none drop-shadow-2xs"
        >
          <svg className="w-4 h-4 fill-amber-400" viewBox="0 0 24 24">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </motion.div>

        {/* 5. Theme Confetti Dot (Top Left) */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.38, type: "spring", stiffness: 350, damping: 16 }}
          className="absolute top-0.5 -left-0.5 w-2 h-2 rounded-full shadow-2xs pointer-events-none"
          style={{ backgroundColor: themeColor }}
        />

        {/* 6. Emerald Confetti Dot (Bottom Right) */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.44, type: "spring", stiffness: 350, damping: 16 }}
          className="absolute -bottom-0.5 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 pointer-events-none"
        />
      </motion.div>
    </div>
  );
};
