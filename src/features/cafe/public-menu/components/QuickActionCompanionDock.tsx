"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  IconPlus,
  IconQrcode,
  IconDownload,
  IconTag,
  IconBellRinging,
  IconShare,
  IconClipboardList,
  IconCheck,
} from "@tabler/icons-react";
import { Cafe } from "@/lib/db/schema/cafes";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";

export interface QuickActionCompanionDockProps {
  cafe: Cafe;
  visualTheme: ReturnType<typeof getDigitalMenuVisualTheme>;
  activeTableName?: string | null;
  isAppInstalled?: boolean;
  onOpenScanner?: () => void;
  onOpenGetApp?: () => void;
  onOpenOffers?: () => void;
  onOpenCallStaff?: () => void;
  onShareMenu?: () => void;
  onOpenOrders?: () => void;
}

export const QuickActionCompanionDock: React.FC<QuickActionCompanionDockProps> = ({
  cafe,
  visualTheme,
  activeTableName,
  isAppInstalled = false,
  onOpenScanner,
  onOpenGetApp,
  onOpenOffers,
  onOpenCallStaff,
  onShareMenu,
  onOpenOrders,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  const handleAction = (callback?: () => void) => {
    close();
    if (callback) {
      callback();
    }
  };

  const actionTiles = [
    {
      id: "scanner",
      label: "Scanner",
      icon: <IconQrcode className="w-5 h-5 text-[#1C1D1A] stroke-[2]" />,
      onClick: () => handleAction(onOpenScanner),
      enabled: Boolean(onOpenScanner),
    },
    {
      id: "get_app",
      label: isAppInstalled ? "Installed" : "Get App",
      icon: isAppInstalled ? (
        <IconCheck className="w-5 h-5 text-emerald-600 stroke-[2.2]" />
      ) : (
        <IconDownload className="w-5 h-5 text-[#1C1D1A] stroke-[2]" />
      ),
      onClick: () => handleAction(onOpenGetApp),
      enabled: Boolean(onOpenGetApp),
    },
    {
      id: "offers",
      label: "Offers",
      icon: <IconTag className="w-5 h-5 text-[#1C1D1A] stroke-[2]" />,
      onClick: () => handleAction(onOpenOffers),
      enabled: Boolean(onOpenOffers),
    },
    {
      id: "call_staff",
      label: "Call Staff",
      icon: <IconBellRinging className="w-5 h-5 text-[#1C1D1A] stroke-[2]" />,
      onClick: () => handleAction(onOpenCallStaff),
      enabled: Boolean(onOpenCallStaff),
    },
    {
      id: "share",
      label: "Share",
      icon: <IconShare className="w-5 h-5 text-[#1C1D1A] stroke-[2]" />,
      onClick: () => handleAction(onShareMenu),
      enabled: Boolean(onShareMenu),
    },
    {
      id: "orders",
      label: "Orders",
      icon: <IconClipboardList className="w-5 h-5 text-[#1C1D1A] stroke-[2]" />,
      onClick: () => handleAction(onOpenOrders),
      enabled: Boolean(onOpenOrders),
    },
  ].filter((tile) => tile.enabled);

  return (
    <div className="relative pointer-events-auto">
      {/* Background Dim / Touch-outside Dismiss */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="companion-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      {/* Floating Popover Action Sheet */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="companion-popover"
            initial={{ opacity: 0, scale: 0.82, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 12 }}
            transition={{
              type: "spring",
              stiffness: 480,
              damping: 28,
              mass: 0.75,
            }}
            className="absolute bottom-16 right-0 z-50 w-72 sm:w-80 rounded-3xl p-3.5 bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_16px_40px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] origin-bottom-right"
          >
            {/* Header / Title */}
            <div className="flex items-center justify-between px-1 pb-2 border-b border-black/[0.04]">
              <span className="text-[10px] font-bold text-[#8C8A84] uppercase tracking-wider">
                Quick Actions
              </span>
              {activeTableName && (
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  Table {activeTableName}
                </span>
              )}
            </div>

            {/* Grid of Action Tiles */}
            <div className="grid grid-cols-3 gap-2 mt-2.5">
              {actionTiles.map((tile) => (
                <motion.button
                  key={tile.id}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={tile.onClick}
                  className="rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 bg-black/[0.03] hover:bg-black/[0.06] active:bg-black/[0.08] transition-colors cursor-pointer select-none group"
                >
                  <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95">
                    {tile.icon}
                  </div>
                  <span className="text-[11px] font-medium text-[#2E2C29] tracking-tight leading-none truncate max-w-full">
                    {tile.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Companion Plus (+) Button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={toggleOpen}
        title={isOpen ? "Close Actions" : "Quick Actions"}
        className="relative z-50 w-11 h-11 sm:w-12 sm:h-12 rounded-full backdrop-blur-2xl border border-white/80 flex items-center justify-center cursor-pointer select-none shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.95),0_6px_20px_-2px_rgba(0,0,0,0.08),0_2px_6px_-1px_rgba(0,0,0,0.04)] focus:outline-none transition-colors"
        style={{
          backgroundColor: isOpen
            ? visualTheme.avatarFallbackBg || "#FF6FAE"
            : `${visualTheme.dockBg}d9`,
        }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ type: "spring", stiffness: 450, damping: 25 }}
          className="flex items-center justify-center"
        >
          <IconPlus
            className={`w-5 h-5 stroke-[2.4] transition-colors ${
              isOpen ? "text-white" : "text-[#1C1D1A]"
            }`}
          />
        </motion.div>
      </motion.button>
    </div>
  );
};
