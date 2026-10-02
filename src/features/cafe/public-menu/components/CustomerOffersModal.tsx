"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  IconX,
  IconTag,
  IconCopy,
  IconCheck,
  IconChecks,
  IconSparkles,
  IconLock,
  IconPercentage,
  IconShoppingCart,
} from "@tabler/icons-react";
import { Offer } from "@/lib/db/schema/offers";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import { DigitalMenuCartItem, CustomerProfile } from "../types";
import { evaluateOffer } from "@/features/cafe/offers/utils/offer-evaluator";

export type ApplicationMethod = "AUTOMATIC" | "COUPON_CODE";

export interface CustomerOffersModalProps {
  isOpen: boolean;
  cafeName: string;
  offers?: Offer[];
  onClose: () => void;
  onApplyCode?: (code: string) => void;
  cartSubtotal?: number;
  appliedCode?: string | null;
  digitalMenuTheme?: string;
  cart?: DigitalMenuCartItem[];
  customerProfile?: CustomerProfile | null;
  hasPastOrders?: boolean;
  cafeSlug?: string;
  orderType?: "DINE_IN" | "TAKEAWAY";
  menuItemNamesById?: Record<string, string>;
  categoryNamesById?: Record<string, string>;
}

export interface OfferItem {
  id: string;
  code: string;
  title: string;
  description?: string;
  discountDesc: string;
  minOrder?: number;
  applicationMethod: ApplicationMethod;
  rawOffer: Offer;
}

export const CustomerOffersModal: React.FC<CustomerOffersModalProps> = ({
  isOpen,
  cafeName,
  offers,
  onClose,
  onApplyCode,
  cartSubtotal,
  appliedCode,
  digitalMenuTheme,
  cart = [],
  customerProfile,
  hasPastOrders = false,
  cafeSlug = "",
  orderType,
  menuItemNamesById,
  categoryNamesById,
}) => {
  const visualTheme = useMemo(
    () => getDigitalMenuVisualTheme(digitalMenuTheme || "roast"),
    [digitalMenuTheme]
  );

  // Compute theme colors matching Order Placed celebration modal
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
    return { r: 229, g: 123, b: 36 };
  }, [visualTheme.avatarFallbackBg]);

  const themeOpaqueColors = useMemo(() => {
    const { r, g, b } = themeRgb;
    const blend = (weight: number) => {
      const red = Math.round(r * weight + 255 * (1 - weight));
      const green = Math.round(g * weight + 255 * (1 - weight));
      const blue = Math.round(b * weight + 255 * (1 - weight));
      return `rgb(${red}, ${green}, ${blue})`;
    };

    return {
      topTint: blend(0.24),
      midTint: blend(0.08),
      bottomTint: "#FFFFFF",
      innerShadowColor: `rgba(${r}, ${g}, ${b}, 0.18)`,
      borderStroke: `rgba(${r}, ${g}, ${b}, 0.35)`,
    };
  }, [themeRgb]);

  const displayOffers: OfferItem[] = useMemo(() => {
    if (offers && offers.length > 0) {
      return offers.map((o) => {
        const isAuto =
          o.applicationMethod === "AUTOMATIC" ||
          o.badgeText?.toLowerCase().includes("auto");

        const discountDesc =
          o.discountType === "FREE_ITEM"
            ? `Free ${o.rewardItemName || "Treat"}`
            : o.discountType === "PERCENTAGE"
            ? `${o.discountValue}% OFF`
            : `Flat ₹${o.discountValue} OFF`;

        return {
          id: o.id,
          code: o.code,
          title: o.title,
          description: o.description || undefined,
          discountDesc,
          minOrder: o.minOrderAmount || undefined,
          applicationMethod: isAuto ? "AUTOMATIC" : "COUPON_CODE",
          rawOffer: o,
        };
      });
    }
    return [];
  }, [offers]);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedOfferIds, setExpandedOfferIds] = useState<Record<string, boolean>>({});

  const handleCopy = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const handleApply = (code: string) => {
    if (onApplyCode) {
      onApplyCode(code);
    } else {
      handleCopy(code);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 pointer-events-auto"
      >
        <motion.div
          initial={{ y: 90, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 90, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.05, bottom: 0.75 }}
          onDragEnd={(_e, info) => {
            if (info.offset.y > 80 || info.velocity.y > 400) {
              onClose();
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm sm:max-w-md relative flex flex-col pointer-events-auto max-h-[82vh] drop-shadow-[0_12px_28px_rgba(0,0,0,0.18)] touch-pan-y"
        >
          {/* SINGLE UNIFIED CONTINUOUS SURFACE (Signature Center Bend Curve) */}
          <svg
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="offersModalSurfaceGrad"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={themeOpaqueColors.topTint} />
                <stop offset="24%" stopColor={themeOpaqueColors.midTint} />
                <stop offset="65%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
            </defs>
            <path
              d="M 0,22 C 0,10 18,0 48,0 C 90,0 120,14 200,14 C 280,14 310,0 352,0 C 382,0 400,10 400,22 L 400,372 C 400,388 388,400 372,400 L 28,400 C 12,400 0,388 0,372 Z"
              fill="url(#offersModalSurfaceGrad)"
              stroke="rgba(0, 0, 0, 0.10)"
              strokeWidth="1.2"
            />
          </svg>

          {/* Grab Pill Nestled Inside Center Bend Dip */}
          <div
            className="w-10 h-1 mx-auto rounded-full shadow-2xs select-none mt-4 relative z-20"
            style={{
              backgroundColor: `rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.55)`,
            }}
            title="Drag down or tap backdrop to close"
          />

          {/* Header */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between relative z-20">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-2xs"
                style={{ backgroundColor: visualTheme.avatarFallbackBg }}
              >
                <IconTag className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-xs font-black text-[#1C1D1A] leading-none">
                  Café Offers & Perks
                </h3>
                <p className="text-[10px] text-[#73716B] font-medium leading-tight mt-0.5">
                  Exclusive to {cafeName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cartSubtotal !== undefined && cartSubtotal > 0 && (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#1C1D1A]">
                  <IconShoppingCart className="w-3.5 h-3.5 text-stone-600" />
                  <span className="font-mono font-bold">₹{cartSubtotal}</span>
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-black/5 transition-colors cursor-pointer"
                title="Close"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Compact Offers List */}
          <div className="px-3.5 py-1.5 space-y-2 overflow-y-auto no-scrollbar relative z-20 flex-1">
            {displayOffers.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-2">
                <div
                  className="w-10 h-10 rounded-full mx-auto flex items-center justify-center text-white shadow-2xs"
                  style={{ backgroundColor: visualTheme.avatarFallbackBg }}
                >
                  <IconTag className="w-5 h-5 stroke-[2]" />
                </div>
                <h4 className="text-xs font-bold text-[#1C1D1A]">
                  No active offers right now
                </h4>
                <p className="text-[11px] text-[#73716B] max-w-xs mx-auto leading-relaxed">
                  Check back soon! {cafeName} will post special discounts, seasonal roasts, and exclusive deals here.
                </p>
              </div>
            ) : (
              displayOffers.map((offer) => {
              const isCopied = copiedCode === offer.code;
              const isApplied =
                Boolean(appliedCode) &&
                appliedCode?.toUpperCase() === offer.code.toUpperCase();
              const isAutomatic = offer.applicationMethod === "AUTOMATIC";

              const evaluation = evaluateOffer(offer.rawOffer, {
                cart,
                subtotal: cartSubtotal || 0,
                customerProfile,
                hasPastOrders,
                channel: "DIGITAL_MENU",
                cafeSlug,
                orderType,
                menuItemNamesById,
                categoryNamesById,
              });

              const isLocked = !evaluation.isEligible;
              const lockMessage =
                evaluation.ineligibleReason ||
                evaluation.lockReason ||
                "Requirements not met for this order";

              // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              // CASE 1: LOCKED / NOT ELIGIBLE
              // Strictly Black & White / Grayscale, Non-Interactive, NO Copy Button
              // Dotted border with subtle inner shadow & soft glow
              // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              if (isLocked) {
                return (
                  <div
                    key={offer.id}
                    style={{
                      boxShadow:
                        "inset 0 1px 3px rgba(0, 0, 0, 0.04), inset 0 0 10px rgba(255, 255, 255, 0.7), 0 1.5px 4px rgba(0, 0, 0, 0.02)",
                    }}
                    className="p-2 sm:p-2.5 rounded-xl border border-dotted border-stone-300 bg-stone-100/75 grayscale contrast-[0.9] opacity-85 select-none text-left transition-all"
                  >
                    <div className="flex items-center gap-2">
                      {/* Circular % Unlock Icon with outline ring */}
                      <div className="w-7 h-7 rounded-full border border-stone-300 bg-stone-200/80 flex items-center justify-center shrink-0 text-stone-500 shadow-2xs">
                        <IconPercentage className="w-3.5 h-3.5 stroke-[2.4]" />
                      </div>

                      {/* Content: Title & Reason to unlock (No promo code shown while locked) */}
                      <div className="flex-1 min-w-0 pr-1">
                        <h4 className="text-[11.5px] font-bold text-stone-700 truncate">
                          Unlock {offer.discountDesc}
                        </h4>
                        <p className="text-[10px] font-medium text-stone-500 leading-snug mt-0.5 line-clamp-2">
                          {lockMessage}
                        </p>
                      </div>

                      {/* Clean Locked Pill */}
                      <div className="shrink-0 pl-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-semibold bg-stone-200 text-stone-500">
                          <IconLock className="w-3 h-3 stroke-[2]" />
                          <span>Locked</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              // CASE 2: ELIGIBLE / ACTIVE OFFER
              // Dotted border, theme color lighter shade inset, small inner shadow
              // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              const cleanTitle = (offer.title || "").trim();
              const cleanDesc = (offer.discountDesc || "").trim();
              const norm = (str: string) =>
                str.toLowerCase().replace(/^(free|get|flat)\s+/i, "").replace(/[^a-z0-9]/g, "");

              const isTitleSameAsDesc =
                !cleanTitle ||
                norm(cleanTitle) === norm(cleanDesc) ||
                (offer.rawOffer.discountType === "FREE_ITEM" &&
                  offer.rawOffer.rewardItemName &&
                  norm(cleanTitle) === norm(offer.rawOffer.rewardItemName));

              const showTitleSubtitle = !isTitleSameAsDesc;
              const isExpanded = Boolean(expandedOfferIds[offer.id]);

              return (
                <div
                  key={offer.id}
                  style={{
                    backgroundColor: isApplied
                      ? "rgba(16, 185, 129, 0.06)"
                      : `rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.05)`,
                    borderColor: isApplied
                      ? "rgba(16, 185, 129, 0.4)"
                      : `rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.3)`,
                    boxShadow: isApplied
                      ? "inset 0 1px 3px rgba(16, 185, 129, 0.08), inset 0 0 12px rgba(255, 255, 255, 0.9), 0 2px 6px rgba(0, 0, 0, 0.02)"
                      : `inset 0 1px 3px rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.08), inset 0 0 12px rgba(255, 255, 255, 0.9), 0 2px 6px rgba(0, 0, 0, 0.02)`,
                  }}
                  className={`p-2.5 rounded-xl border-2 border-dotted transition-all text-left ${
                    isApplied
                      ? "ring-1 ring-emerald-500/25"
                      : "hover:border-stone-400"
                  }`}
                >
                  {/* Top Row: Discount Value + Code (Deduplicated, only show subtitle if distinct) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-black text-[#1C1D1A] tracking-tight shrink-0">
                        {offer.discountDesc}
                      </span>
                      {showTitleSubtitle && (
                        <span className="text-xs font-semibold text-[#1C1D1A] truncate">
                          • {cleanTitle}
                        </span>
                      )}
                    </div>

                    <div className="shrink-0">
                      {isAutomatic ? (
                        <span className="text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 inline-flex items-center gap-0.5">
                          <IconSparkles className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Auto-Applied</span>
                        </span>
                      ) : (
                        <span
                          className="px-1.5 py-0.5 rounded font-mono font-bold text-[10.5px] tracking-wider border border-dashed"
                          style={{
                            color: visualTheme.badgeText,
                            borderColor: visualTheme.badgeBorder,
                            backgroundColor: visualTheme.badgeBg,
                          }}
                        >
                          {offer.code}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description with Read More / Show Less */}
                  {offer.description && (
                    <div className="mt-0.5 text-left">
                      <p
                        className={`text-[10.5px] text-[#595752] leading-relaxed transition-all ${
                          isExpanded ? "" : "line-clamp-2"
                        }`}
                      >
                        {offer.description}
                        {offer.description.length > 70 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedOfferIds((prev) => ({
                                ...prev,
                                [offer.id]: !prev[offer.id],
                              }));
                            }}
                            className="inline-block ml-1 font-bold text-[10px] text-stone-700 hover:text-black underline cursor-pointer"
                          >
                            {isExpanded ? "Show less" : "Read more"}
                          </button>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Bottom Row: Min spend & Action Buttons */}
                  <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-stone-200/40 gap-2">
                    <div className="text-[10px] text-stone-500 font-medium truncate">
                      {isApplied ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                          <IconCheck className="w-3 h-3 stroke-[2.5]" />
                          <span>Applied in your cart</span>
                        </span>
                      ) : (offer.minOrder || 0) > 0 ? (
                        <span>Min. spend ₹{offer.minOrder}</span>
                      ) : (
                        <span>No min. spend required</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isApplied ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <IconCheck className="w-2.5 h-2.5 stroke-[2.5]" />
                          <span>Applied</span>
                        </span>
                      ) : isAutomatic ? (
                        <span className="text-[10px] font-semibold text-emerald-600">
                          Active in cart
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopy(offer.code)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/80 hover:bg-white border border-stone-200 text-[#1C1D1A] transition-colors cursor-pointer"
                          >
                            {isCopied ? (
                              <>
                                <IconCheck className="w-2.5 h-2.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied</span>
                              </>
                            ) : (
                              <>
                                <IconCopy className="w-2.5 h-2.5 text-stone-500" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApply(offer.code)}
                            style={{
                              boxShadow: `0 2px 6px ${
                                visualTheme.buttonShadow || "rgba(0,0,0,0.12)"
                              }`,
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold text-white transition-all active:scale-95 cursor-pointer bg-gradient-to-r ${visualTheme.buttonGradient}`}
                          >
                            <IconChecks className="w-3 h-3 stroke-[2.5]" />
                            <span>Apply</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>

          {/* Footer Note */}
          <div className="px-4 pt-1 pb-3 text-center relative z-20">
            <p className="text-[9.5px] text-[#73716B] leading-tight">
              Discounts are applied directly in your cart before taxes. One promo code per order.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
