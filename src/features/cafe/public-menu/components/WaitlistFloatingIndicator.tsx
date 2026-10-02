"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  IconChevronRight,
  IconArmchair,
} from "@tabler/icons-react";
import { WaitlistSubmissionData } from "./CustomerWaitlistModal";
import { WaitingPassTicketModal } from "./WaitingPassTicketModal";

export interface WaitlistFloatingIndicatorProps {
  waitlistData: WaitlistSubmissionData | null;
  queueNumber: number | null;
  onLeaveWaitlist: () => void;
  onSimulateTableReady?: () => void;
  onAdvanceQueue?: () => void;
  digitalMenuTheme?: string;
  isTableReady?: boolean;
  holdSecondsRemaining?: number | null;
  onOpenTableReady?: () => void;
  onOpenTicket?: () => void;
}

export const WaitlistFloatingIndicator: React.FC<WaitlistFloatingIndicatorProps> = ({
  waitlistData,
  queueNumber,
  onLeaveWaitlist,
  digitalMenuTheme,
  isTableReady,
  holdSecondsRemaining,
  onOpenTableReady,
  onOpenTicket,
}) => {
  const [internalTicketOpen, setInternalTicketOpen] = useState(false);

  if (!waitlistData || !queueNumber) return null;

  const holdFormatted =
    holdSecondsRemaining !== null && holdSecondsRemaining !== undefined
      ? `${Math.floor(holdSecondsRemaining / 60)}:${String(
          holdSecondsRemaining % 60
        ).padStart(2, "0")}`
      : "5:00";

  const handlePillClick = () => {
    if (onOpenTicket) {
      onOpenTicket();
    } else {
      setInternalTicketOpen(true);
    }
  };

  return (
    <>
      {/* Persistent Floating Pill - Clean, Subtle, Centered with Nice Inner Shadow */}
      <div className="fixed bottom-20 inset-x-0 mx-auto w-fit z-40 flex justify-center pointer-events-auto px-4">
        {isTableReady ? (
          <motion.button
            type="button"
            onClick={onOpenTableReady}
            initial={{ scale: 0.94, opacity: 0, y: 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              boxShadow:
                "inset 0 1px 1.5px rgba(255, 255, 255, 0.32), inset 0 -1.5px 3px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.12)",
            }}
            className="px-3.5 py-1.5 rounded-full bg-gradient-to-b from-[#2C2D28] via-[#1C1D1A] to-[#11120F] text-white border border-white/15 flex items-center gap-2 text-xs font-semibold cursor-pointer group select-none"
          >
            <IconArmchair className="w-3.5 h-3.5 text-amber-400 shrink-0 stroke-[2.2]" />
            <span className="tracking-tight">Table Ready</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span className="font-mono font-bold text-amber-300">{holdFormatted}</span>
            <IconChevronRight className="w-3 h-3 text-white/50 group-hover:translate-x-0.5 transition-transform" />
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={handlePillClick}
            initial={{ scale: 0.94, opacity: 0, y: 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              boxShadow:
                "inset 0 1px 1.5px rgba(255, 255, 255, 0.8), inset 0 -1px 2px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.06)",
            }}
            className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-stone-200/90 text-[#1C1D1A] flex items-center gap-2 text-xs font-semibold cursor-pointer group select-none"
          >
            <IconArmchair className="w-3.5 h-3.5 text-stone-500 shrink-0 stroke-[2]" />
            <span>Waiting: #{queueNumber} in line</span>
            <IconChevronRight className="w-3 h-3 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
          </motion.button>
        )}
      </div>

      {!onOpenTicket && (
        <WaitingPassTicketModal
          isOpen={internalTicketOpen}
          onClose={() => setInternalTicketOpen(false)}
          waitlistData={waitlistData}
          queueNumber={queueNumber}
          onLeaveWaitlist={onLeaveWaitlist}
          isTableReady={isTableReady}
          holdSecondsRemaining={holdSecondsRemaining}
          onOpenTableReady={onOpenTableReady}
          digitalMenuTheme={digitalMenuTheme}
        />
      )}
    </>
  );
};
