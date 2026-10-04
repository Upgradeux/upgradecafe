import { Offer } from "@/lib/db/schema/offers";
import { DigitalMenuCartItem, CustomerProfile } from "@/features/cafe/public-menu/types";

export interface OfferEvaluationContext {
  cart: DigitalMenuCartItem[];
  subtotal: number;
  customerProfile?: CustomerProfile | null;
  hasPastOrders?: boolean;
  channel?: "DIGITAL_MENU" | "POS";
  currentTime?: Date;
  cafeSlug?: string;
  orderType?: "DINE_IN" | "TAKEAWAY";
  menuItemNamesById?: Record<string, string>;
  categoryNamesById?: Record<string, string>;
}

export interface OfferEvaluationResult {
  isEligible: boolean;
  ineligibleReason: string | null;
  eligibleCartItems: DigitalMenuCartItem[];
  eligibleSubtotal: number;
  calculatedDiscount: number;
  lockReason: string | null;
  scopeLabel: string;
}

const DAY_MAP: Record<string, string> = {
  "1": "Mon",
  "2": "Tue",
  "3": "Wed",
  "4": "Thu",
  "5": "Fri",
  "6": "Sat",
  "0": "Sun",
};

/**
 * Format 24-hour HH:MM time into readable 12-hour AM/PM string (e.g. "14:00" -> "2:00 PM")
 */
export function format12HourTime(timeStr: string): string {
  if (!timeStr || !timeStr.includes(":")) return timeStr;
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mPadded = isNaN(m) ? "00" : m.toString().padStart(2, "0");
  return `${h12}:${mPadded} ${period}`;
}

/**
 * Get how many times the current customer/device has redeemed a specific offer
 */
export function getCustomerOfferUses(cafeSlug: string, code: string): number {
  if (typeof window === "undefined" || !cafeSlug || !code) return 0;
  try {
    const raw = localStorage.getItem(`cafe_offer_uses_${cafeSlug}_${code.trim().toUpperCase()}`);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Record a redemption when customer places an order with an offer
 */
export function recordCustomerOfferUse(cafeSlug: string, code: string): void {
  if (typeof window === "undefined" || !cafeSlug || !code) return;
  try {
    const current = getCustomerOfferUses(cafeSlug, code);
    localStorage.setItem(`cafe_offer_uses_${cafeSlug}_${code.trim().toUpperCase()}`, String(current + 1));
  } catch {}
}

/**
 * Centralized, strict validation & calculation engine for Offers, Advanced Rules, Schedule & Limits.
 */
export function evaluateOffer(
  offer: Offer,
  context: OfferEvaluationContext
): OfferEvaluationResult {
  const now = context.currentTime || new Date();
  const channel = context.channel || "DIGITAL_MENU";
  const cart = context.cart || [];
  const subtotal = context.subtotal || 0;

  // Derive human-readable scope label
  let scopeLabel = "On entire order";
  if (offer.appliesTo === "ITEMS" && offer.targetItemIds) {
    const ids = offer.targetItemIds.split(",").map((s) => s.trim()).filter(Boolean);
    const names = ids.map((id) => context.menuItemNamesById?.[id]).filter(Boolean);
    scopeLabel = names.length > 0 ? `On ${names.join(", ")}` : "On specific items";
  } else if (offer.appliesTo === "CATEGORIES" && offer.targetCategoryIds) {
    const ids = offer.targetCategoryIds.split(",").map((s) => s.trim()).filter(Boolean);
    const names = ids.map((id) => context.categoryNamesById?.[id]).filter(Boolean);
    scopeLabel = names.length > 0 ? `On ${names.join(", ")}` : "On specific categories";
  }

  // 1. Active status check
  if (!offer.isActive) {
    return {
      isEligible: false,
      ineligibleReason: "This offer is currently inactive.",
      eligibleCartItems: [],
      eligibleSubtotal: 0,
      calculatedDiscount: 0,
      lockReason: "Inactive",
      scopeLabel,
    };
  }

  // 2. Channel availability check (DIGITAL_MENU vs POS)
  if (offer.availableChannels) {
    const allowedChannels = offer.availableChannels
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);
    if (allowedChannels.length > 0 && !allowedChannels.includes(channel)) {
      return {
        isEligible: false,
        ineligibleReason: "This offer is only available in-store at the counter.",
        eligibleCartItems: [],
        eligibleSubtotal: 0,
        calculatedDiscount: 0,
        lockReason: "In-store only",
        scopeLabel,
      };
    }
  }

  // 2b. Dining mode check (Dine-In vs Takeaway)
  const orderType = context.orderType;
  const applicableOrderType = offer.applicableOrderType || "BOTH";
  if (orderType && applicableOrderType !== "BOTH") {
    if (applicableOrderType === "DINE_IN" && orderType !== "DINE_IN") {
      return {
        isEligible: false,
        ineligibleReason: "Valid only for Dine-in orders at tables.",
        eligibleCartItems: [],
        eligibleSubtotal: 0,
        calculatedDiscount: 0,
        lockReason: "Dine-in only",
        scopeLabel,
      };
    }
    if (applicableOrderType === "TAKEAWAY" && orderType !== "TAKEAWAY") {
      return {
        isEligible: false,
        ineligibleReason: "Valid only for Takeaway / pickup orders.",
        eligibleCartItems: [],
        eligibleSubtotal: 0,
        calculatedDiscount: 0,
        lockReason: "Takeaway only",
        scopeLabel,
      };
    }
  }

  // 3. Date validity check (startDate & endDate)
  if (offer.startDate && new Date(offer.startDate).getTime() > now.getTime()) {
    const startDateFormatted = new Date(offer.startDate).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
    return {
      isEligible: false,
      ineligibleReason: `Offer starts on ${startDateFormatted}.`,
      eligibleCartItems: [],
      eligibleSubtotal: 0,
      calculatedDiscount: 0,
      lockReason: `Starts ${startDateFormatted}`,
      scopeLabel,
    };
  }

  if (offer.endDate && new Date(offer.endDate).getTime() < now.getTime()) {
    return {
      isEligible: false,
      ineligibleReason: "Offer has expired.",
      eligibleCartItems: [],
      eligibleSubtotal: 0,
      calculatedDiscount: 0,
      lockReason: "Expired",
      scopeLabel,
    };
  }

  // 4. Days of week schedule (e.g. "1,2,3,4,5" where Sun=0, Mon=1)
  if (offer.daysOfWeek) {
    const allowedDays = offer.daysOfWeek
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    const currentDayStr = now.getDay().toString();
    if (allowedDays.length > 0 && !allowedDays.includes(currentDayStr)) {
      const dayNames = allowedDays.map((d) => DAY_MAP[d] || d).join(", ");
      return {
        isEligible: false,
        ineligibleReason: `Offer is valid only on: ${dayNames}.`,
        eligibleCartItems: [],
        eligibleSubtotal: 0,
        calculatedDiscount: 0,
        lockReason: `Valid on ${dayNames}`,
        scopeLabel,
      };
    }
  }

  // 5. Happy Hour timing schedule (timeStart & timeEnd in HH:MM)
  if (offer.timeStart || offer.timeEnd) {
    const currentHours = now.getHours().toString().padStart(2, "0");
    const currentMins = now.getMinutes().toString().padStart(2, "0");
    const currentTimeStr = `${currentHours}:${currentMins}`;

    if (offer.timeStart && currentTimeStr < offer.timeStart) {
      const startTimeFormatted = format12HourTime(offer.timeStart);
      return {
        isEligible: false,
        ineligibleReason: `Happy hour starts at ${startTimeFormatted}.`,
        eligibleCartItems: [],
        eligibleSubtotal: 0,
        calculatedDiscount: 0,
        lockReason: `Starts at ${startTimeFormatted}`,
        scopeLabel,
      };
    }

    if (offer.timeEnd && currentTimeStr > offer.timeEnd) {
      const endTimeFormatted = format12HourTime(offer.timeEnd);
      return {
        isEligible: false,
        ineligibleReason: `Happy hour ended at ${endTimeFormatted}.`,
        eligibleCartItems: [],
        eligibleSubtotal: 0,
        calculatedDiscount: 0,
        lockReason: `Ended at ${endTimeFormatted}`,
        scopeLabel,
      };
    }
  }

  // 6. Customer Eligibility Check ("ALL" | "NEW" | "RETURNING" | "LOYALTY")
  const isRegisteredLoyalty = Boolean(
    context.customerProfile &&
      !context.customerProfile.isGuest &&
      context.customerProfile.id &&
      !context.customerProfile.id.startsWith("cust_")
  );
  const isReturning = Boolean(
    context.hasPastOrders ||
      isRegisteredLoyalty ||
      (context.customerProfile && (context.customerProfile.loyaltyPoints ?? 0) > 0)
  );

  if (offer.customerEligibility === "LOYALTY") {
    if (!isRegisteredLoyalty) {
      return {
        isEligible: false,
        ineligibleReason: "Exclusive perk for loyalty members. Please log in to unlock.",
        eligibleCartItems: [],
        eligibleSubtotal: 0,
        calculatedDiscount: 0,
        lockReason: "Loyalty Only",
        scopeLabel,
      };
    }
  } else if (offer.customerEligibility === "NEW") {
    if (isReturning) {
      return {
        isEligible: false,
        ineligibleReason: "Offer is exclusively for new guests on their first order.",
        eligibleCartItems: [],
        eligibleSubtotal: 0,
        calculatedDiscount: 0,
        lockReason: "New Guests Only",
        scopeLabel,
      };
    }
  } else if (offer.customerEligibility === "RETURNING") {
    if (!isReturning) {
      return {
        isEligible: false,
        ineligibleReason: "Offer is available for returning guests with previous orders.",
        eligibleCartItems: [],
        eligibleSubtotal: 0,
        calculatedDiscount: 0,
        lockReason: "Returning Guests Only",
        scopeLabel,
      };
    }
  }

  // 7. Customer Redemption Limits (usageLimitPerCustomer)
  if (context.cafeSlug && offer.usageLimitPerCustomer && offer.usageLimitPerCustomer > 0) {
    const customerUses = getCustomerOfferUses(context.cafeSlug, offer.code);
    if (customerUses >= offer.usageLimitPerCustomer) {
      return {
        isEligible: false,
        ineligibleReason: `You have reached the maximum of ${offer.usageLimitPerCustomer} ${
          offer.usageLimitPerCustomer === 1 ? "use" : "uses"
        } for this coupon.`,
        eligibleCartItems: [],
        eligibleSubtotal: 0,
        calculatedDiscount: 0,
        lockReason: "Limit Reached",
        scopeLabel,
      };
    }
  }

  // 8. Scope / Applies To Check (ITEMS, CATEGORIES, or ALL)
  let eligibleCartItems: DigitalMenuCartItem[] = [];
  let eligibleSubtotal = 0;

  if (offer.appliesTo === "ITEMS") {
    const targetItemIds = (offer.targetItemIds || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    eligibleCartItems = cart.filter((it) => targetItemIds.includes(it.menuItem.id));

    if (eligibleCartItems.length === 0) {
      const names = targetItemIds
        .map((id) => context.menuItemNamesById?.[id])
        .filter(Boolean);
      const requirementText = names.length > 0 ? names.join(", ") : "eligible menu items";
      return {
        isEligible: false,
        ineligibleReason: `Requires ${requirementText} in your cart.`,
        eligibleCartItems: [],
        eligibleSubtotal: 0,
        calculatedDiscount: 0,
        lockReason: `Add ${requirementText}`,
        scopeLabel,
      };
    }

    eligibleSubtotal = eligibleCartItems.reduce(
      (sum, it) => sum + it.unitPrice * it.quantity,
      0
    );
  } else if (offer.appliesTo === "CATEGORIES") {
    const targetCategoryIds = (offer.targetCategoryIds || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    eligibleCartItems = cart.filter(
      (it) => it.menuItem.categoryId && targetCategoryIds.includes(it.menuItem.categoryId)
    );

    if (eligibleCartItems.length === 0) {
      const names = targetCategoryIds
        .map((id) => context.categoryNamesById?.[id])
        .filter(Boolean);
      const requirementText =
        names.length > 0 ? names.join(", ") : "items from eligible categories";
      return {
        isEligible: false,
        ineligibleReason: `Requires items from ${requirementText} in your cart.`,
        eligibleCartItems: [],
        eligibleSubtotal: 0,
        calculatedDiscount: 0,
        lockReason: `Add from ${requirementText}`,
        scopeLabel,
      };
    }

    eligibleSubtotal = eligibleCartItems.reduce(
      (sum, it) => sum + it.unitPrice * it.quantity,
      0
    );
  } else {
    // Entire Order
    eligibleCartItems = cart;
    eligibleSubtotal = subtotal;
  }

  // 9. Free Item Specific Unlock Conditions
  if (offer.discountType === "FREE_ITEM") {
    if (offer.freeItemUnlockType === "ITEM" && offer.freeItemQualifyingItemId) {
      const hasQualifyingItem = cart.some(
        (it) => it.menuItem.id === offer.freeItemQualifyingItemId
      );
      if (!hasQualifyingItem) {
        const itemName =
          context.menuItemNamesById?.[offer.freeItemQualifyingItemId] ||
          "qualifying menu item";
        return {
          isEligible: false,
          ineligibleReason: `Requires ${itemName} in your cart to claim free treat.`,
          eligibleCartItems: [],
          eligibleSubtotal: 0,
          calculatedDiscount: 0,
          lockReason: `Add ${itemName}`,
          scopeLabel,
        };
      }
    } else if (
      offer.freeItemUnlockType === "CATEGORY" &&
      offer.freeItemQualifyingCategoryId
    ) {
      const hasQualifyingCategory = cart.some(
        (it) => it.menuItem.categoryId === offer.freeItemQualifyingCategoryId
      );
      if (!hasQualifyingCategory) {
        const catName =
          context.categoryNamesById?.[offer.freeItemQualifyingCategoryId] ||
          "qualifying category";
        return {
          isEligible: false,
          ineligibleReason: `Requires item from ${catName} in your cart to claim free treat.`,
          eligibleCartItems: [],
          eligibleSubtotal: 0,
          calculatedDiscount: 0,
          lockReason: `Add from ${catName}`,
          scopeLabel,
        };
      }
    }
  }

  // 10. Minimum Spend Check (minOrderAmount)
  const minOrder = offer.minOrderAmount || 0;
  if (minOrder > 0 && subtotal < minOrder) {
    const diff = minOrder - subtotal;
    return {
      isEligible: false,
      ineligibleReason: `${offer.code} requires a minimum order of ₹${minOrder}.`,
      eligibleCartItems,
      eligibleSubtotal,
      calculatedDiscount: 0,
      lockReason: `Add ₹${diff} more`,
      scopeLabel,
    };
  }

  // 11. Calculate Discount Amount
  let calculatedDiscount = 0;
  if (offer.discountType === "PERCENTAGE") {
    // CRITICAL: Discount is applied ONLY on eligible items, not on un-selected items in the cart!
    const rawDiscount = Math.round((eligibleSubtotal * offer.discountValue) / 100);
    if (offer.maxDiscountAmount && offer.maxDiscountAmount > 0) {
      calculatedDiscount = Math.min(rawDiscount, offer.maxDiscountAmount);
    } else {
      calculatedDiscount = rawDiscount;
    }
    calculatedDiscount = Math.min(subtotal, calculatedDiscount);
  } else if (offer.discountType === "FLAT") {
    calculatedDiscount = Math.min(eligibleSubtotal, Math.min(subtotal, offer.discountValue));
  } else if (offer.discountType === "FREE_ITEM") {
    calculatedDiscount = 0;
  }

  return {
    isEligible: true,
    ineligibleReason: null,
    eligibleCartItems,
    eligibleSubtotal,
    calculatedDiscount,
    lockReason: null,
    scopeLabel,
  };
}
