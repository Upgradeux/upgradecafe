"use client";

import React, { useState, useRef, useEffect } from "react";
import { MenuItem } from "@/lib/db/schema/menu-items";
import {
  DigitalMenuCartItem,
  CartCustomizationState,
  CustomizationOption,
} from "../types";
import { getMenuItemImageUrl } from "../utils/food-images";
import { parseMenuItemImages } from "@/features/cafe/menu/utils/image-helpers";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import {
  IconChevronLeft,
  IconDotsVertical,
  IconPlus,
  IconMinus,
  IconClock,
  IconCheck,
  IconAlertCircle,
  IconMapPin,
  IconHeart,
} from "@tabler/icons-react";

interface MenuItemDetailModalProps {
  item: (MenuItem & {
    proteinGrams?: number | null;
    fatGrams?: number | null;
    carbsGrams?: number | null;
  }) | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (cartItem: DigitalMenuCartItem) => void;
  cafeName?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (itemId: string) => void;
  digitalMenuTheme?: string;
}

export const MenuItemDetailModal: React.FC<MenuItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onAddToCart,
  cafeName = "The Roasted Bean",
  isFavorite = false,
  onToggleFavorite,
  digitalMenuTheme,
}) => {
  const visualTheme = getDigitalMenuVisualTheme(digitalMenuTheme || "roast");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [specialNote, setSpecialNote] = useState("");
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setActiveImageIndex(0);
      setSpecialNote("");
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  // Multi-image parsing
  const parsedImages = parseMenuItemImages(item.imageKey);
  const images =
    parsedImages.length > 0
      ? parsedImages
      : [getMenuItemImageUrl(item.imageKey, item.slug, item.name)];

  // Nutrition check: only display nutrition cards if owner entered at least one info
  const hasNutritionInfo = Boolean(
    item.calories || item.proteinGrams || item.fatGrams || item.carbsGrams
  );

  const unitPrice = item.price;
  const totalPrice = unitPrice * quantity;

  const handleScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      setActiveImageIndex(index);
    }
  };

  const handleConfirmAdd = () => {
    const customization: CartCustomizationState = {
      specialInstructions: specialNote.trim() || undefined,
    };

    const cartItemId = `${item.id}-def-none`;

    onAddToCart({
      cartItemId,
      menuItem: item,
      quantity,
      unitPrice,
      totalPrice,
      customization,
      variantSnapshotText: "",
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto no-scrollbar animate-in fade-in duration-150">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col bg-white relative pb-28">
        
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            1. TOP FLOATING APP BAR (Back button • "Details" • Favorite)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="sticky top-0 inset-x-0 z-30 px-4 pt-3.5 pb-2 flex items-center justify-between pointer-events-none">
          {/* Back button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-xl border border-black/5 shadow-[0_4px_16px_rgba(0,0,0,0.10)] flex items-center justify-center text-[#1C1D1A] cursor-pointer active:scale-90 pointer-events-auto transition-transform"
          >
            <IconChevronLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Centered "Details" Title */}
          <h2 className="text-base font-bold text-[#1C1D1A] tracking-tight drop-shadow-xs pointer-events-auto">
            Details
          </h2>

          {/* Favorite button */}
          <button
            type="button"
            onClick={() => onToggleFavorite?.(item.id)}
            aria-label="Favorite"
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-xl border border-black/5 shadow-[0_4px_16px_rgba(0,0,0,0.10)] flex items-center justify-center text-[#1C1D1A] cursor-pointer active:scale-90 pointer-events-auto transition-transform"
          >
            <IconHeart
              className={`w-4 h-4 stroke-[2] transition-colors ${
                isFavorite ? "fill-red-500 text-red-500" : "text-[#2A2B28]"
              }`}
            />
          </button>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            2. HERO FOOD IMAGE CAROUSEL (Edge-to-edge full presentation)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="relative w-full h-80 sm:h-96 overflow-hidden -mt-14 z-10 flex-shrink-0 bg-gradient-to-b from-[#F7F9F6] via-[#EFF3EC] to-white">
          {/* Snap Horizontal Scroll for 1, 2, or 3 images */}
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
          >
            {images.map((imgUrl, idx) => (
              <div
                key={idx}
                className="w-full h-full flex-shrink-0 snap-center relative"
              >
                <img
                  src={imgUrl}
                  alt={`${item.name} ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300"
                />
              </div>
            ))}
          </div>

          {/* Soft gradient dissolve into white card below */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20 pointer-events-none" />

          {/* Tilted Floating Sticker Badges (Exact match to Reference Image) */}
          <div className="-rotate-12 absolute top-20 left-4 z-20 px-3.5 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-[0_6px_20px_rgba(0,0,0,0.14)] border border-black/5 text-xs font-bold text-[#1C1D1A] tracking-tight flex items-center gap-1.5">
            {item.isVegetarian ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>100% Pure</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span>Non-Veg</span>
              </>
            )}
          </div>

          {item.isBestseller && (
            <div
              className="rotate-12 absolute bottom-14 right-4 z-20 px-3.5 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-[0_6px_20px_rgba(0,0,0,0.14)] border border-black/5 text-xs font-bold tracking-tight"
              style={{ color: visualTheme.avatarFallbackBg }}
            >
              Chef's Special
            </div>
          )}

          {/* Dot Indicators (Only shown if more than 1 image) */}
          {images.length > 1 && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md">
              {images.map((_, dotIdx) => (
                <div
                  key={dotIdx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeImageIndex === dotIdx ? "w-5 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            3. WHITE CONTENT CARD WITH SIGNATURE CENTER BEND
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="relative -mt-6 z-20">
          {/* Top Divider: Symmetrical Center Dip & Left/Right Rounded Shoulders */}
          <div className="w-full h-8 overflow-hidden leading-none select-none pointer-events-none -mb-1 relative z-20">
            <svg
              viewBox="0 0 400 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full block text-white"
              preserveAspectRatio="none"
            >
              <path
                d="M 0,28 L 0,22 C 0,10 18,0 48,0 C 90,0 120,14 200,14 C 280,14 310,0 352,0 C 382,0 400,10 400,22 L 400,28 Z"
                fill="currentColor"
              />
            </svg>
          </div>

          {/* Card Body */}
          <div className="bg-white px-5 sm:px-6 pt-1 space-y-4">
            {/* Title & Price Row */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1D1A] tracking-tight leading-tight">
                  {item.name}
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-[#73716B] mt-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: visualTheme.badgeBg, color: visualTheme.avatarFallbackBg }}
                  >
                    <IconMapPin className="w-3.5 h-3.5 stroke-[2]" />
                  </div>
                  <span className="font-semibold text-[#1C1D1A]">
                    {cafeName}
                  </span>
                  {item.preparationTimeMinutes && (
                    <span className="flex items-center gap-1 text-[#888] ml-2">
                      <IconClock className="w-3.5 h-3.5" />
                      {item.preparationTimeMinutes} mins
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0 pt-0.5">
                <span className="text-[11px] font-semibold text-[#888] block uppercase tracking-wider">
                  Price
                </span>
                <span className="text-2xl sm:text-3xl font-bold font-mono text-[#1C1D1A] leading-tight">
                  ₹{item.price}
                </span>
              </div>
            </div>

            {/* Subtitle / Tagline */}
            {item.description && (
              <p className="text-xs sm:text-sm text-[#73716B] leading-relaxed">
                {item.description}
              </p>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                4. NUTRITION MACROS (Calories, Protein, Fat, Carbo)
                Matching Reference Image 2: Pillowy Pastel Rounded Cards
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {hasNutritionInfo && (
              <div className="grid grid-cols-4 gap-2.5 pt-2 pb-1">
                {/* 1. Calories (Lemon yellow) */}
                <div className="h-20 sm:h-22 rounded-2xl bg-gradient-to-b from-[#FEFCE8] to-[#FEF08A]/70 border border-yellow-200/60 p-2.5 flex flex-col justify-between items-center text-center shadow-xs">
                  <span className="text-[11px] font-semibold text-[#854D0E] block tracking-tight">
                    Calories
                  </span>
                  <div className="flex items-baseline gap-0.5 justify-center">
                    <span className="text-base sm:text-lg font-bold text-[#1C1D1A] font-mono leading-none">
                      {item.calories || 0}
                    </span>
                    <span className="text-[10px] text-[#78590F] font-medium leading-none">
                      kcal
                    </span>
                  </div>
                </div>

                {/* 2. Protein (Peach) */}
                <div className="h-20 sm:h-22 rounded-2xl bg-gradient-to-b from-[#FFF7ED] to-[#FED7AA]/70 border border-orange-200/60 p-2.5 flex flex-col justify-between items-center text-center shadow-xs">
                  <span className="text-[11px] font-semibold text-[#9A3412] block tracking-tight">
                    Protein
                  </span>
                  <div className="flex items-baseline gap-0.5 justify-center">
                    <span className="text-base sm:text-lg font-bold text-[#1C1D1A] font-mono leading-none">
                      {item.proteinGrams || 0}
                    </span>
                    <span className="text-[10px] text-[#8C3A12] font-medium leading-none">
                      gram
                    </span>
                  </div>
                </div>

                {/* 3. Fat (Pink) */}
                <div className="h-20 sm:h-22 rounded-2xl bg-gradient-to-b from-[#FDF2F8] to-[#FBCFE8]/70 border border-pink-200/60 p-2.5 flex flex-col justify-between items-center text-center shadow-xs">
                  <span className="text-[11px] font-semibold text-[#9D174D] block tracking-tight">
                    Fat
                  </span>
                  <div className="flex items-baseline gap-0.5 justify-center">
                    <span className="text-base sm:text-lg font-bold text-[#1C1D1A] font-mono leading-none">
                      {item.fatGrams || 0}
                    </span>
                    <span className="text-[10px] text-[#8C1D4F] font-medium leading-none">
                      gram
                    </span>
                  </div>
                </div>

                {/* 4. Carbo (Sky blue) */}
                <div className="h-20 sm:h-22 rounded-2xl bg-gradient-to-b from-[#F0F9FF] to-[#BAE6FD]/70 border border-sky-200/60 p-2.5 flex flex-col justify-between items-center text-center shadow-xs">
                  <span className="text-[11px] font-semibold text-[#0369A1] block tracking-tight">
                    Carbo
                  </span>
                  <div className="flex items-baseline gap-0.5 justify-center">
                    <span className="text-base sm:text-lg font-bold text-[#1C1D1A] font-mono leading-none">
                      {item.carbsGrams || 0}
                    </span>
                    <span className="text-[10px] text-[#0A567D] font-medium leading-none">
                      gram
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Description Section */}
            <div className="space-y-1.5 pt-1">
              <h3 className="text-base font-bold text-[#1C1D1A] tracking-tight">
                Description
              </h3>
              <p className="text-xs sm:text-sm text-[#73716B] leading-relaxed">
                {item.description ||
                  "Expertly crafted with premium ingredients, prepared fresh to order for an authentic culinary experience."}
              </p>
            </div>

            {/* Allergens Notice if available */}
            {item.allergens && (
              <div className="p-3 rounded-2xl bg-[#F8FAF7] border border-black/5 flex items-start gap-2.5 text-xs text-[#73716B]">
                <IconAlertCircle
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: visualTheme.avatarFallbackBg }}
                />
                <span>
                  <strong className="text-[#1C1D1A]">Allergens:</strong>{" "}
                  {item.allergens}
                </span>
              </div>
            )}



            {/* Special Instructions Note */}
            <div className="space-y-1.5 pt-2 border-t border-black/5">
              <label className="text-xs font-bold text-[#1C1D1A] block">
                Special Request for Kitchen (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Extra hot, no whipped cream, toasted well..."
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-black/10 bg-white text-[#1C1D1A] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[var(--cafe-primary)]"
              />
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            5. FIXED BOTTOM ACTION BAR: Minimal Stepper + Themed Add to Cart Button
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="fixed bottom-0 inset-x-0 p-3.5 sm:p-4 bg-white/95 backdrop-blur-xl border-t border-black/5 z-40 max-w-md mx-auto shadow-[0_-8px_25px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3">
            {/* Minimal Stepper */}
            <div className="flex items-center bg-[#F2F5F0] rounded-full p-1 border border-black/5 shadow-2xs flex-shrink-0">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#1C1D1A] hover:bg-white disabled:opacity-30 transition-all cursor-pointer active:scale-90"
              >
                <IconMinus className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
              <span className="w-7 text-center font-mono font-bold text-xs sm:text-sm text-[#1C1D1A]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#1C1D1A] hover:bg-white transition-all cursor-pointer active:scale-90"
              >
                <IconPlus className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
            </div>

            {/* Sleek Theme Add to Cart Button */}
            <button
              type="button"
              onClick={handleConfirmAdd}
              className={`flex-1 py-3.5 px-6 rounded-full font-bold text-sm sm:text-base bg-gradient-to-r ${visualTheme.buttonGradient} active:scale-[0.98] text-white flex items-center justify-between transition-all cursor-pointer`}
              style={{ boxShadow: "0 4px 14px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)" }}
            >
              <span>Add to Cart</span>
              <span className="font-mono font-bold text-sm sm:text-base">
                ₹{totalPrice}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
