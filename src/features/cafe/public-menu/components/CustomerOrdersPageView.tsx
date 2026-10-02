"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Cafe } from "@/lib/db/schema/cafes";
import { Table } from "@/lib/db/schema/tables";
import { OrderWithItems } from "@/features/cafe/orders/types";
import { CustomerProfile } from "../types";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import { calculateOrderWaitTime } from "@/features/cafe/orders/utils/wait-time";
import { LiveOrderTrackerModal } from "./LiveOrderTrackerModal";
import { CustomerUpiModal } from "./CustomerUpiModal";
import { useToast } from "@/components/ui/Toast";
import {
  IconArrowLeft,
  IconClock,
  IconFlame,
  IconChefHat,
  IconCheck,
  IconX,
  IconArmchair,
  IconShoppingBag,
  IconQrcode,
  IconChevronRight,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
  IconToolsKitchen2,
  IconTag,
  IconBellRinging,
  IconDroplet,
  IconSmartHome,
  IconShoppingCart,
  IconRepeat,
  IconClipboardList,
} from "@tabler/icons-react";

// Signature Cloche Icon matching floating dock
const ClocheIcon = ({ className = "w-[22px] h-[22px]" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 125"
    className={className}
    fill="currentColor"
  >
    <path d="M19.3,85.7c0.2,0.2,0.4,0.3,0.7,0.3h37.2c0,0,0.1,0,0.1,0l17.4,5c0.1,0,0.2,0,0.3,0 c0.2,0,0.4-0.1,0.6-0.2c0.3-0.2,0.4-0.5,0.4-0.8v-4h4c0.3,0,0.5-0.1,0.7-0.3l5-5c0.3-0.3,0.4-0.7,0.2-1.1C85.8,79.2,85.4,79,85,79 h-4c-0.5-15.6-12.6-28.3-27.9-29.8c0.3-0.5,0.4-1.1,0.4-1.7c0-1.9-1.6-3.5-3.5-3.5s-3.5,1.6-3.5,3.5c0,0.6,0.2,1.2,0.4,1.7 C31.6,50.7,19.5,63.4,19,79h-4c-0.4,0-0.8,0.2-0.9,0.6c-0.2,0.4-0.1,0.8,0.2,1.1L19.3,85.7z M74,88.7L47.1,81H74V88.7z M82.6,81 l-3,3H76v-3h4H82.6z M50,46c0.8,0,1.5,0.7,1.5,1.5S50.8,49,50,49s-1.5-0.7-1.5-1.5S49.2,46,50,46z M50,51c15.7,0,28.5,12.5,29,28h-4 H40H21C21.5,63.5,34.3,51,50,51z M20,81h19.9l10.5,3H20.4l-3-3H20z" />
    <path d="M51,55c0-0.6-0.4-1-1-1c-10.3,0-19.7,6.1-23.8,15.6c-0.2,0.5,0,1.1,0.5,1.3 c0.1,0.1,0.3,0.1,0.4,0.1c0.4,0,0.8-0.2,0.9-0.6C31.8,61.7,40.5,56,50,56C50.6,56,51,55.6,51,55z" />
    <path d="M58.6,44.5c-0.3,0.5-0.1,1.1,0.4,1.3c0.1,0.1,0.3,0.1,0.5,0.1c0.4,0,0.7-0.2,0.9-0.5 c2.8-5.4,1.3-8.4,0.1-10.9c-1.2-2.5-2.3-4.6,0-9.1c0.2-0.5,0-1.1-0.5-1.3c-0.5-0.2-1.1,0-1.3,0.5c-2.7,5.4-1.2,8.3,0,10.9 C59.9,37.9,60.9,40,58.6,44.5z" />
    <path d="M48.6,34.5c-0.3,0.5-0.1,1.1,0.4,1.3c0.1,0.1,0.3,0.1,0.5,0.1c0.4,0,0.7-0.2,0.9-0.5 c2.8-5.4,1.3-8.4,0.1-10.9c-1.2-2.5-2.3-4.6,0-9.1c0.2-0.5,0-1.1-0.5-1.3c-0.5-0.2-1.1,0-1.3,0.5c-2.7,5.4-1.2,8.3,0,10.9 C49.9,27.9,50.9,30,48.6,34.5z" />
    <path d="M39.5,44.5c-0.3,0.5-0.1,1.1,0.4,1.3c0.1,0.1,0.3,0.1,0.5,0.1c0.4,0,0.7-0.2,0.9-0.5 c2.8-5.4,1.3-8.4,0.1-10.9c-1.2-2.5-2.3-4.6,0-9.1c0.2-0.5,0-1.1-0.5-1.3c-0.5-0.2-1.1,0-1.3,0.5c-2.7,5.4-1.2,8.3,0,10.9 C40.8,37.9,41.8,40,39.5,44.5z" />
  </svg>
);

interface CustomerOrdersPageViewProps {
  cafe: Cafe;
  settings?: any;
  table: Table | null;
  tableParamName: string | null;
  digitalMenuTheme?: string;
  initialActiveOrders?: OrderWithItems[];
}

export const CustomerOrdersPageView: React.FC<CustomerOrdersPageViewProps> = ({
  cafe,
  settings,
  table,
  tableParamName,
  digitalMenuTheme,
  initialActiveOrders = [],
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const visualTheme = getDigitalMenuVisualTheme(digitalMenuTheme || "roast");

  const [activeOrders, setActiveOrders] = useState<OrderWithItems[]>(initialActiveOrders);
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [showAllPastOrders, setShowAllPastOrders] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});

  // Tracker Modal state
  const [trackerOrderId, setTrackerOrderId] = useState<string | null>(null);
  const [isLiveTrackerOpen, setIsLiveTrackerOpen] = useState(false);

  // UPI payment state
  const [upiOrderData, setUpiOrderData] = useState<{
    orderId?: string;
    amount: number;
    orderNumber: string;
  } | null>(null);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);

  // Clean table name (preserves full table number and qr)
  const rawTable = table?.tableNumber || tableParamName || null;
  const cleanTableNum = rawTable
    ? rawTable.toLowerCase().startsWith("table")
      ? rawTable.replace(/^table\s*/i, "").trim()
      : rawTable.trim()
    : null;
  const qrParam = table?.qrIdentifier || null;
  const tableQuery = useMemo(() => {
    if (!rawTable) return "";
    let q = `?table=${encodeURIComponent(rawTable)}`;
    if (qrParam) {
      q += `&qr=${encodeURIComponent(qrParam)}`;
    }
    return q;
  }, [rawTable, qrParam]);

  // Themed Primary Colors for Center Bend Gradients
  const themeRgb = useMemo(() => {
    const hex = (visualTheme.avatarFallbackBg || "#FF6FAE").replace("#", "");
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
    return { r: 255, g: 111, b: 174 };
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
      topTint: blend(0.18), // soft lighter shade of primary
      midTint: blend(0.06), // subtle fade
    };
  }, [themeRgb]);

  // Customer Profile & Login State
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`cafe_customer_profile_${cafe.slug}`);
      if (saved) {
        setCustomerProfile(JSON.parse(saved));
      }
    } catch {}
  }, [cafe.slug]);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const savedCart = localStorage.getItem(`cafe_cart_${cafe.slug}`);
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          const count = Array.isArray(parsed)
            ? parsed.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0)
            : 0;
          setCartCount(count);
        } else {
          setCartCount(0);
        }
      } catch {
        setCartCount(0);
      }
    };

    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("focus", updateCartCount);
    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("focus", updateCartCount);
    };
  }, [cafe.slug]);

  const isLoggedIn = Boolean(customerProfile && !customerProfile.isGuest);

  // Load completed past orders for logged-in customers or guests with phone
  const fetchPastOrders = useCallback(async () => {
    const effectiveCustomerId = customerProfile?.id || null;
    const effectivePhone = customerProfile?.phone || null;

    if (!effectiveCustomerId && !effectivePhone) {
      setPastOrders([]);
      return;
    }

    try {
      const headers: Record<string, string> = {};
      if (effectiveCustomerId) headers["x-customer-id"] = effectiveCustomerId;
      if (effectivePhone) headers["x-customer-phone"] = effectivePhone;

      const queryParts: string[] = [];
      if (effectiveCustomerId) queryParts.push(`customerId=${encodeURIComponent(effectiveCustomerId)}`);
      if (effectivePhone) queryParts.push(`phone=${encodeURIComponent(effectivePhone)}`);

      const res = await fetch(
        `/api/cafe/${cafe.slug}/orders/past?${queryParts.join("&")}`,
        { headers, credentials: "include" }
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Exclude any active orders (by ID or order number) to guarantee no overlap
        const activeIds = new Set(activeOrders.map((o) => o.id));
        const activeNumbers = new Set(activeOrders.map((o) => formatOrderNum(o.orderNumber)));

        const verifiedPast = json.data.filter(
          (o: any) =>
            !activeIds.has(o.id) &&
            !activeNumbers.has(formatOrderNum(o.orderNumber)) &&
            (o.status === "COMPLETED" || o.status === "CANCELLED" || o.status === "SERVED")
        );
        setPastOrders(verifiedPast);

        // Sanitize localStorage past orders
        try {
          localStorage.setItem(`cafe_past_orders_${cafe.slug}`, JSON.stringify(verifiedPast));
        } catch {}
      }
    } catch {
      // Offline fallback: load from localStorage, but filter out active orders
      try {
        const saved = localStorage.getItem(`cafe_past_orders_${cafe.slug}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          const activeIds = new Set(activeOrders.map((o) => o.id));
          const activeNumbers = new Set(activeOrders.map((o) => formatOrderNum(o.orderNumber)));
          const filtered = parsed.filter(
            (o: any) =>
              !activeIds.has(o.id) &&
              !activeNumbers.has(formatOrderNum(o.orderNumber)) &&
              o.status !== "NEW" &&
              o.status !== "PREPARING" &&
              o.status !== "READY"
          );
          setPastOrders(filtered);
        }
      } catch {}
    }
  }, [cafe.slug, customerProfile, activeOrders]);

  useEffect(() => {
    fetchPastOrders();
  }, [fetchPastOrders]);

  // Poll live active orders from guest session / order ID / customer ID
  const fetchActiveOrders = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const headers: Record<string, string> = {};
      if (customerProfile?.id && !customerProfile.isGuest) {
        headers["x-customer-id"] = customerProfile.id;
      }
      if (customerProfile?.phone) {
        headers["x-customer-phone"] = customerProfile.phone;
      }
      const savedToken = typeof window !== "undefined" ? localStorage.getItem(`cafe_guest_token_${cafe.slug}`) : null;
      if (savedToken) {
        headers["x-guest-session-token"] = savedToken;
      }
      const savedOrderId = typeof window !== "undefined" ? localStorage.getItem(`cafe_active_order_id_${cafe.slug}`) : null;
      if (savedOrderId) {
        headers["x-order-id"] = savedOrderId;
      }

      const queryParts: string[] = [];
      if (customerProfile?.id && !customerProfile.isGuest) {
        queryParts.push(`customerId=${encodeURIComponent(customerProfile.id)}`);
      }
      if (customerProfile?.phone) {
        queryParts.push(`phone=${encodeURIComponent(customerProfile.phone)}`);
      }
      if (savedOrderId) {
        queryParts.push(`orderId=${encodeURIComponent(savedOrderId)}`);
      }
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
          try {
            localStorage.setItem(`cafe_active_order_id_${cafe.slug}`, latest.id);
            localStorage.setItem(`cafe_active_order_num_${cafe.slug}`, latest.orderNumber);
          } catch {}
        } else if (json.isTerminal || json.data.length === 0) {
          setActiveOrders([]);
          try {
            localStorage.removeItem(`cafe_active_order_id_${cafe.slug}`);
            localStorage.removeItem(`cafe_active_order_num_${cafe.slug}`);
            localStorage.removeItem(`cafe_claimed_table_${cafe.slug}`);
          } catch {}
          fetchPastOrders();
        }
      }
    } catch {
      // silent retry
    } finally {
      if (showIndicator) setIsRefreshing(false);
    }
  }, [cafe.slug, customerProfile, fetchPastOrders]);

  useEffect(() => {
    fetchActiveOrders();
    const interval = setInterval(() => fetchActiveOrders(false), 4000);
    return () => clearInterval(interval);
  }, [fetchActiveOrders]);

  // Reorder handler: puts past items back into cart and navigates to cart
  const handleReorder = (pastOrder: any) => {
    const items = pastOrder.items || [];
    if (items.length === 0) {
      router.push(`/menu/${cafe.slug}${tableQuery}`);
      return;
    }

    try {
      const savedCart = localStorage.getItem(`cafe_cart_${cafe.slug}`);
      let cart: any[] = savedCart ? JSON.parse(savedCart) : [];

      for (const item of items) {
        const menuItemId = item.menuItemId || item.id || `item_${Date.now()}`;
        const itemName = item.itemName || item.name || "Menu Item";
        const unitPrice = Number(item.unitPrice || item.price || 0);
        const quantity = Number(item.quantity || 1);
        const variantName = item.variantName || "";

        const existingIdx = cart.findIndex(
          (c) => c.menuItem?.id === menuItemId && (c.variantSnapshotText || "") === variantName
        );

        if (existingIdx > -1) {
          cart[existingIdx].quantity += quantity;
          cart[existingIdx].totalPrice = cart[existingIdx].unitPrice * cart[existingIdx].quantity;
        } else {
          cart.push({
            cartItemId: `reorder_${menuItemId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            menuItem: {
              id: menuItemId,
              cafeId: cafe.id,
              name: itemName,
              price: unitPrice,
              imageKey: item.imageKey || null,
              slug: item.slug || "",
              isAvailable: true,
            },
            quantity,
            unitPrice,
            totalPrice: unitPrice * quantity,
            customization: {},
            variantSnapshotText: variantName,
          });
        }
      }

      localStorage.setItem(`cafe_cart_${cafe.slug}`, JSON.stringify(cart));
      window.dispatchEvent(new Event("storage"));

      toast({
        title: `Reorder Added to Cart!`,
        description: `${items.length} item${items.length > 1 ? "s" : ""} from Order ${formatOrderNum(pastOrder.orderNumber)} added.`,
        variant: "success",
      });

      router.push(`/menu/${cafe.slug}/cart${tableQuery}`);
    } catch (e) {
      console.error("Reorder failed", e);
    }
  };

  const toggleItemsExpanded = (orderId: string) => {
    setExpandedOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const formatOrderNum = (num?: string | number | null) => {
    if (!num) return "...";
    const clean = String(num).replace(/^#+/, "");
    return `#${clean}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return {
          label: "In Queue",
          color: "bg-emerald-500/10 text-emerald-800 border-emerald-500/20",
          icon: <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />,
        };
      case "PREPARING":
        return {
          label: "In Kitchen",
          color: "bg-amber-500/10 text-amber-800 border-amber-500/20",
          icon: <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />,
        };
      case "READY":
        return {
          label: "Ready 🎉",
          color: "bg-sky-500/10 text-sky-800 border-sky-500/20",
          icon: <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />,
        };
      case "SERVED":
        return {
          label: "Served",
          color: "bg-stone-500/10 text-stone-700 border-stone-400/20",
          icon: <span className="w-1.5 h-1.5 rounded-full bg-stone-500 shrink-0" />,
        };
      default:
        return {
          label: status,
          color: "bg-stone-500/10 text-stone-700 border-stone-400/20",
          icon: <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0" />,
        };
    }
  };

  // Staff assistance
  const handleCallStaff = async (type: "CALL_WAITER" | "NEED_WATER") => {
    try {
      const payload = {
        tableId: table?.id || null,
        tableNameSnapshot: cleanTableNum ? `Table ${cleanTableNum}` : "Customer Counter",
        requestType: type,
        notes: null,
      };

      const res = await fetch(`/api/cafe/${cafe.slug}/service-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error();

      toast({
        title: "Staff Alerted",
        description: type === "CALL_WAITER" ? "A waiter is on the way." : "Fresh water requested.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Could not alert staff",
        description: "Please speak to a staff member directly.",
        variant: "danger",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--cafe-background)] text-[var(--color-foreground)] pb-28 relative overflow-x-hidden selection:bg-[var(--color-primary-light)]">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. RICH THEMED GRADIENT & AMBIENT BLOOM BACKDROP (SAME AS HOME)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="absolute top-0 inset-x-0 h-[460px] pointer-events-none -z-0 overflow-hidden select-none">
        <div className={`absolute inset-0 bg-gradient-to-b ${visualTheme.backdropBase}`} />
        <div className={`absolute -top-20 left-1/2 -translate-x-1/2 w-[420px] h-[360px] rounded-full bg-gradient-to-b ${visualTheme.radialBloom} blur-3xl`} />
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
          2. FROSTED GLASS HEADER BAR
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="sticky top-0 z-30 px-4 pt-3.5 pb-2">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => router.push(`/menu/${cafe.slug}${tableQuery}`)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#1C1D1A] py-1.5 px-3 rounded-full bg-white/70 hover:bg-white/95 border border-white/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.85),0_2px_6px_rgba(0,0,0,0.05)] transition-all cursor-pointer active:scale-95"
          >
            <IconArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Menu</span>
          </button>

          <div className="text-center min-w-0">
            <h1 className="text-sm font-extrabold text-[#1C1D1A] tracking-tight truncate">
              Your Orders
            </h1>
            <p className="text-[11px] text-[#73716B] truncate">
              {cafe.name}
              {cleanTableNum && (
                <>
                  <span> • </span>
                  <span className="font-semibold text-stone-900">Table {cleanTableNum}</span>
                </>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchActiveOrders(true)}
            title="Refresh Orders"
            className="w-8 h-8 rounded-full bg-white/70 hover:bg-white/95 border border-white/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.85),0_2px_6px_rgba(0,0,0,0.05)] flex items-center justify-center text-[#73716B] hover:text-[#1C1D1A] transition-all cursor-pointer active:scale-90"
          >
            <IconRefresh className={`w-3.5 h-3.5 stroke-[2.4] ${isRefreshing ? "animate-spin text-stone-900" : ""}`} />
          </button>
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. MAIN CONTENT: COMPACT CARDS WITH CENTER BEND EFFECT
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <main className="max-w-md mx-auto px-4 pt-2 space-y-3.5 relative z-10">
        {/* Section Header */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-[#50504f]">
            Active Orders <span className="text-[#1C1D1A]">({activeOrders.length})</span>
          </h2>
          {activeOrders.length > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/75 backdrop-blur-md border border-black/[0.06] shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.04)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600" />
              </span>
              <span className="text-[10px] font-bold text-emerald-800 tracking-tight">Live Updates</span>
            </div>
          )}
        </div>

        {/* Empty State */}
        {activeOrders.length === 0 ? (
          <div className="p-6 text-center bg-white/80 backdrop-blur-md rounded-3xl border border-white/80 shadow-xs space-y-2.5 my-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400">
              <ClocheIcon className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-[#1C1D1A]">
                No active orders right now
              </h3>
              <p className="text-[11px] text-[#73716B]">
                Your kitchen orders will appear here automatically with live tracking.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/menu/${cafe.slug}${tableQuery}`)}
              style={{
                backgroundColor: visualTheme.avatarFallbackBg,
                boxShadow:
                  "inset 0 1.5px 2px rgba(255,255,255,0.65), inset 0 -1.5px 2px rgba(0,0,0,0.2), 0 4px 14px " +
                  (visualTheme.buttonShadow || "rgba(0,0,0,0.15)"),
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white text-[11px] font-bold transition-transform active:scale-95 cursor-pointer mt-1"
            >
              <IconToolsKitchen2 className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Explore Menu</span>
            </button>
          </div>
        ) : (
          /* Active Orders: Signature Center Bend Sculpted Cards */
          <div className="space-y-3">
            {activeOrders.map((ord) => {
              const statusBadge = getStatusBadge(ord.status);
              const isPaid = ord.paymentStatus === "PAID";
              const isExpanded = !!expandedOrderIds[ord.id];
              const items = ord.items || [];
              const visibleItems = isExpanded ? items : items.slice(0, 3);
              const extraCount = items.length - 3;
              const waitTime = calculateOrderWaitTime(items);

              return (
                <motion.div
                  key={ord.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative rounded-3xl drop-shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden transition-all"
                >
                  {/* SIGNATURE CENTER BEND SURFACE SVG (Themed Primary Gradient & Top Bend Dip) */}
                  <svg
                    viewBox="0 0 400 400"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id={`orderCardGrad-${ord.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={themeOpaqueColors.topTint} />
                        <stop offset="28%" stopColor={themeOpaqueColors.midTint} />
                        <stop offset="75%" stopColor="#FFFFFF" />
                        <stop offset="100%" stopColor="#FFFFFF" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,22 C 0,10 18,0 48,0 C 90,0 120,14 200,14 C 280,14 310,0 352,0 C 382,0 400,10 400,22 L 400,374 C 400,390 388,400 372,400 L 28,400 C 12,400 0,388 0,372 Z"
                      fill={`url(#orderCardGrad-${ord.id})`}
                      stroke="rgba(0, 0, 0, 0.08)"
                      strokeWidth="1.2"
                    />
                  </svg>

                  {/* Card Content (Clean & Compact) */}
                  <div className="relative z-10 px-4 pt-3.5 pb-3 space-y-2 text-left">
                    {/* Header Row: Order Number + Table info + Status Pill */}
                    <div className="flex items-start justify-between gap-2 border-b border-black/[0.04] pb-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-[13.5px] text-[#1C1D1A] tracking-tight">
                            Order {formatOrderNum(ord.orderNumber)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10.5px] text-[#73716B]">
                          {ord.orderType === "TAKEAWAY" ? (
                            <>
                              <IconShoppingBag className="w-3 h-3 text-[#8C8A84]" />
                              <span>Takeaway</span>
                            </>
                          ) : (
                            <>
                              <IconArmchair className="w-3 h-3 text-[#8C8A84]" />
                              <span>Table {ord.tableNameSnapshot?.replace(/^table\s*/i, "") || cleanTableNum || "01"}</span>
                            </>
                          )}
                          {waitTime && ord.status !== "READY" && ord.status !== "SERVED" && (
                            <>
                              <span>•</span>
                              <span className="text-stone-800 font-semibold">
                                {waitTime.text}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Compact Status Pill */}
                      <div
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-xs ${statusBadge.color}`}
                      >
                        {statusBadge.icon}
                        <span>{statusBadge.label}</span>
                      </div>
                    </div>

                    {/* Items List Preview (Ultra Compact) */}
                    <div className="space-y-1 text-xs">
                      {visibleItems.map((it) => (
                        <div key={it.id} className="flex justify-between items-center text-[11.5px] py-0.2">
                          <span className="truncate pr-2 text-[#1C1D1A]">
                            <span className="font-bold text-[#1C1D1A]">{it.quantity}x</span>{" "}
                            <span>{it.itemName}</span>
                            {it.variantName ? (
                              <span className="text-[#8C8A84] text-[10px] ml-1">
                                ({it.variantName})
                              </span>
                            ) : null}
                          </span>
                          <span className="font-mono font-medium text-stone-700 shrink-0">
                            ₹{it.itemTotal}
                          </span>
                        </div>
                      ))}

                      {/* Expand / Collapse Button if > 3 items */}
                      {extraCount > 0 && (
                        <div className="pt-0.5 text-center">
                          <button
                            type="button"
                            onClick={() => toggleItemsExpanded(ord.id)}
                            className="text-[10px] font-semibold text-[#73716B] hover:text-[#1C1D1A] inline-flex items-center gap-0.5 cursor-pointer underline underline-offset-2 py-0.2"
                          >
                            {isExpanded ? (
                              <>
                                <span>Show less</span>
                                <IconChevronUp className="w-3 h-3 stroke-[2]" />
                              </>
                            ) : (
                              <>
                                <span>View {extraCount} more item{extraCount > 1 ? "s" : ""}</span>
                                <IconChevronDown className="w-3 h-3 stroke-[2]" />
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Total & Payment Badge */}
                    <div className="flex justify-between items-center pt-1.5 border-t border-black/[0.04]">
                      <span className="text-[11px] text-[#73716B] font-medium">Total Amount</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-extrabold text-xs text-[#1C1D1A]">
                          ₹{ord.total?.toLocaleString("en-IN") || 0}
                        </span>
                        {isPaid ? (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 tracking-wider">
                            Paid
                          </span>
                        ) : ord.paymentStatus === "PENDING_VERIFICATION" ? (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 tracking-wider">
                            Verifying
                          </span>
                        ) : ord.paymentStatus === "PAYMENT_REJECTED" ? (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 border border-rose-500/20 tracking-wider">
                            Rejected
                          </span>
                        ) : (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 tracking-wider">
                            Unpaid
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Compact Action Buttons Row (Inner Shadow & Inset 3D Effect) */}
                    <div className="pt-1.5 flex items-center gap-1.5">
                      {/* Track Live Order CTA (Primary Theme Pill with Inset Depth) */}
                      <button
                        type="button"
                        onClick={() => {
                          setTrackerOrderId(ord.id);
                          setIsLiveTrackerOpen(true);
                        }}
                        style={{
                          backgroundColor: visualTheme.avatarFallbackBg,
                          boxShadow:
                            "inset 0 1.5px 2px rgba(255,255,255,0.65), inset 0 -1.5px 2px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.14)",
                        }}
                        className="flex-1 py-1.5 px-3 rounded-full text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
                      >
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-85" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                        </span>
                        <span>Track Live Order</span>
                      </button>

                      {/* View Details CTA (Clean Compact Pill with Inset Glow) */}
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/menu/${cafe.slug}/orders/${ord.id}${tableQuery}`)
                        }
                        className="py-1.5 px-3 rounded-full bg-white/90 hover:bg-white text-[#1C1D1A] text-[11px] font-semibold border border-black/[0.08] shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.9),0_1.5px_3px_rgba(0,0,0,0.05)] flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                      >
                        <span>View Details</span>
                        <IconChevronRight className="w-3 h-3 stroke-[2.5]" />
                      </button>

                      {/* Quick Pay CTA if unpaid */}
                      {!isPaid && (
                        <button
                          type="button"
                          onClick={() => {
                            setUpiOrderData({
                              orderId: ord.id,
                              amount: ord.total,
                              orderNumber: ord.orderNumber,
                            });
                            setIsUpiModalOpen(true);
                          }}
                          className={`py-1.5 px-2.5 rounded-full ${
                            ord.paymentStatus === "PENDING_VERIFICATION"
                              ? "bg-amber-600 hover:bg-amber-700 text-white"
                              : ord.paymentStatus === "PAYMENT_REJECTED"
                              ? "bg-rose-600 hover:bg-rose-700 text-white"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          } text-[11px] font-bold flex items-center justify-center gap-1 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.45),inset_0_-1.5px_2px_rgba(0,0,0,0.2),0_2px_6px_rgba(0,0,0,0.12)] transition-transform active:scale-95 cursor-pointer whitespace-nowrap`}
                        >
                          <IconQrcode className="w-3 h-3 stroke-[2.2]" />
                          <span>
                            {ord.paymentStatus === "PENDING_VERIFICATION"
                              ? "QR"
                              : ord.paymentStatus === "PAYMENT_REJECTED"
                              ? "Retry"
                              : "Pay"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Past Orders Section — Strictly for Logged-In Customers */}
        {isLoggedIn && pastOrders.length > 0 && (() => {
          const PAST_ORDERS_PREVIEW_LIMIT = 3;
          const displayedPastOrders = showAllPastOrders
            ? pastOrders
            : pastOrders.slice(0, PAST_ORDERS_PREVIEW_LIMIT);

          return (
            <section className="pt-2 space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-[#50504f]">
                  Past Orders <span className="text-[#1C1D1A]">({pastOrders.length})</span>
                </h2>
                <span className="text-[10px] font-semibold text-[#73716B]">
                  Receipts & Reorders
                </span>
              </div>

              {/* Ultra-compact, sleek past order pills with center bend & subtle inner shadow */}
              <div className="space-y-1.5">
                {displayedPastOrders.map((past, idx) => (
                  <motion.div
                    key={past.id || idx}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative transition-all"
                  >
                    {/* Sculpted Center Bend SVG Surface (More shade in gradient form + very small inner shadow) */}
                    <svg
                      viewBox="0 0 400 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id={`pastOrderGrad-${past.id || idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={`rgba(${Math.round(themeRgb.r * 0.72)}, ${Math.round(themeRgb.g * 0.72)}, ${Math.round(themeRgb.b * 0.72)}, 0.34)`} />
                          <stop offset="6%" stopColor={`rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.28)`} />
                          <stop offset="45%" stopColor={`rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.20)`} />
                          <stop offset="100%" stopColor={`rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.12)`} />
                        </linearGradient>

                        {/* Very small, delicate inner shadow filter strictly inside the path */}
                        <filter id={`smallInnerShadow-${past.id || idx}`} x="-2%" y="-2%" width="104%" height="104%">
                          <feOffset dx="0" dy="1" />
                          <feGaussianBlur stdDeviation="0.8" result="offset-blur" />
                          <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                          <feFlood floodColor={`rgba(${Math.round(themeRgb.r * 0.45)}, ${Math.round(themeRgb.g * 0.45)}, ${Math.round(themeRgb.b * 0.45)}, 0.26)`} result="color" />
                          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                        </filter>
                      </defs>

                      {/* Sculpted Center Bend Base Surface with Gradient and small inner shadow */}
                      <path
                        d="M 0,24 C 0,11 11,0 24,0 C 90,0 135,7 200,7 C 265,7 310,0 376,0 C 389,0 400,11 400,24 C 400,37 389,48 376,48 L 24,48 C 11,48 0,37 0,24 Z"
                        fill={`url(#pastOrderGrad-${past.id || idx})`}
                        filter={`url(#smallInnerShadow-${past.id || idx})`}
                      />
                    </svg>

                    {/* Left: Order # and Total | Right: View & Reorder Compact Pills */}
                    <div className="relative z-10 px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-extrabold text-[12.5px] text-[#1C1D1A] tracking-tight whitespace-nowrap">
                          Order {formatOrderNum(past.orderNumber)}
                        </span>
                        <span className="text-[#8C8A84] text-[11px]">•</span>
                        <span className="font-mono font-bold text-xs text-[#1C1D1A] whitespace-nowrap">
                          ₹{past.total?.toLocaleString("en-IN") || 0}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/menu/${cafe.slug}/orders/${past.id}${tableQuery}`)
                          }
                          className="py-1 px-2.5 rounded-full bg-white/85 hover:bg-white text-[#1C1D1A] text-[10.5px] font-semibold flex items-center gap-0.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                        >
                          <span>View</span>
                          <IconChevronRight className="w-3 h-3 stroke-[2.2]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReorder(past)}
                          style={{
                            backgroundColor: visualTheme.avatarFallbackBg,
                            boxShadow: "inset 0 1px 1.5px rgba(255,255,255,0.45)",
                          }}
                          className="py-1 px-3 rounded-full text-white text-[10.5px] font-bold flex items-center gap-1 transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
                        >
                          <IconRepeat className="w-3 h-3 stroke-[2.5]" />
                          <span>Reorder</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Show All / Show Less Toggle when more than 3 past orders */}
              {pastOrders.length > PAST_ORDERS_PREVIEW_LIMIT && (
                <button
                  type="button"
                  onClick={() => setShowAllPastOrders((prev) => !prev)}
                  className="w-full py-2 text-[11px] font-bold text-[#55534E] flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer mt-1"
                >
                  <span>
                    {showAllPastOrders
                      ? "Show less"
                      : `See all past orders (${pastOrders.length})`}
                  </span>
                  {showAllPastOrders ? (
                    <IconChevronUp className="w-3.5 h-3.5 stroke-[2.4]" />
                  ) : (
                    <IconChevronDown className="w-3.5 h-3.5 stroke-[2.4]" />
                  )}
                </button>
              )}
            </section>
          );
        })()}

        {/* Quick Assistance Callout */}
        <section className="pt-1">
          <div className="p-3 rounded-2xl bg-white/60 backdrop-blur-xs border border-dashed border-stone-300 text-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-[#1C1D1A] text-[11.5px]">
                {cleanTableNum || table || activeOrders.some((o) => o.orderType === "DINE_IN")
                  ? "Need anything at your table?"
                  : "Need assistance with your pickup?"}
              </span>
              <p className="text-[10.5px] text-[#8C8A84]">
                {cleanTableNum || table || activeOrders.some((o) => o.orderType === "DINE_IN")
                  ? "Call waiter or request clean water"
                  : "Barista counter & takeaway dispatch"}
              </p>
            </div>
            {cleanTableNum || table || activeOrders.some((o) => o.orderType === "DINE_IN") ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCallStaff("CALL_WAITER")}
                  className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10.5px] font-semibold flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                >
                  <IconBellRinging className="w-3 h-3 text-amber-600" />
                  <span>Waiter</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCallStaff("NEED_WATER")}
                  className="px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-[10.5px] font-semibold flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                >
                  <IconDroplet className="w-3 h-3 text-sky-600" />
                  <span>Water</span>
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. FLOATING BOTTOM NAVIGATION DOCK (EXACT SAME AS HOME SCREEN)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-[360px] pointer-events-auto">
        <nav
          className="relative backdrop-blur-2xl rounded-full border border-white/80 p-1.5 flex items-center justify-between"
          style={{
            backgroundColor: `${visualTheme.dockBg}d9`,
            boxShadow:
              "inset 0 1.5px 3px rgba(255,255,255,0.95), 0 6px 20px -2px rgba(0,0,0,0.08), 0 2px 6px -1px rgba(0,0,0,0.04)",
          }}
        >
          {/* Home */}
          <button
            type="button"
            onClick={() => router.push(`/menu/${cafe.slug}${tableQuery}`)}
            className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full text-[#6B7280] hover:text-[#1C1D1A] transition-colors cursor-pointer"
            title="Menu Home"
          >
            <IconSmartHome className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Full Menu / Categories */}
          <button
            type="button"
            onClick={() => router.push(`/menu/${cafe.slug}/all-menu${tableQuery}`)}
            className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full text-[#6B7280] hover:text-[#1C1D1A] transition-colors cursor-pointer"
            title="All Menu Items"
          >
            <IconToolsKitchen2 className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Cart */}
          <button
            type="button"
            onClick={() => router.push(`/menu/${cafe.slug}/cart${tableQuery}`)}
            className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full text-[#6B7280] hover:text-[#1C1D1A] transition-colors cursor-pointer"
            title="View Cart"
          >
            <IconShoppingCart className="w-5 h-5 stroke-[2]" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 z-20 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9.5px] font-bold font-mono flex items-center justify-center shadow-xs border border-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* Orders (ACTIVE TAB WITH SIGNATURE PILL) */}
          <button
            type="button"
            className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full cursor-pointer focus:outline-none"
            title="Orders"
          >
            <motion.div
              layoutId="floatingDockActivePill"
              className={`absolute inset-0 rounded-full bg-gradient-to-tr ${visualTheme.dockActiveGradient}`}
              style={{
                boxShadow:
                  "inset 0 1.5px 2px rgba(255,255,255,0.65), inset 0 -1.5px 2px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.14)",
              }}
              transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
            />
            <motion.span
              animate={{ scale: 1.08, y: -0.5 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="relative z-10 flex items-center justify-center text-white"
            >
              <IconClipboardList className="w-5 h-5 stroke-[2]" />
            </motion.span>
            {activeOrders.length > 0 && (
              <span className="absolute top-1 right-1 z-20 min-w-4 h-4 px-1 rounded-full bg-emerald-400 text-white text-[9.5px] font-bold font-mono flex items-center justify-center shadow-xs border border-white">
                {activeOrders.length}
              </span>
            )}
          </button>

          {/* Offers */}
          <button
            type="button"
            onClick={() => router.push(`/menu/${cafe.slug}/all-menu?diet=BESTSELLER${tableQuery}`)}
            className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full text-[#6B7280] hover:text-[#1C1D1A] transition-colors cursor-pointer"
            title="Special Offers"
          >
            <IconTag className="w-5 h-5 stroke-[2]" />
          </button>
        </nav>
      </div>

      {/* Integrated Live Tracker Modal */}
      {(trackerOrderId || activeOrders.length > 0) && (
        <LiveOrderTrackerModal
          orderId={trackerOrderId || activeOrders[activeOrders.length - 1]?.id}
          activeOrders={activeOrders}
          customerId={customerProfile?.id || null}
          cafeSlug={cafe.slug}
          digitalMenuTheme={digitalMenuTheme}
          isOpen={isLiveTrackerOpen}
          onClose={() => setIsLiveTrackerOpen(false)}
          onRefreshActiveOrders={setActiveOrders}
          onCallStaff={(type) => handleCallStaff(type)}
          onOpenUpiPay={(ord) => {
            setUpiOrderData({
              orderId: ord.id,
              amount: ord.total,
              orderNumber: ord.orderNumber,
            });
            setIsUpiModalOpen(true);
          }}
          onOrderMore={() => {
            setIsLiveTrackerOpen(false);
            router.push(`/menu/${cafe.slug}${tableQuery}`);
          }}
        />
      )}

      {/* Instant UPI Payment Modal */}
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
          digitalMenuTheme={digitalMenuTheme}
          onClose={() => {
            setIsUpiModalOpen(false);
            setUpiOrderData(null);
          }}
          onConfirmPaid={(method) => {
            setIsUpiModalOpen(false);
            setUpiOrderData(null);
            fetchActiveOrders(true);
            if (method === "CASH") {
              toast({
                title: "Cash at Counter Selected",
                description: `Please pay ₹${upiOrderData.amount.toLocaleString("en-IN")} at the counter or to your server.`,
                variant: "info",
              });
            } else {
              toast({
                title: "Payment Reported",
                description: "Status is now Pending Verification. Staff will verify your transaction shortly.",
                variant: "success",
              });
            }
          }}
        />
      )}
    </div>
  );
};
