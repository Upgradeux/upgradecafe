"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MenuItem, MenuItemVariant } from "@/lib/db/schema/menu-items";
import { Cafe } from "@/lib/db/schema/cafes";
import {
  DigitalMenuCartItem,
  CartCustomizationState,
  CustomizationOption,
} from "../types";
import { getMenuItemImageUrl } from "../utils/food-images";
import { parseMenuItemImages } from "@/features/cafe/menu/utils/image-helpers";
import { useToast } from "@/components/ui/Toast";
import {
  IconChevronLeft,
  IconPlus,
  IconMinus,
  IconClock,
  IconCheck,
  IconAlertCircle,
  IconMapPin,
  IconHeart,
  IconShieldCheck,
  IconSparkles,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { transitionNavigate } from "../utils/transitions";

import { FullModifierGroupWithOption } from "@/lib/db/schema/modifiers";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";

/** Helper to identify if a modifier group name represents sizes / portions */
const isSizeGroupName = (name: string): boolean => {
  const lower = name.trim().toLowerCase();
  return (
    lower === "size" ||
    lower === "sizes" ||
    lower === "portion" ||
    lower === "portions" ||
    lower === "portion size" ||
    lower === "cup size" ||
    lower === "drink size" ||
    lower === "choice of size" ||
    lower === "item size" ||
    lower.startsWith("size ") ||
    lower.endsWith(" size") ||
    lower.includes("choice of size")
  );
};

/** Resolves size badge: S for small, M for medium, L for large, XL for extra large */
const getSizeLetter = (label: string, index: number): string => {
  const clean = label.trim().toLowerCase();
  if (
    clean.includes("extra large") ||
    clean.includes("xl") ||
    clean.includes("jumbo") ||
    clean.includes("venti")
  ) {
    return "XL";
  }
  if (
    clean.includes("large") ||
    clean.includes("tall") ||
    clean.includes("double") ||
    clean.includes("full") ||
    clean.includes("grande") ||
    clean.includes("big")
  ) {
    return "L";
  }
  if (
    clean.includes("medium") ||
    clean.includes("regular") ||
    clean.includes("standard") ||
    clean.includes("normal") ||
    clean.includes("mid")
  ) {
    return "M";
  }
  if (
    clean.includes("small") ||
    clean.includes("short") ||
    clean.includes("mini") ||
    clean.includes("half") ||
    clean.includes("single")
  ) {
    return "S";
  }
  const sequence = ["S", "M", "L", "XL"];
  return sequence[Math.min(index, sequence.length - 1)];
};

/** Visual scale and box dimensions for progressive size picker: S < M < L < XL */
const getSizeDimensions = (letter: string, index: number) => {
  const norm = letter.trim().toUpperCase();
  if (norm === "S" || (norm === "" && index === 0)) {
    return {
      sizeClass: "min-w-[46px] h-[40px] px-2",
      letterSize: "text-xs font-black",
      priceSize: "text-[8.5px]",
      badgeOffset: "-top-1 -right-1",
    };
  }
  if (norm === "M" || (norm === "" && index === 1)) {
    return {
      sizeClass: "min-w-[54px] h-[48px] px-2.5",
      letterSize: "text-sm font-black",
      priceSize: "text-[9px]",
      badgeOffset: "-top-1.5 -right-1.5",
    };
  }
  if (norm === "L" || (norm === "" && index === 2)) {
    return {
      sizeClass: "min-w-[62px] h-[56px] px-3",
      letterSize: "text-base font-black",
      priceSize: "text-[9.5px]",
      badgeOffset: "-top-1.5 -right-1.5",
    };
  }
  if (norm === "XL" || index >= 3) {
    return {
      sizeClass: "min-w-[70px] h-[64px] px-3.5",
      letterSize: "text-lg font-black",
      priceSize: "text-[10px]",
      badgeOffset: "-top-2 -right-2",
    };
  }
  return {
    sizeClass: "min-w-[54px] h-[48px] px-2.5",
    letterSize: "text-sm font-black",
    priceSize: "text-[9px]",
    badgeOffset: "-top-1.5 -right-1.5",
  };
};

/** Determines dietary indicator for a modifier option (matching home page standard) */
const resolveDietaryType = (
  optDietaryType?: string | null,
  name: string = "",
  _itemIsVeg: boolean = true
): "veg" | "non-veg" | "egg" | "vegan" | "none" => {
  if (optDietaryType) {
    const dt = optDietaryType.toUpperCase();
    if (dt === "NON_VEG" || dt === "NON-VEG") return "non-veg";
    if (dt === "EGG") return "egg";
    if (dt === "VEGAN") return "vegan";
    if (dt === "NONE") return "none";
    if (dt === "VEG") return "veg";
  }

  const lower = name.toLowerCase();
  if (
    lower.includes("tissue") ||
    lower.includes("napkin") ||
    lower.includes("cutlery") ||
    lower.includes("straw") ||
    lower.includes("carry bag") ||
    lower.includes("bag")
  ) {
    return "none";
  }
  if (
    lower.includes("chicken") ||
    lower.includes("chiken") ||
    lower.includes("chkn") ||
    lower.includes("bacon") ||
    lower.includes("ham") ||
    lower.includes("pork") ||
    lower.includes("beef") ||
    lower.includes("mutton") ||
    lower.includes("meat") ||
    lower.includes("fish") ||
    lower.includes("prawn") ||
    lower.includes("salmon") ||
    lower.includes("seekh") ||
    lower.includes("pepperoni") ||
    lower.includes("turkey") ||
    lower.includes("tuna")
  ) {
    return "non-veg";
  }
  if (lower.includes("vegan")) {
    return "vegan";
  }
  if (lower.includes("egg") || lower.includes("omelette") || lower.includes("scramble")) {
    return "egg";
  }
  return "veg";
};

/** Dietary square icon identical to home page */
const ModifierDietaryIcon: React.FC<{ type: "veg" | "non-veg" | "egg" | "vegan" | "none" }> = ({
  type,
}) => {
  if (type === "none") return null;

  if (type === "veg") {
    return (
      <span
        title="Vegetarian"
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-xs border border-emerald-600/70 p-0.5 bg-white shrink-0"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 block" />
      </span>
    );
  }

  if (type === "vegan") {
    return (
      <span
        title="Vegan"
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-xs border border-emerald-600/70 p-0.5 bg-white shrink-0"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" />
      </span>
    );
  }

  if (type === "egg") {
    return (
      <span
        title="Contains Egg"
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-xs border border-amber-600/70 p-0.5 bg-white shrink-0"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 block" />
      </span>
    );
  }

  return (
    <span
      title="Non-Vegetarian"
      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-xs border border-rose-600/70 p-0.5 bg-white shrink-0"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 block" />
    </span>
  );
};

interface ItemDetailPageViewProps {
  cafe: Cafe;
  item: MenuItem & {
    categoryName?: string | null;
    proteinGrams?: number | null;
    fatGrams?: number | null;
    carbsGrams?: number | null;
  };
  variants?: MenuItemVariant[];
  modifierGroups?: FullModifierGroupWithOption[];
  tableParamName?: string | null;
  digitalMenuTheme?: string;
}



export const ItemDetailPageView: React.FC<ItemDetailPageViewProps> = ({
  cafe,
  item,
  variants = [],
  modifierGroups = [],
  tableParamName,
  digitalMenuTheme,
}) => {
  const visualTheme = getDigitalMenuVisualTheme(digitalMenuTheme || "roast");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const activeTableName = searchParams.get("table") || tableParamName || null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Check if custom modifier groups exist
  const hasCustomModifiers = Boolean(modifierGroups && modifierGroups.length > 0);

  // Determine if DB variants exist
  const hasDbVariants = variants && variants.length > 0;
  const dbSizes: CustomizationOption[] = hasDbVariants
    ? variants.map((v) => ({
        id: v.id,
        label: v.name,
        priceDelta: v.price - item.price,
      }))
    : [];

  const [selectedSize, setSelectedSize] = useState<CustomizationOption | null>(
    dbSizes.length > 0 ? dbSizes[0] : null
  );

  // Find if owner configured size as a modifier group (e.g. "Size", "Sizes", "Portion")
  const sizeModifierGroup = !hasDbVariants
    ? modifierGroups.find((g) => isSizeGroupName(g.name))
    : undefined;

  // Other modifier groups (excluding the size modifier group so it's not rendered twice!)
  const otherModifierGroups = modifierGroups.filter((g) => {
    if (sizeModifierGroup && g.id === sizeModifierGroup.id) return false;
    if (hasDbVariants && isSizeGroupName(g.name)) return false;
    return true;
  });

  const [specialNote, setSpecialNote] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Group selections for dynamic modifiers: { [groupId]: string[] (optionIds) }
  const [groupSelections, setGroupSelections] = useState<Record<string, string[]>>(() => {
    if (!modifierGroups || modifierGroups.length === 0) return {};
    const initial: Record<string, string[]> = {};
    modifierGroups.forEach((g) => {
      const isSize = isSizeGroupName(g.name);
      if ((isSize || (g.selectionType === "SINGLE" && g.isRequired)) && g.options.length > 0) {
        const freeOpt =
          g.options.find((o) => o.priceDelta === 0 && o.isAvailable) ||
          g.options.find((o) => o.isAvailable) ||
          g.options[0];
        if (freeOpt) initial[g.id] = [freeOpt.id];
      } else {
        initial[g.id] = [];
      }
    });
    return initial;
  });

  const handleToggleModifierOption = (group: FullModifierGroupWithOption, optionId: string) => {
    setGroupSelections((prev) => {
      const current = prev[group.id] || [];
      const isSize = isSizeGroupName(group.name);
      if (group.selectionType === "SINGLE" || isSize) {
        if (current.includes(optionId)) {
          if (group.isRequired || isSize) return prev;
          return { ...prev, [group.id]: [] };
        }
        return { ...prev, [group.id]: [optionId] };
      } else {
        // MULTIPLE
        if (current.includes(optionId)) {
          return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
        }
        if (group.maxSelections && current.length >= group.maxSelections) {
          toast({
            title: "Maximum Limit Reached",
            description: `You can select up to ${group.maxSelections} option(s) for "${group.name}".`,
            variant: "warning",
          });
          return prev;
        }
        return { ...prev, [group.id]: [...current, optionId] };
      }
    });
  };

  // Initialize favorite from localStorage
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem(`cafe_favorites_${cafe.slug}`);
      if (savedFavs) {
        const parsed = JSON.parse(savedFavs);
        if (Array.isArray(parsed)) {
          setIsFavorite(parsed.includes(item.id));
        }
      }
    } catch {}
  }, [cafe.slug, item.id]);

  const toggleFavorite = () => {
    try {
      const savedFavs = localStorage.getItem(`cafe_favorites_${cafe.slug}`);
      let parsed: string[] = savedFavs ? JSON.parse(savedFavs) : [];
      if (parsed.includes(item.id)) {
        parsed = parsed.filter((id) => id !== item.id);
        setIsFavorite(false);
      } else {
        parsed.push(item.id);
        setIsFavorite(true);
      }
      localStorage.setItem(`cafe_favorites_${cafe.slug}`, JSON.stringify(parsed));
    } catch {}
  };

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

  const customModifiersTotal = hasCustomModifiers
    ? Object.entries(groupSelections).reduce((sum, [groupId, optIds]) => {
        const group = modifierGroups?.find((g) => g.id === groupId);
        if (!group) return sum;
        const optSum = group.options
          .filter((o) => optIds.includes(o.id))
          .reduce((s, o) => s + (o.priceDelta || 0), 0);
        return sum + optSum;
      }, 0)
    : 0;

  const sizeDiff = selectedSize ? selectedSize.priceDelta : 0;
  const unitPrice = Math.max(0, item.price + sizeDiff + customModifiersTotal);
  const totalPrice = unitPrice * quantity;

  // Unified size options for the creative Size Squares section
  const sizeTiles = hasDbVariants
    ? dbSizes.map((sz, idx) => ({
        id: sz.id,
        label: sz.label,
        priceDelta: sz.priceDelta,
        isAvailable: true,
        isSelected: selectedSize?.id === sz.id,
        onSelect: () => setSelectedSize(sz),
      }))
    : sizeModifierGroup
    ? sizeModifierGroup.options.map((opt, idx) => ({
        id: opt.id,
        label: opt.name,
        priceDelta: opt.priceDelta,
        isAvailable: opt.isAvailable,
        isSelected: (groupSelections[sizeModifierGroup.id] || []).includes(opt.id),
        onSelect: () => handleToggleModifierOption(sizeModifierGroup, opt.id),
      }))
    : [];

  useEffect(() => {
    const tableQuery = activeTableName ? `?table=${encodeURIComponent(activeTableName)}` : "";
    router.prefetch(`/menu/${cafe.slug}${tableQuery}`);
    router.prefetch(`/menu/${cafe.slug}/cart${tableQuery}`);
  }, [cafe.slug, activeTableName, router]);

  const handleScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      setActiveImageIndex(index);
    }
  };

  const handleBack = () => {
    const tableQuery = activeTableName ? `?table=${encodeURIComponent(activeTableName)}` : "";
    transitionNavigate(router, `/menu/${cafe.slug}${tableQuery}`);
  };

  const handleConfirmAdd = () => {
    if (hasCustomModifiers && modifierGroups) {
      for (const group of modifierGroups) {
        const selectedCount = (groupSelections[group.id] || []).length;
        const minReq = group.minSelections > 0 ? group.minSelections : group.isRequired ? 1 : 0;
        if (minReq > 0 && selectedCount < minReq) {
          toast({
            title: "Selection Required",
            description: `Please select ${minReq === 1 ? "an option" : `at least ${minReq} options`} for "${group.name}".`,
            variant: "error",
          });
          return;
        }
      }
    }

    const selectedCustomModifiers: CustomizationOption[] = [];
    if (hasCustomModifiers && modifierGroups) {
      modifierGroups.forEach((group) => {
        const selectedIds = groupSelections[group.id] || [];
        group.options
          .filter((opt) => selectedIds.includes(opt.id))
          .forEach((opt) => {
            selectedCustomModifiers.push({
              id: opt.id,
              label: opt.name,
              priceDelta: opt.priceDelta,
            });
          });
      });
    }

    let effectiveSelectedSize = selectedSize;
    let finalAddOns = selectedCustomModifiers;

    if (!effectiveSelectedSize && sizeModifierGroup) {
      const selOptId = (groupSelections[sizeModifierGroup.id] || [])[0];
      const matchedOption = sizeModifierGroup.options.find((o) => o.id === selOptId);
      if (matchedOption) {
        effectiveSelectedSize = {
          id: matchedOption.id,
          label: matchedOption.name,
          priceDelta: matchedOption.priceDelta,
        };
        finalAddOns = selectedCustomModifiers.filter((m) => m.id !== matchedOption.id);
      }
    }

    const customization: CartCustomizationState = {
      size: effectiveSelectedSize || undefined,
      addOns: finalAddOns.length > 0 ? finalAddOns : undefined,
      specialInstructions: specialNote.trim() || undefined,
    };

    const variantNotes: string[] = [];
    if (effectiveSelectedSize) {
      variantNotes.push(effectiveSelectedSize.label);
    }
    finalAddOns.forEach((m) => {
      variantNotes.push(m.priceDelta > 0 ? `${m.label} (+₹${m.priceDelta})` : m.label);
    });

    const variantSnapshotText = variantNotes.join(" • ");
    const customModId = finalAddOns
      .map((a) => a.id)
      .sort()
      .join("_");
    const cartItemId = `${item.id}-${effectiveSelectedSize?.id || "def"}-${customModId || "none"}`;

    const newCartItem: DigitalMenuCartItem = {
      cartItemId,
      menuItem: item,
      quantity,
      unitPrice,
      totalPrice,
      customization,
      variantSnapshotText,
      availableModifierGroups: modifierGroups || [],
      availableVariants: variants || [],
    };

    try {
      const storageKey = `cafe_cart_${cafe.slug}`;
      const existing = localStorage.getItem(storageKey);
      let cartItems: DigitalMenuCartItem[] = existing ? JSON.parse(existing) : [];
      const matchIndex = cartItems.findIndex((c) => c.cartItemId === cartItemId);
      if (matchIndex > -1) {
        cartItems[matchIndex].quantity += quantity;
        cartItems[matchIndex].totalPrice = cartItems[matchIndex].quantity * unitPrice;
      } else {
        cartItems.push(newCartItem);
      }
      localStorage.setItem(storageKey, JSON.stringify(cartItems));
    } catch {}

    toast({
      title: "Added to Cart",
      description: `${quantity}x ${item.name} added to your order.`,
      variant: "success",
    });

    // Return back to public menu
    handleBack();
  };

  return (
    <div className="min-h-screen bg-[var(--cafe-background)] text-[#1C1D1A] flex flex-col relative selection:bg-[var(--cafe-primary)]/20">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col bg-white relative pb-32">
        
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            1. HERO FOOD IMAGE CAROUSEL (Edge-to-edge, flush at top 0, NO white space gap)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="relative w-full h-80 sm:h-96 overflow-hidden z-10 flex-shrink-0 bg-[#111111]">
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
                  className="w-full h-full object-cover"
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={idx === 0 ? "high" : "auto"}
                />
              </div>
            ))}
          </div>

          {/* Dot Indicators (Only shown if more than 1 image exists) */}
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

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              2. TOP FLOATING APP BAR (Back Button • "Details" Pill • Favorite Heart)
              Floats cleanly directly on top of the hero image at top: 0
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div className="absolute top-0 inset-x-0 z-30 px-4 pt-4 pb-2 flex items-center justify-between pointer-events-none">
            {/* Back button */}
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back to Menu"
              className="w-10 h-10 rounded-full bg-white/85 backdrop-blur-xl border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.12)] flex items-center justify-center text-[#1C1D1A] cursor-pointer active:scale-90 pointer-events-auto transition-transform"
            >
              <IconChevronLeft className="w-5 h-5 stroke-[2.4]" />
            </button>

            {/* Centered "Details" Floating Pill Badge (Exact match to reference design) */}
            <div className="px-4 py-1.5 rounded-full bg-white/85 backdrop-blur-xl border border-white/80 shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.95),0_2px_12px_rgba(0,0,0,0.06)] pointer-events-auto flex items-center justify-center">
              <span className="text-sm font-bold text-[#1C1D1A] tracking-tight">
                Details
              </span>
            </div>

            {/* Favorite button */}
            <button
              type="button"
              onClick={toggleFavorite}
              aria-label="Favorite"
              className="w-10 h-10 rounded-full bg-white/85 backdrop-blur-xl border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.12)] flex items-center justify-center text-[#1C1D1A] cursor-pointer active:scale-90 pointer-events-auto transition-transform"
            >
              <IconHeart
                className={`w-4 h-4 stroke-[2] transition-colors ${
                  isFavorite ? "fill-red-500 text-red-500" : "text-[#262626]"
                }`}
              />
            </button>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            3. CONTENT CARD WITH SIGNATURE TOP CENTER BEND
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="relative -mt-6 z-20 flex-1">
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
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1D1A] tracking-tight leading-tight font-heading">
                  {item.name}
                </h1>
                
                {/* Meta Row: Cafe Location • Prep Time • Dietary Tag (NO duplicate description here!) */}
                <div className="flex items-center gap-2 text-xs text-[#73716B] mt-2 flex-wrap">
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: visualTheme.badgeBg,
                      color: visualTheme.badgeText,
                    }}
                  >
                    <IconMapPin className="w-3.5 h-3.5 stroke-[2]" />
                    <span>{cafe.name}</span>
                  </div>

                  {item.isVegetarian ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" />
                      <span>Vegetarian</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 block" />
                      <span>Non-Veg</span>
                    </span>
                  )}

                  {item.preparationTimeMinutes && (
                    <span className="inline-flex items-center gap-1 text-[#888] text-xs">
                      <IconClock className="w-3.5 h-3.5" />
                      <span>{item.preparationTimeMinutes} mins</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Price on Top Right (Exact match to reference layout) */}
              <div className="text-right flex-shrink-0 pt-0.5">
                <span className="text-[11px] font-semibold text-[#888] block uppercase tracking-wider">
                  Price
                </span>
                <span className="text-2xl sm:text-3xl font-bold font-mono text-[#1C1D1A] leading-tight">
                  ₹{item.price}
                </span>
              </div>
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                4. NUTRITION MACROS (Calories, Protein, Fat, Carbo)
                Soft pastel linear gradients & soft inset inner glow/shadow
                matching second reference image!
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {hasNutritionInfo && (
              <div className="grid grid-cols-4 gap-2.5 pt-2 pb-1">
                {/* 1. Calories (Lemon yellow pastel linear gradient + soft inset shadow) */}
                <div className="h-20 sm:h-22 rounded-2xl bg-gradient-to-b from-[#FFFDF0] via-[#FEFCE8] to-[#FEF08A]/75 border border-[#FEF08A]/90 p-2.5 flex flex-col justify-between items-center text-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(202,138,4,0.12),0_4px_14px_rgba(234,179,8,0.06)]">
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

                {/* 2. Protein (Peach pastel linear gradient + soft inset shadow) */}
                <div className="h-20 sm:h-22 rounded-2xl bg-gradient-to-b from-[#FFFBF7] via-[#FFF7ED] to-[#FED7AA]/75 border border-[#FED7AA]/90 p-2.5 flex flex-col justify-between items-center text-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(194,65,12,0.12),0_4px_14px_rgba(249,115,22,0.06)]">
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

                {/* 3. Fat (Pink pastel linear gradient + soft inset shadow) */}
                <div className="h-20 sm:h-22 rounded-2xl bg-gradient-to-b from-[#FFF8FA] via-[#FDF2F8] to-[#FBCFE8]/75 border border-[#FBCFE8]/90 p-2.5 flex flex-col justify-between items-center text-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(190,24,93,0.12),0_4px_14px_rgba(236,72,153,0.06)]">
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

                {/* 4. Carbo (Sky blue pastel linear gradient + soft inset shadow) */}
                <div className="h-20 sm:h-22 rounded-2xl bg-gradient-to-b from-[#F7FCFF] via-[#F0F9FF] to-[#BAE6FD]/75 border border-[#BAE6FD]/90 p-2.5 flex flex-col justify-between items-center text-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(3,105,161,0.12),0_4px_14px_rgba(14,165,233,0.06)]">
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

            {/* Description Section (Displayed cleanly once here) */}
            <div className="space-y-1.5 pt-1">
              <h3 className="text-base font-bold text-[#1C1D1A] tracking-tight font-heading">
                Description
              </h3>
              <p className="text-xs sm:text-sm text-[#73716B] leading-relaxed">
                {item.description ||
                  "Expertly crafted with artisanal ingredients, prepared fresh to order for an authentic culinary experience."}
              </p>
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                5. SIZE SELECTION (Always displayed first before other customizations)
                Compact, tactile inset boxes with adaptable theme tint
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {sizeTiles.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-black/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#1C1D1A]">
                      Size
                    </span>
                    <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 tracking-tight">
                      Required
                    </span>
                  </div>
                  <span className="text-[10.5px] font-medium text-black/50">
                    Select 1
                  </span>
                </div>

                {/* Progressive tactile size boxes: S < M < L < XL with theme-tinted inset shadow */}
                <div className="flex items-end gap-2.5 flex-wrap pt-1">
                  {sizeTiles.map((sz, idx) => {
                    const letter = getSizeLetter(sz.label, idx);
                    const dim = getSizeDimensions(letter, idx);

                    return (
                      <motion.button
                        key={sz.id}
                        type="button"
                        disabled={!sz.isAvailable}
                        whileTap={!sz.isAvailable ? undefined : { scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 450, damping: 28 }}
                        onClick={sz.onSelect}
                        className={`relative rounded-lg border border-dotted text-center flex flex-col items-center justify-center transition-all select-none cursor-pointer ${dim.sizeClass} ${
                          !sz.isAvailable
                            ? "opacity-40 cursor-not-allowed bg-black/5 border-black/5"
                            : sz.isSelected
                            ? "font-bold"
                            : "hover:border-black/20"
                        }`}
                        style={
                          !sz.isAvailable
                            ? undefined
                            : sz.isSelected
                            ? {
                                backgroundColor: visualTheme.accentSurface || visualTheme.badgeBg,
                                borderColor: visualTheme.avatarFallbackBg,
                                color: visualTheme.badgeText || visualTheme.avatarFallbackBg,
                                borderWidth: "1.5px",
                                boxShadow: `inset 0 2.5px 5px -1px rgba(0, 0, 0, 0.12), inset 0 1px 2px 0 rgba(0, 0, 0, 0.08), inset 0 -1.5px 2px 0 rgba(255, 255, 255, 0.85), 0 3px 8px -2px ${visualTheme.buttonShadow || "rgba(0, 0, 0, 0.08)"}`,
                              }
                            : {
                                backgroundColor: visualTheme.cardBg || "#FAF9F6",
                                borderColor: visualTheme.badgeBorder || "rgba(0, 0, 0, 0.08)",
                                color: "#37352F",
                                borderWidth: "1px",
                                boxShadow: `inset 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 1.5px 0 rgba(0, 0, 0, 0.04), inset 0 -1.5px 2px 0 rgba(255, 255, 255, 0.95), 0 1px 2px 0 rgba(0, 0, 0, 0.02)`,
                              }
                        }
                      >
                        {/* Size Letter Badge: S, M, L, XL */}
                        <span className={`${dim.letterSize}  leading-none tracking-tight`}>
                          {letter}
                        </span>

                        {/* Only show + price delta if greater than 0 */}
                        {sz.priceDelta > 0 && (
                          <span
                            className={`${dim.priceSize} font-mono font-bold mt-0.5 leading-none ${
                              sz.isSelected ? "opacity-90" : "text-stone-500"
                            }`}
                          >
                            +₹{sz.priceDelta}
                          </span>
                        )}

                        {/* Active Selection Check Dot */}
                        {sz.isSelected && (
                          <div
                            className={`absolute ${dim.badgeOffset} w-3 h-3 rounded-2xl border border-dotted flex items-center justify-center text-white shadow-xs`}
                            style={{ backgroundColor: visualTheme.avatarFallbackBg }}
                          >
                            <IconCheck className="w-2 h-2 stroke-3" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Allergens Information (Compact & Small) */}
            {item.allergens && (
              <div className="space-y-1.5 pt-2 border-t border-black/5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700">
                  <IconAlertCircle className="w-3.5 h-3.5 text-amber-600 stroke-[2.2]" />
                  <span>Allergen Notice</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {item.allergens.split(",").map((allergen, idx) => {
                    const cleanName = allergen.trim();
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-amber-50/90 text-amber-900 border border-amber-200/70"
                      >
                        <span className="w-1 h-1 rounded-full bg-amber-500" />
                        {cleanName}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                6. OTHER CUSTOMIZATIONS (Choice of Milk, Extras, Sweetness, etc.)
                Clean list design with home-style dietary icons & smooth animations
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {otherModifierGroups && otherModifierGroups.length > 0 && (
              <div className="space-y-4 pt-1">
                {otherModifierGroups.map((group) => {
                  const currentSelected = groupSelections[group.id] || [];
                  const isSingle = group.selectionType === "SINGLE";
                  return (
                    <div key={group.id} className="space-y-2 pt-2.5 border-t border-black/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#1C1D1A]">
                              {group.name}
                            </span>
                            {group.isRequired ? (
                              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 tracking-tight">
                                Required
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-black/40">
                                Optional
                              </span>
                            )}
                          </div>
                          {group.description && (
                            <p className="text-[11px] text-black/55 mt-0.5">
                              {group.description}
                            </p>
                          )}
                        </div>
                        <span className="text-[10.5px] font-medium text-black/50">
                          {isSingle
                            ? "Select 1"
                            : group.maxSelections
                            ? `Select up to ${group.maxSelections} option${group.maxSelections > 1 ? "s" : ""}`
                            : "Any"}
                        </span>
                      </div>

                      {/* Clean Grouped List Container (No pills, clean list with dividers) */}
                      <div className="rounded-xl border border-black/10 bg-white overflow-hidden shadow-2xs divide-y divide-stone-100">
                        {group.options.map((opt) => {
                          const isSelected = currentSelected.includes(opt.id);
                          const isDisabled = !opt.isAvailable;
                          const dietary = resolveDietaryType((opt as any).dietaryType, opt.name, item.isVegetarian ?? true);

                          return (
                            <motion.button
                              key={opt.id}
                              type="button"
                              disabled={isDisabled}
                              whileTap={isDisabled ? undefined : { scale: 0.99 }}
                              transition={{ type: "spring", stiffness: 450, damping: 28 }}
                              onClick={() => handleToggleModifierOption(group, opt.id)}
                              className={`w-full py-2.5 px-3.5 flex items-center justify-between text-left transition-colors select-none ${
                                isDisabled
                                  ? "opacity-45 cursor-not-allowed bg-black/5"
                                  : isSelected
                                  ? "bg-stone-50/80 font-semibold cursor-pointer"
                                  : "bg-white hover:bg-stone-50/50 text-[#1C1D1A] cursor-pointer"
                              }`}
                              style={
                                isSelected && !isDisabled
                                  ? {
                                      backgroundColor: `${visualTheme.badgeBg}77`,
                                    }
                                  : undefined
                              }
                            >
                              {/* Left: Dietary Icon (identical to home) + Option Name */}
                              <div className="flex items-center gap-2.5 min-w-0">
                                <ModifierDietaryIcon type={dietary} />
                                <span className="text-xs sm:text-sm text-[#1C1D1A] truncate">
                                  {opt.name}
                                </span>
                                {isDisabled && (
                                  <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-black/10 text-black/60 font-semibold">
                                    Sold Out
                                  </span>
                                )}
                              </div>

                              {/* Right: Price + Radio/Checkbox */}
                              <div className="flex items-center gap-3 shrink-0 ml-3">
                                {opt.priceDelta > 0 ? (
                                  <span className="font-mono text-xs font-bold text-[#1C1D1A]">
                                    +₹{opt.priceDelta}
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-medium text-stone-400">
                                    Free
                                  </span>
                                )}

                                {/* Radio / Checkbox Indicator on the right */}
                                {isSingle ? (
                                  <div
                                    className="w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0"
                                    style={
                                      isSelected
                                        ? {
                                            borderColor: visualTheme.avatarFallbackBg,
                                            backgroundColor: "#FFFFFF",
                                          }
                                        : {
                                            border: "1.5px solid rgba(0,0,0,0.25)",
                                            backgroundColor: "#FFFFFF",
                                          }
                                    }
                                  >
                                    {isSelected && (
                                      <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: visualTheme.avatarFallbackBg }}
                                      />
                                    )}
                                  </div>
                                ) : (
                                  <div
                                    className="w-4 h-4 rounded-xs border flex items-center justify-center transition-colors shrink-0"
                                    style={
                                      isSelected
                                        ? {
                                            backgroundColor: visualTheme.avatarFallbackBg,
                                            borderColor: visualTheme.avatarFallbackBg,
                                            color: "#FFFFFF",
                                          }
                                        : {
                                            border: "1.5px solid rgba(0,0,0,0.25)",
                                            backgroundColor: "#FFFFFF",
                                          }
                                    }
                                  >
                                    {isSelected && <IconCheck className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                )}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                7. COOKING / KITCHEN REQUEST (Designed like Image 2)
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="pt-3 border-t border-black/5">
              <div className="rounded-2xl border border-black/10 bg-white p-3.5 space-y-2 shadow-2xs">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#1C1D1A]">
                    Add a cooking request (optional)
                  </h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5">
                    The restaurant will try its best to fulfil your requests. However, refunds or cancellations related to such requests won&apos;t be possible.
                  </p>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    maxLength={100}
                    placeholder="e.g. Don't make it too spicy, extra hot, less ice..."
                    value={specialNote}
                    onChange={(e) => setSpecialNote(e.target.value)}
                    className="w-full p-3 pb-6 text-xs rounded-xl border border-black/10 bg-stone-50/70 text-[#1C1D1A] placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-[var(--cafe-primary)] transition-all resize-none"
                  />
                  <span className="absolute bottom-2 right-2.5 text-[10px] font-mono text-stone-400 select-none">
                    {100 - specialNote.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Neutral Fade from Bottom */}
        <div className="fixed bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white/95 via-white/70 to-transparent pointer-events-none z-30 max-w-md mx-auto" />

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            7. FLOATING GLASSY THEME ADD TO CART BUTTON
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="fixed bottom-5 inset-x-4 z-40 max-w-md mx-auto pointer-events-auto">
          <div className="flex items-center gap-2.5 w-full">
            {/* Minimal Quantity Stepper with Frosted Glass Ring & Inset Highlight */}
            <div className="flex items-center bg-white/80 backdrop-blur-xl border border-white/90 rounded-full p-1 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-1px_2px_rgba(0,0,0,0.06),0_6px_20px_rgba(0,0,0,0.08)] flex-shrink-0">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#1C1D1A] hover:bg-white disabled:opacity-30 transition-all cursor-pointer active:scale-90"
              >
                <IconMinus className="w-4 h-4 stroke-[2.2]" />
              </button>
              <span className="w-7 text-center font-mono font-bold text-sm text-[#1C1D1A]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#1C1D1A] hover:bg-white transition-all cursor-pointer active:scale-90"
              >
                <IconPlus className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            {/* Sleek Theme Pill Button with Subtle Depth */}
            <button
              type="button"
              onClick={handleConfirmAdd}
              className={`flex-1 py-4 px-6 rounded-full font-bold text-sm sm:text-base text-white cursor-pointer active:scale-[0.98] transition-all flex items-center justify-between bg-gradient-to-r ${visualTheme.buttonGradient} backdrop-blur-xl border border-white/30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),inset_0_-1.5px_3px_rgba(0,0,0,0.2)]`}
              style={{ boxShadow: "0 4px 14px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)" }}
            >
              <span className="tracking-tight">Add to Cart</span>
              <span className="font-mono font-bold text-sm sm:text-base tracking-tight">
                ₹{totalPrice}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
