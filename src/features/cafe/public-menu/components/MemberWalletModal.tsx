"use client";

import React from "react";
import { Cafe } from "@/lib/db/schema/cafes";
import { CustomerProfile } from "../types";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import {
  IconX,
  IconWallet,
  IconCoffee,
  IconCrown,
  IconSparkles,
  IconGift,
  IconCheck,
  IconArrowRight,
  IconChevronRight,
  IconCoins,
} from "@tabler/icons-react";
import { WaxSealStampCard } from "./WaxSealStampCard";

export interface MemberWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafe: Cafe;
  visualTheme: ReturnType<typeof getDigitalMenuVisualTheme>;
  customerProfile: CustomerProfile | null;
  onOpenProfile: () => void;
  onOpenOffers: () => void;
}

export const MemberWalletModal: React.FC<MemberWalletModalProps> = ({
  isOpen,
  onClose,
  cafe,
  visualTheme,
  customerProfile,
  onOpenProfile,
  onOpenOffers,
}) => {
  if (!isOpen) return null;

  const points = customerProfile?.loyaltyPoints || 480;
  const stampsCollected = customerProfile?.stampsCollected || 6;
  const stampsRequired = customerProfile?.stampsRequired || 7;
  const stampsRemaining = Math.max(0, stampsRequired - stampsCollected);
  const memberTier = customerProfile?.memberTier || "GOLD";
  const approxRupees = (points / 10).toFixed(0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-200"
        style={{ color: "#1C1D1A" }}
      >
        {/* Top Header with Cafe Branding & Center Bend */}
        <div
          className="relative pt-4 pb-3 px-5 text-white flex items-center justify-between"
          style={{ backgroundColor: visualTheme.avatarFallbackBg }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <IconGift className="w-4.5 h-4.5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Café Rewards Pass</h3>
              <p className="text-[11px] text-white/80">{cafe.name} Club</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <IconX className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto no-scrollbar">
          {/* 1. Digital Member Card */}
          <div
            className="w-full rounded-2xl p-4.5 text-white relative overflow-hidden shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${visualTheme.avatarFallbackBg} 0%, #1A1513 100%)`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-bold tracking-wide uppercase">
                <IconCrown className="w-3 h-3 text-amber-300" />
                <span>{memberTier} PASS</span>
              </div>
              <span className="text-[10px] font-mono tracking-widest text-white/70">
                {cafe.slug.toUpperCase()}
              </span>
            </div>

            <div className="pt-4 pb-2">
              <span className="text-[11px] text-white/75 font-medium block">
                Loyalty Points Balance
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono tracking-tight">{points}</span>
                <span className="text-xs text-amber-300 font-semibold">pts</span>
                <span className="text-[11px] text-white/60 ml-auto">
                  &asymp; &#8377;{approxRupees} value
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-white/85">
              <span>{customerProfile?.name || "Café Guest Member"}</span>
              <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Installed PWA Active
              </span>
            </div>
          </div>

          {/* 2. Artisanal Wax Seal Stamp Card (Exact Reference UI) */}
          <WaxSealStampCard
            cafeName={cafe.name}
            stampsCollected={stampsCollected}
            stampsRequired={stampsRequired}
          />

          {/* 3. Quick Actions */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOffers();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-black/10 hover:border-black/20 shadow-xs transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <IconGift className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h5 className="text-xs font-bold text-[#1C1D1A]">Active Offers &amp; Coupons</h5>
                  <p className="text-[10px] text-[#73716B]">View exclusive discounts for your order</p>
                </div>
              </div>
              <IconChevronRight className="w-4 h-4 text-[#8C8A84]" />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenProfile();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-black/10 hover:border-black/20 shadow-xs transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <IconSparkles className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h5 className="text-xs font-bold text-[#1C1D1A]">Badges &amp; Stickers Profile</h5>
                  <p className="text-[10px] text-[#73716B]">Customize your personal digital passport</p>
                </div>
              </div>
              <IconChevronRight className="w-4 h-4 text-[#8C8A84]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
