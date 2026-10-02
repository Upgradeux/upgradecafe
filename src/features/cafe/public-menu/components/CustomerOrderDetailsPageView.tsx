"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Cafe } from "@/lib/db/schema/cafes";
import { Table } from "@/lib/db/schema/tables";
import { OrderWithItems } from "@/features/cafe/orders/types";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import { calculateOrderWaitTime } from "@/features/cafe/orders/utils/wait-time";
import { LiveOrderTrackerModal } from "./LiveOrderTrackerModal";
import { CustomerUpiModal } from "./CustomerUpiModal";
import { DigitalReceiptCard } from "./DigitalReceiptCard";
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
  IconRefresh,
  IconPlus,
  IconBellRinging,
  IconDroplet,
  IconCopy,
  IconShare,
  IconRepeat,
  IconAlertCircle,
} from "@tabler/icons-react";

interface CustomerOrderDetailsPageViewProps {
  order: OrderWithItems;
  cafe: Cafe;
  settings?: any;
  table: Table | null;
  tableParamName: string | null;
  digitalMenuTheme?: string;
}

export const CustomerOrderDetailsPageView: React.FC<CustomerOrderDetailsPageViewProps> = ({
  order: initialOrder,
  cafe,
  settings,
  table,
  tableParamName,
  digitalMenuTheme,
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const visualTheme = getDigitalMenuVisualTheme(digitalMenuTheme || "roast");

  const [order, setOrder] = useState<OrderWithItems>(initialOrder);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLiveTrackerOpen, setIsLiveTrackerOpen] = useState(false);
  const [upiOrderData, setUpiOrderData] = useState<{
    orderId?: string;
    amount: number;
    orderNumber: string;
  } | null>(null);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);

  const currentStatus = order.status || "NEW";
  const isPastOrder = currentStatus === "COMPLETED" || currentStatus === "CANCELLED";
  const isPaid = order.paymentStatus === "PAID";

  // Clean table name (avoids "Table Table 01")
  const rawTable = table?.tableNumber || tableParamName || order.tableNameSnapshot || null;
  const cleanTableNum = rawTable
    ? rawTable.toLowerCase().startsWith("table")
      ? rawTable.replace(/^table\s*/i, "").trim()
      : rawTable.trim()
    : null;
  const tableQuery = cleanTableNum ? `?table=${encodeURIComponent(cleanTableNum)}` : "";

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
      topTint: blend(0.18),
      midTint: blend(0.06),
    };
  }, [themeRgb]);

  // Poll live single order status (only if order is still active)
  const fetchOrder = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/cafe/${cafe.slug}/orders/${order.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrder(json.data);
      }
    } catch {
      // silent retry
    } finally {
      if (showIndicator) setIsRefreshing(false);
    }
  }, [cafe.slug, order.id]);

  useEffect(() => {
    fetchOrder();
    if (isPastOrder) return;
    const interval = setInterval(() => fetchOrder(false), 4000);
    return () => clearInterval(interval);
  }, [fetchOrder, isPastOrder]);

  useEffect(() => {
    if (isPastOrder) {
      try {
        const savedOrderId = localStorage.getItem(`cafe_active_order_id_${cafe.slug}`);
        if (savedOrderId === order.id) {
          localStorage.removeItem(`cafe_active_order_id_${cafe.slug}`);
          localStorage.removeItem(`cafe_active_order_num_${cafe.slug}`);
          localStorage.removeItem(`cafe_claimed_table_${cafe.slug}`);
        }
      } catch {}
    }
  }, [isPastOrder, cafe.slug, order.id]);

  const calculatedWaitTime = useMemo(() => {
    if (isPastOrder || !order.items) return null;
    return calculateOrderWaitTime(order.items);
  }, [isPastOrder, order.items]);

  const formatOrderNum = (num?: string | number | null) => {
    if (!num) return "...";
    const clean = String(num).replace(/^#+/, "");
    return `#${clean}`;
  };

  const handleShareOrder = async () => {
    if (typeof window === "undefined") return;
    const shareData = {
      title: `Order #${order.orderNumber} • ${cafe.name}`,
      text: `Receipt for Order #${order.orderNumber} at ${cafe.name}`,
      url: window.location.href,
    };
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied!",
          description: "Receipt link copied to clipboard.",
          variant: "success",
        });
      }
    } catch {
      // User cancelled share
    }
  };

  const handleReorder = () => {
    const items = order.items || [];
    if (items.length === 0) {
      router.push(`/menu/${cafe.slug}${tableQuery}`);
      return;
    }

    try {
      const savedCart = localStorage.getItem(`cafe_cart_${cafe.slug}`);
      let cart: any[] = savedCart ? JSON.parse(savedCart) : [];

      for (const item of items) {
        const menuItemId = item.menuItemId || item.id || `item_${Date.now()}`;
        const itemName = item.itemName || "Menu Item";
        const unitPrice = Number(item.unitPrice || 0);
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
              imageKey: null,
              slug: "",
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
        description: `${items.length} item${items.length > 1 ? "s" : ""} added to your cart.`,
        variant: "success",
      });

      router.push(`/menu/${cafe.slug}/cart${tableQuery}`);
    } catch (e) {
      console.error("Reorder failed", e);
    }
  };

  const steps = [
    {
      key: "NEW",
      label: "Received",
      isDone: ["NEW", "PREPARING", "READY", "SERVED", "COMPLETED"].includes(currentStatus),
      isCurrent: currentStatus === "NEW",
    },
    {
      key: "PREPARING",
      label: "In Kitchen",
      isDone: ["PREPARING", "READY", "SERVED", "COMPLETED"].includes(currentStatus),
      isCurrent: currentStatus === "PREPARING",
    },
    {
      key: "READY",
      label: "Ready",
      isDone: ["READY", "SERVED", "COMPLETED"].includes(currentStatus),
      isCurrent: currentStatus === "READY",
    },
    {
      key: "SERVED",
      label: "Served",
      isDone: ["SERVED", "COMPLETED"].includes(currentStatus),
      isCurrent: ["SERVED", "COMPLETED"].includes(currentStatus),
    },
  ];

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

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.orderNumber || order.id);
    toast({
      title: "Order ID Copied",
      description: `Order ${formatOrderNum(order.orderNumber)} copied to clipboard.`,
      variant: "success",
    });
  };

  return (
    <div className="min-h-screen bg-[var(--cafe-background)] text-[var(--color-foreground)] pb-24 relative overflow-x-hidden selection:bg-[var(--color-primary-light)]">
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
          2. FROSTED GLASS HEADER
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="sticky top-0 z-30 px-4 pt-3.5 pb-2">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => router.push(`/menu/${cafe.slug}/orders${tableQuery}`)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#1C1D1A] py-1.5 px-3 rounded-full bg-white/70 hover:bg-white/95 border border-white/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.85),0_2px_6px_rgba(0,0,0,0.05)] transition-all cursor-pointer active:scale-95"
          >
            <IconArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Orders</span>
          </button>

          <div className="text-center min-w-0">
            <h1 className="text-sm font-extrabold text-[#1C1D1A] tracking-tight truncate">
              Order {formatOrderNum(order.orderNumber)}
            </h1>
            <p className="text-[11px] text-[#73716B] truncate">
              {order.orderType === "TAKEAWAY"
                ? "Takeaway"
                : cleanTableNum
                ? `Dine-In • Table ${cleanTableNum}`
                : "Dine-In"}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleShareOrder}
              title="Share / Copy Receipt Link"
              className="w-8 h-8 rounded-full bg-white/70 hover:bg-white/95 border border-white/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.85),0_2px_6px_rgba(0,0,0,0.05)] flex items-center justify-center text-[#73716B] hover:text-[#1C1D1A] transition-all cursor-pointer active:scale-90"
            >
              <IconShare className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
            <button
              type="button"
              onClick={() => fetchOrder(true)}
              title="Refresh Status"
              className="w-8 h-8 rounded-full bg-white/70 hover:bg-white/95 border border-white/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.85),0_2px_6px_rgba(0,0,0,0.05)] flex items-center justify-center text-[#73716B] hover:text-[#1C1D1A] transition-all cursor-pointer active:scale-90"
            >
              <IconRefresh className={`w-3.5 h-3.5 stroke-[2.4] ${isRefreshing ? "animate-spin text-stone-900" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. MAIN CONTENT:
             - Completed Order: Dedicated Dynamic Digital Receipt Experience
             - Active Order: Signature Live Tracker & Kitchen Progress Timeline
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <main className="max-w-md mx-auto px-4 pt-2 space-y-3.5 relative z-10">
        {isPastOrder ? (
          /* ═════════════════════════════════════════════════════════════════
             COMPLETED ORDER EXPERIENCE: DYNAMIC DIGITAL RECEIPT
             ═════════════════════════════════════════════════════════════════ */
          <div className="space-y-4 pt-1 animate-in fade-in duration-300">
            {/* Themed Dynamic Digital Receipt Paper */}
            <DigitalReceiptCard
              order={order}
              cafe={cafe}
              table={table}
              tableParamName={cleanTableNum}
              settings={settings}
              digitalMenuTheme={digitalMenuTheme}
            />

            {/* Quick Action CTAs Below Receipt */}
            <div className="max-w-[390px] sm:max-w-[420px] mx-auto space-y-2.5 px-1 pt-1">
              <button
                type="button"
                onClick={handleReorder}
                style={{
                  backgroundColor: visualTheme.avatarFallbackBg,
                  boxShadow: `inset 0 1.5px 2px rgba(255, 255, 255, 0.45), inset 0 -2px 4px rgba(0, 0, 0, 0.22), 0 4px 14px ${visualTheme.buttonShadow || "rgba(0, 0, 0, 0.15)"}`,
                }}
                className={`w-full py-3 rounded-full font-bold text-xs sm:text-sm text-white ring-1 ring-white/25 active:scale-[0.98] transition-all cursor-pointer bg-gradient-to-r ${visualTheme.buttonGradient} flex items-center justify-center gap-2`}
              >
                <IconRepeat className="w-4 h-4 stroke-[2.4]" />
                <span>Reorder These Items</span>
              </button>

              <button
                type="button"
                onClick={() => router.push(`/menu/${cafe.slug}${tableQuery}`)}
                className="w-full py-2.5 rounded-full bg-[#EFE9DF] hover:bg-[#E8E1D5] border border-stone-300/40 text-xs sm:text-sm font-semibold text-[#1C1D1A] shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.9),0_1.5px_3px_rgba(0,0,0,0.04)] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <IconPlus className="w-3.5 h-3.5 stroke-[2.4]" />
                <span>Explore Menu</span>
              </button>
            </div>
          </div>
        ) : (
          /* ═════════════════════════════════════════════════════════════════
             ACTIVE ORDER EXPERIENCE: LIVE TRACKER & KITCHEN TIMELINE
             ═════════════════════════════════════════════════════════════════ */
          <>
            {/* Hero Live Status Card (Signature Center Bend & Themed Lighter Primary Gradient) */}
            <div className="relative rounded-3xl drop-shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
              <svg
                viewBox="0 0 400 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="orderDetailsHeroGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={themeOpaqueColors.topTint} />
                    <stop offset="28%" stopColor={themeOpaqueColors.midTint} />
                    <stop offset="75%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#FFFFFF" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0,22 C 0,10 18,0 48,0 C 90,0 120,14 200,14 C 280,14 310,0 352,0 C 382,0 400,10 400,22 L 400,374 C 400,390 388,400 372,400 L 28,400 C 12,400 0,388 0,372 Z"
                  fill="url(#orderDetailsHeroGrad)"
                  stroke="rgba(0, 0, 0, 0.08)"
                  strokeWidth="1.2"
                />
              </svg>

              <div className="relative z-10 p-5 text-center space-y-3">
                {/* Animated Status Icon */}
                <div className="relative w-13 h-13 mx-auto flex items-center justify-center">
                  <div
                    className="w-13 h-13 rounded-full flex items-center justify-center text-white shadow-md transition-all"
                    style={{
                      backgroundColor: visualTheme.avatarFallbackBg,
                      boxShadow:
                        "inset 0 1.5px 2px rgba(255,255,255,0.65), inset 0 -1.5px 2px rgba(0,0,0,0.22), 0 4px 14px " +
                        (visualTheme.buttonShadow || "rgba(0,0,0,0.18)"),
                    }}
                  >
                    {currentStatus === "NEW" && <IconClock className="w-6 h-6 stroke-[2.4]" />}
                    {currentStatus === "PREPARING" && <IconFlame className="w-6 h-6 stroke-[2.4] animate-pulse" />}
                    {currentStatus === "READY" && <IconChefHat className="w-6 h-6 stroke-[2.4]" />}
                    {currentStatus === "SERVED" && <IconCheck className="w-6 h-6 stroke-[3]" />}
                  </div>
                </div>

                {/* Title & Status Message */}
                <div className="space-y-0.5">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-dashed inline-block"
                    style={{
                      backgroundColor: visualTheme.badgeBg,
                      color: visualTheme.badgeText,
                      borderColor: visualTheme.badgeBorder,
                    }}
                  >
                    Order {formatOrderNum(order.orderNumber)}
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#1C1D1A] tracking-tight">
                    {currentStatus === "NEW" && "Order Received • In Queue"}
                    {currentStatus === "PREPARING" && "In the Kitchen • Brewing"}
                    {currentStatus === "READY" && "Your Order is Ready! 🎉"}
                    {currentStatus === "SERVED" && "Order Served • Enjoy!"}
                  </h2>
                  {calculatedWaitTime && currentStatus !== "READY" && currentStatus !== "SERVED" && (
                    <p className="text-[11px] text-[#73716B]">
                      Estimated wait time:{" "}
                      <span className="font-bold text-[#1C1D1A]">{calculatedWaitTime.text}</span>
                    </p>
                  )}
                </div>

                {/* 4-Stage Progress Line */}
                <div className="py-1 px-1">
                  <div className="relative flex items-center justify-between">
                    {/* Background Line */}
                    <div className="absolute left-3 right-3 top-3 -translate-y-1/2 h-1 bg-black/[0.08] rounded-full z-0" />
                    {/* Active Progress */}
                    <div
                      className="absolute left-3 top-3 -translate-y-1/2 h-1 rounded-full z-0 transition-all duration-500 ease-out"
                      style={{
                        backgroundColor: visualTheme.avatarFallbackBg,
                        width:
                          currentStatus === "NEW"
                            ? "10%"
                            : currentStatus === "PREPARING"
                            ? "42%"
                            : currentStatus === "READY"
                            ? "74%"
                            : "calc(100% - 24px)",
                      }}
                    />

                    {steps.map((step) => (
                      <div key={step.key} className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all shadow-2xs ${
                            step.isCurrent
                              ? "text-white ring-2 ring-white"
                              : step.isDone
                              ? "text-white"
                              : "bg-white text-stone-400 border border-stone-200"
                          }`}
                          style={
                            step.isCurrent || step.isDone
                              ? {
                                  backgroundColor: visualTheme.avatarFallbackBg,
                                  boxShadow: step.isCurrent
                                    ? `0 0 0 2px white, 0 0 0 3px ${visualTheme.avatarFallbackBg}`
                                    : undefined,
                                }
                              : undefined
                          }
                        >
                          {step.isDone && !step.isCurrent ? (
                            <IconCheck className="w-2.5 h-2.5 stroke-[3]" />
                          ) : step.key === "PREPARING" ? (
                            <IconFlame className="w-2.5 h-2.5 stroke-[2.4]" />
                          ) : step.key === "READY" ? (
                            <IconChefHat className="w-2.5 h-2.5 stroke-[2.4]" />
                          ) : (
                            <IconClock className="w-2.5 h-2.5 stroke-[2.4]" />
                          )}
                        </div>
                        <span
                          className={`text-[9.5px] mt-1 tracking-tight font-medium ${
                            step.isCurrent
                              ? "font-bold text-[#1C1D1A]"
                              : step.isDone
                              ? "font-semibold text-[#1C1D1A]"
                              : "text-[#8C8A84]"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Open Signature Live Tracker Modal Button */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsLiveTrackerOpen(true)}
                    style={{
                      backgroundColor: visualTheme.avatarFallbackBg,
                      boxShadow:
                        "inset 0 1.5px 2px rgba(255,255,255,0.65), inset 0 -1.5px 2px rgba(0,0,0,0.22), 0 3px 10px " +
                        (visualTheme.buttonShadow || "rgba(0, 0, 0, 0.15)"),
                    }}
                    className="w-full py-2 px-4 rounded-full text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-transform active:scale-98 cursor-pointer"
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-85" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                    </span>
                    <span>Open Live Tracker Modal</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Order Details & Table Information Card */}
            <div className="p-3.5 rounded-3xl bg-white/85 backdrop-blur-xs border border-white/90 shadow-xs space-y-2 text-xs">
              <h3 className="font-bold text-[10.5px] uppercase tracking-wider text-[#73716B] border-b border-black/[0.04] pb-1.5">
                Order Information
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                <div>
                  <span className="text-[#8C8A84] block text-[10.5px]">Order Number</span>
                  <span className="font-bold text-[#1C1D1A] text-xs">
                    {formatOrderNum(order.orderNumber)}
                  </span>
                </div>

                <div>
                  <span className="text-[#8C8A84] block text-[10.5px]">Dining Option</span>
                  <span className="font-semibold text-[#1C1D1A] text-xs flex items-center gap-1">
                    {order.orderType === "TAKEAWAY" ? (
                      <>
                        <IconShoppingBag className="w-3.5 h-3.5 text-[#8C8A84]" />
                        <span>Takeaway</span>
                      </>
                    ) : (
                      <>
                        <IconArmchair className="w-3.5 h-3.5 text-[#8C8A84]" />
                        <span>Table {cleanTableNum || "01"}</span>
                      </>
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-[#8C8A84] block text-[10.5px]">Placed At</span>
                  <span className="font-medium text-[#1C1D1A] text-xs">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Just now"}
                  </span>
                </div>

                <div>
                  <span className="text-[#8C8A84] block text-[10.5px]">Payment Status</span>
                  {isPaid ? (
                    <span className="inline-block font-extrabold uppercase text-[9px] text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full tracking-wider">
                      Paid
                    </span>
                  ) : (
                    <span className="inline-block font-extrabold uppercase text-[9px] text-amber-700 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full tracking-wider">
                      Unpaid
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Itemized Order Breakdown Card */}
            <div className="p-3.5 rounded-3xl bg-white/85 backdrop-blur-xs border border-white/90 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-black/[0.04] pb-1.5">
                <h3 className="font-bold text-[10.5px] uppercase tracking-wider text-[#73716B]">
                  Items in Order ({order.items?.length || 0})
                </h3>
                <span className="text-[10px] text-[#8C8A84]">Freshly Prepared</span>
              </div>

              <div className="divide-y divide-black/[0.04] space-y-1.5">
                {order.items?.map((it) => (
                  <div key={it.id} className="pt-1.5 first:pt-0 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-[#1C1D1A] text-[11.5px]">
                          {it.quantity}x
                        </span>
                        <span className="font-semibold text-[#1C1D1A] text-[11.5px]">
                          {it.itemName}
                        </span>
                      </div>

                      {it.variantName && (
                        <p className="text-[10.5px] text-[#73716B] pl-4">
                          Option: {it.variantName}
                        </p>
                      )}

                      {it.specialInstructions && (
                        <p className="text-[10px] text-amber-700 bg-amber-50/80 px-1.5 py-0.2 rounded-md inline-block ml-4">
                          Note: {it.specialInstructions}
                        </p>
                      )}

                      {it.preparationTimeMinutes && (
                        <p className="text-[10px] text-[#8C8A84] pl-4">
                          ⏱ {it.preparationTimeMinutes} mins prep
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-xs text-[#1C1D1A]">
                        ₹{it.itemTotal}
                      </span>
                      {it.quantity > 1 && (
                        <span className="block text-[9.5px] text-[#8C8A84]">
                          ₹{it.unitPrice} each
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Summary Breakdown */}
              <div className="pt-2 border-t border-black/[0.04] space-y-1 text-xs">
                <div className="flex justify-between text-[#73716B] text-[11px]">
                  <span>Items Subtotal</span>
                  <span className="font-mono">₹{order.subtotal || order.total}</span>
                </div>

                {order.tax ? (
                  <div className="flex justify-between text-[#73716B] text-[11px]">
                    <span>GST & Taxes</span>
                    <span className="font-mono">₹{order.tax}</span>
                  </div>
                ) : null}

                {order.discount ? (
                  <div className="flex justify-between text-emerald-600 font-medium text-[11px]">
                    <span>Discount</span>
                    <span className="font-mono">-₹{order.discount}</span>
                  </div>
                ) : null}

                <div className="flex justify-between items-center pt-1.5 border-t border-black/[0.06] text-xs sm:text-sm">
                  <span className="font-bold text-[#1C1D1A]">Total Amount</span>
                  <span className="font-mono font-extrabold text-sm sm:text-base text-[#1C1D1A]">
                    ₹{order.total?.toLocaleString("en-IN") || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons for Active Order */}
            <div className="space-y-2 pt-0.5">
              {/* Payment Action / Status Box */}
              {order.paymentStatus === "PAID" ? (
                <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-center text-xs text-emerald-800 font-semibold flex items-center justify-center gap-1.5">
                  <IconCheck className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Payment Completed • Thank you!</span>
                </div>
              ) : order.paymentStatus === "PENDING_VERIFICATION" ? (
                <div className="p-2.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-xs text-amber-900 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5 text-amber-800">
                      <IconClock className="w-4 h-4 text-amber-600 stroke-[2.2]" />
                      Payment Pending Verification
                    </span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-100 font-bold text-amber-800">
                      Under Review
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700/90 leading-tight">
                    We received your payment notice. Café staff will verify it shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setUpiOrderData({
                        orderId: order.id,
                        amount: order.total,
                        orderNumber: order.orderNumber,
                      });
                      setIsUpiModalOpen(true);
                    }}
                    className="text-[11px] font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-950 inline-block cursor-pointer pt-0.5"
                  >
                    View UPI QR details again
                  </button>
                </div>
              ) : order.paymentStatus === "PAYMENT_REJECTED" ? (
                <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-xs text-rose-900 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5 text-rose-800">
                      <IconAlertCircle className="w-4 h-4 text-rose-600 stroke-[2.2]" />
                      Payment Not Verified
                    </span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-rose-100 font-bold text-rose-800">
                      Rejected
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-700/90 leading-tight">
                    Payment was not received on the café account. Please pay cash at counter or scan UPI again.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setUpiOrderData({
                        orderId: order.id,
                        amount: order.total,
                        orderNumber: order.orderNumber,
                      });
                      setIsUpiModalOpen(true);
                    }}
                    className="w-full mt-1 py-1.5 rounded-xl bg-rose-600 text-white font-semibold text-xs text-center cursor-pointer shadow-xs hover:bg-rose-700 transition-colors"
                  >
                    Retry UPI Payment
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setUpiOrderData({
                      orderId: order.id,
                      amount: order.total,
                      orderNumber: order.orderNumber,
                    });
                    setIsUpiModalOpen(true);
                  }}
                  style={{
                    boxShadow: `inset 0 1.5px 2px rgba(255, 255, 255, 0.45), inset 0 -2px 4px rgba(0, 0, 0, 0.22), 0 4px 14px ${visualTheme.buttonShadow || "rgba(0, 0, 0, 0.15)"}`,
                  }}
                  className={`w-full py-2.5 rounded-full font-bold text-xs sm:text-sm text-white ring-1 ring-white/25 active:scale-[0.98] transition-all cursor-pointer bg-gradient-to-r ${visualTheme.buttonGradient} flex items-center justify-center gap-2`}
                >
                  <IconQrcode className="w-4 h-4 stroke-[2.2]" />
                  <span>Pay ₹{order.total} via UPI QR Now</span>
                </button>
              )}

              {/* Table Assistance Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCallStaff("CALL_WAITER")}
                  className="py-1.5 px-3 rounded-xl bg-white border border-stone-200/80 hover:bg-stone-50 text-[#1C1D1A] flex items-center justify-center gap-1.5 text-xs font-semibold shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.9),0_1.5px_3px_rgba(0,0,0,0.05)] transition-all cursor-pointer active:scale-97"
                >
                  <IconBellRinging className="w-3.5 h-3.5 text-amber-500" />
                  <span>Call Waiter</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCallStaff("NEED_WATER")}
                  className="py-1.5 px-3 rounded-xl bg-white border border-stone-200/80 hover:bg-stone-50 text-[#1C1D1A] flex items-center justify-center gap-1.5 text-xs font-semibold shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.9),0_1.5px_3px_rgba(0,0,0,0.05)] transition-all cursor-pointer active:scale-97"
                >
                  <IconDroplet className="w-3.5 h-3.5 text-sky-500" />
                  <span>Need Water</span>
                </button>
              </div>

              {/* Order More Items */}
              <button
                type="button"
                onClick={() => router.push(`/menu/${cafe.slug}${tableQuery}`)}
                className="w-full py-2 rounded-full bg-white/80 hover:bg-white border border-stone-200/80 text-xs font-semibold text-[#1C1D1A] shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.9),0_1.5px_3px_rgba(0,0,0,0.04)] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <IconPlus className="w-3.5 h-3.5 stroke-[2.4]" />
                <span>Order More Items</span>
              </button>
            </div>
          </>
        )}
      </main>

      {/* Integrated Live Tracker Modal (Only for Active Orders) */}
      {!isPastOrder && (
        <LiveOrderTrackerModal
          orderId={order.id}
          activeOrders={[order]}
          cafeSlug={cafe.slug}
          digitalMenuTheme={digitalMenuTheme}
          isOpen={isLiveTrackerOpen}
          onClose={() => setIsLiveTrackerOpen(false)}
          onRefreshActiveOrders={(ords) => {
            const found = ords.find((o) => o.id === order.id);
            if (found) setOrder(found);
          }}
          onCallStaff={(type) => handleCallStaff(type)}
          onOpenUpiPay={(ord) => {
            setUpiOrderData({ amount: ord.total, orderNumber: ord.orderNumber });
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
          orderId={upiOrderData.orderId || order.id}
          cafeSlug={cafe.slug}
          cafeName={cafe.name}
          cafeLogoUrl={cafe.logoKey}
          upiId={settings?.upiId}
          merchantName={settings?.upiMerchantName}
          upiQrUrl={settings?.upiQrUrl}
          initialMode={order.paymentMethod === "CASH" ? "CASH" : "UPI"}
          digitalMenuTheme={digitalMenuTheme}
          orderType={order.orderType}
          tableName={order.tableNameSnapshot}
          onClose={() => setIsUpiModalOpen(false)}
          onConfirmPaid={(method) => {
            setIsUpiModalOpen(false);
            if (method === "CASH") {
              setOrder((prev) => ({
                ...prev,
                paymentStatus: "UNPAID",
                paymentMethod: "CASH",
              }));
              fetchOrder(true);
              toast({
                title: "Cash at Counter Selected",
                description: `Please pay ₹${upiOrderData.amount.toLocaleString("en-IN")} at the counter or to your server.`,
                variant: "info",
              });
            } else {
              setOrder((prev) => ({
                ...prev,
                paymentStatus: "PENDING_VERIFICATION",
                paymentMethod: "UPI",
              }));
              fetchOrder(true);
              toast({
                title: "Payment Reported",
                description: "Staff will verify your UPI receipt shortly.",
                variant: "success",
              });
            }
          }}
        />
      )}
    </div>
  );
};
