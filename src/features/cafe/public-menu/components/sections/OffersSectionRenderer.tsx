"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Offer } from "@/lib/db/schema/offers";
import { HomeSectionConfig, OfferTemplate } from "@/lib/db/schema/cafe-settings";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import {
  IconTag,
  IconChevronRight,
  IconArrowRight,
  IconSparkles,
  IconPercentage,
  IconGift,
  IconUsers,
  IconScissors,
  IconTicket,
  IconLock,
} from "@tabler/icons-react";
import { DigitalMenuCartItem, CustomerProfile } from "../../types";
import { evaluateOffer } from "@/features/cafe/offers/utils/offer-evaluator";

interface OffersSectionRendererProps {
  section: HomeSectionConfig;
  offers?: Offer[];
  digitalMenuTheme?: string;
  onOpenOffers?: (offerCode?: string) => void;
  onClaimOffer?: (offerCode: string) => void;
  claimedOfferCodes?: string[];
  appliedOfferCode?: string | null;
  cafeName?: string;
  cafeSlug?: string;
  orderType?: "DINE_IN" | "TAKEAWAY";
  cart?: DigitalMenuCartItem[];
  cartSubtotal?: number;
  customerProfile?: CustomerProfile | null;
  hasPastOrders?: boolean;
  menuItemNamesById?: Record<string, string>;
  categoryNamesById?: Record<string, string>;
}

interface ResolvedOfferItem {
  id: string;
  badge: string;
  title: string;
  description: string;
  code?: string;
  actionText: string;
  imageUrl?: string;
  discountValue?: string;
  voucherColor?: string;
  rawOffer?: Offer;
}

export const OffersSectionRenderer: React.FC<OffersSectionRendererProps> = ({
  section,
  offers = [],
  digitalMenuTheme,
  onOpenOffers,
  onClaimOffer,
  claimedOfferCodes = [],
  appliedOfferCode,
  cafeName,
  cafeSlug,
  orderType,
  cart = [],
  cartSubtotal,
  customerProfile,
  hasPastOrders = false,
  menuItemNamesById,
  categoryNamesById,
}) => {
  const visualTheme = getDigitalMenuVisualTheme(digitalMenuTheme || "roast");

  // Keep track of applied code from localStorage or prop
  const [localAppliedCode, setLocalAppliedCode] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !cafeSlug) return;
    try {
      const savedApplied = localStorage.getItem(`cafe_applied_coupon_${cafeSlug}`);
      if (savedApplied) setLocalAppliedCode(savedApplied.trim().toUpperCase());
    } catch {}
  }, [cafeSlug]);

  const effectiveAppliedCode = useMemo(() => {
    return (appliedOfferCode || localAppliedCode || "").trim().toUpperCase();
  }, [appliedOfferCode, localAppliedCode]);

  const currentSubtotal =
    cartSubtotal !== undefined
      ? cartSubtotal
      : cart.reduce((s, it) => s + it.totalPrice, 0);

  const getItemEvaluation = (item: ResolvedOfferItem) => {
    const offerToEval =
      item.rawOffer ||
      (item.code ? offers.find((o) => o.code.toUpperCase() === item.code?.toUpperCase()) : null);

    if (!offerToEval) return null;

    return evaluateOffer(offerToEval, {
      cart: cart || [],
      subtotal: currentSubtotal,
      customerProfile,
      hasPastOrders: Boolean(hasPastOrders),
      channel: "DIGITAL_MENU",
      cafeSlug,
      orderType,
      menuItemNamesById,
      categoryNamesById,
    });
  };

  const handleOpen = (item?: ResolvedOfferItem) => {
    if (onOpenOffers) onOpenOffers(item?.code);
  };

  const handleClaim = (item: ResolvedOfferItem) => {
    if (!item.code) {
      handleOpen(item);
      return;
    }
    if (onClaimOffer) {
      onClaimOffer(item.code);
    } else if (onOpenOffers) {
      onOpenOffers(item.code);
    }
  };

  // Resolve template: SPECIAL_CAROUSEL is default for rich cafe banner, or user-selected
  const template: OfferTemplate =
    (section.template as OfferTemplate) || "SPECIAL_CAROUSEL";

  // -------------------------------------------------------------
  // DEFAULT VOUCHER COLORS (Emerald green first to match voucher design)
  // -------------------------------------------------------------
  const DEFAULT_VOUCHER_COLORS = [
    "#10B981", // Emerald Green (#1) - matches customer home screen screenshot
    "#FF9E54", // Tangerine Orange (#2)
    "#FF5C5C", // Coral Red (#3)
    "#38BDF8", // Sky Cyan (#4)
    "#B28DFF", // Royal Violet (#5)
    "#FFB703", // Golden Amber (#6)
    "#B4E858", // Celery Lime (#7)
  ];

  // Build list of display offers:
  // Prioritize active offers from the database so the owner never has to create offers twice.
  let displayList: ResolvedOfferItem[] = [];

  const activeOffers = (offers || []).filter((o) => o.isActive);
  const configuredIds = section.config?.offerIds;
  const configuredSlides = section.config?.offerSlides;

  if (activeOffers.length > 0) {
    // Owner has created offers in the database!
    let targetOffers: Offer[] = [];

    if (Array.isArray(configuredIds)) {
      if (configuredIds.length > 0) {
        // Owner explicitly chose which offers appear in the home section
        targetOffers = configuredIds
          .map((id) => activeOffers.find((o) => o.id === id))
          .filter((o): o is Offer => Boolean(o));
      } else {
        // Owner explicitly turned off all offers from home
        targetOffers = [];
      }
    } else {
      // Default: automatically feature active offers (up to 5) so newly created offers show immediately
      targetOffers = activeOffers.slice(0, 5);
    }

    displayList = targetOffers.map((o, idx) => {
      const matchingSlide = configuredSlides?.find((s) => s.offerId === o.id);

      let discountVal = "";
      if (o.discountType === "PERCENTAGE") {
        discountVal = `${o.discountValue}%`;
      } else if (o.discountType === "FLAT") {
        discountVal = `₹${o.discountValue}`;
      } else if (o.discountType === "FREE_ITEM") {
        discountVal = "FREE";
      }

      return {
        id: o.id,
        badge: matchingSlide?.badgeText || o.badgeText || "SPECIAL OFFER",
        title: matchingSlide?.customTitle || o.title,
        description:
          matchingSlide?.customSubtitle ||
          o.description ||
          (o.minOrderAmount && o.minOrderAmount > 0
            ? `Special perk on orders above ₹${o.minOrderAmount}`
            : "Special limited-time reward for our guests."),
        code: o.code,
        actionText: matchingSlide?.actionText || "Claim",
        imageUrl: matchingSlide?.customImageUrl || o.imageUrl || undefined,
        discountValue: matchingSlide?.discountValue || discountVal,
        voucherColor:
          matchingSlide?.voucherColor ||
          DEFAULT_VOUCHER_COLORS[idx % DEFAULT_VOUCHER_COLORS.length],
        rawOffer: o,
      };
    });
  } else if (configuredSlides && configuredSlides.length > 0) {
    // Fallback if no database offers exist yet but custom slides were configured
    displayList = configuredSlides.map((slide, idx) => ({
      id: slide.id || `custom_offer_${idx}`,
      badge: slide.badgeText || "Special Offer",
      title: slide.customTitle || "Special Café Reward",
      description: slide.customSubtitle || "Special limited-time reward for our guests.",
      code: slide.code || undefined,
      actionText: slide.actionText || "Claim",
      imageUrl: slide.customImageUrl || undefined,
      discountValue: slide.discountValue,
      voucherColor: slide.voucherColor || DEFAULT_VOUCHER_COLORS[idx % DEFAULT_VOUCHER_COLORS.length],
      rawOffer: slide.code ? offers.find((o) => o.code.toUpperCase() === slide.code?.toUpperCase()) : undefined,
    }));
  }

  // Carousel & Auto-scroll State
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabled = section.config?.autoScroll !== false;
  const intervalMs = section.config?.autoScrollInterval || 4200;

  // Auto-scroll effect
  useEffect(() => {
    if (!isAutoScrollEnabled || isPaused || displayList.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % displayList.length;
        if (carouselRef.current) {
          const cardWidth = carouselRef.current.clientWidth * 0.88;
          carouselRef.current.scrollTo({
            left: next * (cardWidth + 14),
            behavior: "smooth",
          });
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isAutoScrollEnabled, isPaused, displayList.length, intervalMs]);

  // Handle manual scroll listener to sync dots
  const handleScroll = () => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const cardWidth = carouselRef.current.clientWidth * 0.88;
    const newIdx = Math.round(scrollLeft / (cardWidth + 14));
    if (newIdx !== activeIndex && newIdx >= 0 && newIdx < displayList.length) {
      setActiveIndex(newIdx);
    }
  };

  const scrollToSlide = (idx: number) => {
    setActiveIndex(idx);
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.clientWidth * 0.88;
      carouselRef.current.scrollTo({
        left: idx * (cardWidth + 14),
        behavior: "smooth",
      });
    }
  };

  // Section heading
  const sectionTitle = section.title || "Special Offers";


  const getDiscountInfo = (item: ResolvedOfferItem, idx: number) => {
    if (item.discountValue && item.discountValue.trim()) {
      const val = item.discountValue.trim();
      if (val.includes("%")) {
        return {
          value: val.replace(/OFF|DISCOUNT/gi, "").trim(),
          label: "DISCOUNT",
        };
      }
      return {
        value: val,
        label: val.toUpperCase().includes("OFF") ? "" : "DISCOUNT",
      };
    }

    // Auto-detect percentage or flat discount from title, badge, actionText, or code
    const combined = `${item.title} ${item.badge} ${item.actionText} ${item.code || ""}`;
    const percentMatch = combined.match(/(\d+)\s*%/);
    if (percentMatch) {
      return { value: `${percentMatch[1]}%`, label: "DISCOUNT" };
    }
    const flatMatch = combined.match(/(₹|\$)\s*(\d+)/);
    if (flatMatch) {
      return { value: `${flatMatch[1]}${flatMatch[2]}`, label: "OFF" };
    }
    return null;
  };

  if (displayList.length === 0) {
    return null;
  }

  // -------------------------------------------------------------
  // TEMPLATE 1: SPECIAL_CAROUSEL (Authentic Detailed Voucher Ticket - No Illustrations, 100% Field Matched)
  // -------------------------------------------------------------
  if (template === "SPECIAL_CAROUSEL") {
    return (
      <section key={section.id} className="w-full space-y-2.5">
        {/* Section Header */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-[#1C1D1A] font-heading">
              {sectionTitle}
            </h3>
            {section.subtitle && (
              <p className="text-[11px] text-[#73716B]">
                {section.subtitle}
              </p>
            )}
          </div>

          {displayList.length > 1 && (
            <div className="flex items-center gap-1.5">
              {displayList.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => scrollToSlide(dotIdx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeIndex === dotIdx ? "w-4" : "w-1.5 bg-black/20"
                  }`}
                  style={
                    activeIndex === dotIdx
                      ? { backgroundColor: visualTheme.avatarFallbackBg }
                      : undefined
                  }
                  aria-label={`Slide ${dotIdx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Horizontal Carousel */}
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="-mx-4 px-4 flex items-center gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-1"
        >
          {displayList.map((item, idx) => {
            const evaluation = getItemEvaluation(item);
            const cleanCode = (item.code || "").trim().toUpperCase();
            const isApplied = Boolean(
              cleanCode &&
              effectiveAppliedCode === cleanCode &&
              evaluation?.isEligible
            );
            const isLocked = Boolean(evaluation && !evaluation.isEligible);
            const isEligible = Boolean(!isLocked && !isApplied);
            const lockReason =
              evaluation?.ineligibleReason ||
              evaluation?.lockReason ||
              "Requirements not met for this order";

            const discountInfo = getDiscountInfo(item, idx);
            // When applied: light silver/gray monochrome (#E5E5E5)
            // When locked or eligible: vibrant owner selected voucher color
            const cardVoucherColor = isApplied
              ? "#E5E5E5"
              : item.voucherColor && item.voucherColor.trim()
              ? item.voucherColor
              : DEFAULT_VOUCHER_COLORS[idx % DEFAULT_VOUCHER_COLORS.length];

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isApplied && onClaimOffer && item.code) {
                    onClaimOffer(item.code);
                  } else {
                    handleOpen(item);
                  }
                }}
                className={`flex-shrink-0 w-[88vw] sm:w-[410px] h-[168px] sm:h-[176px] snap-center relative select-none transition-all duration-200 ${
                  isApplied
                    ? "grayscale contrast-[0.92] opacity-80 cursor-pointer"
                    : "cursor-pointer group active:scale-[0.99]"
                }`}
              >
                {/* SVG Ticket Frame */}
                <svg
                  viewBox="0 0 420 170"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                >
                  {/* Left Stub Background */}
                  <path
                    d="M 20 1.5 L 286 1.5 L 286 168.5 L 20 168.5 A 18.5 18.5 0 0 1 1.5 150 L 1.5 99 A 14 14 0 0 0 1.5 71 L 1.5 20 A 18.5 18.5 0 0 1 20 1.5 Z"
                    fill={isApplied ? "#F5F5F4" : "#FFFDF6"}
                  />

                  {/* Right Stub Background */}
                  <path
                    d="M 286 1.5 L 400 1.5 A 18.5 18.5 0 0 1 418.5 20 L 418.5 71 A 14 14 0 0 0 418.5 99 L 418.5 150 A 18.5 18.5 0 0 1 400 168.5 L 286 168.5 Z"
                    fill={cardVoucherColor}
                  />

                  {/* Left Stub Dashed Inner Stitching */}
                  <path
                    d="M 20 6.5 L 280.5 6.5 L 280.5 163.5 L 20 163.5 A 13.5 13.5 0 0 1 6.5 150 L 6.5 104 A 19 19 0 0 0 6.5 66 L 6.5 20 A 13.5 13.5 0 0 1 20 6.5 Z"
                    fill="none"
                    stroke={isApplied ? "#D6D3D1" : "#C8C0B0"}
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />

                  {/* Right Stub Dashed Inner Stitching */}
                  <path
                    d="M 291.5 6.5 L 400 6.5 A 13.5 13.5 0 0 1 413.5 20 L 413.5 66 A 19 19 0 0 0 413.5 104 L 413.5 150 A 13.5 13.5 0 0 1 400 163.5 L 291.5 163.5 Z"
                    fill="none"
                    stroke="#1C1D1A"
                    strokeOpacity={isApplied ? "0.15" : "0.22"}
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />

                  {/* Vertical Perforation Dashed Divider Line */}
                  <line
                    x1="286"
                    y1="2"
                    x2="286"
                    y2="168"
                    stroke={isApplied ? "#78716C" : "#1C1D1A"}
                    strokeWidth="1.6"
                    strokeDasharray="4 3.5"
                    strokeLinecap="round"
                  />

                  {/* Outer Solid Dark Border */}
                  <path
                    d="M 20 1.5 L 400 1.5 A 18.5 18.5 0 0 1 418.5 20 L 418.5 71 A 14 14 0 0 0 418.5 99 L 418.5 150 A 18.5 18.5 0 0 1 400 168.5 L 20 168.5 A 18.5 18.5 0 0 1 1.5 150 L 1.5 99 A 14 14 0 0 0 1.5 71 L 1.5 20 A 18.5 18.5 0 0 1 20 1.5 Z"
                    fill="none"
                    stroke={isApplied ? "#57534E" : "#1C1D1A"}
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>

                {/* Content Overlay */}
                <div className="relative z-10 w-full h-full flex">
                  {/* Left Stub Content */}
                  <div className="w-[68%] h-full pl-7 sm:pl-8 pr-5 py-4 flex flex-col justify-between">
                    {/* Top Row: Café Brand + Status Badge Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[#1C1D1A] min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full flex items-center justify-center flex-shrink-0 ${isApplied ? "bg-stone-500" : "bg-[#1C1D1A]"}`}>
                          <span className="w-1 h-1 rounded-full bg-[#FFFDF6]" />
                        </span>
                        <span className={`text-[11.5px] sm:text-xs font-black tracking-tight truncate max-w-[130px] sm:max-w-[150px] ${isApplied ? "text-stone-700" : "text-[#1C1D1A]"}`}>
                        {cafeName || "Café"}
                        </span>
                      </div>
                      {isApplied ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 border border-stone-300 shadow-none shrink-0 select-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-500 shrink-0" />
                          <span>APPLIED ✓</span>
                        </span>
                      ) : isLocked ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-900 border border-amber-500/25 shadow-none shrink-0 select-none">
                          <IconLock className="w-2.5 h-2.5 stroke-[2.4]" />
                          <span>LOCKED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1C1D1A]/[0.06] text-[#1C1D1A]/90 border border-[#1C1D1A]/15 shadow-[0_1px_2px_rgba(0,0,0,0.03)] shrink-0 select-none">
                          <span className="w-1 h-1 rounded-full bg-[#1C1D1A]/60 flex-shrink-0" />
                          <span>{item.badge || "LIMITED TIME"}</span>
                        </span>
                      )}
                    </div>

                    {/* Middle Area: Headline & Description / Requirement */}
                    <div className="my-auto space-y-1 pr-2">
                      <h4 className={`text-[15px] sm:text-[17px] font-black tracking-tight leading-tight line-clamp-2 font-heading ${isApplied ? "text-stone-800" : "text-[#1C1D1A]"}`}>
                        {item.title}
                      </h4>
                      {isLocked ? (
                        <p className="text-[11.5px] sm:text-xs leading-relaxed line-clamp-2 font-medium text-amber-950 font-sans">
                          <span className="font-bold text-amber-800">Need: </span>
                          {lockReason}
                        </p>
                      ) : item.description ? (
                        <p className={`text-[11.5px] sm:text-xs leading-relaxed line-clamp-2 font-medium ${isApplied ? "text-stone-500" : "text-[#595752]"}`}>
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Right Stub Content */}
                  <div className="w-[32%] h-full py-4 px-2.5 flex flex-col items-center justify-between text-[#1C1D1A] text-center relative select-none">
                    {/* Voucher Top Label */}
                    <div className={`flex items-center gap-1 pt-0.5 ${isApplied ? "opacity-70 text-stone-600" : "opacity-80"}`}>
                      <IconSparkles className="w-2.5 h-2.5 stroke-[2.5]" />
                      <span className="text-[9.5px] sm:text-[10px] font-black tracking-widest uppercase">
                        {isApplied ? "APPLIED" : isLocked ? "PERK" : "VOUCHER"}
                      </span>
                    </div>

                    {/* Center Discount Value */}
                    <div className="my-auto space-y-0.5 py-1">
                      <div className={`text-2xl sm:text-[28px] font-black leading-none tracking-tight font-heading ${isApplied ? "text-stone-700" : "text-[#1C1D1A]"}`}>
                        {discountInfo?.value || item.code || "Offer"}
                      </div>
                      {discountInfo?.label && (
                        <div className={`text-[9.5px] sm:text-[10.5px] font-black tracking-wider uppercase ${isApplied ? "text-stone-600 opacity-80" : "text-[#1C1D1A] opacity-90"}`}>
                          {discountInfo.label}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Pill */}
                    {isApplied ? (
                      <div className="w-auto px-3.5 py-1.5 rounded-full bg-stone-600 text-stone-100 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-none flex items-center justify-center gap-1 select-none whitespace-nowrap cursor-pointer">
                        <span>APPLIED</span>
                        <span className="text-xs font-black">✓</span>
                      </div>
                    ) : isLocked ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpen(item);
                        }}
                        className="w-auto px-3.5 py-1.5 rounded-full bg-[#1C1D1A] hover:bg-black text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-[0_2px_8px_rgba(0,0,0,0.18)] flex items-center justify-center gap-1 select-none whitespace-nowrap cursor-pointer active:scale-95 transition-transform"
                      >
                        <span>Unlock</span>
                        <IconLock className="w-2.5 h-2.5 stroke-[2.4]" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaim(item);
                        }}
                        className="w-auto px-4 py-1.5 rounded-full bg-[#1C1D1A] text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-[0_2px_8px_rgba(0,0,0,0.18)] group-hover:bg-black group-hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 select-none whitespace-nowrap cursor-pointer"
                      >
                        <span>Claim</span>
                        <IconArrowRight className="w-3 h-3 stroke-[2.5] flex-shrink-0" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 2: SIMPLE_BANNER (Borderless clean modern banner)
  // -------------------------------------------------------------
  if (template === "SIMPLE_BANNER") {
    return (
      <section key={section.id} className="w-full space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm sm:text-base font-bold tracking-tight text-[#1C1D1A] font-heading">
            {sectionTitle}
          </h3>
          {displayList.length > 1 && (
            <div className="flex items-center gap-1">
              {displayList.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToSlide(i)}
                  className={`h-1 rounded-full transition-all ${
                    activeIndex === i ? "w-3" : "w-1 bg-black/20"
                  }`}
                  style={
                    activeIndex === i
                      ? { backgroundColor: visualTheme.avatarFallbackBg }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="-mx-4 px-4 flex items-center gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth"
        >
          {displayList.map((item) => {
            const evaluation = getItemEvaluation(item);
            const cleanCode = (item.code || "").trim().toUpperCase();
            const isApplied = Boolean(
              cleanCode &&
              effectiveAppliedCode === cleanCode &&
              evaluation?.isEligible
            );
            const isLocked = Boolean(evaluation && !evaluation.isEligible);
            const lockReason =
              evaluation?.ineligibleReason ||
              evaluation?.lockReason ||
              "Requirements not met for this order";

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isApplied && onClaimOffer && item.code) {
                    onClaimOffer(item.code);
                  } else {
                    handleOpen(item);
                  }
                }}
                className={`flex-shrink-0 w-[86vw] sm:w-[380px] snap-center py-4 px-5 rounded-2xl flex items-center justify-between gap-3 border border-black/5 shadow-xs transition-all ${
                  isApplied
                    ? "grayscale contrast-[0.9] opacity-75 cursor-pointer"
                    : "cursor-pointer group"
                }`}
                style={{ backgroundColor: visualTheme.accentSurface }}
              >
                <div className="space-y-1 min-w-0">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: visualTheme.accentSurfaceText }}
                  >
                    {isApplied ? "APPLIED ✓" : isLocked ? "LOCKED 🔒" : item.badge}
                  </span>
                  <h4 className="text-sm font-extrabold text-[#1C1D1A] truncate font-heading">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-[#73716B] truncate">
                    {isLocked ? lockReason : item.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isApplied) {
                      if (onClaimOffer && item.code) onClaimOffer(item.code);
                      else handleOpen(item);
                    } else if (isLocked) {
                      handleOpen(item);
                    } else {
                      handleClaim(item);
                    }
                  }}
                  className={`flex-shrink-0 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs ${
                    isApplied
                      ? "bg-stone-500 text-stone-100 cursor-pointer"
                      : "text-white cursor-pointer"
                  }`}
                  style={!isApplied ? { backgroundColor: visualTheme.avatarFallbackBg } : undefined}
                >
                  <span>{isApplied ? "Applied ✓" : isLocked ? "Unlock 🔒" : item.actionText || "Claim"}</span>
                  {!isApplied && !isLocked && <IconChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 3: ROUNDED_CARD (One with rounded corner & soft border)
  // -------------------------------------------------------------
  if (template === "ROUNDED_CARD" || template === "OFFER_CARD") {
    return (
      <section key={section.id} className="w-full space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm sm:text-base font-bold tracking-tight text-[#1C1D1A] font-heading">
            {sectionTitle}
          </h3>
          {displayList.length > 1 && (
            <div className="flex items-center gap-1.5">
              {displayList.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeIndex === i ? "w-3.5" : "w-1.5 bg-black/20"
                  }`}
                  style={
                    activeIndex === i
                      ? { backgroundColor: visualTheme.avatarFallbackBg }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="-mx-4 px-4 flex items-center gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-1"
        >
          {displayList.map((item) => {
            const evaluation = getItemEvaluation(item);
            const cleanCode = (item.code || "").trim().toUpperCase();
            const isApplied = Boolean(
              cleanCode &&
              effectiveAppliedCode === cleanCode &&
              evaluation?.isEligible
            );
            const isLocked = Boolean(evaluation && !evaluation.isEligible);
            const lockReason =
              evaluation?.ineligibleReason ||
              evaluation?.lockReason ||
              "Requirements not met for this order";

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isApplied && onClaimOffer && item.code) {
                    onClaimOffer(item.code);
                  } else {
                    handleOpen(item);
                  }
                }}
                className={`flex-shrink-0 w-[86vw] sm:w-[380px] snap-center relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-r ${visualTheme.bannerGradient} border shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-200 ${
                  isApplied
                    ? "grayscale contrast-[0.9] opacity-75 cursor-pointer"
                    : "cursor-pointer group hover:shadow-md"
                }`}
                style={{ borderColor: visualTheme.badgeBorder }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: isApplied ? "#E5E5E5" : isLocked ? "#FEF3C7" : visualTheme.badgeBg,
                        color: isApplied ? "#525252" : isLocked ? "#92400E" : visualTheme.badgeText,
                      }}
                    >
                      {isLocked ? <IconLock className="w-3 h-3 stroke-[2.4]" /> : <IconTag className="w-3 h-3" />}
                      <span>{isApplied ? "APPLIED ✓" : isLocked ? "LOCKED" : item.badge}</span>
                    </div>
                    <div className="text-base sm:text-lg font-extrabold text-[#1C1D1A] tracking-tight truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] sm:text-xs text-[#73716B] truncate">
                      {isLocked ? lockReason : item.description}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isApplied) {
                        if (onClaimOffer && item.code) onClaimOffer(item.code);
                        else handleOpen(item);
                      } else if (isLocked) {
                        handleOpen(item);
                      } else {
                        handleClaim(item);
                      }
                    }}
                    className={`flex-shrink-0 inline-flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-semibold shadow-xs ${
                      isApplied
                        ? "bg-stone-500 text-stone-100 cursor-pointer"
                        : "text-white cursor-pointer group-hover:scale-105 transition-transform"
                    }`}
                    style={!isApplied ? { backgroundColor: visualTheme.avatarFallbackBg } : undefined}
                  >
                    <span>{isApplied ? "Applied ✓" : isLocked ? "Unlock 🔒" : item.actionText || "Claim"}</span>
                    {!isApplied && !isLocked && <IconChevronRight className="w-3.5 h-3.5 stroke-[2.2]" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 4: CENTER_BEND (Signature center bend wave geometry)
  // -------------------------------------------------------------
  return (
    <section key={section.id} className="w-full space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm sm:text-base font-bold tracking-tight text-[#1C1D1A] font-heading">
          {sectionTitle}
        </h3>
        {displayList.length > 1 && (
          <div className="flex items-center gap-1.5">
            {displayList.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToSlide(i)}
                className={`h-1.5 rounded-full transition-all ${
                  activeIndex === i ? "w-3.5" : "w-1.5 bg-black/20"
                }`}
                style={
                  activeIndex === i
                    ? { backgroundColor: visualTheme.avatarFallbackBg }
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      <div
        ref={carouselRef}
        onScroll={handleScroll}
        className="-mx-4 px-4 flex items-center gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-1"
      >
        {displayList.map((item) => {
          const evaluation = getItemEvaluation(item);
          const cleanCode = (item.code || "").trim().toUpperCase();
          const isApplied = Boolean(
            cleanCode &&
            effectiveAppliedCode === cleanCode &&
            evaluation?.isEligible
          );
          const isLocked = Boolean(evaluation && !evaluation.isEligible);
          const lockReason =
            evaluation?.ineligibleReason ||
            evaluation?.lockReason ||
            "Requirements not met for this order";

          return (
            <div
              key={item.id}
              onClick={() => {
                if (isApplied && onClaimOffer && item.code) {
                  onClaimOffer(item.code);
                } else {
                  handleOpen(item);
                }
              }}
              className={`flex-shrink-0 w-[86vw] sm:w-[380px] snap-center relative min-h-[140px] px-5 py-4 flex flex-col justify-center transition-all ${
                isApplied
                  ? "grayscale contrast-[0.9] opacity-75 cursor-pointer"
                  : "cursor-pointer group active:scale-[0.99]"
              }`}
            >
              {/* Center Bend SVG Surface */}
              <svg
                viewBox="0 0 360 140"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full text-white pointer-events-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
              >
                <path
                  d="M 0,22 C 0,10 14,0 32,0 C 75,0 115,10 180,10 C 245,10 285,0 328,0 C 346,0 360,10 360,22 L 360,118 C 360,130 346,140 328,140 C 285,140 245,130 180,130 C 115,130 75,140 32,140 C 14,140 0,130 0,118 Z"
                  fill="currentColor"
                  stroke="rgba(0, 0, 0, 0.05)"
                  strokeWidth="1"
                />
              </svg>

              {/* Subtle Sheen */}
              <div
                className="absolute inset-2 rounded-2xl pointer-events-none opacity-40"
                style={{ backgroundColor: visualTheme.accentSurface }}
              />

              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: isApplied ? "#E5E5E5" : isLocked ? "#FEF3C7" : visualTheme.badgeBg,
                      color: isApplied ? "#525252" : isLocked ? "#92400E" : visualTheme.badgeText,
                    }}
                  >
                    {isLocked ? <IconLock className="w-3 h-3 stroke-[2.4]" /> : <IconTag className="w-3 h-3" />}
                    <span>{isApplied ? "APPLIED ✓" : isLocked ? "LOCKED" : item.badge}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-[#1C1D1A] truncate font-heading">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-[#73716B] truncate">
                    {isLocked ? lockReason : item.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isApplied) {
                      if (onClaimOffer && item.code) onClaimOffer(item.code);
                      else handleOpen(item);
                    } else if (isLocked) {
                      handleOpen(item);
                    } else {
                      handleClaim(item);
                    }
                  }}
                  className={`flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs ${
                    isApplied
                      ? "bg-stone-500 text-stone-100 cursor-pointer"
                      : "text-white cursor-pointer"
                  }`}
                  style={!isApplied ? { backgroundColor: visualTheme.avatarFallbackBg } : undefined}
                >
                  <span>{isApplied ? "Applied ✓" : isLocked ? "Unlock 🔒" : item.actionText || "Claim"}</span>
                  {!isApplied && !isLocked && <IconChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
