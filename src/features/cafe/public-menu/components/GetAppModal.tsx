"use client";

import React, { useState } from "react";
import { Cafe } from "@/lib/db/schema/cafes";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import { useToast } from "@/components/ui/Toast";
import {
  IconX,
  IconDownload,
  IconBolt,
  IconGift,
  IconWifi,
  IconShare,
  IconPlus,
  IconCheck,
  IconSparkles,
} from "@tabler/icons-react";

export interface GetAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafe: Cafe;
  visualTheme: ReturnType<typeof getDigitalMenuVisualTheme>;
  deferredPrompt: any;
  onInstalled: () => void;
}

export const GetAppModal: React.FC<GetAppModalProps> = ({
  isOpen,
  onClose,
  cafe,
  visualTheme,
  deferredPrompt,
  onInstalled,
}) => {
  const { toast } = useToast();
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setIsInstalling(true);

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === "accepted") {
          toast({
            title: "App Installed!",
            description: "Café Rewards has been unlocked on your dock.",
            variant: "success",
          });
          onInstalled();
          onClose();
          return;
        }
      } catch (err) {
        console.error("Install prompt error:", err);
      }
    }

    // Fallback or user added to home screen
    try {
      localStorage.setItem(`cafe_pwa_installed_${cafe.slug}`, "true");
    } catch {}

    toast({
      title: "App Ready!",
      description: `${cafe.name} has been added. Café Rewards is now unlocked!`,
      variant: "success",
    });

    onInstalled();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-200">
        {/* Top Header */}
        <div
          className="relative pt-4 pb-3 px-5 text-white flex items-center justify-between"
          style={{ backgroundColor: visualTheme.avatarFallbackBg }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <IconDownload className="w-4.5 h-4.5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Get {cafe.name} App</h3>
              <p className="text-[11px] text-white/80">Install for 1-Tap Access</p>
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

        {/* Modal Content */}
        <div className="p-5 space-y-4 overflow-y-auto no-scrollbar">
          {/* Cafe Preview Pill */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#FAF9F6] border border-black/5">
            <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-black/5 flex items-center justify-center overflow-hidden flex-shrink-0">
              {(cafe as any).logoUrl || cafe.logoKey ? (
                <img
                  src={(cafe as any).logoUrl || cafe.logoKey}
                  alt={cafe.name}
                  className="w-9 h-9 object-contain"
                />
              ) : (
                <span className="font-bold text-sm text-[#1C1D1A]">
                  {cafe.name.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-[#1C1D1A] truncate">{cafe.name}</h4>
              <p className="text-[11px] text-[#73716B] truncate">Official Digital Café Web App</p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              FREE
            </span>
          </div>

          {/* Benefits List */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#8C8A84] px-1">
              Why Install the App?
            </h5>

            <div className="space-y-2">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-black/5 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <IconBolt className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h6 className="text-xs font-bold text-[#1C1D1A]">1-Tap Fast Ordering</h6>
                  <p className="text-[11px] text-[#73716B]">
                    Instant access right from your home screen with zero downloading from app stores.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-black/5 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <IconGift className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h6 className="text-xs font-bold text-[#1C1D1A]">Unlocks Café Rewards</h6>
                  <p className="text-[11px] text-[#73716B]">
                    Replaces this button with your digital Rewards pass to track stamp cards and points!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-black/5 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <IconWifi className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h6 className="text-xs font-bold text-[#1C1D1A]">Smooth Offline Access</h6>
                  <p className="text-[11px] text-[#73716B]">
                    Loads instantly even on spotty café Wi-Fi with cached menu photos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* iOS Safari Hint */}
          <div className="p-3 rounded-xl bg-[#F5F4F0] border border-black/5 text-[11px] text-[#73716B] space-y-1">
            <span className="font-bold text-[#1C1D1A] block">On iPhone / Safari?</span>
            <p className="flex items-center gap-1.5 flex-wrap">
              Tap <IconShare className="w-3.5 h-3.5 inline text-blue-600" /> Share in the Safari bar, then tap
              <span className="font-semibold text-[#1C1D1A] inline-flex items-center gap-0.5">
                <IconPlus className="w-3 h-3" /> "Add to Home Screen"
              </span>
              .
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full py-3.5 px-4 rounded-full text-white text-xs sm:text-sm font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{
                backgroundColor: visualTheme.avatarFallbackBg,
                boxShadow: `0 4px 14px ${visualTheme.buttonShadow}`,
              }}
            >
              <IconDownload className="w-4 h-4 stroke-[2.2]" />
              <span>{isInstalling ? "Installing..." : "Install App & Unlock Rewards"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
