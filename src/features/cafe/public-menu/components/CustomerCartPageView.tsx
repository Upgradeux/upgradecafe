"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Cafe } from "@/lib/db/schema/cafes";
import { Table } from "@/lib/db/schema/tables";
import { CafeSetting } from "@/lib/db/schema/cafe-settings";
import { Offer } from "@/lib/db/schema/offers";
import { DigitalMenuCartItem, CustomerProfile, CustomizationOption } from "../types";
import { FullModifierGroupWithOption } from "@/lib/db/schema/modifiers";
import {
  CreateOrderInput,
  CreateOrderItemInput,
  OrderWithItems,
} from "@/features/cafe/orders/types";
import { CustomerPastOrder } from "../layouts";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import { getMenuItemImageUrl } from "../utils/food-images";
import { transitionNavigate } from "../utils/transitions";
import { useToast } from "@/components/ui/Toast";
import { CustomerUpiModal } from "./CustomerUpiModal";
import { LiveOrderTrackerModal } from "./LiveOrderTrackerModal";
import {
  CustomerWaitlistModal,
  WaitlistSubmissionData,
} from "./CustomerWaitlistModal";
import { WaitingPassTicketModal } from "./WaitingPassTicketModal";
import { TableReadyAlertSheet } from "./TableReadyAlertSheet";
import { TableQrScannerModal } from "./TableQrScannerModal";
import { WaitlistFloatingIndicator } from "./WaitlistFloatingIndicator";
import { CustomerOffersModal } from "./CustomerOffersModal";
import { soundAlert } from "@/features/cafe/orders/utils/sound-chime";
import { ConfettiBurst } from "./ConfettiBurst";
import { calculateOrderWaitTime } from "@/features/cafe/orders/utils/wait-time";
import {
  IconArrowLeft,
  IconShoppingBag,
  IconPlus,
  IconMinus,
  IconTrash,
  IconArmchair,
  IconQrcode,
  IconCash,
  IconLoader2,
  IconCheck,
  IconTag,
  IconToolsKitchen2,
  IconAlertCircle,
  IconDiscount2,
  IconPercentage,
  IconChevronDown,
  IconChevronRight,
  IconClock,
  IconFlame,
  IconSparkles,
  IconLeaf,
  IconX,
  IconUser,
} from "@tabler/icons-react";

import { MenuItem } from "@/lib/db/schema/menu-items";
import {
  evaluateOffer,
  recordCustomerOfferUse,
} from "@/features/cafe/offers/utils/offer-evaluator";

interface CustomerCartPageViewProps {
  cafe: Cafe;
  table: Table | null;
  tableParamName: string | null;
  isQrScanned?: boolean;
  settings: CafeSetting | null;
  initialOffers?: Offer[];
  quickAddItems?: MenuItem[];
  tablesList?: Table[];
  categoriesList?: { id: string; name: string }[];
  menuItemsList?: { id: string; name: string; categoryId: string }[];
  digitalMenuTheme?: string;
}

/**
 * Cart Item Row:
 * - Opaque theme lighter gradient background (no dustbin icon bleed-through)
 * - Veg / Non-Veg / Vegan / Egg SVG badges (NO emojis)
 * - Popular / Bestseller badge
 * - Calories, size, prep time
 * - Selected extra customization options displayed as pills
 * - Stepper placed directly BELOW the price on the right
 * - Left-swipe to delete
 */
interface CartItemRowProps {
  item: DigitalMenuCartItem;
  themeCardBg: string;
  themeColor: string;
  visualTheme: any;
  availableModifierGroups?: FullModifierGroupWithOption[];
  isLoadingGroups?: boolean;
  onOpenItemDetail: (item: DigitalMenuCartItem) => void;
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onUpdateCustomization: (
    cartItemId: string,
    updates: {
      size?: { id: string; label: string; priceDelta: number } | null;
      addOns?: CustomizationOption[];
      specialInstructions?: string;
    },
  ) => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  themeCardBg,
  themeColor,
  visualTheme,
  availableModifierGroups = [],
  isLoadingGroups = false,
  onOpenItemDetail,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateCustomization,
}) => {
  const [isSwiped, setIsSwiped] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const imageUrl = getMenuItemImageUrl(
    item.menuItem.imageKey,
    item.menuItem.slug,
    item.menuItem.name,
  );

  const foodType = (
    item.menuItem.foodType || (item.menuItem.isVegetarian ? "VEG" : "NON_VEG")
  ).toUpperCase();

  const selectedSize = item.customization?.size?.label || null;

  const isFreeReward =
    item.unitPrice === 0 || item.cartItemId.startsWith("free_");

  // Build active extra options summary
  const extraOptions = useMemo(() => {
    const list: string[] = [];
    if (
      item.customization?.milkChoice &&
      item.customization.milkChoice.label !== "Standard" &&
      item.customization.milkChoice.label !== "Whole"
    ) {
      const mLabel = item.customization.milkChoice.label;
      list.push(
        mLabel.toLowerCase().includes("milk") ? mLabel : `${mLabel} Milk`,
      );
    }
    if (
      item.customization?.sweetness &&
      item.customization.sweetness !== "Normal"
    ) {
      list.push(item.customization.sweetness);
    }
    if (item.customization?.addOns && item.customization.addOns.length > 0) {
      item.customization.addOns.forEach((a) => {
        list.push(a.priceDelta > 0 ? `${a.label} (+₹${a.priceDelta})` : a.label);
      });
    }
    if (item.customization?.specialInstructions) {
      list.push(item.customization.specialInstructions);
    }
    return list;
  }, [item.customization]);

  return (
    <div className="relative overflow-hidden rounded-2xl select-none">
      {/* Background Soft Red/Pink Delete Action: only visible when swiped to prevent bleed-through */}
      <div
        className={`absolute inset-y-0 right-0 w-20 flex items-center justify-end pr-2.5 z-0 transition-opacity duration-200 ${
          isSwiped ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          type="button"
          aria-label="Remove item"
          onClick={() => onRemoveItem(item.cartItemId)}
          className="w-14 h-full max-h-[76px] rounded-2xl bg-rose-100 text-rose-600 hover:bg-rose-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-xs"
        >
          <IconTrash className="w-5 h-5 stroke-[2]" />
        </button>
      </div>

      {/* Foreground Swipeable Card: 100% Opaque with subtle theme gradient */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -76, right: 0 }}
        dragElastic={0.12}
        onDragEnd={(_e, info) => {
          if (info.offset.x < -35) {
            setIsSwiped(true);
          } else {
            setIsSwiped(false);
          }
        }}
        animate={{ x: isSwiped ? -76 : 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="relative z-10 p-3 rounded-2xl border border-stone-200/60 shadow-[inset_0_1.5px_2px_rgba(255,255,255,1),0_1px_4px_rgba(0,0,0,0.03)] cursor-grab active:cursor-grabbing touch-pan-y"
        style={{
          background: isFreeReward
            ? "linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 50%, #FFFFFF 100%)"
            : `linear-gradient(135deg, #FFFFFF 0%, ${themeCardBg} 50%, #FFFFFF 100%)`,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: Food Thumbnail - Clickable to open item detailed page */}
          <div
            onClick={() => onOpenItemDetail(item)}
            className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-stone-100 shadow-2xs cursor-pointer active:scale-95 transition-transform"
            title="View item details"
          >
            <img
              src={imageUrl}
              alt={item.menuItem.name}
              className="w-full h-full object-cover pointer-events-none"
              loading="lazy"
            />
          </div>

          {/* Middle: Dish Details & Extra Options */}
          <div className="min-w-0 flex-1">
            <div
              onClick={() => onOpenItemDetail(item)}
              className="cursor-pointer group select-none"
              title="View item details"
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Dietary Badges: Exact match with menu (Red dot for Non-Veg, Green dot for Veg, SVG Leaf for Vegan) */}
                {item.menuItem.foodType === "VEGAN" ? (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 shrink-0">
                    <IconLeaf className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                    <span>Vegan</span>
                  </span>
                ) : item.menuItem.isVegetarian ? (
                  <span
                    title="Vegetarian"
                    className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-xs border border-emerald-600/70 p-0.5 bg-white shrink-0"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 block" />
                  </span>
                ) : (
                  <span
                    title="Non-Vegetarian"
                    className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-xs border border-rose-600/70 p-0.5 bg-white shrink-0"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 block" />
                  </span>
                )}

                {/* Popular / Bestseller Badge */}
                {item.menuItem.isBestseller && (
                  <span className="text-[9.5px] font-bold text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5">
                    <IconSparkles className="w-2.5 h-2.5 text-amber-600 stroke-[2.5]" />
                    <span>Popular</span>
                  </span>
                )}

                <h3 className="font-semibold text-xs sm:text-sm text-[#1C1D1A] tracking-tight leading-snug truncate group-hover:underline">
                  {item.menuItem.name}
                </h3>
              </div>

              {/* Micro Details: Size, Calories, Time */}
              <div className="flex items-center gap-2 text-[10.5px] text-[#73716B] mt-0.5 flex-wrap">
                <span className="font-medium text-[#1C1D1A]">
                  Size: {selectedSize}
                </span>
                {item.menuItem.calories ? (
                  <span className="inline-flex items-center gap-0.5 opacity-80">
                    <IconFlame className="w-3 h-3 text-orange-500" />
                    {item.menuItem.calories} kcal
                  </span>
                ) : null}
                {item.menuItem.preparationTimeMinutes ? (
                  <span className="inline-flex items-center gap-0.5 opacity-80">
                    <IconClock className="w-3 h-3 text-stone-500" />
                    {item.menuItem.preparationTimeMinutes}m
                  </span>
                ) : null}
              </div>
            </div>

            {/* Show Selected Extra Options as Clean Theme-Adapted Pills */}
            {extraOptions.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {extraOptions.map((opt, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded border"
                    style={{
                      backgroundColor: visualTheme.badgeBg,
                      color: visualTheme.badgeText,
                      borderColor: visualTheme.badgeBorder,
                    }}
                  >
                    {opt}
                  </span>
                ))}
              </div>
            )}

            {/* Customise link or Free Gift tag */}
            <div className="mt-1 flex items-center gap-2">
              {isFreeReward ? (
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800/50 inline-flex items-center gap-1">
                  <span>🎁</span>
                  <span>Complimentary Offer</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCustomizing(!isCustomizing);
                  }}
                  className="text-[11px] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  style={{ color: themeColor }}
                >
                  <span>Customise</span>
                  <IconChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isCustomizing ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Right Side: Price on top, Stepper Directly Below Price */}
          <div className="flex flex-col items-end justify-between self-stretch shrink-0 py-0.5">
            <div className="text-right">
              {isFreeReward ? (
                <span className="font-extrabold font-mono text-xs sm:text-sm text-emerald-600 tracking-tight">
                  FREE (₹0)
                </span>
              ) : (
                <span className="font-bold font-mono text-sm sm:text-base text-[#1C1D1A] tracking-tight">
                  ₹{item.totalPrice.toLocaleString("en-IN")}
                </span>
              )}
              {!isFreeReward && item.quantity > 1 && (
                <div className="text-[10px] text-[#8C8A84] font-mono">
                  ₹{item.unitPrice} each
                </div>
              )}
            </div>

            {/* Clean Plus/Minus Stepper Directly Below Price */}
            <div className="inline-flex items-center gap-2 bg-stone-100/90 hover:bg-stone-100 px-2 py-0.5 rounded-full text-xs font-semibold shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] mt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuantity(item.cartItemId, item.quantity - 1);
                }}
                aria-label="Decrease quantity"
                className="w-4 h-4 flex items-center justify-center text-[#555] hover:text-[#1C1D1A] active:scale-90 transition-transform cursor-pointer"
              >
                <IconMinus className="w-3 h-3 stroke-[2.4]" />
              </button>
              <span className="font-mono text-xs font-bold text-[#1C1D1A] min-w-3 text-center">
                {item.quantity}
              </span>
              <button
                type="button"
                disabled={isFreeReward}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isFreeReward) return;
                  onUpdateQuantity(item.cartItemId, item.quantity + 1);
                }}
                aria-label="Increase quantity"
                title={isFreeReward ? "Only 1 complimentary item per order" : "Increase quantity"}
                className={`w-4 h-4 flex items-center justify-center text-[#555] transition-transform ${
                  isFreeReward
                    ? "opacity-25 cursor-not-allowed"
                    : "hover:text-[#1C1D1A] active:scale-90 cursor-pointer"
                }`}
              >
                <IconPlus className="w-3 h-3 stroke-[2.4]" />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Customization Drawer (Original Clean Horizontal Layout) */}
        <AnimatePresence>
          {isCustomizing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 pt-2.5 border-t border-black/5 space-y-2 text-xs"
            >
              {isLoadingGroups ? (
                <div className="py-1.5 text-center text-[11px] text-[#73716B]">
                  Loading options...
                </div>
              ) : availableModifierGroups && availableModifierGroups.length > 0 ? (
                availableModifierGroups.map((group) => {
                  const isSizeGroup =
                    group.name.trim().toLowerCase() === "size" ||
                    group.name.trim().toLowerCase() === "sizes" ||
                    group.name.trim().toLowerCase().includes("size");

                  const isSingleChoice = group.selectionType === "SINGLE" || isSizeGroup;
                  const selectedAddOns = item.customization?.addOns || [];
                  const currentSize = item.customization?.size;

                  return (
                    <div key={group.id} className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-[#73716B] shrink-0">
                        {group.name}:
                      </span>
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {group.options.map((opt) => {
                          const isSelected = isSizeGroup
                            ? currentSize?.id === opt.id ||
                              currentSize?.label.toLowerCase() === opt.name.toLowerCase() ||
                              selectedAddOns.some((a) => a.id === opt.id || a.label.toLowerCase() === opt.name.toLowerCase())
                            : selectedAddOns.some((a) => a.id === opt.id || a.label.toLowerCase() === opt.name.toLowerCase());

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                if (isSizeGroup) {
                                  const newSize = isSelected && !group.isRequired
                                    ? null
                                    : {
                                        id: opt.id,
                                        label: opt.name,
                                        priceDelta: opt.priceDelta,
                                      };
                                  const cleanedAddOns = selectedAddOns.filter(
                                    (a) => !group.options.some((o) => o.id === a.id || o.name.toLowerCase() === a.label.toLowerCase())
                                  );
                                  onUpdateCustomization(item.cartItemId, {
                                    size: newSize,
                                    addOns: cleanedAddOns,
                                  });
                                } else if (isSingleChoice) {
                                  let newAddOns = selectedAddOns.filter(
                                    (a) => !group.options.some((o) => o.id === a.id || o.name.toLowerCase() === a.label.toLowerCase())
                                  );
                                  if (!isSelected) {
                                    newAddOns.push({
                                      id: opt.id,
                                      label: opt.name,
                                      priceDelta: opt.priceDelta,
                                    });
                                  }
                                  onUpdateCustomization(item.cartItemId, {
                                    addOns: newAddOns,
                                  });
                                } else {
                                  let newAddOns: CustomizationOption[];
                                  if (isSelected) {
                                    newAddOns = selectedAddOns.filter(
                                      (a) => a.id !== opt.id && a.label.toLowerCase() !== opt.name.toLowerCase()
                                    );
                                  } else {
                                    newAddOns = [
                                      ...selectedAddOns,
                                      {
                                        id: opt.id,
                                        label: opt.name,
                                        priceDelta: opt.priceDelta,
                                      },
                                    ];
                                  }
                                  onUpdateCustomization(item.cartItemId, {
                                    addOns: newAddOns,
                                  });
                                }
                              }}
                              className={`px-2 py-0.5 rounded-md text-[10.5px] font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? "text-white shadow-2xs"
                                  : "bg-black/[0.04] text-[#1C1D1A] hover:bg-black/[0.08]"
                              }`}
                              style={
                                isSelected
                                  ? { backgroundColor: visualTheme.avatarFallbackBg }
                                  : undefined
                              }
                            >
                              {opt.name} {opt.priceDelta > 0 ? `+₹${opt.priceDelta}` : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : item.availableVariants && item.availableVariants.length > 0 ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-[#73716B] shrink-0">
                    Size:
                  </span>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {item.availableVariants.map((v) => {
                      const isSelected = item.customization?.size?.id === v.id;
                      const delta = Math.max(0, v.price - item.menuItem.price);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            onUpdateCustomization(item.cartItemId, {
                              size: {
                                id: v.id,
                                label: v.name,
                                priceDelta: delta,
                              },
                            });
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10.5px] font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "text-white shadow-2xs"
                              : "bg-black/[0.04] text-[#1C1D1A] hover:bg-black/[0.08]"
                          }`}
                          style={
                            isSelected
                              ? { backgroundColor: visualTheme.avatarFallbackBg }
                              : undefined
                          }
                        >
                          {v.name} {delta > 0 ? `+₹${delta}` : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export const CustomerCartPageView: React.FC<CustomerCartPageViewProps> = ({
  cafe,
  table,
  tableParamName,
  isQrScanned = false,
  settings,
  initialOffers = [],
  quickAddItems = [],
  tablesList = [],
  categoriesList = [],
  menuItemsList = [],
  digitalMenuTheme,
}) => {
  const router = useRouter();
  const { toast } = useToast();

  const themeId =
    digitalMenuTheme ||
    settings?.digitalMenuTheme ||
    settings?.themePreset ||
    "roast";
  const visualTheme = getDigitalMenuVisualTheme(themeId);

  const themeRgb = useMemo(() => {
    const hex = (visualTheme.avatarFallbackBg || "#30AFFF").replace("#", "");
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
    return { r: 48, g: 175, b: 255 };
  }, [visualTheme.avatarFallbackBg]);

  // 100% Opaque Solid Themed Colors (No transparency bleed-through)
  const themeOpaqueColors = useMemo(() => {
    const { r, g, b } = themeRgb;
    const blend = (weight: number) => {
      const red = Math.round(r * weight + 255 * (1 - weight));
      const green = Math.round(g * weight + 255 * (1 - weight));
      const blue = Math.round(b * weight + 255 * (1 - weight));
      return `rgb(${red}, ${green}, ${blue})`;
    };

    return {
      topTint: blend(0.24), // 100% solid, visible rich soft tint of theme
      midTint: blend(0.08), // 100% solid, gentle mid tone
      bottomTint: "#FFFFFF",
      innerShadowColor: `rgba(${r}, ${g}, ${b}, 0.18)`,
      borderStroke: `rgba(${r}, ${g}, ${b}, 0.35)`,
    };
  }, [themeRgb]);

  // Customer Profile & History State
  const [customerProfile, setCustomerProfile] =
    useState<CustomerProfile | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [hasPastOrders, setHasPastOrders] = useState(false);

  // Active / Live Orders State (tracked across devices and guest sessions)
  const [activeOrders, setActiveOrders] = useState<OrderWithItems[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isLiveTrackerOpen, setIsLiveTrackerOpen] = useState(false);

  // Claimed table upon physical QR camera scan (persisted across reloads and navigation)
  const [claimedTable, setClaimedTable] = useState<{
    id: string;
    tableNumber: string;
    qrIdentifier?: string | null;
    claimedAt?: number;
  } | null>(null);

  // Helper: "Takeaway" is NOT a real table name — it's a stale URL artifact from past takeaway orders
  const isTakeawayParam = (name: string | null | undefined): boolean =>
    !!name && name.toLowerCase() === "takeaway";

  // Active table name is resolved from claimed table, direct table prop, or table param name
  // Exclude "Takeaway" as it's not a real table
  const activeTableName = useMemo(() => {
    if (claimedTable?.tableNumber && !isTakeawayParam(claimedTable.tableNumber)) {
      return claimedTable.tableNumber;
    }
    if (table?.tableNumber && !isTakeawayParam(table.tableNumber)) {
      return table.tableNumber;
    }
    if (tableParamName && !isTakeawayParam(tableParamName)) {
      return tableParamName;
    }
    return null;
  }, [claimedTable, table, tableParamName]);

  const tableQuery = useMemo(() => {
    if (!activeTableName) return "";
    let q = `?table=${encodeURIComponent(activeTableName)}`;
    const qr = table?.qrIdentifier || claimedTable?.qrIdentifier;
    if (qr) {
      q += `&qr=${encodeURIComponent(qr)}`;
    }
    return q;
  }, [activeTableName, table?.qrIdentifier, claimedTable?.qrIdentifier]);

  // Helper: check if this customer has an active in-progress order at a specific table
  const hasActiveOrderOnTable = useCallback(
    (tableId?: string | null, tableNum?: string | null) => {
      if (!activeOrders || activeOrders.length === 0) return false;
      return activeOrders.some((ord) => {
        const matchId = tableId && ord.tableId === tableId;
        const matchNum =
          tableNum &&
          ord.tableNameSnapshot &&
          ord.tableNameSnapshot.toLowerCase() === tableNum.toLowerCase();
        const isActive = ["NEW", "PREPARING", "READY", "SERVED"].includes(
          ord.status,
        );
        return (matchId || matchNum) && isActive;
      });
    },
    [activeOrders],
  );

  // Sync active orders from server (guest session cookie or authenticated customerId)
  const syncActiveOrders = useCallback(async () => {
    try {
      const customerId =
        customerProfile && !customerProfile.isGuest ? customerProfile.id : null;
      const savedOrderId =
        typeof window !== "undefined"
          ? localStorage.getItem(`cafe_active_order_id_${cafe.slug}`)
          : null;
      const headers: Record<string, string> = {};
      if (customerId) headers["x-customer-id"] = customerId;
      if (customerProfile?.phone)
        headers["x-customer-phone"] = customerProfile.phone;
      if (savedOrderId) headers["x-order-id"] = savedOrderId;

      const queryParts: string[] = [];
      if (customerId)
        queryParts.push(`customerId=${encodeURIComponent(customerId)}`);
      if (customerProfile?.phone)
        queryParts.push(`phone=${encodeURIComponent(customerProfile.phone)}`);
      if (savedOrderId)
        queryParts.push(`orderId=${encodeURIComponent(savedOrderId)}`);

      const url = `/api/cafe/${cafe.slug}/orders/active${queryParts.length > 0 ? `?${queryParts.join("&")}` : ""}`;
      const res = await fetch(url, {
        headers,
        credentials: "include",
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        if (json.data.length > 0) {
          setActiveOrders(json.data);
          const latest = json.data[json.data.length - 1];
          setActiveOrderId(latest.id);
          try {
            localStorage.setItem(
              `cafe_active_order_id_${cafe.slug}`,
              latest.id,
            );
            localStorage.setItem(
              `cafe_active_order_num_${cafe.slug}`,
              latest.orderNumber,
            );
          } catch {}
        } else if (json.isTerminal || json.data.length === 0) {
          // Terminal or no active orders: clear active orders & release claimed table
          setActiveOrders([]);
          setActiveOrderId(null);
          try {
            localStorage.removeItem(`cafe_active_order_id_${cafe.slug}`);
            localStorage.removeItem(`cafe_active_order_num_${cafe.slug}`);
          } catch {}

          // Check if URL has a REAL table param (not "Takeaway" which is a stale artifact)
          const urlTableParam =
            typeof window !== "undefined"
              ? new URLSearchParams(window.location.search).get("table")
              : null;
          const urlHasRealTable =
            (urlTableParam && !isTakeawayParam(urlTableParam)) ||
            (typeof window !== "undefined" &&
              new URLSearchParams(window.location.search).has("qr"));
          if (!urlHasRealTable) {
            try {
              localStorage.removeItem(`cafe_claimed_table_${cafe.slug}`);
            } catch {}
            setClaimedTable(null);
            setSelectedTableNumber("");
          }

          // Clean stale "Takeaway" from URL if present
          if (urlTableParam && isTakeawayParam(urlTableParam)) {
            try {
              const cleanUrl = `/menu/${cafe.slug}/cart`;
              window.history.replaceState(
                { ...window.history.state, as: cleanUrl, url: cleanUrl },
                "",
                cleanUrl,
              );
            } catch {}
          }
        }
      }
    } catch {}
  }, [cafe.slug, customerProfile]);

  useEffect(() => {
    syncActiveOrders();

    const hasActive =
      activeOrders.length > 0 ||
      (typeof window !== "undefined" &&
        Boolean(localStorage.getItem(`cafe_active_order_id_${cafe.slug}`)));
    if (!hasActive) return;

    let intervalId: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (
        intervalId ||
        (typeof document !== "undefined" && document.visibilityState === "hidden")
      )
        return;
      intervalId = setInterval(syncActiveOrders, 10000);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibility = () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        syncActiveOrders();
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }
    window.addEventListener("focus", syncActiveOrders);

    return () => {
      stopPolling();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
      window.removeEventListener("focus", syncActiveOrders);
    };
  }, [syncActiveOrders, activeOrders.length, cafe.slug]);

  // Cart State (lazily initialized from localStorage to avoid initial empty render)
  const [cart, setCart] = useState<DigitalMenuCartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(`cafe_cart_${cafe.slug}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isWaitingListOpen, setIsWaitingListOpen] = useState(false);

  // Quick lookups for item names and category names for accurate offer matching & error messages
  const menuItemNamesById = useMemo(() => {
    const map: Record<string, string> = {};
    (menuItemsList || []).forEach((m) => {
      map[m.id] = m.name;
    });
    quickAddItems.forEach((m) => {
      map[m.id] = m.name;
    });
    cart.forEach((it) => {
      map[it.menuItem.id] = it.menuItem.name;
    });
    return map;
  }, [menuItemsList, quickAddItems, cart]);

  const categoryNamesById = useMemo(() => {
    const map: Record<string, string> = {};
    (categoriesList || []).forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categoriesList]);

  // Cache for item modifier groups
  const [itemModifiersCache, setItemModifiersCache] = useState<
    Record<string, FullModifierGroupWithOption[]>
  >({});
  const [loadingGroupsMap, setLoadingGroupsMap] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    cart.forEach((it) => {
      const mId = it.menuItem.id;
      if (
        !it.availableModifierGroups &&
        !itemModifiersCache[mId] &&
        !loadingGroupsMap[mId]
      ) {
        setLoadingGroupsMap((prev) => ({ ...prev, [mId]: true }));
        fetch(`/api/cafe/${cafe.slug}/modifiers?menuItemId=${mId}`)
          .then((res) => res.json())
          .then((json) => {
            if (json.success && Array.isArray(json.data)) {
              setItemModifiersCache((prev) => ({ ...prev, [mId]: json.data }));
            }
          })
          .catch(() => {})
          .finally(() => {
            setLoadingGroupsMap((prev) => ({ ...prev, [mId]: false }));
          });
      }
    });
  }, [cart, cafe.slug, itemModifiersCache, loadingGroupsMap]);

  // Dynamic tables list with live availability polling
  const [localTablesList, setLocalTablesList] = useState<Table[]>(
    tablesList || [],
  );
  useEffect(() => {
    if (tablesList && tablesList.length > 0) {
      setLocalTablesList(tablesList);
    }
  }, [tablesList]);

  // Persistent waitlist state
  const [waitlistEntry, setWaitlistEntry] =
    useState<WaitlistSubmissionData | null>(null);
  const [waitlistQueueNum, setWaitlistQueueNum] = useState<number | null>(null);
  const [isTicketPassOpen, setIsTicketPassOpen] = useState(false);
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);

  // Table Ready alert state & 5-minute hold management
  const [isTableReadyOpen, setIsTableReadyOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [readyTableData, setReadyTableData] = useState<{
    number: string;
    id: string;
    guests: number;
    qrIdentifier?: string | null;
  } | null>(null);
  const [tableHoldSeconds, setTableHoldSeconds] = useState<number | null>(null);
  const [hasShown3MinReminder, setHasShown3MinReminder] = useState(false);
  const [hasShown1MinReminder, setHasShown1MinReminder] = useState(false);

  // Restore claimed table, waitlist and hold state from localStorage on mount
  useEffect(() => {
    try {
      // 1. Restore persistent claimed table session ONLY if customer has an active order or arrived with table param
      let existingClaim = null;
      const savedClaim = localStorage.getItem(
        `cafe_claimed_table_${cafe.slug}`,
      );
      const savedActiveOrderId = localStorage.getItem(
        `cafe_active_order_id_${cafe.slug}`,
      );
      // Only count real table names (not "Takeaway" from stale URLs)
      const hasUrlTable = Boolean(
        (table?.tableNumber && !isTakeawayParam(table.tableNumber)) ||
        (tableParamName && !isTakeawayParam(tableParamName))
      );

      // Clean stale ?table=Takeaway from URL on mount
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const urlTable = urlParams.get("table");
        if (urlTable && isTakeawayParam(urlTable)) {
          const cleanUrl = `/menu/${cafe.slug}/cart`;
          window.history.replaceState(
            { ...window.history.state, as: cleanUrl, url: cleanUrl },
            "",
            cleanUrl,
          );
        }
      }

      if (savedClaim) {
        const parsedClaim = JSON.parse(savedClaim);
        // Clear claims for "Takeaway" (stale from past takeaway orders)
        if (isTakeawayParam(parsedClaim?.tableNumber)) {
          localStorage.removeItem(`cafe_claimed_table_${cafe.slug}`);
        // If there is NO active order and NO direct table in URL, clear stale claim from past visits!
        } else if (!savedActiveOrderId && !hasUrlTable) {
          localStorage.removeItem(`cafe_claimed_table_${cafe.slug}`);
        } else if (
          parsedClaim?.tableNumber &&
          (!parsedClaim.claimedAt ||
            Date.now() - parsedClaim.claimedAt < 4 * 60 * 60 * 1000)
        ) {
          existingClaim = parsedClaim;
          setClaimedTable(parsedClaim);
          setSelectedTableNumber(parsedClaim.tableNumber);
          setOrderType("DINE_IN");
        } else {
          localStorage.removeItem(`cafe_claimed_table_${cafe.slug}`);
        }
      }

      // 1b. If table prop was passed from QR scan or URL, only lock if available or has active order
      // Skip if table name is "Takeaway" (stale from past orders)
      if (table?.tableNumber && !isTakeawayParam(table.tableNumber)) {
        const isOccupied = (table.status || "").toUpperCase() === "OCCUPIED";
        const hasActiveOrder = savedActiveOrderId != null;
        if (!isOccupied || hasActiveOrder) {
          const claimObj = {
            id: table.id,
            tableNumber: table.tableNumber,
            qrIdentifier: table.qrIdentifier || null,
            claimedAt: Date.now(),
          };
          setClaimedTable(claimObj);
          setSelectedTableNumber(table.tableNumber);
          setOrderType("DINE_IN");
          try {
            localStorage.setItem(
              `cafe_claimed_table_${cafe.slug}`,
              JSON.stringify(claimObj),
            );
          } catch {}
        } else {
          // If table is OCCUPIED by someone else and visitor has no active order, strip from URL
          if (typeof window !== "undefined") {
            const cleanUrl = `/menu/${cafe.slug}/cart`;
            window.history.replaceState(
              { ...window.history.state, as: cleanUrl, url: cleanUrl },
              "",
              cleanUrl,
            );
          }
        }
      } else if (tableParamName && !existingClaim) {
        setSelectedTableNumber(tableParamName);
        setOrderType("DINE_IN");
      }

      // 2. Restore active waitlist entry
      const saved = localStorage.getItem(`cafe_waitlist_${cafe.slug}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.entry && parsed?.queueNumber) {
          setWaitlistEntry(parsed.entry);
          setWaitlistQueueNum(parsed.queueNumber);
        }
      }

      // 3. Restore table hold countdown
      const savedHold = localStorage.getItem(`cafe_waitlist_hold_${cafe.slug}`);
      if (savedHold) {
        const parsedHold = JSON.parse(savedHold);
        if (parsedHold?.holdUntil && parsedHold?.tableData) {
          const remaining = Math.round(
            (parsedHold.holdUntil - Date.now()) / 1000,
          );
          if (remaining > 0) {
            setReadyTableData(parsedHold.tableData);
            setTableHoldSeconds(remaining);
            setIsTableReadyOpen(true);
          } else {
            localStorage.removeItem(`cafe_waitlist_hold_${cafe.slug}`);
            localStorage.removeItem(`cafe_waitlist_${cafe.slug}`);
            setWaitlistEntry(null);
            setWaitlistQueueNum(null);
            setReadyTableData(null);
            setTableHoldSeconds(null);
          }
        }
      }
    } catch {
      // Ignore
    }
  }, [cafe.slug]);

  // Periodically poll live table statuses so manager updates in dashboard are reflected in cart
  useEffect(() => {
    const pollTables = async () => {
      try {
        const res = await fetch(`/api/cafe/${cafe.slug}/public-tables`);
        const json = await res.json();
        if (res.ok && json.success && Array.isArray(json.data)) {
          setLocalTablesList(json.data);
        }
      } catch {
        // Silently ignore network blips
      }
    };

    pollTables();
    const interval = setInterval(pollTables, 6000);
    window.addEventListener("focus", pollTables);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", pollTables);
    };
  }, [cafe.slug]);

  const handleJoinedWaitlist = (
    data: WaitlistSubmissionData,
    queueNum: number,
  ) => {
    setWaitlistEntry(data);
    setWaitlistQueueNum(queueNum);
    setTableHoldSeconds(null);
    setReadyTableData(null);
    setIsWaitingListOpen(false);
    setIsTicketPassOpen(true);
    try {
      localStorage.setItem(
        `cafe_waitlist_${cafe.slug}`,
        JSON.stringify({ entry: data, queueNumber: queueNum }),
      );
    } catch {
      // Ignore
    }
    toast({
      title: "Added to Waiting List",
      description: `You're #${queueNum} in line for a table. We'll alert you with a chime when ready!`,
      variant: "success",
    });
  };

  const handleLeaveWaitlist = () => {
    setWaitlistEntry(null);
    setWaitlistQueueNum(null);
    setReadyTableData(null);
    setTableHoldSeconds(null);
    setIsTableReadyOpen(false);
    setIsQrScannerOpen(false);
    setIsTicketPassOpen(false);
    try {
      localStorage.removeItem(`cafe_waitlist_${cafe.slug}`);
      localStorage.removeItem(`cafe_waitlist_hold_${cafe.slug}`);
    } catch {
      // Ignore
    }
    toast({
      title: "Left Waiting List",
      description: "You have been removed from the table queue.",
      variant: "info",
    });
  };

  const handleCancelWaitlistHold = async () => {
    try {
      if (waitlistEntry) {
        await fetch(`/api/cafe/${cafe.slug}/waitlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "cancel",
            waitlistId: waitlistEntry.id || undefined,
            phone: waitlistEntry.phone,
          }),
        });
      }
      if (readyTableData) {
        await fetch(`/api/cafe/${cafe.slug}/public-tables`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "release",
            tableId: readyTableData.id,
          }),
        });
      }
    } catch {
      // Ignore
    }
    handleLeaveWaitlist();
  };

  // Real-Time Multi-Device Waitlist Backend Polling
  useEffect(() => {
    if (!waitlistEntry) return;

    let isMounted = true;

    const syncWithBackendWaitlist = async () => {
      try {
        const params = new URLSearchParams({
          phone: waitlistEntry.phone,
          ...(waitlistEntry.id ? { waitlistId: waitlistEntry.id } : {}),
        });

        const res = await fetch(
          `/api/cafe/${cafe.slug}/waitlist?${params.toString()}`,
        );
        const json = await res.json();

        if (!isMounted || !res.ok || !json.success) return;

        const {
          customerPosition,
          heldTableData,
          remainingHoldSeconds,
          customerEntry,
        } = json.data;

        // If backend marked entry as EXPIRED or CANCELLED, or entry was not found in active queue
        if (
          !customerEntry ||
          customerEntry.status === "EXPIRED" ||
          customerEntry.status === "CANCELLED"
        ) {
          setWaitlistEntry(null);
          setWaitlistQueueNum(null);
          setReadyTableData(null);
          setTableHoldSeconds(null);
          setIsTableReadyOpen(false);
          setIsQrScannerOpen(false);
          setIsTicketPassOpen(false);
          try {
            localStorage.removeItem(`cafe_waitlist_${cafe.slug}`);
            localStorage.removeItem(`cafe_waitlist_hold_${cafe.slug}`);
          } catch {
            // Ignore
          }
          if (
            customerEntry?.status === "EXPIRED" ||
            (!customerEntry && tableHoldSeconds !== null)
          ) {
            toast({
              title: "Table Hold Expired",
              description:
                "Your 5-minute table hold has expired. The table has been released.",
              variant: "warning",
            });
          }
          return;
        }

        // Update real queue position
        if (typeof customerPosition === "number") {
          setWaitlistQueueNum(customerPosition);
        }

        // If table has been assigned & called by the backend priority cascade
        if (
          heldTableData &&
          (customerPosition === 1 || customerEntry?.status === "CALLED")
        ) {
          // If server reports remainingHoldSeconds is 0 or less, immediately expire and exit
          if (
            typeof remainingHoldSeconds === "number" &&
            remainingHoldSeconds <= 0
          ) {
            setWaitlistEntry(null);
            setWaitlistQueueNum(null);
            setReadyTableData(null);
            setTableHoldSeconds(null);
            setIsTableReadyOpen(false);
            setIsQrScannerOpen(false);
            setIsTicketPassOpen(false);
            try {
              localStorage.removeItem(`cafe_waitlist_${cafe.slug}`);
              localStorage.removeItem(`cafe_waitlist_hold_${cafe.slug}`);
            } catch {}
            toast({
              title: "Table Hold Expired",
              description:
                "Your 5-minute table hold has expired. The table has been released.",
              variant: "warning",
            });
            return;
          }

          const holdSecs =
            typeof remainingHoldSeconds === "number" && remainingHoldSeconds > 0
              ? remainingHoldSeconds
              : 300;

          setReadyTableData({
            number: heldTableData.number,
            id: heldTableData.id,
            guests: waitlistEntry.guests || 2,
            qrIdentifier: heldTableData.qrIdentifier || null,
          });

          // First time table became available
          if (tableHoldSeconds === null) {
            setTableHoldSeconds(holdSecs);
            setIsTableReadyOpen(true);
            setHasShown3MinReminder(false);
            setHasShown1MinReminder(false);
            soundAlert.playTableReadyDoubleChime(); // exactly 2 times then stops
            try {
              localStorage.setItem(
                `cafe_waitlist_hold_${cafe.slug}`,
                JSON.stringify({
                  holdUntil: Date.now() + holdSecs * 1000,
                  tableData: {
                    number: heldTableData.number,
                    id: heldTableData.id,
                    guests: waitlistEntry.guests || 2,
                    qrIdentifier: heldTableData.qrIdentifier || null,
                  },
                }),
              );
            } catch {
              // Ignore
            }
          } else {
            // Keep in sync with server timer
            setTableHoldSeconds(holdSecs);
          }
        }
      } catch {
        // Silently skip temporary network drops
      }
    };

    syncWithBackendWaitlist();
    const interval = setInterval(syncWithBackendWaitlist, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [waitlistEntry, tableHoldSeconds, cafe.slug, toast]);

  // 5-minute background countdown & auto-release at 0 seconds
  useEffect(() => {
    if (tableHoldSeconds === null) return;

    if (tableHoldSeconds <= 0) {
      // 5 minutes expired! Auto-cancel hold and release table for other guests
      if (waitlistEntry) {
        fetch(`/api/cafe/${cafe.slug}/waitlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "expire",
            waitlistId: waitlistEntry.id || undefined,
            phone: waitlistEntry.phone,
          }),
        }).catch(() => {});
      }
      if (readyTableData) {
        fetch(`/api/cafe/${cafe.slug}/public-tables`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "release",
            tableId: readyTableData.id,
          }),
        }).catch(() => {});
      }
      setIsTableReadyOpen(false);
      setIsQrScannerOpen(false);
      setIsTicketPassOpen(false);
      setReadyTableData(null);
      setTableHoldSeconds(null);
      setWaitlistEntry(null);
      setWaitlistQueueNum(null);
      try {
        localStorage.removeItem(`cafe_waitlist_${cafe.slug}`);
        localStorage.removeItem(`cafe_waitlist_hold_${cafe.slug}`);
      } catch {
        // Ignore
      }
      toast({
        title: "Table Hold Expired",
        description:
          "Your 5-minute table hold expired. The table has been released for other guests.",
        variant: "warning",
      });
      return;
    }

    const timer = setInterval(() => {
      setTableHoldSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [tableHoldSeconds, readyTableData, waitlistEntry, cafe.slug, toast]);

  // Re-prompts at 3 minutes (180s) and 1 minute (60s) if customer dismissed popup
  useEffect(() => {
    if (tableHoldSeconds === null || !readyTableData) return;

    // 3 minutes remaining reminder (180s left)
    if (tableHoldSeconds === 180 && !hasShown3MinReminder) {
      setHasShown3MinReminder(true);
      if (!isTableReadyOpen && !isQrScannerOpen) {
        setIsTableReadyOpen(true);
        soundAlert.playTableReadyChime();
        toast({
          title: "Table Reminder",
          description: `3 minutes remaining to claim ${readyTableData.number}!`,
          variant: "warning",
        });
      }
    }

    // 1 minute remaining final call reminder (60s left)
    if (tableHoldSeconds === 60 && !hasShown1MinReminder) {
      setHasShown1MinReminder(true);
      if (!isTableReadyOpen && !isQrScannerOpen) {
        setIsTableReadyOpen(true);
        soundAlert.playTableReadyChime();
        toast({
          title: "Final Call!",
          description: `Only 1 minute remaining before ${readyTableData.number} is released.`,
          variant: "danger",
        });
      }
    }
  }, [
    tableHoldSeconds,
    hasShown3MinReminder,
    hasShown1MinReminder,
    isTableReadyOpen,
    isQrScannerOpen,
    readyTableData,
    toast,
  ]);

  // Claim table from QR scan (strict verification passed)
  const handleTableClaimedFromQr = async (
    tableNum: string,
    tableId: string,
    qrIdent?: string | null,
  ) => {
    const qrIdentifier = qrIdent || readyTableData?.qrIdentifier || null;
    try {
      if (waitlistEntry) {
        await fetch(`/api/cafe/${cafe.slug}/waitlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "claim",
            waitlistId: waitlistEntry.id || undefined,
            tableId,
            guests: waitlistEntry?.guests || 2,
          }),
        });
      }
      await fetch(`/api/cafe/${cafe.slug}/public-tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "claim",
          tableId,
          guests: waitlistEntry?.guests || 2,
        }),
      });
    } catch {
      // Ignore
    }

    // Update table in local state to OCCUPIED
    setLocalTablesList((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status: "OCCUPIED" } : t)),
    );

    const claimedInfo = {
      id: tableId,
      tableNumber: tableNum,
      qrIdentifier,
      claimedAt: Date.now(),
    };

    setClaimedTable(claimedInfo);
    setSelectedTableNumber(tableNum);
    setOrderType("DINE_IN");
    setTableError(null);
    setIsQrScannerOpen(false);
    setIsTableReadyOpen(false);
    setReadyTableData(null);
    setTableHoldSeconds(null);
    setWaitlistEntry(null);
    setWaitlistQueueNum(null);

    // Save to localStorage so claimed table survives page reloads and back-navigation!
    try {
      localStorage.setItem(
        `cafe_claimed_table_${cafe.slug}`,
        JSON.stringify(claimedInfo),
      );
      localStorage.removeItem(`cafe_waitlist_${cafe.slug}`);
      localStorage.removeItem(`cafe_waitlist_hold_${cafe.slug}`);
    } catch {
      // Ignore
    }

    // Seamlessly update current URL query parameter to keep table synced in browser address bar
    if (typeof window !== "undefined") {
      const newUrl = `/menu/${cafe.slug}/cart?table=${encodeURIComponent(tableNum)}${
        qrIdentifier ? `&qr=${encodeURIComponent(qrIdentifier)}` : ""
      }`;
      window.history.replaceState(
        { ...window.history.state, as: newUrl, url: newUrl },
        "",
        newUrl,
      );
    }

    soundAlert.playOrderPlacedSuccess();
    toast({
      title: `Welcome to ${tableNum}!`,
      description:
        "Your table is occupied and your cart is synced. Place your order now!",
      variant: "success",
    });
  };

  // Allow customer to release/vacate claimed table if they leave or made a mistake
  const handleVacateClaimedTable = () => {
    try {
      localStorage.removeItem(`cafe_claimed_table_${cafe.slug}`);
    } catch {}
    setClaimedTable(null);
    setSelectedTableNumber("");
    if (typeof window !== "undefined") {
      const newUrl = `/menu/${cafe.slug}/cart`;
      window.history.replaceState(
        { ...window.history.state, as: newUrl, url: newUrl },
        "",
        newUrl,
      );
    }
    toast({
      title: "Table Vacated",
      description: "You have released your table reservation.",
      variant: "info",
    });
  };

  const handleConfirmTableReady = (tableNum: string, tableId: string) => {
    handleTableClaimedFromQr(tableNum, tableId);
  };

  // Only available tables in cafe (or occupied tables ONLY IF this customer holds an active in-progress order or verified waitlist hold)
  const availableTables = useMemo(() => {
    const list =
      localTablesList && localTablesList.length > 0 ? localTablesList : [];
    return list.filter((t) => {
      const isStatusAvailable =
        (t.status || "AVAILABLE").toUpperCase() === "AVAILABLE";
      if (isStatusAvailable) return true;

      // If table is OCCUPIED, only include if this device is the one currently dining at this table
      const hasActiveOrder = hasActiveOrderOnTable(t.id, t.tableNumber);
      const isWaitlistHeld = Boolean(
        readyTableData && readyTableData.id === t.id,
      );
      return hasActiveOrder || isWaitlistHeld;
    });
  }, [localTablesList, hasActiveOrderOnTable, readyTableData]);

  // Seated guest check: only true if they arrived with QR/URL for an AVAILABLE table,
  // or they hold an ACTIVE ORDER or verified waitlist hold on an OCCUPIED table
  const isCurrentlySeatedGuest = useMemo(() => {
    if (!activeTableName) return false;
    const matched = localTablesList.find(
      (t) => t.tableNumber.toLowerCase() === activeTableName.toLowerCase(),
    );
    // If the table is AVAILABLE and arrived via QR or table URL
    if (
      matched &&
      (matched.status || "AVAILABLE").toUpperCase() === "AVAILABLE"
    ) {
      return Boolean(isQrScanned || table || tableParamName);
    }
    // If the table is OCCUPIED, only count as seated if customer holds active order or waitlist hold
    if (matched && (matched.status || "").toUpperCase() === "OCCUPIED") {
      return (
        hasActiveOrderOnTable(matched.id, matched.tableNumber) ||
        Boolean(readyTableData && readyTableData.id === matched.id)
      );
    }
    return Boolean(isQrScanned && activeTableName);
  }, [
    activeTableName,
    localTablesList,
    isQrScanned,
    table,
    tableParamName,
    hasActiveOrderOnTable,
    readyTableData,
  ]);

  const isSeatedGuest = isCurrentlySeatedGuest;
  const isTableLocked = Boolean(isCurrentlySeatedGuest && activeTableName);
  const hasNoTablesForGuest =
    !isCurrentlySeatedGuest && availableTables.length === 0;

  // Dining Mode & Strict Table QR Claim (Approach A)
  // Auto-detect takeaway mode if the URL had "Takeaway" as the table param (from a previous takeaway order)
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY">(
    isTakeawayParam(tableParamName) || isTakeawayParam(table?.tableNumber) ? "TAKEAWAY" : "DINE_IN"
  );

  // Takeaway guest name prompt state
  const [takeawayGuestName, setTakeawayGuestName] = useState("");
  const [showTakeawayNameError, setShowTakeawayNameError] = useState(false);
  const [selectedTableNumber, setSelectedTableNumber] = useState<string>(
    isCurrentlySeatedGuest && activeTableName
      ? activeTableName
      : isCurrentlySeatedGuest && claimedTable?.tableNumber
        ? claimedTable.tableNumber
        : "",
  );
  const [tableError, setTableError] = useState<string | null>(null);

  // Keep selectedTableNumber in sync strictly with verified QR scan session
  useEffect(() => {
    if (isTableLocked && activeTableName) {
      setSelectedTableNumber(activeTableName);
    } else if (isCurrentlySeatedGuest && claimedTable?.tableNumber) {
      setSelectedTableNumber(claimedTable.tableNumber);
    } else if (!isCurrentlySeatedGuest) {
      setSelectedTableNumber("");
    }
  }, [isTableLocked, isCurrentlySeatedGuest, activeTableName, claimedTable]);

  // Kitchen notes state: badges, paragraph notes, input
  const [kitchenBadges, setKitchenBadges] = useState<string[]>([]);
  const [paragraphNotes, setParagraphNotes] = useState<string[]>([]);
  const [kitchenInput, setKitchenInput] = useState("");
  const [hasInitializedItemNotes, setHasInitializedItemNotes] = useState(false);

  // Automatically pull kitchen note from item detailed page if user already added
  useEffect(() => {
    if (cart.length > 0 && !hasInitializedItemNotes) {
      const extractedBadges: string[] = [];
      const extractedParas: string[] = [];

      cart.forEach((item) => {
        const note = item.customization?.specialInstructions;
        if (note && note.trim()) {
          const trimmed = note.trim();
          if (trimmed.includes(",")) {
            const parts = trimmed
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean);
            extractedBadges.push(...parts);
          } else if (trimmed.length > 60 || trimmed.includes("\n")) {
            extractedParas.push(trimmed);
          } else {
            extractedBadges.push(trimmed);
          }
        }
      });

      if (extractedBadges.length > 0) {
        setKitchenBadges((prev) =>
          Array.from(new Set([...prev, ...extractedBadges])),
        );
      }
      if (extractedParas.length > 0) {
        setParagraphNotes((prev) =>
          Array.from(new Set([...prev, ...extractedParas])),
        );
      }
      setHasInitializedItemNotes(true);
    }
  }, [cart, hasInitializedItemNotes]);

  // Handle adding notes via Enter, Comma, or Add button
  const handleAddKitchenNote = (textToAdd: string) => {
    const trimmed = textToAdd.trim();
    if (!trimmed) return;

    if (trimmed.includes(",")) {
      // Split on comma into multiple compact badges
      const parts = trimmed
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      setKitchenBadges((prev) => Array.from(new Set([...prev, ...parts])));
    } else if (trimmed.length > 60 || trimmed.includes("\n")) {
      // Paragraph note
      setParagraphNotes((prev) => [...prev, trimmed]);
    } else {
      // Single compact badge
      setKitchenBadges((prev) => Array.from(new Set([...prev, trimmed])));
    }
    setKitchenInput("");
  };

  const handleKitchenInputChange = (val: string) => {
    // If typing comma in a short note, immediately convert preceding text into a badge
    if (val.includes(",") && val.length < 60) {
      const parts = val.split(",");
      const toCommit = parts
        .slice(0, -1)
        .map((p) => p.trim())
        .filter(Boolean);
      if (toCommit.length > 0) {
        setKitchenBadges((prev) => Array.from(new Set([...prev, ...toCommit])));
        setKitchenInput(parts[parts.length - 1].trimStart());
        return;
      }
    }
    setKitchenInput(val);
  };

  const effectiveOrderNotes = useMemo(() => {
    const parts: string[] = [];
    if (kitchenBadges.length > 0) {
      parts.push(kitchenBadges.join(", "));
    }
    if (paragraphNotes.length > 0) {
      parts.push(...paragraphNotes);
    }
    if (kitchenInput.trim()) {
      parts.push(kitchenInput.trim());
    }
    return parts.join("\n\n");
  }, [kitchenBadges, paragraphNotes, kitchenInput]);

  const [paymentPreference, setPaymentPreference] = useState<
    "COUNTER" | "UPI_NOW"
  >("COUNTER");

  // Promo Code State
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discount: number;
    label: string;
    discountType?: "PERCENTAGE" | "FIXED" | "FREE_ITEM";
    discountValue?: number;
    maxDiscountAmount?: number | null;
    minOrder?: number;
    rewardItemId?: string | null;
    rewardItemName?: string | null;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Full Screen Order Success Celebration Modal
  const [isOrderPlacedSuccess, setIsOrderPlacedSuccess] = useState(false);
  const [placedOrderInfo, setPlacedOrderInfo] = useState<{
    orderNumber: string;
    total: number;
    orderType: string;
    tableName: string;
    itemCount: number;
    estimatedWaitText?: string | null;
    paymentMethod?: "CASH" | "UPI";
  } | null>(null);

  // Live tracker / UPI modal states
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [upiOrderData, setUpiOrderData] = useState<{
    orderId?: string;
    amount: number;
    orderNumber: string;
    initialMode?: "UPI" | "CASH";
  } | null>(null);

  // Guard dismissal for 1200ms after opening to prevent accidental double-tap closures
  const [canDismissModal, setCanDismissModal] = useState(false);

  useEffect(() => {
    if (isOrderPlacedSuccess) {
      setCanDismissModal(false);
      const timer = setTimeout(() => {
        setCanDismissModal(true);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setCanDismissModal(false);
    }
  }, [isOrderPlacedSuccess]);

  // Navigate back to menu/home screen when closing celebration modal
  const handleCloseCelebrationAndGoHome = () => {
    setIsOrderPlacedSuccess(false);
    setCart([]);
    try {
      localStorage.setItem(`cafe_cart_${cafe.slug}`, JSON.stringify([]));
    } catch (e) {}
    transitionNavigate(router, `/menu/${cafe.slug}${tableQuery}`);
  };

  // Load cart, profile, and history on mount
  useEffect(() => {
    try {
      localStorage.setItem("recent_cafe_slug", cafe.slug);
      router.prefetch(`/menu/${cafe.slug}${tableQuery}`);

      const savedCart = localStorage.getItem(`cafe_cart_${cafe.slug}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }

      const savedProfile = localStorage.getItem(
        `cafe_customer_profile_${cafe.slug}`,
      );
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setCustomerProfile(parsed);
        if (parsed.name) setGuestName(parsed.name);
        if (parsed.phone) setGuestPhone(parsed.phone);
      }

      const savedPastStr = localStorage.getItem(
        `cafe_past_orders_${cafe.slug}`,
      );
      if (savedPastStr) {
        const parsedPast: CustomerPastOrder[] = JSON.parse(savedPastStr);
        setHasPastOrders(parsedPast.length > 0);
      }

      const savedActiveOrderId = localStorage.getItem(
        `cafe_active_order_id_${cafe.slug}`,
      );
      if (savedActiveOrderId) {
        setActiveOrderId(savedActiveOrderId);
      }
    } catch (e) {
      // localStorage safety
    } finally {
      setIsLoaded(true);
    }

    const handleSync = () => {
      try {
        const savedCart = localStorage.getItem(`cafe_cart_${cafe.slug}`);
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (e) {}
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("focus", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("focus", handleSync);
    };
  }, [cafe.slug]);

  const saveCart = (updatedCart: DigitalMenuCartItem[]) => {
    setCart(updatedCart);
    try {
      localStorage.setItem(
        `cafe_cart_${cafe.slug}`,
        JSON.stringify(updatedCart),
      );
    } catch (e) {}
  };

  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    const targetItem = cart.find((it) => it.cartItemId === cartItemId);
    const isFreeItem =
      targetItem &&
      (targetItem.unitPrice === 0 || targetItem.cartItemId.startsWith("free_"));

    if (isFreeItem && newQty > 1) {
      toast({
        title: "Limit: 1 Free Item",
        description: "Complimentary promotional items are limited to 1 per order.",
        variant: "info",
      });
      return;
    }

    if (newQty <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }
    const updated = cart.map((it) =>
      it.cartItemId === cartItemId
        ? { ...it, quantity: newQty, totalPrice: it.unitPrice * newQty }
        : it,
    );
    saveCart(updated);
  };

  const handleRemoveItem = (cartItemId: string) => {
    const itemToRemove = cart.find((c) => c.cartItemId === cartItemId);
    const updated = cart.filter((it) => it.cartItemId !== cartItemId);
    saveCart(updated);
    if (itemToRemove) {
      toast({
        title: "Item Removed",
        description: `${itemToRemove.menuItem.name} removed from your order.`,
        variant: "info",
      });
    }
  };

  const handleClearCart = () => {
    saveCart([]);
    toast({
      title: "Cart Cleared",
      description: "All dishes removed from your cart.",
      variant: "info",
    });
  };

  const handleOpenItemDetail = (cartItem: DigitalMenuCartItem) => {
    transitionNavigate(router, `/menu/${cafe.slug}/${cartItem.menuItem.slug}${tableQuery}`);
  };

  const handleUpdateCustomization = (
    cartItemId: string,
    updates: {
      size?: { id: string; label: string; priceDelta: number } | null;
      addOns?: CustomizationOption[];
      specialInstructions?: string;
    },
  ) => {
    const updated = cart.map((it) => {
      if (it.cartItemId !== cartItemId) return it;

      const basePrice = it.menuItem.price;
      const sizeOption =
        updates.size !== undefined ? updates.size : it.customization?.size;
      const addOns =
        updates.addOns !== undefined
          ? updates.addOns
          : it.customization?.addOns || [];
      const instructions =
        updates.specialInstructions !== undefined
          ? updates.specialInstructions
          : it.customization?.specialInstructions;

      const sizeDelta = sizeOption?.priceDelta || 0;
      const addOnsDelta = addOns.reduce((sum, a) => sum + (a.priceDelta || 0), 0);
      const newUnitPrice = Math.max(0, basePrice + sizeDelta + addOnsDelta);

      const snapshotParts: string[] = [];
      if (sizeOption?.label) snapshotParts.push(sizeOption.label);
      addOns.forEach((a) => {
        snapshotParts.push(a.priceDelta > 0 ? `${a.label} (+₹${a.priceDelta})` : a.label);
      });
      if (instructions) snapshotParts.push(instructions);

      return {
        ...it,
        unitPrice: newUnitPrice,
        totalPrice: newUnitPrice * it.quantity,
        variantSnapshotText: snapshotParts.join(" • "),
        customization: {
          ...it.customization,
          size: sizeOption || undefined,
          addOns: addOns.length > 0 ? addOns : undefined,
          specialInstructions: instructions || undefined,
        },
      };
    });

    saveCart(updated);
  };

  // Pricing calculations
  const subtotal = useMemo(
    () => cart.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
    [cart],
  );

  const totalCustomizationsAmount = useMemo(() => {
    return cart.reduce((sum, it) => {
      const sizeDelta = Math.max(0, it.customization?.size?.priceDelta || 0);
      const addOnsDelta = (it.customization?.addOns || []).reduce(
        (aSum, a) => aSum + Math.max(0, a.priceDelta || 0),
        0,
      );
      const milkDelta = Math.max(0, it.customization?.milkChoice?.priceDelta || 0);
      return sum + (sizeDelta + addOnsDelta + milkDelta) * it.quantity;
    }, 0);
  }, [cart]);

  // Base items subtotal (base items cost before add-ons and extra options)
  const baseItemsSubtotal = useMemo(() => {
    return Math.max(0, subtotal - totalCustomizationsAmount);
  }, [subtotal, totalCustomizationsAmount]);

  // All individual extra customizations across all items in cart with their prices
  const allExtrasList = useMemo(() => {
    const list: {
      id: string;
      label: string;
      unitPriceDelta: number;
      quantity: number;
      amount: number;
    }[] = [];

    cart.forEach((it) => {
      // 1. Size upgrade if priceDelta > 0
      if (it.customization?.size && it.customization.size.priceDelta > 0) {
        const sizeLabel = `${it.customization.size.label} Size`;
        const fullLabel =
          cart.length > 1 ? `${sizeLabel} • ${it.menuItem.name}` : sizeLabel;
        list.push({
          id: `size_${it.cartItemId}_${it.customization.size.id}`,
          label: fullLabel,
          unitPriceDelta: it.customization.size.priceDelta,
          quantity: it.quantity,
          amount: it.customization.size.priceDelta * it.quantity,
        });
      }

      // 2. Add-ons if priceDelta > 0
      if (it.customization?.addOns && it.customization.addOns.length > 0) {
        it.customization.addOns.forEach((a) => {
          if (a.priceDelta > 0) {
            const fullLabel =
              cart.length > 1 ? `${a.label} • ${it.menuItem.name}` : a.label;
            list.push({
              id: `addon_${it.cartItemId}_${a.id}`,
              label: fullLabel,
              unitPriceDelta: a.priceDelta,
              quantity: it.quantity,
              amount: a.priceDelta * it.quantity,
            });
          }
        });
      }

      // 3. Milk choice if priceDelta > 0
      if (
        it.customization?.milkChoice &&
        it.customization.milkChoice.priceDelta > 0
      ) {
        const milkRaw = it.customization.milkChoice.label;
        const milkLabel = milkRaw.toLowerCase().includes("milk")
          ? milkRaw
          : `${milkRaw} Milk`;
        const fullLabel =
          cart.length > 1 ? `${milkLabel} • ${it.menuItem.name}` : milkLabel;
        list.push({
          id: `milk_${it.cartItemId}_${it.customization.milkChoice.id}`,
          label: fullLabel,
          unitPriceDelta: it.customization.milkChoice.priceDelta,
          quantity: it.quantity,
          amount: it.customization.milkChoice.priceDelta * it.quantity,
        });
      }
    });

    return list;
  }, [cart]);
  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    const matchingOffer = initialOffers.find(
      (o) => o.code.toUpperCase() === appliedPromo.code.toUpperCase(),
    );
    if (matchingOffer) {
      const evaluation = evaluateOffer(matchingOffer, {
        cart,
        subtotal,
        customerProfile,
        hasPastOrders,
        channel: "DIGITAL_MENU",
        cafeSlug: cafe.slug,
        orderType,
        menuItemNamesById,
        categoryNamesById,
      });
      return evaluation.calculatedDiscount;
    }
    return 0;
  }, [
    appliedPromo,
    subtotal,
    cart,
    initialOffers,
    customerProfile,
    hasPastOrders,
    cafe.slug,
    orderType,
    menuItemNamesById,
    categoryNamesById,
  ]);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(taxableAmount * 0.05);
  const total = taxableAmount + tax;

  // Deduplicated Qualifying Coupons (Evaluates advanced rules, items scope, categories, schedule, limits)
  const qualifyingOffers = useMemo(() => {
    const seenCodes = new Set<string>();
    const list: {
      code: string;
      title: string;
      description: string;
      discountType: "PERCENTAGE" | "FIXED" | "FREE_ITEM";
      discountValue: number;
      badgeText?: string;
      rewardItemName?: string | null;
      applicationMethod?: string;
    }[] = [];

    // Active cafe owner offers from DB verified against cart & rules
    initialOffers.forEach((o) => {
      const evaluation = evaluateOffer(o, {
        cart,
        subtotal,
        customerProfile,
        hasPastOrders,
        channel: "DIGITAL_MENU",
        cafeSlug: cafe.slug,
        orderType,
        menuItemNamesById,
        categoryNamesById,
      });

      if (!evaluation.isEligible) return;

      const code = o.code.trim().toUpperCase();
      if (seenCodes.has(code)) return;
      seenCodes.add(code);

      const title =
        o.discountType === "FREE_ITEM"
          ? `Free ${o.rewardItemName || "Item"}`
          : o.title || `${o.discountValue}% OFF`;

      list.push({
        code,
        title,
        description:
          o.description ||
          (evaluation.scopeLabel !== "On entire order"
            ? evaluation.scopeLabel
            : o.minOrderAmount
            ? `Valid on orders above ₹${o.minOrderAmount}`
            : "Special Offer"),
        discountType:
          (o.discountType as "PERCENTAGE" | "FIXED" | "FREE_ITEM") ||
          "PERCENTAGE",
        discountValue: o.discountValue,
        badgeText:
          o.badgeText ||
          (evaluation.scopeLabel !== "On entire order"
            ? evaluation.scopeLabel
            : "Special Offer"),
        rewardItemName: o.rewardItemName,
        applicationMethod: o.applicationMethod,
      });
    });

    return list;
  }, [
    initialOffers,
    subtotal,
    cart,
    customerProfile,
    hasPastOrders,
    cafe.slug,
    orderType,
    menuItemNamesById,
    categoryNamesById,
  ]);

  // Nearest locked offer for Swiggy/Zomato style "Unlock % OFF" banner
  const nearestLockedOffer = useMemo(() => {
    if (appliedPromo || subtotal === 0) return null;
    interface LockedOfferData {
      code: string;
      title: string;
      discountDesc: string;
      minOrder: number;
      diff: number;
      isClaimedByCustomer?: boolean;
    }

    // 1. If customer claimed a specific offer from Home or modal, prioritize it in the unlock banner!
    let savedCouponCode: string | null = null;
    try {
      savedCouponCode = localStorage.getItem(`cafe_applied_coupon_${cafe.slug}`);
    } catch (e) {}

    if (savedCouponCode) {
      const claimedOffer = initialOffers.find(
        (o) => o.code.toUpperCase() === savedCouponCode?.toUpperCase() && o.isActive
      );
      if (
        claimedOffer &&
        (!claimedOffer.applicableOrderType ||
          claimedOffer.applicableOrderType === "BOTH" ||
          claimedOffer.applicableOrderType === orderType) &&
        (claimedOffer.minOrderAmount || 0) > subtotal
      ) {
        const min = claimedOffer.minOrderAmount || 0;
        const discountDesc =
          claimedOffer.discountType === "FREE_ITEM"
            ? `Free ${claimedOffer.rewardItemName || "Treat"}`
            : claimedOffer.discountType === "PERCENTAGE"
            ? `${claimedOffer.discountValue}% OFF`
            : `Flat ₹${claimedOffer.discountValue} OFF`;
        return {
          code: claimedOffer.code,
          title: claimedOffer.title,
          discountDesc,
          minOrder: min,
          diff: min - subtotal,
          isClaimedByCustomer: true,
        };
      }
    }

    let nearest: LockedOfferData | null = null;

    for (const o of initialOffers) {
      if (!o.isActive) continue;
      // If offer is restricted to another dining mode, skip teasing it here
      if (o.applicableOrderType && o.applicableOrderType !== "BOTH" && o.applicableOrderType !== orderType) {
        continue;
      }
      // If offer requires specific items or categories, only tease unlock if those items are present in cart
      if (o.appliesTo === "ITEMS") {
        const targetIds = (o.targetItemIds || "").split(",").map((s) => s.trim()).filter(Boolean);
        const hasItem = cart.some((it) => targetIds.includes(it.menuItem.id));
        if (!hasItem) continue;
      }
      if (o.appliesTo === "CATEGORIES") {
        const targetCatIds = (o.targetCategoryIds || "").split(",").map((s) => s.trim()).filter(Boolean);
        const hasCat = cart.some((it) => it.menuItem.categoryId && targetCatIds.includes(it.menuItem.categoryId));
        if (!hasCat) continue;
      }
      const min = o.minOrderAmount || 0;
      if (min > subtotal) {
        const diff = min - subtotal;
        if (!nearest || diff < nearest.diff) {
          const discountDesc =
            o.discountType === "FREE_ITEM"
              ? `Free ${o.rewardItemName || "Treat"}`
              : o.discountType === "PERCENTAGE"
              ? `${o.discountValue}% OFF`
              : `Flat ₹${o.discountValue} OFF`;
          nearest = {
            code: o.code,
            title: o.title,
            discountDesc,
            minOrder: min,
            diff,
          };
        }
      }
    }

    return nearest;
  }, [appliedPromo, initialOffers, subtotal, cart, cafe.slug, orderType]);

  // Apply promo (supports manual entry, threshold auto-application, and free items)
  const handleApplyPromo = (
    codeToApply: string,
    explicitSubtotal?: number,
    isAutoApplied?: boolean,
  ): boolean => {
    const code = codeToApply.trim().toUpperCase();
    if (!code) return false;
    const effSubtotal =
      explicitSubtotal !== undefined ? explicitSubtotal : subtotal;

    const matchingOffer = initialOffers.find(
      (o) => o.code.toUpperCase() === code && o.isActive,
    );
    if (!matchingOffer) {
      if (!isAutoApplied) {
        setPromoError(`Invalid coupon code '${code}'`);
      }
      return false;
    }

    const evaluation = evaluateOffer(matchingOffer, {
      cart,
      subtotal: effSubtotal,
      customerProfile,
      hasPastOrders,
      channel: "DIGITAL_MENU",
      cafeSlug: cafe.slug,
      orderType,
      menuItemNamesById,
      categoryNamesById,
    });

    if (!evaluation.isEligible) {
      if (!isAutoApplied) {
        setPromoError(evaluation.ineligibleReason || `Cannot apply ${code}`);
      }
      return false;
    }

    // CRITICAL FIX: If switching to another offer, remove any previous free promo item!
    const hasExistingFreeItem = cart.some(
      (it) => it.unitPrice === 0 || it.cartItemId.startsWith("free_"),
    );
    if (hasExistingFreeItem && matchingOffer.code !== appliedPromo?.code) {
      const cleanedCart = cart.filter(
        (it) => it.unitPrice !== 0 && !it.cartItemId.startsWith("free_"),
      );
      saveCart(cleanedCart);
    }

    const disc = evaluation.calculatedDiscount;
    setAppliedPromo({
      code,
      discount: disc,
      label:
        matchingOffer.discountType === "FREE_ITEM"
          ? `Free ${matchingOffer.rewardItemName || "Item"}`
          : matchingOffer.title || `${matchingOffer.discountValue}% OFF`,
      discountType:
        (matchingOffer.discountType as "PERCENTAGE" | "FIXED" | "FREE_ITEM") ||
        "PERCENTAGE",
      discountValue: matchingOffer.discountValue,
      maxDiscountAmount: matchingOffer.maxDiscountAmount,
      minOrder: matchingOffer.minOrderAmount || undefined,
      rewardItemId: matchingOffer.rewardItemId,
      rewardItemName: matchingOffer.rewardItemName,
    });
    setPromoError(null);
    setPromoInput("");

    // Persist applied coupon and add to claimed offers in localStorage
    try {
      localStorage.setItem(`cafe_applied_coupon_${cafe.slug}`, code);
      const rawClaimed = localStorage.getItem(`cafe_claimed_offers_${cafe.slug}`);
      const claimedList: string[] = rawClaimed ? JSON.parse(rawClaimed) : [];
      if (!claimedList.includes(code)) {
        claimedList.push(code);
        localStorage.setItem(`cafe_claimed_offers_${cafe.slug}`, JSON.stringify(claimedList));
      }
    } catch (e) {}

    // CRITICAL FIX: If FREE_ITEM offer, auto-inject the complimentary reward item into cart if not present
    if (matchingOffer.discountType === "FREE_ITEM" && matchingOffer.rewardItemId) {
      const rewardId = matchingOffer.rewardItemId;
      const rewardName = matchingOffer.rewardItemName || "Complimentary Item";
      const alreadyInCart = cart.some(
        (it) => it.menuItem.id === rewardId && it.unitPrice === 0
      );
      if (!alreadyInCart) {
        const realItem =
          (quickAddItems?.find((it) => it.id === rewardId) as any) ||
          (menuItemsList?.find((it) => it.id === rewardId) as any);

        const freeItem: DigitalMenuCartItem = {
          cartItemId: `free_${rewardId}_${Date.now()}`,
          menuItem: {
            id: rewardId,
            cafeId: cafe.id,
            name: rewardName,
            slug: realItem?.slug || rewardName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            imageKey: realItem?.imageKey || null,
            price: 0,
            foodType: realItem?.foodType || "VEG",
            isVegetarian: realItem?.isVegetarian ?? true,
            isBestseller: false,
            calories: realItem?.calories || undefined,
            preparationTimeMinutes: realItem?.preparationTimeMinutes || undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any,
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          customization: {},
          variantSnapshotText: "Complimentary Free Item 🎁",
        };
        const updated = [
          ...cart.filter(
            (it) => it.unitPrice !== 0 && !it.cartItemId.startsWith("free_")
          ),
          freeItem,
        ];
        saveCart(updated);
      }
    }

    toast({
      title: isAutoApplied
        ? "Offer Unlocked & Applied! 🎉"
        : "Promo Applied!",
      description:
        matchingOffer.discountType === "FREE_ITEM"
          ? `Unlocked 1 Free ${matchingOffer.rewardItemName || "Treat"}!`
          : `Saved ₹${disc} with ${code}`,
      variant: "success",
    });
    return true;
  };

  const handleRemovePromo = () => {
    try {
      localStorage.removeItem(`cafe_target_unlock_${cafe.slug}`);
      localStorage.removeItem(`cafe_applied_coupon_${cafe.slug}`);
    } catch (e) {}

    // CRITICAL FIX: Automatically remove any complimentary free promo items from cart!
    const hasFreeItem = cart.some(
      (it) => it.unitPrice === 0 || it.cartItemId.startsWith("free_"),
    );
    if (hasFreeItem) {
      const cleanedCart = cart.filter(
        (it) => it.unitPrice !== 0 && !it.cartItemId.startsWith("free_"),
      );
      saveCart(cleanedCart);
    }

    setAppliedPromo(null);
    setPromoError(null);
    setPromoInput("");
    toast({
      title: "Promo Removed",
      description: hasFreeItem
        ? "Offer and complimentary item removed from order."
        : "Discount removed from order.",
      variant: "info",
    });
  };

  // Monitor promo validity: auto-revoke offer & free items if requirements are no longer met
  useEffect(() => {
    if (!appliedPromo) return;

    // Check remaining paid items
    const paidItems = cart.filter(
      (it) => it.unitPrice > 0 && !it.cartItemId.startsWith("free_"),
    );

    if (paidItems.length === 0) {
      // Customer removed all dishes; don't leave isolated free promo item in cart
      const hasFreeItem = cart.some(
        (it) => it.unitPrice === 0 || it.cartItemId.startsWith("free_"),
      );
      if (hasFreeItem) {
        saveCart([]);
      }
      setAppliedPromo(null);
      return;
    }

    const matchingOffer = initialOffers.find(
      (o) => o.code.toUpperCase() === appliedPromo.code.toUpperCase(),
    );
    if (!matchingOffer) {
      setAppliedPromo(null);
      return;
    }

    const evaluation = evaluateOffer(matchingOffer, {
      cart,
      subtotal,
      customerProfile,
      hasPastOrders,
      channel: "DIGITAL_MENU",
      cafeSlug: cafe.slug,
      orderType,
      menuItemNamesById,
      categoryNamesById,
    });

    if (!evaluation.isEligible) {
      const hasFreeItem = cart.some(
        (it) => it.unitPrice === 0 || it.cartItemId.startsWith("free_"),
      );
      if (hasFreeItem) {
        const cleanedCart = cart.filter(
          (it) => it.unitPrice !== 0 && !it.cartItemId.startsWith("free_"),
        );
        saveCart(cleanedCart);
      }
      setAppliedPromo(null);
      toast({
        title: "Promo Revoked",
        description: evaluation.ineligibleReason || "Order no longer meets requirements for this offer.",
        variant: "warning",
      });
    }
  }, [
    subtotal,
    appliedPromo,
    cart,
    initialOffers,
    customerProfile,
    hasPastOrders,
    cafe.slug,
    orderType,
    menuItemNamesById,
    categoryNamesById,
    toast,
  ]);

  // Claim Free Item Reward
  const handleClaimFreeItem = (rewardItemId: string, rewardItemName: string) => {
    const alreadyInCart = cart.some(
      (it) => it.menuItem.id === rewardItemId && it.unitPrice === 0,
    );
    if (alreadyInCart) {
      toast({
        title: "Free Item Already Added",
        description: `Your complimentary ${rewardItemName} is already in your cart!`,
        variant: "info",
      });
      return;
    }

    const realItem = quickAddItems?.find((it) => it.id === rewardItemId);

    const freeItem: DigitalMenuCartItem = {
      cartItemId: `free_${rewardItemId}_${Date.now()}`,
      menuItem: {
        id: rewardItemId,
        cafeId: cafe.id,
        name: rewardItemName,
        slug: realItem?.slug || rewardItemName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        imageKey: realItem?.imageKey || null,
        price: 0,
        foodType: realItem?.foodType || "VEG",
        isVegetarian: realItem?.isVegetarian ?? true,
        isBestseller: false,
        calories: realItem?.calories || undefined,
        preparationTimeMinutes: realItem?.preparationTimeMinutes || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      customization: {},
      variantSnapshotText: "Complimentary Free Item 🎁",
    };

    const updated = [...cart, freeItem];
    saveCart(updated);
    toast({
      title: "Free Item Added! 🎁",
      description: `1 Complimentary ${rewardItemName} added to your cart for ₹0!`,
      variant: "success",
    });
  };

  // Quick add item from cart unlock banner with automatic offer unlock & application
  const handleQuickAddMenuItem = (menuItem: MenuItem) => {
    let updatedCart: DigitalMenuCartItem[] = [];
    const existingIndex = cart.findIndex(
      (it) => it.menuItem.id === menuItem.id,
    );
    if (existingIndex > -1) {
      const updated = [...cart];
      const existing = updated[existingIndex];
      const newQty = existing.quantity + 1;
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        totalPrice: existing.unitPrice * newQty,
      };
      updatedCart = updated;
    } else {
      const newItem: DigitalMenuCartItem = {
        cartItemId: `${menuItem.id}_${Date.now()}`,
        menuItem,
        quantity: 1,
        unitPrice: menuItem.price,
        totalPrice: menuItem.price,
        customization: {},
        variantSnapshotText: "",
      };
      updatedCart = [...cart, newItem];
    }
    saveCart(updatedCart);

    const newSubtotal = updatedCart.reduce(
      (sum, it) => sum + it.unitPrice * it.quantity,
      0,
    );

    // Auto-apply target offer immediately if new subtotal unlocks it!
    if (
      !appliedPromo &&
      nearestLockedOffer &&
      newSubtotal >= nearestLockedOffer.minOrder
    ) {
      try {
        localStorage.removeItem(`cafe_target_unlock_${cafe.slug}`);
      } catch (e) {}
      handleApplyPromo(nearestLockedOffer.code, newSubtotal, true);
    } else {
      toast({
        title: `Added ${menuItem.name}`,
        description: `₹${menuItem.price} added to cart`,
        variant: "success",
      });
    }
  };

  // Persist target unlock offer so if customer navigates to menu to add items, it auto-applies on return
  useEffect(() => {
    if (appliedPromo) return;
    if (nearestLockedOffer) {
      try {
        localStorage.setItem(
          `cafe_target_unlock_${cafe.slug}`,
          JSON.stringify({
            code: nearestLockedOffer.code,
            minOrder: nearestLockedOffer.minOrder,
          }),
        );
      } catch (e) {}
    }
  }, [nearestLockedOffer, appliedPromo, cafe.slug]);

  // Auto-apply saved coupon from home claim or session when cart meets requirements
  useEffect(() => {
    if (appliedPromo || cart.length === 0) return;
    try {
      const savedCoupon = localStorage.getItem(`cafe_applied_coupon_${cafe.slug}`);
      if (savedCoupon) {
        const matchingOffer = initialOffers.find(
          (o) => o.code.toUpperCase() === savedCoupon.trim().toUpperCase() && o.isActive
        );
        if (matchingOffer) {
          const evalRes = evaluateOffer(matchingOffer, {
            cart,
            subtotal,
            customerProfile,
            hasPastOrders,
            channel: "DIGITAL_MENU",
            cafeSlug: cafe.slug,
            orderType,
            menuItemNamesById,
            categoryNamesById,
          });
          if (evalRes.isEligible) {
            handleApplyPromo(savedCoupon, subtotal, true);
            return;
          }
        }
      }

      // Check general target unlock
      const raw = localStorage.getItem(`cafe_target_unlock_${cafe.slug}`);
      if (raw) {
        const target = JSON.parse(raw);
        if (target && target.code && subtotal >= target.minOrder) {
          localStorage.removeItem(`cafe_target_unlock_${cafe.slug}`);
          handleApplyPromo(target.code, subtotal, true);
        }
      }
    } catch (e) {}
  }, [
    subtotal,
    appliedPromo,
    cart,
    initialOffers,
    cafe.slug,
    customerProfile,
    hasPastOrders,
    orderType,
    menuItemNamesById,
    categoryNamesById,
  ]);

  // If subtotal drops below required minOrder for the applied promo, automatically remove it
  useEffect(() => {
    if (
      appliedPromo &&
      appliedPromo.minOrder &&
      subtotal < appliedPromo.minOrder
    ) {
      const code = appliedPromo.code;
      const min = appliedPromo.minOrder;
      setAppliedPromo(null);
      toast({
        title: "Offer Removed",
        description: `Order subtotal dropped below ₹${min} required for ${code}`,
        variant: "warning",
      });
    }
  }, [subtotal, appliedPromo]);

  // Submit and place order
  const handlePlaceOrderSubmit = async (
    forcedPaymentMethod?: "CASH" | "UPI",
    forcedPaymentStatus?: "UNPAID" | "PENDING_VERIFICATION"
  ) => {
    if (cart.length === 0) return;

    // Takeaway: require guest name if not logged in
    if (orderType === "TAKEAWAY" && !customerProfile?.name && !guestName.trim() && !takeawayGuestName.trim()) {
      setShowTakeawayNameError(true);
      toast({
        title: "Name Required",
        description: "Please enter your name for the takeaway order.",
        variant: "warning",
      });
      return;
    }

    if (
      orderType === "DINE_IN" &&
      (!selectedTableNumber.trim() || !isCurrentlySeatedGuest)
    ) {
      setTableError("Please scan your table QR code to place a dine-in order");
      setIsQrScannerOpen(true);
      toast({
        title: "Scan Table QR Code",
        description:
          "Please scan your tabletop QR stand to order Dine-In, or switch to Takeaway.",
        variant: "warning",
      });
      return;
    }

    // If customer has a table held from waitlist, require scanning physical QR to confirm arrival before placing order
    if (orderType === "DINE_IN" && readyTableData && !claimedTable) {
      setIsQrScannerOpen(true);
      toast({
        title: "Scan Table QR to Confirm",
        description: `Please scan the QR code on ${readyTableData.number} to confirm your seat before placing your order.`,
        variant: "warning",
      });
      return;
    }

    const selectedPaymentMethod =
      forcedPaymentMethod || (paymentPreference === "COUNTER" ? "CASH" : "UPI");
    const selectedPaymentStatus =
      forcedPaymentStatus || (selectedPaymentMethod === "CASH" ? "UNPAID" : "PENDING_VERIFICATION");

    try {
      setIsPlacingOrder(true);
      setTableError(null);

      const itemsPayload: CreateOrderItemInput[] = cart.map((it) => ({
        menuItemId: it.menuItem.id,
        itemName: it.menuItem.name,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        variantName: it.variantSnapshotText || null,
        specialInstructions: it.customization.specialInstructions || null,
      }));

      const resolvedTableName =
        orderType === "DINE_IN" ? selectedTableNumber.trim() : "Takeaway";

      const matchedTableObj = localTablesList.find(
        (t) => t.tableNumber.toLowerCase() === resolvedTableName.toLowerCase(),
      );

      const payload: CreateOrderInput = {
        orderType,
        tableId: matchedTableObj?.id || claimedTable?.id || table?.id || null,
        tableNameSnapshot: resolvedTableName,
        tableQrIdentifier:
          matchedTableObj?.qrIdentifier ||
          table?.qrIdentifier ||
          claimedTable?.qrIdentifier ||
          null,
        customerId:
          customerProfile &&
          !customerProfile.isGuest &&
          customerProfile.id &&
          !customerProfile.id.startsWith("cust_") &&
          !customerProfile.id.startsWith("usr_")
            ? customerProfile.id
            : null,
        customerName:
          customerProfile?.name ||
          guestName.trim() ||
          (orderType === "TAKEAWAY" ? takeawayGuestName.trim() : "") ||
          (orderType === "DINE_IN" ? "Dine-in Guest" : "Takeaway Guest"),
        customerPhone: customerProfile?.phone || guestPhone.trim() || null,
        items: itemsPayload,
        notes: effectiveOrderNotes.trim() || null,
        discount: discountAmount,
        paymentStatus: selectedPaymentStatus,
        paymentMethod: selectedPaymentMethod,
      };

      const res = await fetch(`/api/cafe/${cafe.slug}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to place order");
      }

      const createdOrder: OrderWithItems = json.data;

      try {
        localStorage.setItem(
          `cafe_active_order_id_${cafe.slug}`,
          createdOrder.id,
        );
        localStorage.setItem(
          `cafe_active_order_num_${cafe.slug}`,
          createdOrder.orderNumber,
        );

        // Record customer usage of promo code to enforce uses limit
        if (appliedPromo?.code) {
          recordCustomerOfferUse(cafe.slug, appliedPromo.code);
        }

        // Signal other tabs / components of new active order
        window.dispatchEvent(new Event("storage"));
      } catch (e) {}

      setActiveOrderId(createdOrder.id);
      setActiveOrders((prev) => [
        ...prev.filter((o) => o.id !== createdOrder.id),
        createdOrder,
      ]);
      syncActiveOrders();

      const waitEstimate = calculateOrderWaitTime(
        cart.map((c) => ({
          preparationTimeMinutes: c.menuItem.preparationTimeMinutes,
          quantity: c.quantity,
        })),
      );

      setPlacedOrderInfo({
        orderNumber: createdOrder.orderNumber,
        total: createdOrder.total,
        orderType,
        tableName: resolvedTableName,
        itemCount: cart.reduce((s, it) => s + it.quantity, 0),
        estimatedWaitText: waitEstimate ? waitEstimate.text : null,
        paymentMethod: selectedPaymentMethod,
      });

      // Clear local storage for next visit, but keep in-memory cart until modal dismiss
      try {
        localStorage.setItem(`cafe_cart_${cafe.slug}`, JSON.stringify([]));
      } catch (e) {}

      // Reset any pending UPI modal data and show celebration
      setUpiOrderData(null);
      setIsUpiModalOpen(false);
      setIsOrderPlacedSuccess(true);
    } catch (err: any) {
      toast({
        title: "Order Failed",
        description: err.message || "Could not place order. Please try again.",
        variant: "danger",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--cafe-background)] text-[var(--color-foreground)] flex flex-col relative overflow-x-hidden selection:bg-[var(--color-primary-light)]">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. EXACT AMBIENT BLOOM & BACKDROP (Identical to Home Screen)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="absolute top-0 inset-x-0 h-[460px] pointer-events-none -z-0 overflow-hidden select-none">
        <div
          className={`absolute inset-0 bg-gradient-to-b ${visualTheme.backdropBase}`}
        />
        <div
          className={`absolute -top-20 left-1/2 -translate-x-1/2 w-[420px] h-[360px] rounded-full bg-gradient-to-b ${visualTheme.radialBloom} blur-3xl`}
        />
        <div
          className="absolute -top-12 -left-12 w-72 h-72 rounded-full blur-3xl"
          style={{ backgroundColor: visualTheme.radialWarmth, opacity: 0.6 }}
        />
        <div
          className="absolute -top-12 -right-12 w-72 h-72 rounded-full blur-3xl"
          style={{ backgroundColor: visualTheme.radialGlow, opacity: 0.35 }}
        />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. MINIMAL TOP BAR (Menu / Your Order / Clear)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="relative z-20 max-w-md mx-auto px-4 pt-4 pb-2 w-full">
        <header className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => transitionNavigate(router, `/menu/${cafe.slug}${tableQuery}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border-0 text-xs font-semibold text-[#1C1D1A] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.04)] hover:bg-white transition-all cursor-pointer select-none active:scale-95"
          >
            <IconArrowLeft className="w-3.5 h-3.5 stroke-[2.4]" />
            <span>Menu</span>
          </button>

          <div className="text-center">
            <h1 className="text-sm font-bold text-[#1C1D1A] tracking-tight">
              Your Order
            </h1>
            <span className="text-[11px] text-[#8C8A84] font-medium">
              {cart.length} {cart.length === 1 ? "item" : "items"}
            </span>
          </div>

          {cart.length > 0 ? (
            <button
              type="button"
              onClick={handleClearCart}
              className="text-xs font-medium text-rose-400 hover:text-rose-600 transition-colors cursor-pointer active:scale-95 px-2 py-1"
            >
              Clear
            </button>
          ) : (
            <div className="w-12" />
          )}
        </header>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CASE A: EMPTY CART
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {isLoaded &&
      cart.length === 0 &&
      !isOrderPlacedSuccess &&
      !placedOrderInfo ? (
        <div className="relative z-10 max-w-md mx-auto px-4 mt-6">
          <div className="p-8 text-center rounded-3xl bg-white/80 backdrop-blur-md border-0 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.9),0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-black/[0.04] text-[#73716B] flex items-center justify-center">
              <IconShoppingBag className="w-8 h-8 stroke-[1.8]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#1C1D1A]">
                Your Cart is Empty
              </h2>
              <p className="text-xs text-[#8C8A84] max-w-xs mx-auto leading-relaxed">
                Explore our freshly brewed coffees, bakery treats, and delicious
                bistro specials.
              </p>
            </div>
            <button
              type="button"
              onClick={() => transitionNavigate(router, `/menu/${cafe.slug}${tableQuery}`)}
              className={`px-6 py-2.5 rounded-full text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all inline-flex items-center gap-1.5 bg-gradient-to-r ${visualTheme.buttonGradient}`}
            >
              <IconShoppingBag className="w-4 h-4 stroke-[2]" />
              <span>Explore Menu</span>
            </button>
          </div>
        </div>
      ) : (
        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            CASE B: POPULAR SECTION CENTER BEND CONTINUOUS SURFACE
            Contains EVERYTHING seamlessly:
            1. Dining Mode + Table Selector (Integrated at the top of the surface)
            2. Dishes in Order
            3. Kitchen Instructions
            4. Coupons & Offers
            5. Bill Breakdown
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
        <div className="relative mt-2 -mx-0 z-10 max-w-md mx-auto w-full flex-1 flex flex-col">
          {/* Symmetrical Center Dip Top Divider */}
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

          {/* Unified Continuous Surface Container - Flat at bottom, ends naturally at floating button */}
          <div className="bg-white px-4 pt-1 pb-32 space-y-5 flex-1">
            {/* 1. Dine-In / Takeaway + Table Selector (INSIDE Center Bend, No Extra Background) */}
            <div className="space-y-2 pt-1">
              <div className="p-1 rounded-2xl bg-stone-100/90 grid grid-cols-2 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setOrderType("DINE_IN");
                    setTableError(null);
                  }}
                  className={`py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    orderType === "DINE_IN"
                      ? "bg-white text-[#1C1D1A] shadow-xs"
                      : "text-[#73716B] hover:text-[#1C1D1A]"
                  }`}
                >
                  <IconArmchair
                    className="w-4 h-4 transition-colors"
                    style={
                      orderType === "DINE_IN"
                        ? { color: visualTheme.avatarFallbackBg }
                        : { color: "#73716B" }
                    }
                  />
                  <span>Dine-In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOrderType("TAKEAWAY");
                    setTableError(null);
                  }}
                  className={`py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    orderType === "TAKEAWAY"
                      ? "bg-white text-[#1C1D1A] shadow-xs"
                      : "text-[#73716B] hover:text-[#1C1D1A]"
                  }`}
                >
                  <IconShoppingBag
                    className="w-4 h-4 transition-colors"
                    style={
                      orderType === "TAKEAWAY"
                        ? { color: visualTheme.avatarFallbackBg }
                        : { color: "#73716B" }
                    }
                  />
                  <span>Takeaway</span>
                </button>
              </div>

              {/* Inline Table Selector with Distinct Background and Border */}
              {/* Takeaway mode: compact pill with guest name input */}
              {orderType === "TAKEAWAY" ? (
                <div className="relative z-40 px-3.5 py-2.5 border-b border-dashed border-stone-200/70 space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full font-bold border shrink-0"
                      style={{
                        backgroundColor: `${visualTheme.avatarFallbackBg}12`,
                        borderColor: `${visualTheme.avatarFallbackBg}30`,
                        color: visualTheme.avatarFallbackBg,
                      }}
                    >
                      <IconShoppingBag className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Takeaway</span>
                    </span>
                    <span className="text-[10.5px] text-[#8C8A84] font-medium">
                      Collect at counter
                    </span>
                  </div>

                  {/* Guest name prompt for takeaway if not logged in */}
                  {!customerProfile?.name && !guestName.trim() && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <IconUser
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8C8A84] pointer-events-none"
                        />
                        <input
                          type="text"
                          value={takeawayGuestName}
                          onChange={(e) => {
                            setTakeawayGuestName(e.target.value);
                            if (e.target.value.trim()) setShowTakeawayNameError(false);
                          }}
                          placeholder="Your name for the order"
                          className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-[11.5px] font-medium bg-stone-50 border transition-colors outline-none placeholder:text-[#B5B3AE] ${
                            showTakeawayNameError && !takeawayGuestName.trim()
                              ? "border-rose-300 bg-rose-50/50"
                              : "border-stone-200/80 focus:border-stone-300"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                  {showTakeawayNameError && !takeawayGuestName.trim() && !customerProfile?.name && !guestName.trim() && (
                    <p className="text-[10.5px] text-rose-500 font-medium flex items-center gap-1 -mt-0.5">
                      <IconAlertCircle className="w-3 h-3 shrink-0" />
                      <span>Please enter your name to place a takeaway order</span>
                    </p>
                  )}
                </div>
              ) : orderType === "DINE_IN" && hasNoTablesForGuest ? (
                <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-50/40 border border-amber-200/70 text-xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
                        <IconArmchair className="w-3.5 h-3.5 stroke-[2.2]" />
                      </div>
                      <span className="font-bold text-xs text-[#1C1D1A] truncate">
                        No Tables Currently Available
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded-md shrink-0">
                      Occupied
                    </span>
                  </div>
                  <p className="text-[11px] text-[#73716B] leading-tight">
                    All dine-in tables are occupied. Join the waiting list to
                    get notified, or switch to takeaway.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (waitlistEntry) {
                          setIsTicketPassOpen(true);
                        } else {
                          setIsWaitingListOpen(true);
                        }
                      }}
                      className="py-1.5 px-3 rounded-full bg-white hover:bg-stone-50 text-[#1C1D1A] font-bold text-[11.5px] border border-stone-200/90 shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <IconClock className="w-3.5 h-3.5 text-amber-600 stroke-[2.2]" />
                      <span className="truncate">
                        {waitlistEntry
                          ? "View Waiting Ticket"
                          : "Join Waiting List"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOrderType("TAKEAWAY");
                        setTableError(null);
                      }}
                      className="py-1.5 px-3 rounded-full bg-[#1C1D1A] hover:bg-black text-white font-bold text-[11.5px] flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
                    >
                      <IconShoppingBag className="w-3.5 h-3.5 text-stone-300 stroke-[2]" />
                      <span className="truncate">Switch to Takeaway</span>
                    </button>
                  </div>
                </div>
              ) : (
                orderType === "DINE_IN" && (
                  <div className="relative z-40 flex items-center justify-between px-3.5 py-2.5 border-b border-dashed border-stone-200/70 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <IconArmchair
                        className="w-4 h-4 shrink-0"
                        style={{ color: visualTheme.avatarFallbackBg }}
                      />
                      <span className="text-[#73716B] text-[11px] font-medium shrink-0">
                        Table:
                      </span>
                      {selectedTableNumber && isCurrentlySeatedGuest ? (
                        <span className="font-mono font-bold text-[#1C1D1A] text-xs">
                          {selectedTableNumber}
                        </span>
                      ) : (
                        <span className="text-[#73716B] text-xs italic">
                          Not Scanned
                        </span>
                      )}
                    </div>

                    {selectedTableNumber && isCurrentlySeatedGuest ? (
                      <span className="inline-flex items-center gap-1 text-[10.5px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/70 shrink-0">
                        <IconCheck className="w-3 h-3 stroke-[2.5]" />
                        <span>Seated</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsQrScannerOpen(true)}
                        className="px-2.5 py-1 rounded-full bg-stone-900 hover:bg-black text-white text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                      >
                        <IconQrcode className="w-3.5 h-3.5" />
                        <span>Scan Table QR</span>
                      </button>
                    )}
                  </div>
                )
              )}

              {tableError && (
                <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 px-1">
                  <IconAlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{tableError}</span>
                </p>
              )}
            </div>

            {/* 2. Dishes In Order */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[#1C1D1A] tracking-tight">
                  Dishes in Order
                </span>
                <span className="text-[10px] text-[#8C8A84]">
                  Swipe left to remove
                </span>
              </div>

              <div className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {cart.map((item) => (
                    <motion.div
                      key={item.cartItemId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        scale: 0.95,
                        height: 0,
                        marginBottom: 0,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <CartItemRow
                        item={item}
                        themeCardBg={visualTheme.cardBg || "#FAF7FF"}
                        themeColor={visualTheme.avatarFallbackBg}
                        visualTheme={visualTheme}
                        availableModifierGroups={
                          item.availableModifierGroups ||
                          itemModifiersCache[item.menuItem.id] ||
                          []
                        }
                        isLoadingGroups={
                          !item.availableModifierGroups &&
                          !itemModifiersCache[item.menuItem.id] &&
                          Boolean(loadingGroupsMap[item.menuItem.id])
                        }
                        onOpenItemDetail={handleOpenItemDetail}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemoveItem={handleRemoveItem}
                        onUpdateCustomization={handleUpdateCustomization}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* 3. Kitchen Note */}
            <div className="pt-2 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#1C1D1A] font-semibold">
                  <IconToolsKitchen2
                    className="w-4 h-4 shrink-0"
                    style={{ color: visualTheme.avatarFallbackBg }}
                  />
                  <span>Cooking Instructions (Optional)</span>
                </span>
                {(kitchenBadges.length > 0 || paragraphNotes.length > 0) && (
                  <span className="text-[10px] text-[#8C8A84] font-medium">
                    {kitchenBadges.length + paragraphNotes.length} added
                  </span>
                )}
              </div>

              {/* Kitchen Input Field with Add Button */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="e.g. Make it spicy, make it fast, less ice..."
                  value={kitchenInput}
                  onChange={(e) => handleKitchenInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddKitchenNote(kitchenInput);
                    }
                  }}
                  className="w-full pl-3.5 pr-14 py-2 text-xs rounded-xl bg-stone-100/80 border border-stone-200/50 text-[#1C1D1A] placeholder:text-[#999] focus:outline-none focus:ring-1 focus:ring-[var(--cafe-primary,#30AFFF)] focus:bg-white transition-all"
                />
                {kitchenInput.trim() && (
                  <button
                    type="button"
                    onClick={() => handleAddKitchenNote(kitchenInput)}
                    className="absolute right-1.5 px-2.5 py-1 rounded-lg text-white text-[10.5px] font-bold shadow-2xs transition-all active:scale-95 cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: visualTheme.avatarFallbackBg }}
                  >
                    Add
                  </button>
                )}
              </div>

              {/* Compact Badges Display */}
              {kitchenBadges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {kitchenBadges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border shadow-2xs animate-in fade-in zoom-in-95 duration-150"
                      style={{
                        backgroundColor: visualTheme.badgeBg,
                        color: visualTheme.badgeText,
                        borderColor: visualTheme.badgeBorder,
                      }}
                    >
                      <span>{badge}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setKitchenBadges((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="w-3.5 h-3.5 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors cursor-pointer"
                        style={{ color: visualTheme.badgeText }}
                        aria-label={`Remove note ${badge}`}
                      >
                        <IconX className="w-2.5 h-2.5 stroke-[3]" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Paragraph Notes Display */}
              {paragraphNotes.length > 0 && (
                <div className="space-y-1.5 pt-0.5">
                  {paragraphNotes.map((para, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/70 text-[11.5px] text-[#1C1D1A] flex items-start justify-between gap-2 shadow-2xs leading-relaxed"
                    >
                      <p className="flex-1 whitespace-pre-wrap">{para}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setParagraphNotes((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="text-stone-400 hover:text-rose-600 p-0.5 transition-colors cursor-pointer shrink-0"
                        aria-label="Remove note"
                      >
                        <IconX className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Coupons & Offers */}
            <div className="pt-2 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1C1D1A] flex items-center gap-1.5">
                  <IconTag
                    className="w-4 h-4"
                    style={{ color: visualTheme.avatarFallbackBg }}
                  />
                  <span>Coupons & Offers</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsOffersModalOpen(true)}
                  className="text-[11px] font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
                  style={{ color: visualTheme.avatarFallbackBg }}
                >
                  <span>View all offers</span>
                  <IconChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>

              {/* Applied Promo Ticket: Theme color lighter shade with dashed border, NO ( ) */}
              {appliedPromo ? (
                <>
                  <div
                    className="p-2.5 rounded-xl border-2 border-dashed flex items-center justify-between text-xs"
                  style={{
                    backgroundColor:
                      visualTheme.badgeBg || "rgba(155, 109, 255, 0.10)",
                    borderColor:
                      visualTheme.badgeBorder || "rgba(155, 109, 255, 0.35)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: visualTheme.avatarFallbackBg }}
                    >
                      <IconCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-[#1C1D1A] uppercase tracking-wide">
                        {appliedPromo.code}
                      </span>
                      <span className="text-[#73716B] text-[11px]">
                        applied
                      </span>
                      <span
                        className="font-bold text-[11px]"
                        style={{
                          color:
                            appliedPromo.discountType === "FREE_ITEM"
                              ? "#059669"
                              : visualTheme.avatarFallbackBg,
                        }}
                      >
                        {appliedPromo.discountType === "FREE_ITEM"
                          ? `• Free ${appliedPromo.rewardItemName || "Treat"} Unlocked 🎁`
                          : `• Save ₹${discountAmount}`}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer px-2 py-0.5"
                  >
                    Remove
                  </button>
                </div>

                {/* Free Item Claim Call-to-Action Banner */}
                {appliedPromo?.discountType === "FREE_ITEM" &&
                  appliedPromo.rewardItemId &&
                  !cart.some(
                    (it) =>
                      it.menuItem.id === appliedPromo.rewardItemId &&
                      it.unitPrice === 0,
                  ) && (
                    <div className="mt-2 p-2.5 rounded-xl border border-dashed border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">🎁</span>
                        <div className="truncate">
                          <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-200 truncate">
                            Claim Free {appliedPromo.rewardItemName}
                          </h5>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            Complimentary treat unlocked with your order!
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleClaimFreeItem(
                            appliedPromo.rewardItemId!,
                            appliedPromo.rewardItemName || "Free Item",
                          )
                        }
                        className="px-2.5 py-1 text-[10.5px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg shrink-0 transition-all shadow-xs cursor-pointer"
                      >
                        Add to Cart (₹0)
                      </button>
                    </div>
                  )}
              </>
              ) : (
                <div className="space-y-2">
                  {/* Qualifying Vouchers with theme dashed border */}
                  {qualifyingOffers.length > 0 && (
                    <div className="space-y-2">
                      {qualifyingOffers.map((offer) => (
                        <div
                          key={offer.code}
                          className="flex items-center justify-between p-2.5 rounded-xl border-2 border-dashed transition-all"
                          style={{
                            backgroundColor:
                              visualTheme.badgeBg ||
                              "rgba(155, 109, 255, 0.06)",
                            borderColor:
                              visualTheme.badgeBorder ||
                              "rgba(155, 109, 255, 0.25)",
                          }}
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <IconDiscount2
                              className="w-4 h-4 shrink-0 mt-0.5"
                              style={{ color: visualTheme.avatarFallbackBg }}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className="font-mono font-bold text-xs uppercase tracking-wide"
                                  style={{ color: visualTheme.badgeText }}
                                >
                                  {offer.code}
                                </span>
                                {offer.badgeText && (
                                  <span
                                    className="text-[9.5px] px-1.5 py-0.2 rounded font-semibold border"
                                    style={{
                                      backgroundColor: visualTheme.badgeBg,
                                      color: visualTheme.badgeText,
                                      borderColor: visualTheme.badgeBorder,
                                    }}
                                  >
                                    {offer.badgeText}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#73716B] leading-tight truncate mt-0.5">
                                {offer.description}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleApplyPromo(offer.code)}
                            className="px-3 py-1 rounded-full text-xs font-bold text-white active:scale-95 transition-all shrink-0 ml-2 shadow-2xs cursor-pointer hover:opacity-90"
                            style={{
                              backgroundColor: visualTheme.avatarFallbackBg,
                            }}
                          >
                            Apply
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Swiggy/Zomato style Unlock Banner with Quick Add Items */}
                  {nearestLockedOffer && (
                    <div
                      style={{
                        boxShadow:
                          "inset 0 1.5px 4px rgba(0, 0, 0, 0.03), inset 0 0 14px rgba(255, 255, 255, 0.9), 0 2px 6px rgba(0, 0, 0, 0.02)",
                      }}
                      className="p-2.5 rounded-xl border border-dotted border-stone-300 bg-stone-50/90 text-left transition-all"
                    >
                      <div
                        onClick={() => setIsOffersModalOpen(true)}
                        className="flex items-center justify-between gap-2 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-2xs text-white"
                            style={{
                              backgroundColor: visualTheme.avatarFallbackBg,
                            }}
                          >
                            <IconPercentage className="w-3.5 h-3.5 stroke-[2.4]" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[11.5px] font-bold text-[#1C1D1A] truncate group-hover:text-black">
                              {nearestLockedOffer.isClaimedByCustomer ? "Claimed: " : ""}Unlock {nearestLockedOffer.discountDesc}
                            </h4>
                            <p
                              className="text-[10px] font-medium truncate mt-0.2"
                              style={{ color: visualTheme.avatarFallbackBg }}
                            >
                              Add items worth{" "}
                              <span className="font-bold font-mono">
                                ₹{nearestLockedOffer.diff}
                              </span>{" "}
                              or more to unlock
                            </p>
                          </div>
                        </div>
                        <span
                          className="text-[10px] font-bold shrink-0 px-2 py-0.5 rounded text-white shadow-2xs transition-all active:scale-95"
                          style={{
                            backgroundColor: visualTheme.avatarFallbackBg,
                          }}
                        >
                          View
                        </span>
                      </div>

                      {/* Items to Add Carousel (Sized to show 3 items on screen with smooth horizontal scroll/drag) */}
                      {quickAddItems && quickAddItems.length > 0 && (
                        <div className="mt-2 pt-1.5 border-t border-dashed border-stone-200/70">
                          <div className="flex items-stretch gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pb-0.5 select-none touch-pan-x cursor-grab active:cursor-grabbing">
                            {quickAddItems.map((item) => (
                              <div
                                key={item.id}
                                onClick={() =>
                                  transitionNavigate(router,
                                    `/menu/${cafe.slug}/${item.slug}${tableQuery}`,
                                  )
                                }
                                style={{
                                  boxShadow:
                                    "inset 0 1px 2px rgba(0, 0, 0, 0.02), inset 0 0 6px rgba(255, 255, 255, 0.9), 0 1px 3px rgba(0,0,0,0.03)",
                                }}
                                className="w-[calc((100%-12px)/3.25)] min-w-[80px] max-w-[94px] shrink-0 rounded-xl bg-neutral-200/60 border border-stone-200 p-1 flex flex-col justify-between shadow-2xs hover:border-stone-300 transition-all select-none cursor-pointer group active:scale-[0.98]"
                              >
                                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-stone-200 mb-1">
                                  <img
                                    src={getMenuItemImageUrl(
                                      item.imageKey,
                                      item.slug,
                                      item.name,
                                    )}
                                    alt={item.name}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickAddMenuItem(item);
                                    }}
                                    className="absolute bottom-1 right-1 w-4.5 h-4.5 rounded-md bg-stone-100 hover:bg-black text-white flex items-center justify-center shadow-xs cursor-pointer active:scale-90 transition-all pointer-events-auto z-10"
                                    title={`Add ${item.name}`}
                                  >
                                    <IconPlus className="w-2.5 h-2.5 stroke-3 text-black" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-1 min-w-0">
                                  {item.foodType === "VEGAN" ? (
                                    <span
                                      title="Vegan"
                                      className="inline-flex items-center justify-center w-3 h-3 rounded-[2.5px] border border-emerald-600/80 p-0.5 bg-white shrink-0 shadow-2xs"
                                    >
                                      <IconLeaf className="w-2 h-2 text-emerald-600 stroke-[2.5]" />
                                    </span>
                                  ) : item.foodType === "VEG" ||
                                    item.isVegetarian ? (
                                    <span
                                      title="Vegetarian"
                                      className="inline-flex items-center justify-center w-3 h-3 rounded-[2.5px] border border-emerald-600/80 p-0.5 bg-white shrink-0 shadow-2xs"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 block" />
                                    </span>
                                  ) : item.foodType === "EGG" ? (
                                    <span
                                      title="Contains Egg"
                                      className="inline-flex items-center justify-center w-3 h-3 rounded-[2.5px] border border-amber-600/80 p-0.5 bg-white shrink-0 shadow-2xs"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 block" />
                                    </span>
                                  ) : (
                                    <span
                                      title="Non-Vegetarian"
                                      className="inline-flex items-center justify-center w-3 h-3 rounded-[2.5px] border border-rose-600/80 p-0.5 bg-white shrink-0 shadow-2xs"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 block" />
                                    </span>
                                  )}

                                  <span className="text-[9.5px] font-medium text-[#1C1D1A] truncate leading-tight group-hover:text-black">
                                    {item.name}
                                  </span>
                                </div>
                                <span className="font-mono font-bold text-[9.5px] text-[#1C1D1A] mt-0.5">
                                  ₹{item.price}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Custom Code Entry: compact height & disabled if empty */}
                  <div className="flex gap-2 pt-0.5">
                    <input
                      type="text"
                      placeholder="Have another promo code?"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value);
                        setPromoError(null);
                      }}
                      className="flex-1 h-9 px-3 py-1 text-xs rounded-md bg-stone-100/80 border border-stone-200/60 uppercase font-mono font-medium focus:outline-none focus:ring-1 focus:ring-[var(--cafe-primary,#30AFFF)] placeholder:normal-case placeholder:font-sans placeholder:text-[#999]"
                    />
                    <button
                      type="button"
                      disabled={!promoInput.trim()}
                      onClick={() => handleApplyPromo(promoInput)}
                      className="h-9 px-4 rounded-md text-xs font-bold text-white shadow-2xs cursor-pointer active:scale-95 transition-all flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                      style={{ backgroundColor: visualTheme.avatarFallbackBg }}
                    >
                      Apply
                    </button>
                  </div>

                  {promoError && (
                    <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                      <IconAlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{promoError}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 5. Bill Summary: Clean & Compact, NO ( ) */}
            <div className="pt-2 space-y-1.5 text-xs text-[#73716B]">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-mono text-[#1C1D1A]">
                  ₹{baseItemsSubtotal.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Extra Items Breakdown: shows each individual extra item price so user knows how total is calculated */}
              {allExtrasList.length > 0 && (
                <div className="space-y-1 pl-2.5 py-0.5 border-l-2 border-stone-200/80 my-1">
                  {allExtrasList.map((extra) => (
                    <div
                      key={extra.id}
                      className="flex justify-between items-center text-[11px] text-[#73716B]"
                    >
                      <span className="truncate pr-2">
                        + {extra.label} {extra.quantity > 1 ? `× ${extra.quantity}` : ""}
                      </span>
                      <span className="font-mono text-[#1C1D1A] shrink-0 font-medium">
                        +₹{extra.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Promo Discount</span>
                  <span className="font-mono font-semibold">
                    -₹{discountAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Taxes & GST (5%)</span>
                <span className="font-mono text-[#1C1D1A]">
                  ₹{tax.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="pt-2 flex justify-between items-baseline font-bold text-sm text-[#1C1D1A]">
                <span>Total</span>
                <span className="font-mono text-base tracking-tight">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clean Neutral Fade from Bottom (identical to Item Detailed Page) */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white/95 via-white/70 to-transparent pointer-events-none z-30 max-w-md mx-auto" />
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          6. FLOATING CAPSULE (Payment Preference + Place Order)
          Identical floating dock positioning to Item Detailed Page
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {cart.length > 0 && (
        <div className="fixed bottom-5 inset-x-0 z-40 max-w-md mx-auto pointer-events-auto px-4 flex justify-center">
          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-white/95 backdrop-blur-2xl border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.14)]">
            {/* Integrated Mini Payment Toggle */}
            <div className="flex items-center bg-black/[0.05] p-0.5 rounded-full text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setPaymentPreference("COUNTER")}
                className={`relative px-2.5 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                  paymentPreference === "COUNTER"
                    ? "text-[#1C1D1A]"
                    : "text-[#73716B] hover:text-[#1C1D1A]"
                }`}
              >
                {paymentPreference === "COUNTER" && (
                  <motion.div
                    layoutId="miniPayPill"
                    className="absolute inset-0 rounded-full bg-white shadow-xs z-0"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  <IconCash
                    className="w-3.5 h-3.5"
                    style={{ color: visualTheme.avatarFallbackBg }}
                  />
                  <span>Cash</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentPreference("UPI_NOW")}
                className={`relative px-2.5 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                  paymentPreference === "UPI_NOW"
                    ? "text-[#1C1D1A]"
                    : "text-[#73716B] hover:text-[#1C1D1A]"
                }`}
              >
                {paymentPreference === "UPI_NOW" && (
                  <motion.div
                    layoutId="miniPayPill"
                    className="absolute inset-0 rounded-full bg-white shadow-xs z-0"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  <IconQrcode
                    className="w-3.5 h-3.5"
                    style={{ color: visualTheme.avatarFallbackBg }}
                  />
                  <span>UPI</span>
                </span>
              </button>
            </div>

            {/* Compact Place Order Pill Action Button */}
            <button
              type="button"
              disabled={
                isPlacingOrder ||
                cart.length === 0 ||
                (orderType === "DINE_IN" && hasNoTablesForGuest)
              }
              onClick={() => {
                if (orderType === "DINE_IN" && hasNoTablesForGuest) {
                  setOrderType("TAKEAWAY");
                  return;
                }
                if (
                  orderType === "DINE_IN" &&
                  (!selectedTableNumber.trim() || !isCurrentlySeatedGuest)
                ) {
                  setIsQrScannerOpen(true);
                  toast({
                    title: "Scan Table QR",
                    description:
                      "Please scan your tabletop QR stand to place your Dine-In order.",
                    variant: "info",
                  });
                  return;
                }
                if (
                  orderType === "DINE_IN" &&
                  readyTableData &&
                  !claimedTable
                ) {
                  setIsQrScannerOpen(true);
                  toast({
                    title: "Scan Table QR to Confirm",
                    description: `Please scan the QR code on ${readyTableData.number} to confirm your seat before placing your order.`,
                    variant: "warning",
                  });
                  return;
                }

                // Takeaway: require guest name if not logged in
                if (
                  orderType === "TAKEAWAY" &&
                  !customerProfile?.name &&
                  !guestName.trim() &&
                  !takeawayGuestName.trim()
                ) {
                  setShowTakeawayNameError(true);
                  toast({
                    title: "Name Required",
                    description: "Please enter your name for the takeaway order.",
                    variant: "warning",
                  });
                  return;
                }

                if (paymentPreference === "UPI_NOW") {
                  // Open UPI modal FIRST to pay before placing order
                  setUpiOrderData({
                    amount: total,
                    orderNumber: "",
                    initialMode: "UPI",
                  });
                  setIsUpiModalOpen(true);
                } else {
                  // Cash selected: directly place order, no UPI modal
                  handlePlaceOrderSubmit("CASH", "UNPAID");
                }
              }}
              className={`px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm text-white cursor-pointer active:scale-95 transition-all flex items-center gap-2 bg-gradient-to-r ${visualTheme.buttonGradient} shadow-md disabled:opacity-60 disabled:pointer-events-none`}
            >
              {isPlacingOrder ? (
                <>
                  <IconLoader2 className="w-4 h-4 animate-spin" />
                  <span className="tracking-tight whitespace-nowrap">
                    Placing Order...
                  </span>
                </>
              ) : orderType === "DINE_IN" && hasNoTablesForGuest ? (
                <>
                  <IconShoppingBag className="w-4 h-4 stroke-[2]" />
                  <span className="tracking-tight whitespace-nowrap">
                    No Tables • Switch to Takeaway
                  </span>
                </>
              ) : orderType === "DINE_IN" &&
                (!selectedTableNumber.trim() || !isCurrentlySeatedGuest) ? (
                <>
                  <IconQrcode className="w-4 h-4 stroke-[2.2]" />
                  <span className="tracking-tight whitespace-nowrap">
                    Scan Table QR to Order
                  </span>
                  <span className="font-mono font-bold pl-1.5 border-l border-white/30 whitespace-nowrap">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </>
              ) : orderType === "DINE_IN" && readyTableData && !claimedTable ? (
                <>
                  <IconQrcode className="w-4 h-4 stroke-[2.2]" />
                  <span className="tracking-tight whitespace-nowrap">
                    Scan {readyTableData.number} QR to Order
                  </span>
                  <span className="font-mono font-bold pl-1.5 border-l border-white/30 whitespace-nowrap">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </>
              ) : (
                <>
                  {paymentPreference === "UPI_NOW" ? (
                    <IconQrcode className="w-4 h-4 stroke-[2.2]" />
                  ) : (
                    <IconCheck className="w-4 h-4 stroke-[2.5]" />
                  )}
                  <span className="tracking-tight whitespace-nowrap">
                    {paymentPreference === "UPI_NOW"
                      ? "Pay UPI"
                      : "Place Order"}
                  </span>
                  <span className="font-mono font-bold pl-1.5 border-l border-white/30 whitespace-nowrap">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. BOTTOM-DOCKED ORDER PLACED CELEBRATION CARD
          Snappy bottom spring entrance, center bend top curve, rounded bottom,
          half-screen mobile height, visible soft theme primary gradient,
          same-color inner shadow, ring-1 ring-black/10 shadow-md shadow-black/10
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <AnimatePresence>
        {isOrderPlacedSuccess && placedOrderInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target !== e.currentTarget) return;
              if (!canDismissModal) return;
              handleCloseCelebrationAndGoHome();
            }}
            className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:pb-5 bg-black/40 backdrop-blur-xs pointer-events-auto"
          >
            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 450, damping: 28 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.75 }}
              onDragEnd={(_e, info) => {
                if (info.offset.y > 80 || info.velocity.y > 400) {
                  if (!canDismissModal) return;
                  handleCloseCelebrationAndGoHome();
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm sm:max-w-md relative flex flex-col pointer-events-auto max-h-[58vh] sm:max-h-[64vh] drop-shadow-[0_12px_28px_rgba(0,0,0,0.18)] touch-pan-y"
            >
              {/* SINGLE UNIFIED CONTINUOUS SURFACE (Zero separation, 100% Opaque, Signature Center Bend) */}
              <svg
                viewBox="0 0 400 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="orderModalSingleSurfaceGrad"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={themeOpaqueColors.topTint} />
                    <stop offset="28%" stopColor={themeOpaqueColors.midTint} />
                    <stop offset="70%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#FFFFFF" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0,22 C 0,10 18,0 48,0 C 90,0 120,14 200,14 C 280,14 310,0 352,0 C 382,0 400,10 400,22 L 400,372 C 400,388 388,400 372,400 L 28,400 C 12,400 0,388 0,372 Z"
                  fill="url(#orderModalSingleSurfaceGrad)"
                  stroke="rgba(0, 0, 0, 0.10)"
                  strokeWidth="1.2"
                />
              </svg>

              {/* Confetti Explosion Canvas */}
              <ConfettiBurst themeColor={visualTheme.avatarFallbackBg} />

              {/* Content Body (Cleanly Spaced Inside Center Bend Surface) */}
              <div className="px-5 pt-3 pb-4 sm:pb-5 text-center space-y-2 relative z-20 flex-1 overflow-y-auto no-scrollbar">
                {/* Thin Grab Pill Nestled Right INSIDE Center Bend Dip with Drag Indicator */}
                <div
                  className="w-10 h-1 mx-auto rounded-full shadow-2xs cursor-grab active:cursor-grabbing select-none  mt-2"
                  style={{
                    backgroundColor: `rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.55)`,
                  }}
                  title="Drag down to close"
                />

                {/* Simple Check SVG Animation */}
                <div className="relative w-11 h-11 mx-auto flex items-center justify-center select-none pt-0.5">
                  <motion.div
                    initial={{ scale: 0.75, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 22 }}
                    className="w-11 h-11 rounded-full flex items-center justify-center shadow-xs"
                    style={{
                      backgroundColor: visualTheme.avatarFallbackBg,
                      boxShadow: `0 3px 10px ${visualTheme.buttonShadow || "rgba(0,0,0,0.15)"}`,
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="w-5 h-5 text-white"
                    >
                      <motion.path
                        d="M 5 12.5 L 9.5 17 L 19 7.5"
                        stroke="#FFFFFF"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{
                          duration: 0.35,
                          ease: "easeOut",
                          delay: 0.1,
                        }}
                      />
                    </svg>
                  </motion.div>
                </div>

                {/* Celebration Title & Order Info */}
                <div className="space-y-0.5">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-dashed inline-block"
                    style={{
                      backgroundColor: visualTheme.badgeBg,
                      color: visualTheme.badgeText,
                      borderColor: visualTheme.badgeBorder,
                    }}
                  >
                    Order Confirmed
                  </span>
                  <h2 className="text-lg font-extrabold text-[#1C1D1A] tracking-tight">
                    Woohoo! Order Placed!
                  </h2>
                  <p className="text-[11.5px] text-[#73716B] leading-tight max-w-xs mx-auto">
                    Your order{" "}
                    <span className="font-mono font-bold text-[#1C1D1A]">
                      #{placedOrderInfo.orderNumber.replace(/^#+/, "")}
                    </span>{" "}
                    is on its way to the kitchen!
                  </p>
                </div>

                {/* Estimated Wait Time: Only show when owner configured prep time on item(s) */}
                {placedOrderInfo.estimatedWaitText && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-[#73716B] py-0.5">
                    <IconClock className="w-3.5 h-3.5 text-[#8C8A84]" />
                    <span>Estimated wait time:</span>
                    <span className="font-bold text-[#1C1D1A]">
                      {placedOrderInfo.estimatedWaitText}
                    </span>
                  </div>
                )}

                {/* Compact Order Details Box without word 'mode' */}
                <div className="px-3.5 py-2 rounded-2xl bg-white/85 border border-stone-200/60 text-xs space-y-1.5 text-left shadow-2xs backdrop-blur-xs">
                  <div className="flex justify-between items-center text-[11.5px]">
                    <span className="text-[#73716B] font-medium flex items-center gap-1.5">
                      {placedOrderInfo.orderType === "DINE_IN" ? (
                        <IconArmchair className="w-3.5 h-3.5 text-[#8C8A84]" />
                      ) : (
                        <IconShoppingBag className="w-3.5 h-3.5 text-[#8C8A84]" />
                      )}
                      <span>Order Type</span>
                    </span>
                    <span className="font-semibold text-[#1C1D1A]">
                      {placedOrderInfo.orderType === "DINE_IN"
                        ? "Dine-In"
                        : "Takeaway"}
                    </span>
                  </div>

                  {placedOrderInfo.orderType === "DINE_IN" && (
                    <div className="flex justify-between items-center text-[11.5px]">
                      <span className="text-[#73716B] font-medium">
                        Table No.
                      </span>
                      <span className="font-bold text-[#1C1D1A] font-mono px-2 py-0.2 rounded-md bg-stone-100/90 border border-stone-200/60">
                        {placedOrderInfo.tableName}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[11.5px]">
                    <span className="text-[#73716B] font-medium flex items-center gap-1.5">
                      {placedOrderInfo.paymentMethod === "CASH" ? (
                        <IconCash className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <IconQrcode className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>Payment</span>
                    </span>
                    <span className="font-semibold text-[#1C1D1A]">
                      {placedOrderInfo.paymentMethod === "CASH"
                        ? "Cash at Counter"
                        : "UPI Paid (Pending Verification)"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-stone-100">
                    <span className="text-[#73716B] font-medium text-[11.5px]">
                      Total Amount
                    </span>
                    <span className="font-mono font-bold text-xs sm:text-sm text-[#1C1D1A]">
                      ₹{placedOrderInfo.total.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Action Buttons: Clean, Theme Adaptable & Inset Effect */}
                <div className="space-y-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOrderPlacedSuccess(false);
                      setIsLiveTrackerOpen(true);
                    }}
                    style={{
                      boxShadow: `inset 0 1.5px 2.5px rgba(255, 255, 255, 0.45), inset 0 -2.5px 5px rgba(0, 0, 0, 0.22), 0 4px 14px ${visualTheme.buttonShadow || "rgba(0, 0, 0, 0.15)"}`,
                    }}
                    className={`w-full py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm text-white ring-1 ring-white/25 active:scale-[0.98] active:translate-y-0.5 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all cursor-pointer bg-gradient-to-r ${visualTheme.buttonGradient} flex items-center justify-center gap-2`}
                  >
                    <IconToolsKitchen2 className="w-4 h-4 stroke-[2.2]" />
                    <span>Track Live Order</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!canDismissModal) return;
                      handleCloseCelebrationAndGoHome();
                    }}
                    className={`w-full py-1.5 rounded-full font-semibold text-xs text-[#73716B] hover:text-[#1C1D1A] hover:bg-black/5 active:scale-98 transition-all cursor-pointer ${
                      !canDismissModal ? "opacity-60 cursor-default" : ""
                    }`}
                  >
                    Back to Menu
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5. MODALS (UPI & LIVE TRACKER)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {upiOrderData && (
        <CustomerUpiModal
          isOpen={isUpiModalOpen}
          amount={upiOrderData.amount}
          orderNumber={upiOrderData.orderNumber}
          orderId={upiOrderData.orderId}
          cafeSlug={cafe.slug}
          cafeName={cafe.name}
          cafeLogoUrl={cafe.logoKey}
          upiId={settings?.upiId}
          merchantName={settings?.upiMerchantName}
          upiQrUrl={settings?.upiQrUrl}
          initialMode={upiOrderData.initialMode || (paymentPreference === "COUNTER" ? "CASH" : "UPI")}
          digitalMenuTheme={themeId}
          orderType={orderType}
          tableName={placedOrderInfo?.tableName || (orderType === "DINE_IN" ? selectedTableNumber : undefined)}
          onClose={() => {
            setIsUpiModalOpen(false);
            setUpiOrderData(null);
            if (upiOrderData.orderId) {
              setIsLiveTrackerOpen(true);
            }
          }}
          onConfirmPaid={async (method) => {
            if (upiOrderData.orderId) {
              setIsUpiModalOpen(false);
              setUpiOrderData(null);
              setIsLiveTrackerOpen(true);
              if (method === "CASH") {
                toast({
                  title: "Cash at Counter Selected",
                  description: `Please pay ₹${upiOrderData.amount.toLocaleString("en-IN")} at the counter or to your server.`,
                  variant: "info",
                });
              } else {
                toast({
                  title: "Payment Reported",
                  description: "Staff will verify your UPI receipt and confirm.",
                  variant: "success",
                });
              }
            } else {
              // Pre-order payment flow: user confirmed payment in modal, now place the order!
              await handlePlaceOrderSubmit(
                method === "CASH" ? "CASH" : "UPI",
                method === "CASH" ? "UNPAID" : "PENDING_VERIFICATION"
              );
            }
          }}
        />
      )}

      {(activeOrderId || activeOrders.length > 0) && (
        <LiveOrderTrackerModal
          orderId={activeOrderId}
          activeOrders={activeOrders}
          customerId={
            customerProfile && !customerProfile.isGuest
              ? customerProfile.id
              : null
          }
          cafeSlug={cafe.slug}
          digitalMenuTheme={digitalMenuTheme}
          isOpen={isLiveTrackerOpen}
          onClose={() => {
            setIsLiveTrackerOpen(false);
            transitionNavigate(router, `/menu/${cafe.slug}${tableQuery}`);
          }}
          onRefreshActiveOrders={setActiveOrders}
          onCallStaff={() => {}}
          onOpenUpiPay={(ord) => {
            setUpiOrderData({
              amount: ord.total,
              orderNumber: ord.orderNumber,
            });
            setIsUpiModalOpen(true);
          }}
          onOrderMore={() => {
            setIsLiveTrackerOpen(false);
            transitionNavigate(router, `/menu/${cafe.slug}${tableQuery}`);
          }}
        />
      )}

      {/* Dedicated Customer Waiting List Modal */}
      <CustomerWaitlistModal
        isOpen={isWaitingListOpen}
        cafeName={cafe.name}
        cafeSlug={cafe.slug}
        tablesList={localTablesList}
        defaultName={customerProfile?.name || guestName}
        defaultPhone={customerProfile?.phone || guestPhone}
        digitalMenuTheme={digitalMenuTheme}
        onClose={() => setIsWaitingListOpen(false)}
        onJoinedWaitlist={handleJoinedWaitlist}
      />

      {/* Centered Minimalist Waiting Pass Ticket Modal */}
      <WaitingPassTicketModal
        isOpen={isTicketPassOpen}
        onClose={() => setIsTicketPassOpen(false)}
        waitlistData={waitlistEntry}
        queueNumber={waitlistQueueNum}
        onLeaveWaitlist={handleCancelWaitlistHold}
        isTableReady={Boolean(readyTableData && tableHoldSeconds !== null)}
        holdSecondsRemaining={tableHoldSeconds}
        onOpenTableReady={() => {
          setIsTicketPassOpen(false);
          setIsTableReadyOpen(true);
        }}
        digitalMenuTheme={digitalMenuTheme}
      />

      {/* Persistent Floating Waiting List Indicator */}
      <WaitlistFloatingIndicator
        waitlistData={waitlistEntry}
        queueNumber={waitlistQueueNum}
        digitalMenuTheme={digitalMenuTheme}
        isTableReady={Boolean(readyTableData && tableHoldSeconds !== null)}
        holdSecondsRemaining={tableHoldSeconds}
        onOpenTableReady={() => setIsTableReadyOpen(true)}
        onOpenTicket={() => setIsTicketPassOpen(true)}
        onLeaveWaitlist={handleCancelWaitlistHold}
      />

      {/* Table Ready Full-Width Bottom Sheet Alert */}
      {readyTableData && (
        <TableReadyAlertSheet
          isOpen={isTableReadyOpen}
          tableNumber={readyTableData.number}
          tableId={readyTableData.id}
          guests={readyTableData.guests}
          currentHoldSeconds={
            tableHoldSeconds !== null ? tableHoldSeconds : undefined
          }
          digitalMenuTheme={digitalMenuTheme}
          onOpenScanner={() => {
            setIsTableReadyOpen(false);
            setIsQrScannerOpen(true);
          }}
          onConfirmReady={handleTableClaimedFromQr}
          onCancelWaitlist={handleCancelWaitlistHold}
          onDismiss={() => setIsTableReadyOpen(false)}
        />
      )}

      {/* Table Claim QR Scanner Modal */}
      <TableQrScannerModal
        isOpen={isQrScannerOpen}
        expectedTableNumber={readyTableData?.number}
        expectedTableId={readyTableData?.id}
        expectedTableQrIdentifier={readyTableData?.qrIdentifier}
        tablesList={localTablesList}
        cafeSlug={cafe.slug}
        cafeName={cafe.name}
        digitalMenuTheme={digitalMenuTheme}
        onTableClaimed={handleTableClaimedFromQr}
        onClose={() => setIsQrScannerOpen(false)}
      />

      {/* Cart-Aware Customer Offers & Perks Modal */}
      <CustomerOffersModal
        isOpen={isOffersModalOpen}
        cafeName={cafe.name}
        cafeSlug={cafe.slug}
        offers={initialOffers}
        cart={cart}
        customerProfile={customerProfile}
        hasPastOrders={hasPastOrders}
        menuItemNamesById={menuItemNamesById}
        categoryNamesById={categoryNamesById}
        orderType={orderType}
        onClose={() => setIsOffersModalOpen(false)}
        onApplyCode={(code) => {
          handleApplyPromo(code);
        }}
        cartSubtotal={subtotal}
        appliedCode={appliedPromo?.code || null}
        digitalMenuTheme={digitalMenuTheme}
      />
    </div>
  );
};
