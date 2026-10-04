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
  IconCheck,
} from "@tabler/icons-react";
import { Cafe } from "@/lib/db/schema/cafes";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";

export interface DockTabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  onPointerDown?: () => void;
  badge?: number;
  badgeColor?: string;
  hasPulse?: boolean;
}

export interface UnifiedFloatingDockProps {
  cafe: Cafe;
  visualTheme: ReturnType<typeof getDigitalMenuVisualTheme>;
  tabs: DockTabItem[];
  activeTableName?: string | null;
  isAppInstalled?: boolean;
  onOpenScanner?: () => void;
  onOpenGetApp?: () => void;
  onOpenOffers?: () => void;
  onOpenCallStaff?: () => void;
  onShareMenu?: () => void;
}

export const UnifiedFloatingDock: React.FC<UnifiedFloatingDockProps> = ({
  cafe,
  visualTheme,
  tabs,
  activeTableName,
  isAppInstalled = false,
  onOpenScanner,
  onOpenGetApp,
  onOpenOffers,
  onOpenCallStaff,
  onShareMenu,
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

  // Compact quick action tiles (Orders excluded since it is already on the main dock)
  const actionTiles = [
    {
      id: "scanner",
      label: "Scanner",
      icon: <IconQrcode className="w-[19px] h-[19px] stroke-[2.2]" />,
      onClick: () => handleAction(onOpenScanner),
      enabled: Boolean(onOpenScanner),
    },
    {
      id: "get_app",
      label: isAppInstalled ? "Installed" : "Get App",
      icon: isAppInstalled ? (
        <IconCheck className="w-[19px] h-[19px] stroke-[2.4]" />
      ) : (
        <IconDownload className="w-[19px] h-[19px] stroke-[2.2]" />
      ),
      onClick: () => handleAction(onOpenGetApp),
      enabled: Boolean(onOpenGetApp),
    },
    {
      id: "offers",
      label: "Offers",
      icon: <IconTag className="w-[19px] h-[19px] stroke-[2.2]" />,
      onClick: () => handleAction(onOpenOffers),
      enabled: Boolean(onOpenOffers),
    },
    {
      id: "call_staff",
      label: "Call Staff",
      icon: <IconBellRinging className="w-[19px] h-[19px] stroke-[2.2]" />,
      onClick: () => handleAction(onOpenCallStaff),
      enabled: Boolean(onOpenCallStaff),
    },
    {
      id: "share",
      label: "Share",
      icon: <IconShare className="w-[19px] h-[19px] stroke-[2.2]" />,
      onClick: () => handleAction(onShareMenu),
      enabled: Boolean(onShareMenu),
    },
  ].filter((tile) => tile.enabled);

  return (
    <>
      {/* Outside Click Catcher: Transparent touch listener without blur over the dock */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="dock-backdrop-catcher"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
            className="fixed inset-0 z-30 bg-transparent pointer-events-auto"
          />
        )}
      </AnimatePresence>

      {/* Floating Bottom Dock Container: Ergonomic, touch-friendly 60px height on mobile & desktop */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-[376px] flex items-end justify-center gap-2.5 pointer-events-auto">
        {/* Left Side: Smoothly transitions between 4-tab Navigation Bar and Action Sheet */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            {!isOpen ? (
              <motion.nav
                key="dock-nav-bar"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="w-full h-[60px] backdrop-blur-2xl rounded-full border border-white/90 p-1.5 flex items-center justify-between"
                style={{
                  backgroundColor: `${visualTheme.dockBg}fa`,
                  borderColor: "rgba(255, 255, 255, 0.9)",
                  boxShadow:
                    "inset 0 1.5px 3px rgba(255,255,255,0.95), 0 8px 24px -2px rgba(0,0,0,0.06), 0 2px 6px -1px rgba(0,0,0,0.02)",
                }}
              >
                {tabs.map((tab) => {
                  const isActive = tab.isActive;
                  return (
                    <motion.button
                      key={tab.id}
                      layout
                      type="button"
                      onClick={tab.onClick}
                      onPointerDown={tab.onPointerDown}
                      whileTap={{ scale: 0.94 }}
                      title={tab.label}
                      className={`relative h-[46px] flex items-center justify-center rounded-full cursor-pointer focus:outline-none transition-all ${
                        isActive ? "px-4 gap-2" : "w-[46px]"
                      }`}
                    >
                      {/* Active Pill: Primary Color of Selected Theme with Clean Subtle Inset Highlight */}
                      {isActive && (
                        <motion.div
                          layoutId="unifiedDockActivePill"
                          className="absolute inset-0 rounded-full"
                          style={{
                            backgroundColor: visualTheme.avatarFallbackBg,
                            boxShadow: `0 2px 8px ${
                              visualTheme.buttonShadow || "rgba(0,0,0,0.12)"
                            }`,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 34,
                            mass: 0.7,
                          }}
                        />
                      )}

                      {/* Icon with Snuggled Top-Right Badge */}
                      <motion.span
                        layout
                        className="relative z-10 flex items-center justify-center transition-colors duration-200"
                        style={{
                          color: isActive ? "#FFFFFF" : "#7E7D7A",
                        }}
                      >
                        {tab.icon}

                        {/* Badge for Cart Count or Active Orders: Positioned slightly close to icon top-right */}
                        {tab.badge !== undefined && tab.badge > 0 && (
                          <span
                            className={`absolute -top-1 -right-2 z-20 min-w-[16px] h-4 px-1 rounded-full ${
                              tab.badgeColor || "bg-[#EF4444]"
                            } text-white text-[9.5px] font-bold font-mono flex items-center justify-center shadow-xs border border-white`}
                          >
                            {tab.badge}
                          </span>
                        )}

                        {/* Pulse Indicator */}
                        {tab.hasPulse && (!tab.badge || tab.badge === 0) && (
                          <span className="absolute -top-0.5 -right-1 z-20 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
                        )}
                      </motion.span>

                      {/* Active Label: Crisp White beside the icon */}
                      <AnimatePresence mode="popLayout" initial={false}>
                        {isActive && (
                          <motion.span
                            layout
                            initial={{ opacity: 0, width: 0, scale: 0.85 }}
                            animate={{ opacity: 1, width: "auto", scale: 1 }}
                            exit={{ opacity: 0, width: 0, scale: 0.85 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 32,
                            }}
                            className="relative z-10 text-xs font-bold text-white tracking-tight whitespace-nowrap overflow-hidden"
                          >
                            {tab.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </motion.nav>
            ) : (
              <motion.div
                key="dock-action-sheet"
                initial={{ opacity: 0, scale: 0.9, y: 12, originX: 1, originY: 1 }}
                animate={{ opacity: 1, scale: 1, y: 0, originX: 1, originY: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: 12, originX: 1, originY: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 480,
                  damping: 30,
                  mass: 0.75,
                }}
                className="w-full rounded-3xl p-3 backdrop-blur-2xl border border-white/90"
                style={{
                  backgroundColor: `${visualTheme.dockBg}fa`,
                  borderColor: "rgba(255, 255, 255, 0.9)",
                  boxShadow:
                    "inset 0 1.5px 3px rgba(255,255,255,0.95), 0 16px 42px -4px rgba(0,0,0,0.10), 0 4px 14px -2px rgba(0,0,0,0.04)",
                }}
              >
                {/* Clean, Compact Action Tiles: Symmetrical 3 + 2 layout with refined compact icons */}
                <div className="flex flex-wrap justify-center gap-2">
                  {actionTiles.map((tile) => (
                    <motion.button
                      key={tile.id}
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={tile.onClick}
                      className="w-[calc(33.333%-6px)] rounded-2xl py-2 px-1.5 sm:py-2.5 sm:px-2 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer select-none group border border-white/80 shadow-2xs"
                      style={{
                        backgroundColor: `${visualTheme.accentSurface || "#FFFFFF"}e6`,
                      }}
                    >
                      {/* Compact icon directly in tile with theme primary color */}
                      <div
                        className="flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95"
                        style={{ color: visualTheme.avatarFallbackBg }}
                      >
                        {tile.icon}
                      </div>
                      <span className="text-[10.5px] font-medium text-[#1C1D1A] tracking-tight leading-none truncate max-w-full">
                        {tile.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: The Companion Plus (+) / Close (×) Button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={toggleOpen}
          title={isOpen ? "Close Actions" : "More Actions"}
          className={`relative z-40 w-[60px] h-[60px] flex-shrink-0 rounded-full flex items-center justify-center cursor-pointer select-none focus:outline-none transition-all duration-200 ${
            !isOpen ? "backdrop-blur-2xl border border-white/90" : "border border-white/30"
          }`}
          style={{
            backgroundColor: isOpen
              ? visualTheme.avatarFallbackBg
              : `${visualTheme.dockBg}fa`,
            boxShadow: isOpen
              ? `0 4px 18px ${visualTheme.buttonShadow || "rgba(0,0,0,0.18)"}`
              : "inset 0 1.5px 3px rgba(255,255,255,0.95), 0 8px 24px -2px rgba(0,0,0,0.06), 0 2px 6px -1px rgba(0,0,0,0.02)",
          }}
        >
          <motion.div
            animate={{ rotate: isOpen ? 135 : 0 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            className="flex items-center justify-center"
          >
            <IconPlus
              className={`w-6 h-6 stroke-[2.5] transition-colors duration-200 ${
                isOpen ? "text-white" : "text-[#1C1D1A]"
              }`}
            />
          </motion.div>
        </motion.button>
      </div>
    </>
  );
};
