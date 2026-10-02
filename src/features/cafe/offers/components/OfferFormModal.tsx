"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Offer,
  DiscountType,
  OfferApplicationMethod,
  OfferAppliesTo,
  CustomerEligibility,
  FreeItemUnlockType,
  OfferOrderType,
} from "@/lib/db/schema/offers";
import {
  IconTag,
  IconPercentage,
  IconCurrencyRupee,
  IconGift,
  IconSparkles,
  IconInfoCircle,
  IconDice,
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconCalendar,
  IconUsers,
  IconShieldLock,
  IconCheck,
  IconArmchair,
  IconShoppingBag,
} from "@tabler/icons-react";

export interface MenuItemSummary {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
}

export interface CategorySummary {
  id: string;
  name: string;
}

interface OfferFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    code: string;
    title: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
    maxDiscountAmount?: number | null;
    minOrderAmount: number;
    rewardItemId?: string | null;
    rewardItemName?: string | null;
    applicationMethod: OfferApplicationMethod;
    appliesTo: OfferAppliesTo;
    targetCategoryIds?: string | null;
    targetItemIds?: string | null;
    customerEligibility: CustomerEligibility;
    usageLimitTotal?: number | null;
    usageLimitPerCustomer?: number | null;
    timeStart?: string | null;
    timeEnd?: string | null;
    daysOfWeek?: string | null;
    availableChannels?: string;
    applicableOrderType: OfferOrderType;
    cannotCombine?: boolean;
    freeItemUnlockType?: FreeItemUnlockType;
    freeItemQualifyingCategoryId?: string | null;
    freeItemQualifyingItemId?: string | null;
    badgeText?: string;
    isActive: boolean;
    showOnHome?: boolean;
  }) => Promise<void>;
  initialData?: Offer | null;
  isFeaturedOnHome?: boolean;
  menuItems?: MenuItemSummary[];
  categories?: CategorySummary[];
  isLoading?: boolean;
}

const ALL_DAYS = [
  { label: "M", value: "1", name: "Mon" },
  { label: "T", value: "2", name: "Tue" },
  { label: "W", value: "3", name: "Wed" },
  { label: "T", value: "4", name: "Thu" },
  { label: "F", value: "5", name: "Fri" },
  { label: "S", value: "6", name: "Sat" },
  { label: "S", value: "0", name: "Sun" },
];

export const OfferFormModal: React.FC<OfferFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isFeaturedOnHome,
  menuItems = [],
  categories = [],
  isLoading = false,
}) => {
  const isEditing = Boolean(initialData);

  // Core Basics
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<string>("10");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>("");
  const [rewardItemId, setRewardItemId] = useState<string>("");
  const [applicationMethod, setApplicationMethod] = useState<OfferApplicationMethod>("COUPON_CODE");
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [badgeText, setBadgeText] = useState("Special Offer");
  const [isActive, setIsActive] = useState(true);
  const [showOnHome, setShowOnHome] = useState(true);

  // Scope & Applies To
  const [appliesTo, setAppliesTo] = useState<OfferAppliesTo>("ALL");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Free Item Unlock Condition
  const [freeItemUnlockType, setFreeItemUnlockType] = useState<FreeItemUnlockType>("SPEND");
  const [freeItemQualifyingCategoryId, setFreeItemQualifyingCategoryId] = useState<string>("");
  const [freeItemQualifyingItemId, setFreeItemQualifyingItemId] = useState<string>("");
  const [minOrderAmount, setMinOrderAmount] = useState<string>("0");

  // Advanced: Eligibility, Schedule, Limits & Channels
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customerEligibility, setCustomerEligibility] = useState<CustomerEligibility>("ALL");
  const [selectedDays, setSelectedDays] = useState<string[]>(["1", "2", "3", "4", "5", "6", "0"]);
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [usageLimitTotal, setUsageLimitTotal] = useState("");
  const [usageLimitPerCustomer, setUsageLimitPerCustomer] = useState("1");
  const [channelDigital, setChannelDigital] = useState(true);
  const [channelPOS, setChannelPOS] = useState(true);
  const [cannotCombine, setCannotCombine] = useState(true);
  const [applicableOrderType, setApplicableOrderType] = useState<OfferOrderType>("BOTH");

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setDiscountType((initialData.discountType as DiscountType) || "PERCENTAGE");
      setCode(initialData.code);
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setDiscountValue(String(initialData.discountValue || 10));
      setMaxDiscountAmount(initialData.maxDiscountAmount ? String(initialData.maxDiscountAmount) : "");
      setMinOrderAmount(String(initialData.minOrderAmount || 0));
      setRewardItemId(initialData.rewardItemId || "");
      setApplicationMethod((initialData.applicationMethod as OfferApplicationMethod) || "COUPON_CODE");
      setAppliesTo((initialData.appliesTo as OfferAppliesTo) || "ALL");
      setSelectedCategoryIds(
        initialData.targetCategoryIds ? initialData.targetCategoryIds.split(",").filter(Boolean) : []
      );
      setSelectedItemIds(
        initialData.targetItemIds ? initialData.targetItemIds.split(",").filter(Boolean) : []
      );
      setFreeItemUnlockType((initialData.freeItemUnlockType as FreeItemUnlockType) || "SPEND");
      setFreeItemQualifyingCategoryId(initialData.freeItemQualifyingCategoryId || "");
      setFreeItemQualifyingItemId(initialData.freeItemQualifyingItemId || "");
      setCustomerEligibility((initialData.customerEligibility as CustomerEligibility) || "ALL");
      setSelectedDays(
        initialData.daysOfWeek
          ? initialData.daysOfWeek.split(",").filter(Boolean)
          : ["1", "2", "3", "4", "5", "6", "0"]
      );
      setTimeStart(initialData.timeStart || "");
      setTimeEnd(initialData.timeEnd || "");
      setUsageLimitTotal(initialData.usageLimitTotal ? String(initialData.usageLimitTotal) : "");
      setUsageLimitPerCustomer(String(initialData.usageLimitPerCustomer ?? 1));
      const channels = initialData.availableChannels ? initialData.availableChannels.split(",") : ["DIGITAL_MENU", "POS"];
      setChannelDigital(channels.includes("DIGITAL_MENU"));
      setChannelPOS(channels.includes("POS"));
      setCannotCombine(initialData.cannotCombine ?? true);
      setApplicableOrderType((initialData.applicableOrderType as OfferOrderType) || "BOTH");
      setBadgeText(initialData.badgeText || "Special Offer");
      setIsActive(initialData.isActive);
      setShowOnHome(isFeaturedOnHome ?? true);
    } else {
      setDiscountType("PERCENTAGE");
      setCode("");
      setTitle("");
      setDescription("");
      setDiscountValue("10");
      setMaxDiscountAmount("");
      setMinOrderAmount("0");
      setRewardItemId(menuItems[0]?.id || "");
      setApplicationMethod("COUPON_CODE");
      setAppliesTo("ALL");
      setSelectedCategoryIds([]);
      setSelectedItemIds([]);
      setFreeItemUnlockType("SPEND");
      setFreeItemQualifyingCategoryId(categories[0]?.id || "");
      setFreeItemQualifyingItemId(menuItems[0]?.id || "");
      setCustomerEligibility("ALL");
      setSelectedDays(["1", "2", "3", "4", "5", "6", "0"]);
      setTimeStart("");
      setTimeEnd("");
      setUsageLimitTotal("");
      setUsageLimitPerCustomer("1");
      setChannelDigital(true);
      setChannelPOS(true);
      setCannotCombine(true);
      setApplicableOrderType("BOTH");
      setBadgeText("Special Offer");
      setIsActive(true);
      setShowOnHome(true);
    }
    setError(null);
  }, [initialData, isOpen, menuItems, categories, isFeaturedOnHome]);

  // Quick Code Generator Helper
  const handleGenerateCode = () => {
    const prefixes =
      discountType === "FREE_ITEM"
        ? ["FREE", "TREAT", "GIFT"]
        : discountType === "FLAT"
        ? ["FLAT", "SAVE", "DEAL"]
        : ["BREW", "ROAST", "SAVE", "WELCOME"];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    let val = "";
    if (discountType === "PERCENTAGE") {
      val = discountValue ? String(discountValue) : "20";
    } else if (discountType === "FLAT") {
      val = discountValue ? String(discountValue) : "50";
    } else {
      val = Math.floor(10 + Math.random() * 90).toString();
    }
    setCode(`${prefix}${val}`);
  };

  const selectedRewardItem = menuItems.find((it) => it.id === rewardItemId);
  const qualifyingCategory = categories.find((c) => c.id === freeItemQualifyingCategoryId);
  const qualifyingItem = menuItems.find((i) => i.id === freeItemQualifyingItemId);

  // Dynamic Human-readable Offer Summary
  const getOfferSummary = () => {
    let whatText = "";
    if (discountType === "FREE_ITEM") {
      const rewardName = selectedRewardItem?.name || "Free Item";
      whatText = `Claim 1 Free ${rewardName}`;
    } else if (discountType === "FLAT") {
      whatText = `Get Flat ₹${discountValue || 0} OFF`;
    } else {
      const capText = Number(maxDiscountAmount) > 0 ? ` (max ₹${maxDiscountAmount})` : "";
      whatText = `Get ${discountValue || 0}% OFF${capText}`;
    }

    // Scope
    let scopeText = "on entire order";
    if (appliesTo === "CATEGORIES" && selectedCategoryIds.length > 0) {
      const catNames = categories
        .filter((c) => selectedCategoryIds.includes(c.id))
        .map((c) => c.name)
        .slice(0, 2)
        .join(", ");
      scopeText = `on ${catNames || "selected categories"}`;
    } else if (appliesTo === "ITEMS" && selectedItemIds.length > 0) {
      scopeText = "on selected menu items";
    }

    // Condition
    let conditionText = "";
    if (discountType === "FREE_ITEM") {
      if (freeItemUnlockType === "SPEND") {
        const spend = Number(minOrderAmount) || 0;
        conditionText = spend > 0 ? `when spending ₹${spend}+` : "on any order";
      } else if (freeItemUnlockType === "CATEGORY") {
        conditionText = `when buying from ${qualifyingCategory?.name || "category"}`;
      } else if (freeItemUnlockType === "ITEM") {
        conditionText = `when purchasing ${qualifyingItem?.name || "specific item"}`;
      }
    } else {
      const spend = Number(minOrderAmount) || 0;
      conditionText = spend > 0 ? `on ₹${spend}+ orders` : "";
    }

    // Application
    const appText =
      applicationMethod === "AUTOMATIC"
        ? "auto-applied in cart"
        : `with code ${code.trim() || "[CODE]"}`;

    // Timing note
    let timingNote = "";
    if (timeStart && timeEnd) {
      timingNote = ` (${timeStart}-${timeEnd})`;
    }

    // Dining mode note
    let diningNote = "";
    if (applicableOrderType === "DINE_IN") {
      diningNote = " (Dine-in only)";
    } else if (applicableOrderType === "TAKEAWAY") {
      diningNote = " (Takeaway only)";
    }

    return `${whatText} ${scopeText} ${conditionText}, ${appText}${timingNote}${diningNote}.`.replace(/\s+/g, " ");
  };

  const toggleDay = (dayVal: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal]
    );
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const numDiscount = Number(discountValue);
    const numMinOrder = Number(minOrderAmount);
    const numMaxDiscount = maxDiscountAmount ? Number(maxDiscountAmount) : null;

    let finalCode = code.trim().toUpperCase();
    if (applicationMethod === "AUTOMATIC" && !finalCode) {
      finalCode = `AUTO_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    if (applicationMethod === "COUPON_CODE" && !finalCode) {
      setError("Please provide a promo code (e.g. WELCOME10)");
      return;
    }
    if (!cleanTitle) {
      setError("Please provide an offer title");
      return;
    }
    if (discountType !== "FREE_ITEM" && (isNaN(numDiscount) || numDiscount <= 0)) {
      setError("Discount value must be greater than 0");
      return;
    }
    if (discountType === "PERCENTAGE" && numDiscount > 90) {
      setError("Percentage discount cannot exceed 90%");
      return;
    }
    if (discountType === "FREE_ITEM" && !rewardItemId) {
      setError("Please select the free menu item reward");
      return;
    }
    if (isNaN(numMinOrder) || numMinOrder < 0) {
      setError("Minimum order cannot be negative");
      return;
    }

    const channels: string[] = [];
    if (channelDigital) channels.push("DIGITAL_MENU");
    if (channelPOS) channels.push("POS");
    if (channels.length === 0) {
      setError("Offer must be available on at least one channel (Digital Menu or POS)");
      return;
    }

    try {
      await onSubmit({
        code: finalCode,
        title: cleanTitle,
        description: description.trim() || undefined,
        discountType,
        discountValue: discountType === "FREE_ITEM" ? 0 : numDiscount,
        maxDiscountAmount: discountType === "PERCENTAGE" ? numMaxDiscount : null,
        minOrderAmount: numMinOrder,
        rewardItemId: discountType === "FREE_ITEM" ? rewardItemId : null,
        rewardItemName: discountType === "FREE_ITEM" ? selectedRewardItem?.name || null : null,
        applicationMethod,
        appliesTo,
        targetCategoryIds: appliesTo === "CATEGORIES" ? selectedCategoryIds.join(",") : null,
        targetItemIds: appliesTo === "ITEMS" ? selectedItemIds.join(",") : null,
        customerEligibility,
        usageLimitTotal: usageLimitTotal ? Number(usageLimitTotal) : null,
        usageLimitPerCustomer: usageLimitPerCustomer ? Number(usageLimitPerCustomer) : 1,
        timeStart: timeStart || null,
        timeEnd: timeEnd || null,
        daysOfWeek: selectedDays.length > 0 ? selectedDays.join(",") : null,
        availableChannels: channels.join(","),
        applicableOrderType,
        cannotCombine,
        freeItemUnlockType: discountType === "FREE_ITEM" ? freeItemUnlockType : "SPEND",
        freeItemQualifyingCategoryId:
          discountType === "FREE_ITEM" && freeItemUnlockType === "CATEGORY"
            ? freeItemQualifyingCategoryId
            : null,
        freeItemQualifyingItemId:
          discountType === "FREE_ITEM" && freeItemUnlockType === "ITEM"
            ? freeItemQualifyingItemId
            : null,
        badgeText: badgeText.trim() || undefined,
        isActive,
        showOnHome,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save offer. Please try again.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Offer" : "Create Offer"}
      description="Configure promotional perks, discount rules, and unlock requirements."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3 max-h-[82vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-2.5 text-[11px] bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-900/50 flex items-center gap-1.5">
            <IconInfoCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            1. OFFER TYPE SELECTOR (Sleek Horizontal Segment)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--color-foreground)] mb-1 uppercase tracking-wider">
            Offer Type
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => {
                setDiscountType("PERCENTAGE");
                if (title === "Flat ₹50 OFF" || title.includes("Free")) {
                  setTitle("20% OFF Deal");
                }
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                discountType === "PERCENTAGE"
                  ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs border border-[var(--color-border)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <IconPercentage className="w-3.5 h-3.5" />
              <span>% Discount</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDiscountType("FLAT");
                if (title.includes("%") || title.includes("Free")) {
                  setTitle("Flat ₹50 OFF");
                }
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                discountType === "FLAT"
                  ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs border border-[var(--color-border)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <IconCurrencyRupee className="w-3.5 h-3.5" />
              <span>₹ Flat Off</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDiscountType("FREE_ITEM");
                if (!title || title.includes("%") || title.includes("Flat")) {
                  setTitle("Free Treat with Order");
                }
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                discountType === "FREE_ITEM"
                  ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs border border-[var(--color-border)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <IconGift className="w-3.5 h-3.5" />
              <span>Free Item</span>
            </button>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            2. DYNAMIC VALUE CONFIGURATION
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {discountType === "PERCENTAGE" && (
          <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-foreground)] mb-1">
                Discount (%) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="90"
                  placeholder="20"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="pr-7 text-xs h-9"
                  required
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-muted)]">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-foreground)] mb-1">
                Max Cap (₹) <span className="text-[10px] text-[var(--color-muted)] font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--color-muted)]">
                  ₹
                </span>
                <Input
                  type="number"
                  min="0"
                  placeholder="No limit"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  className="pl-6 text-xs h-9"
                />
              </div>
            </div>
          </div>
        )}

        {discountType === "FLAT" && (
          <div className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <label className="block text-[11px] font-semibold text-[var(--color-foreground)] mb-1">
              Fixed Discount Amount (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--color-muted)]">
                ₹
              </span>
              <Input
                type="number"
                min="1"
                placeholder="50"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="pl-6 text-xs h-9"
                required
              />
            </div>
          </div>
        )}

        {discountType === "FREE_ITEM" && (
          <div className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-foreground)] mb-1">
                Complimentary Reward Item <span className="text-red-500">*</span>
              </label>
              {menuItems.length > 0 ? (
                <select
                  value={rewardItemId}
                  onChange={(e) => {
                    setRewardItemId(e.target.value);
                    const it = menuItems.find((m) => m.id === e.target.value);
                    if (it && (!title || title.includes("Free"))) {
                      setTitle(`Free ${it.name}`);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-hidden focus:border-[var(--color-primary)] h-9"
                >
                  <option value="">-- Select Free Menu Item --</option>
                  {menuItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Worth ₹{item.price})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-amber-600">No menu items found. Add items to menu first.</p>
              )}
            </div>

            {/* Free Item Unlock Condition */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-foreground)] mb-1">
                How does customer qualify for this Free Item?
              </label>
              <div className="grid grid-cols-3 gap-1 bg-[var(--color-background)] p-0.5 rounded-lg border border-[var(--color-border)] mb-2">
                <button
                  type="button"
                  onClick={() => setFreeItemUnlockType("SPEND")}
                  className={`text-[10px] py-1 font-medium rounded-md transition-colors cursor-pointer ${
                    freeItemUnlockType === "SPEND"
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  Spend Amount
                </button>
                <button
                  type="button"
                  onClick={() => setFreeItemUnlockType("CATEGORY")}
                  className={`text-[10px] py-1 font-medium rounded-md transition-colors cursor-pointer ${
                    freeItemUnlockType === "CATEGORY"
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  Buy from Category
                </button>
                <button
                  type="button"
                  onClick={() => setFreeItemUnlockType("ITEM")}
                  className={`text-[10px] py-1 font-medium rounded-md transition-colors cursor-pointer ${
                    freeItemUnlockType === "ITEM"
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  Buy Specific Item
                </button>
              </div>

              {freeItemUnlockType === "CATEGORY" && (
                <select
                  value={freeItemQualifyingCategoryId}
                  onChange={(e) => setFreeItemQualifyingCategoryId(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] h-8"
                >
                  <option value="">-- Choose Qualifying Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      Buy any item in {c.name}
                    </option>
                  ))}
                </select>
              )}

              {freeItemUnlockType === "ITEM" && (
                <select
                  value={freeItemQualifyingItemId}
                  onChange={(e) => setFreeItemQualifyingItemId(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] h-8"
                >
                  <option value="">-- Choose Qualifying Menu Item --</option>
                  {menuItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      Must buy: {item.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            3. SCOPE (APPLIES TO) & MINIMUM SPEND
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-foreground)] mb-1">
                Discount Applies To
              </label>
              <div className="grid grid-cols-3 gap-1 bg-[var(--color-background)] p-0.5 rounded-lg border border-[var(--color-border)] h-9">
                <button
                  type="button"
                  onClick={() => setAppliesTo("ALL")}
                  className={`text-[10px] font-medium rounded-md transition-colors cursor-pointer ${
                    appliesTo === "ALL"
                      ? "bg-[var(--color-primary)] text-white shadow-2xs"
                      : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  Entire Order
                </button>
                <button
                  type="button"
                  onClick={() => setAppliesTo("CATEGORIES")}
                  className={`text-[10px] font-medium rounded-md transition-colors cursor-pointer ${
                    appliesTo === "CATEGORIES"
                      ? "bg-[var(--color-primary)] text-white shadow-2xs"
                      : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  Categories
                </button>
                <button
                  type="button"
                  onClick={() => setAppliesTo("ITEMS")}
                  className={`text-[10px] font-medium rounded-md transition-colors cursor-pointer ${
                    appliesTo === "ITEMS"
                      ? "bg-[var(--color-primary)] text-white shadow-2xs"
                      : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  Specific Items
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-foreground)] mb-1">
                Min Spend (₹) <span className="text-[10px] text-[var(--color-muted)] font-normal">(0 = any order)</span>
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--color-muted)]">
                  ₹
                </span>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  className="pl-6 text-xs h-9"
                />
              </div>
            </div>
          </div>

          {/* If Categories selected */}
          {appliesTo === "CATEGORIES" && (
            <div className="pt-1.5 border-t border-[var(--color-border-subtle)]">
              <span className="block text-[10px] font-semibold text-[var(--color-muted)] mb-1 uppercase tracking-wider">
                Select Eligible Categories:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {categories.length > 0 ? (
                  categories.map((cat) => {
                    const isSelected = selectedCategoryIds.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                            : "bg-[var(--color-background)] text-[var(--color-foreground)] border-[var(--color-border)] hover:border-[var(--color-primary)]"
                        }`}
                      >
                        {isSelected && <IconCheck className="w-3 h-3 stroke-[3]" />}
                        <span>{cat.name}</span>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-[11px] text-[var(--color-muted)]">No categories found.</p>
                )}
              </div>
            </div>
          )}

          {/* If Specific Items selected */}
          {appliesTo === "ITEMS" && (
            <div className="pt-1.5 border-t border-[var(--color-border-subtle)]">
              <span className="block text-[10px] font-semibold text-[var(--color-muted)] mb-1 uppercase tracking-wider">
                Select Eligible Menu Items:
              </span>
              <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
                {menuItems.map((item) => {
                  const isSelected = selectedItemIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setSelectedItemIds((prev) =>
                          prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                        )
                      }
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                          : "bg-[var(--color-background)] text-[var(--color-foreground)] border-[var(--color-border)] hover:border-[var(--color-primary)]"
                      }`}
                    >
                      {isSelected && <IconCheck className="w-2.5 h-2.5" />}
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            4. APPLICATION METHOD & CONDITIONAL PROMO CODE
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-2">
          <label className="block text-[11px] font-semibold text-[var(--color-foreground)]">
            How Do Customers Unlock This?
          </label>
          <div className="grid grid-cols-2 gap-1 bg-[var(--color-background)] p-0.5 rounded-lg border border-[var(--color-border)] h-9">
            <button
              type="button"
              onClick={() => setApplicationMethod("COUPON_CODE")}
              className={`text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                applicationMethod === "COUPON_CODE"
                  ? "bg-[var(--color-primary)] text-white shadow-2xs"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              Coupon Code
            </button>
            <button
              type="button"
              onClick={() => setApplicationMethod("AUTOMATIC")}
              className={`text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                applicationMethod === "AUTOMATIC"
                  ? "bg-[var(--color-primary)] text-white shadow-2xs"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              Automatic in Cart
            </button>
          </div>

          {/* Conditional: If Coupon Code -> Show Code input + Generate */}
          {applicationMethod === "COUPON_CODE" ? (
            <div className="pt-1.5">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-[var(--color-foreground)]">
                  Promo Code <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="text-[10px] font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <IconDice className="w-3 h-3" />
                  <span>Generate Code</span>
                </button>
              </div>
              <div className="relative">
                <IconTag className="w-3.5 h-3.5 text-[var(--color-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="e.g. WELCOME10"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                  className="pl-8 text-xs font-mono uppercase tracking-wider h-9"
                  required={applicationMethod === "COUPON_CODE"}
                />
              </div>
            </div>
          ) : (
            /* If Automatic -> Helpful message, no code input needed */
            <div className="pt-1 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-1.5">
              <IconCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span>This offer will apply automatically in the cart once the customer qualifies.</span>
            </div>
          )}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            4b. APPLICABLE DINING MODE (Dine-In, Takeaway, or Both)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-semibold text-[var(--color-foreground)]">
              Applicable Dining Mode
            </label>
            <span className="text-[10px] text-[var(--color-muted)] font-medium">
              {applicableOrderType === "BOTH"
                ? "Valid for both Dine-In & Takeaway"
                : applicableOrderType === "DINE_IN"
                ? "Dine-in table orders only"
                : "Takeaway / pickup orders only"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-[var(--color-background)] p-0.5 rounded-lg border border-[var(--color-border)] h-9">
            <button
              type="button"
              onClick={() => setApplicableOrderType("BOTH")}
              className={`text-[11px] font-medium rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                applicableOrderType === "BOTH"
                  ? "bg-[var(--color-primary)] text-white shadow-2xs font-semibold"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <div className="flex items-center gap-1">
                <IconArmchair className="w-3.5 h-3.5" />
                <span className="text-[10px] opacity-60">+</span>
                <IconShoppingBag className="w-3.5 h-3.5" />
              </div>
              <span>Both</span>
            </button>
            <button
              type="button"
              onClick={() => setApplicableOrderType("DINE_IN")}
              className={`text-[11px] font-medium rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                applicableOrderType === "DINE_IN"
                  ? "bg-[var(--color-primary)] text-white shadow-2xs font-semibold"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <IconArmchair className="w-3.5 h-3.5" />
              <span>Dine-In Only</span>
            </button>
            <button
              type="button"
              onClick={() => setApplicableOrderType("TAKEAWAY")}
              className={`text-[11px] font-medium rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                applicableOrderType === "TAKEAWAY"
                  ? "bg-[var(--color-primary)] text-white shadow-2xs font-semibold"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <IconShoppingBag className="w-3.5 h-3.5" />
              <span>Takeaway Only</span>
            </button>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            5. TITLE, BADGE & DESCRIPTION
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-foreground)] mb-1">
              Offer Title <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Summer Brew Deal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs h-9"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-foreground)] mb-1">
              Badge Label
            </label>
            <Input
              type="text"
              placeholder="e.g. Special Offer"
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              className="text-xs h-9"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[var(--color-foreground)] mb-1">
            Description <span className="text-[10px] text-[var(--color-muted)] font-normal">(Optional)</span>
          </label>
          <Input
            type="text"
            placeholder="e.g. On all handcrafted roasts & bakery"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-xs h-9"
          />
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            6. ADVANCED RULES & SCHEDULE (Clean Collapsible Accordion)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-3 py-2 text-xs font-semibold text-[var(--color-foreground)] flex items-center justify-between hover:bg-[var(--color-background)] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <IconShieldLock className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>Advanced Rules, Schedule & Limits</span>
              <span className="text-[10px] text-[var(--color-muted)] font-normal">(Optional)</span>
            </div>
            {showAdvanced ? (
              <IconChevronUp className="w-3.5 h-3.5 text-[var(--color-muted)]" />
            ) : (
              <IconChevronDown className="w-3.5 h-3.5 text-[var(--color-muted)]" />
            )}
          </button>

          {showAdvanced && (
            <div className="p-3 pt-2 border-t border-[var(--color-border-subtle)] space-y-3 bg-[var(--color-background)]/50">
              {/* Customer Eligibility */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-foreground)] mb-1">
                  Who Can Use This Offer?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-[var(--color-surface)] p-0.5 rounded-lg border border-[var(--color-border)]">
                  {(
                    [
                      { id: "ALL", label: "Everyone" },
                      { id: "NEW", label: "New Guests" },
                      { id: "RETURNING", label: "Returning" },
                      { id: "LOYALTY", label: "Loyalty Only" },
                    ] as const
                  ).map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setCustomerEligibility(tier.id)}
                      className={`text-[10px] py-1 font-medium rounded-md transition-colors cursor-pointer ${
                        customerEligibility === tier.id
                          ? "bg-[var(--color-primary)] text-white shadow-2xs"
                          : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Days of Week */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-foreground)] mb-1">
                  Valid Days of Week
                </label>
                <div className="flex gap-1">
                  {ALL_DAYS.map((d) => {
                    const isSelected = selectedDays.includes(d.value);
                    return (
                      <button
                        key={d.name}
                        type="button"
                        onClick={() => toggleDay(d.value)}
                        className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[var(--color-primary)] text-white shadow-2xs"
                            : "bg-[var(--color-surface)] text-[var(--color-muted)] border border-[var(--color-border)] hover:text-[var(--color-foreground)]"
                        }`}
                        title={d.name}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Happy Hour Times */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-foreground)] mb-1">
                    Happy Hour Start
                  </label>
                  <Input
                    type="time"
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-foreground)] mb-1">
                    Happy Hour End
                  </label>
                  <Input
                    type="time"
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-foreground)] mb-1">
                    Total Uses Cap <span className="text-[10px] text-[var(--color-muted)]">(Blank = Unlimited)</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={usageLimitTotal}
                    onChange={(e) => setUsageLimitTotal(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-foreground)] mb-1">
                    Uses Per Customer
                  </label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={usageLimitPerCustomer}
                    onChange={(e) => setUsageLimitPerCustomer(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              {/* Channels & Stacking */}
              <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-2">
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-semibold text-[var(--color-foreground)] text-[11px]">Available on:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                    <input
                      type="checkbox"
                      checked={channelDigital}
                      onChange={(e) => setChannelDigital(e.target.checked)}
                      className="rounded text-[var(--color-primary)]"
                    />
                    <span>Digital Menu</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                    <input
                      type="checkbox"
                      checked={channelPOS}
                      onChange={(e) => setChannelPOS(e.target.checked)}
                      className="rounded text-[var(--color-primary)]"
                    />
                    <span>POS Register</span>
                  </label>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[var(--color-foreground)]">
                  <input
                    type="checkbox"
                    checked={cannotCombine}
                    onChange={(e) => setCannotCombine(e.target.checked)}
                    className="rounded text-[var(--color-primary)]"
                  />
                  <span>Do not combine with other promotional offers</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            7. STATUS & LIVE SUMMARY STRIP
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-foreground)]">
              Active Offer Status
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-neutral-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
            </label>
          </div>

          {/* Feature on Home Carousel Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)]">
            <div className="min-w-0 pr-2">
              <span className="text-xs font-bold text-[var(--color-foreground)] flex items-center gap-1.5">
                <IconTag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Show in Home &quot;Offers &amp; Perks&quot; Section</span>
              </span>
              <p className="text-[10px] text-[var(--color-muted)] mt-0.5">
                Displays as a claimable voucher ticket card directly on the public customer home page so guests see and claim it immediately.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={showOnHome}
                onChange={(e) => setShowOnHome(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-neutral-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
            <IconSparkles className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
            <p className="text-[11px] text-[var(--color-muted)] line-clamp-2">
              <span className="font-semibold text-[var(--color-foreground)] mr-1">Live Summary:</span>
              {getOfferSummary()}
            </p>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            8. FOOTER BUTTONS
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isLoading}
          >
            {isEditing ? "Save Changes" : "Create Offer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
