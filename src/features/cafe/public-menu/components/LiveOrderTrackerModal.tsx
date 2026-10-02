"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { OrderWithItems } from "@/features/cafe/orders/types";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import { calculateOrderWaitTime } from "@/features/cafe/orders/utils/wait-time";
import {
  IconCheck,
  IconClock,
  IconFlame,
  IconBellRinging,
  IconDroplet,
  IconQrcode,
  IconChefHat,
  IconArmchair,
  IconShoppingBag,
  IconPlus,
  IconX,
  IconChevronUp,
  IconChevronDown,
  IconCash,
} from "@tabler/icons-react";

interface LiveOrderTrackerModalProps {
  orderId?: string | null;
  activeOrders?: OrderWithItems[];
  customerId?: string | null;
  cafeSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onCallStaff: (type: "CALL_WAITER" | "NEED_WATER") => void;
  onOpenUpiPay: (order: OrderWithItems) => void;
  onOrderMore?: () => void;
  digitalMenuTheme?: string;
  onRefreshActiveOrders?: (orders: OrderWithItems[]) => void;
}

export const LiveOrderTrackerModal: React.FC<LiveOrderTrackerModalProps> = ({
  orderId,
  activeOrders = [],
  customerId,
  cafeSlug,
  isOpen,
  onClose,
  onCallStaff,
  onOpenUpiPay,
  onOrderMore,
  digitalMenuTheme,
  onRefreshActiveOrders,
}) => {
  const [ordersList, setOrdersList] = useState<OrderWithItems[]>(activeOrders || []);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    orderId || activeOrders?.[activeOrders.length - 1]?.id || activeOrders?.[0]?.id || null
  );
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);

  // Reset expanded items when switching order or opening/closing modal
  useEffect(() => {
    setIsItemsExpanded(false);
  }, [selectedOrderId, isOpen]);

  const visualTheme = getDigitalMenuVisualTheme(digitalMenuTheme || "roast");

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
      topTint: blend(0.24),
      midTint: blend(0.08),
      bottomTint: "#FFFFFF",
      innerShadowColor: `rgba(${r}, ${g}, ${b}, 0.18)`,
    };
  }, [themeRgb]);

  // Synchronize with activeOrders prop if passed
  useEffect(() => {
    if (activeOrders && activeOrders.length > 0) {
      setOrdersList(activeOrders);
      setSelectedOrderId((prev) => {
        if (prev && activeOrders.some((o) => o.id === prev)) {
          return prev;
        }
        return orderId || activeOrders[activeOrders.length - 1]?.id || activeOrders[0]?.id;
      });
    }
  }, [activeOrders, orderId]);

  // Poll live active orders from server-side guest session every 4 seconds while modal is open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchActiveOrders = async () => {
      try {
        const queryParts: string[] = [];
        if (customerId) queryParts.push(`customerId=${encodeURIComponent(customerId)}`);
        const targetOrderId = selectedOrderId || orderId;
        if (targetOrderId) queryParts.push(`orderId=${encodeURIComponent(targetOrderId)}`);

        let savedPhone: string | null = null;
        let savedToken: string | null = null;
        try {
          savedToken = localStorage.getItem(`cafe_guest_token_${cafeSlug}`);
          const savedProfile = localStorage.getItem(`cafe_customer_profile_${cafeSlug}`);
          if (savedProfile) {
            const parsed = JSON.parse(savedProfile);
            if (parsed.phone) savedPhone = parsed.phone;
          }
        } catch {}

        if (savedPhone) queryParts.push(`phone=${encodeURIComponent(savedPhone)}`);

        const headers: Record<string, string> = {};
        if (customerId) headers["x-customer-id"] = customerId;
        if (savedPhone) headers["x-customer-phone"] = savedPhone;
        if (targetOrderId) headers["x-order-id"] = targetOrderId;
        if (savedToken) headers["x-guest-session-token"] = savedToken;

        const url = `/api/cafe/${cafeSlug}/orders/active${queryParts.length > 0 ? `?${queryParts.join("&")}` : ""}`;
        const res = await fetch(url, {
          headers,
          credentials: "include",
        });
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.data)) {
          if (json.data.length > 0) {
            setOrdersList(json.data);
            if (onRefreshActiveOrders) {
              onRefreshActiveOrders(json.data);
            }
            setSelectedOrderId((prev) => {
              if (prev && json.data.some((o: OrderWithItems) => o.id === prev)) {
                return prev;
              }
              return json.data[json.data.length - 1].id;
            });
          } else if (json.isTerminal) {
            setOrdersList([]);
            if (onRefreshActiveOrders) {
              onRefreshActiveOrders([]);
            }
            try {
              localStorage.removeItem(`cafe_claimed_table_${cafeSlug}`);
              localStorage.removeItem(`cafe_active_order_id_${cafeSlug}`);
              localStorage.removeItem(`cafe_active_order_num_${cafeSlug}`);
            } catch {}
          }
        }
      } catch {
        // silent retry
      }
    };

    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, cafeSlug, customerId, selectedOrderId, orderId, onRefreshActiveOrders]);

  // Also fetch single order if ordersList is empty but orderId was provided
  useEffect(() => {
    if (!isOpen || ordersList.length > 0 || !orderId) return;

    let isMounted = true;
    const fetchSingle = async () => {
      try {
        const res = await fetch(`/api/cafe/${cafeSlug}/orders/${orderId}`, {
          credentials: "include",
        });
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setOrdersList([json.data]);
          setSelectedOrderId(json.data.id);
        }
      } catch {
        // silent retry
      }
    };

    fetchSingle();
  }, [isOpen, orderId, ordersList.length, cafeSlug]);

  const currentOrder: OrderWithItems | null = useMemo(() => {
    if (ordersList.length === 0) return null;
    return (
      ordersList.find((o) => o.id === selectedOrderId) ||
      ordersList[ordersList.length - 1] ||
      null
    );
  }, [ordersList, selectedOrderId]);

  const allItems = currentOrder?.items || [];
  const visibleItems = isItemsExpanded ? allItems : allItems.slice(0, 3);
  const extraItemsCount = allItems.length - 3;

  const calculatedWaitTime = useMemo(() => {
    if (!currentOrder || !currentOrder.items) return null;
    return calculateOrderWaitTime(currentOrder.items);
  }, [currentOrder]);

  const formatOrderNum = (num?: string | number | null) => {
    if (!num) return "...";
    const clean = String(num).replace(/^#+/, "");
    return `#${clean}`;
  };

  const currentStatus = currentOrder?.status || "NEW";
  const isPaid = currentOrder?.paymentStatus === "PAID";

  useEffect(() => {
    if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
      try {
        localStorage.removeItem(`cafe_claimed_table_${cafeSlug}`);
        localStorage.removeItem(`cafe_active_order_id_${cafeSlug}`);
        localStorage.removeItem(`cafe_active_order_num_${cafeSlug}`);
      } catch {}
    }
  }, [currentStatus, cafeSlug]);

  const steps = [
    {
      key: "NEW",
      label: "Received",
      isDone: ["NEW", "PREPARING", "READY", "SERVED", "COMPLETED"].includes(currentStatus),
      isCurrent: currentStatus === "NEW",
    },
    {
      key: "PREPARING",
      label: "Preparing",
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target !== e.currentTarget) return;
            onClose();
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
              if (info.offset.y > 60 || info.velocity.y > 300) {
                onClose();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm sm:max-w-md relative flex flex-col pointer-events-auto max-h-[90vh] sm:max-h-[92vh] drop-shadow-[0_12px_28px_rgba(0,0,0,0.18)] touch-pan-y"
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
                <linearGradient id="liveTrackerUnifiedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={themeOpaqueColors.topTint} />
                  <stop offset="28%" stopColor={themeOpaqueColors.midTint} />
                  <stop offset="70%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#FFFFFF" />
                </linearGradient>
              </defs>
              <path
                d="M 0,22 C 0,10 18,0 48,0 C 90,0 120,14 200,14 C 280,14 310,0 352,0 C 382,0 400,10 400,22 L 400,372 C 400,388 388,400 372,400 L 28,400 C 12,400 0,388 0,372 Z"
                fill="url(#liveTrackerUnifiedGrad)"
                stroke="rgba(0, 0, 0, 0.10)"
                strokeWidth="1.2"
              />
            </svg>

            {/* Pinned Top Center Grab Pill (Stays permanently in place, drag handle to close) */}
            <div className="absolute top-2 inset-x-0 z-30 flex justify-center pointer-events-none">
              <div className="pt-1.5 pb-2 px-6 pointer-events-auto cursor-grab active:cursor-grabbing touch-none flex justify-center">
                <div
                  className="w-10 h-1 rounded-full shadow-2xs select-none"
                  style={{
                    backgroundColor: `rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.55)`,
                  }}
                  title="Drag down to close"
                />
              </div>
            </div>

            {/* Content Body (Cleanly Spaced Inside Center Bend Surface) */}
            <div className="px-5 pt-6 pb-4 sm:pb-5 text-center space-y-2 relative z-20 flex-1 overflow-y-auto no-scrollbar">
              {!currentOrder ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-3">
                  <div
                    className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
                    style={{
                      borderColor: visualTheme.avatarFallbackBg,
                      borderTopColor: "transparent",
                    }}
                  />
                  <p className="text-xs font-semibold text-[#73716B]">Loading live order tracking...</p>
                </div>
              ) : (
                <>
                  {/* Multi-Order Selector Tabs (Compact, single-line, responsive with sliding highlight) */}
                  {ordersList.length > 1 && (
                    <div className="flex items-center justify-center pt-1 pb-0.5 px-2">
                  <div className="inline-flex items-center p-0.5 rounded-full bg-black/[0.04] border border-black/[0.06] shadow-2xs max-w-full overflow-x-auto no-scrollbar gap-1">
                    {ordersList.map((ord) => {
                      const isSelected = ord.id === currentOrder?.id;
                      const isOrdActive = ord.status === "NEW" || ord.status === "PREPARING";
                      const statusLabel =
                        ord.status === "NEW"
                          ? "In Queue"
                          : ord.status === "PREPARING"
                          ? "Kitchen"
                          : ord.status === "READY"
                          ? "Ready"
                          : ord.status === "SERVED"
                          ? "Served"
                          : ord.status.toLowerCase();

                      return (
                        <button
                          key={ord.id}
                          type="button"
                          onClick={() => setSelectedOrderId(ord.id)}
                          title={`Order ${formatOrderNum(ord.orderNumber)} • ${statusLabel}`}
                          className={`relative px-2.5 py-1 rounded-full text-[11px] flex items-center gap-1.5 cursor-pointer select-none transition-colors whitespace-nowrap shrink-0 outline-none focus:outline-none ${
                            isSelected
                              ? "text-white font-bold"
                              : "text-[#666] hover:text-[#1C1D1A] font-medium"
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="activeOrderTabHighlight"
                              className="absolute inset-0 rounded-full shadow-xs"
                              style={{
                                backgroundColor: visualTheme.avatarFallbackBg,
                              }}
                              transition={{ type: "spring", stiffness: 500, damping: 35 }}
                            />
                          )}
                          <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                                isSelected
                                  ? "bg-white"
                                  : ord.status === "NEW"
                                  ? "bg-emerald-500"
                                  : ord.status === "PREPARING"
                                  ? "bg-amber-500"
                                  : ord.status === "READY"
                                  ? "bg-sky-500 animate-pulse"
                                  : "bg-stone-400"
                              }`}
                            />
                            <span className="tracking-tight">
                              {ordersList.length <= 2 && !isSelected ? "Order " : ""}
                              {formatOrderNum(ord.orderNumber)}
                            </span>
                            {isSelected && (
                              <span className="text-[9.5px] font-semibold text-white/90">
                                · {statusLabel}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status Animated Icon Badge (Stable, no remount jump on order switch) */}
              <div className="relative w-10 h-10 mx-auto flex items-center justify-center select-none pt-0.5">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-xs text-white transition-colors duration-300"
                  style={{
                    backgroundColor: visualTheme.avatarFallbackBg,
                    boxShadow: `0 3px 10px ${visualTheme.buttonShadow || "rgba(0,0,0,0.15)"}`,
                  }}
                >
                  {currentStatus === "NEW" && <IconClock className="w-5 h-5 stroke-[2.4]" />}
                  {currentStatus === "PREPARING" && <IconFlame className="w-5 h-5 stroke-[2.4] animate-pulse" />}
                  {currentStatus === "READY" && <IconChefHat className="w-5 h-5 stroke-[2.4]" />}
                  {(currentStatus === "SERVED" || currentStatus === "COMPLETED") && (
                    <IconCheck className="w-5.5 h-5.5 stroke-[3]" />
                  )}
                  {currentStatus === "CANCELLED" && <IconX className="w-5 h-5 stroke-[2.5]" />}
                </div>
              </div>

              {/* Title & Order Badge */}
              <div className="space-y-0.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-dashed inline-block"
                  style={{
                    backgroundColor: visualTheme.badgeBg,
                    color: visualTheme.badgeText,
                    borderColor: visualTheme.badgeBorder,
                  }}
                >
                  Order {formatOrderNum(currentOrder?.orderNumber)} • Live Tracker
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-[#1C1D1A] tracking-tight">
                  {currentStatus === "NEW" && "Order Received • In Queue"}
                  {currentStatus === "PREPARING" && "In the Kitchen • Brewing"}
                  {currentStatus === "READY" && "Your Order is Ready! 🎉"}
                  {currentStatus === "SERVED" && "Order Served • Enjoy your meal!"}
                  {currentStatus === "COMPLETED" && "Order Completed"}
                  {currentStatus === "CANCELLED" && "Order Cancelled"}
                </h2>
              </div>

              {/* Estimated Wait Time: ONLY shown when owner configured prep time on items (No hardcoded fallback!) */}
              {currentStatus === "READY" || currentStatus === "SERVED" || currentStatus === "COMPLETED" ? (
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#73716B] py-0.5">
                  <IconClock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Status:</span>
                  <span className="font-bold text-emerald-600">
                    {currentStatus === "READY" ? "Ready now" : "Served"}
                  </span>
                </div>
              ) : calculatedWaitTime ? (
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#73716B] py-0.5">
                  <IconClock className="w-3.5 h-3.5 text-[#8C8A84]" />
                  <span>Estimated wait time:</span>
                  <span className="font-bold text-[#1C1D1A]">{calculatedWaitTime.text}</span>
                </div>
              ) : null}

              {/* Compact 4-Stage Horizontal Progress Tracker */}
              <div className="py-1 px-1">
                <div className="relative flex items-center justify-between">
                  {/* Background Track Line */}
                  <div className="absolute left-3 right-3 top-3 -translate-y-1/2 h-1 bg-stone-200/80 rounded-full z-0" />
                  {/* Active Track Progress Bar */}
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
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shadow-2xs ${
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
                          <IconCheck className="w-3 h-3 stroke-[3]" />
                        ) : step.key === "PREPARING" ? (
                          <IconFlame className="w-3 h-3 stroke-[2.4]" />
                        ) : step.key === "READY" ? (
                          <IconChefHat className="w-3 h-3 stroke-[2.4]" />
                        ) : step.key === "SERVED" ? (
                          <IconCheck className="w-3 h-3 stroke-[3]" />
                        ) : (
                          <IconClock className="w-3 h-3 stroke-[2.4]" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] mt-1 tracking-tight font-medium ${
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

              {/* Compact Order Details Box (Matches Order Placed Modal) */}
              <div className="px-3.5 py-2 rounded-2xl bg-white/85 border border-stone-200/60 text-xs space-y-1.5 text-left shadow-2xs backdrop-blur-xs">
                <div className="flex justify-between items-center text-[11.5px]">
                  <span className="text-[#73716B] font-medium flex items-center gap-1.5">
                    {currentOrder?.orderType === "TAKEAWAY" ? (
                      <IconShoppingBag className="w-3.5 h-3.5 text-[#8C8A84]" />
                    ) : (
                      <IconArmchair className="w-3.5 h-3.5 text-[#8C8A84]" />
                    )}
                    <span>Order Type</span>
                  </span>
                  <span className="font-semibold text-[#1C1D1A]">
                    {currentOrder?.orderType === "TAKEAWAY"
                      ? "Takeaway"
                      : `Dine-In (${currentOrder?.tableNameSnapshot || "Table"})`}
                  </span>
                </div>

                {/* Items Line Preview (Max 3 items initially, expandable with [View X more items]) */}
                {allItems.length > 0 && (
                  <div className="space-y-1 pt-1.5 border-t border-stone-100 text-[11.5px]">
                    {visibleItems.map((it) => (
                      <div key={it.id} className="flex justify-between items-center py-0.5">
                        <span className="truncate pr-2 text-[#1C1D1A]">
                          <span className="font-semibold text-[#1C1D1A]">{it.quantity}x</span>{" "}
                          <span>{it.itemName}</span>
                          {it.variantName ? (
                            <span className="text-[#8C8A84] text-[10px] ml-1">
                              ({it.variantName})
                            </span>
                          ) : null}
                        </span>
                        <span className="font-mono font-medium text-stone-700 shrink-0">₹{it.itemTotal}</span>
                      </div>
                    ))}

                    {extraItemsCount > 0 && (
                      <div className="pt-0.5 text-center">
                        <button
                          type="button"
                          onClick={() => setIsItemsExpanded((prev) => !prev)}
                          className="px-2 py-0.5 text-[10px]  font-medium text-[#73716B] hover:text-[#1C1D1A] underline underline-offset-2 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {isItemsExpanded ? (
                            <span className="flex items-center justify-center" >Show less <IconChevronUp className="w-3.5 h-3.5 stroke-[1.5]" /></span>
                          ) : (
                            <span className="flex items-center justify-center">View {extraItemsCount} more item{extraItemsCount > 1 ? "s" : ""} <IconChevronDown className="w-3.5 h-3.5 stroke-[1.5]" /></span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Total & Paid status */}
                <div className="flex justify-between items-center pt-1 border-t border-stone-100">
                  <span className="text-[#73716B] font-medium text-[11.5px]">Total Amount</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs sm:text-sm text-[#1C1D1A]">
                      ₹{currentOrder?.total?.toLocaleString("en-IN") || 0}
                    </span>
                    {isPaid ? (
                      <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        PAID
                      </span>
                    ) : currentOrder?.paymentStatus === "PENDING_VERIFICATION" ? (
                      <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80">
                        VERIFICATION PENDING
                      </span>
                    ) : currentOrder?.paymentStatus === "PAYMENT_REJECTED" ? (
                      <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80">
                        REJECTED
                      </span>
                    ) : currentOrder?.paymentMethod === "CASH" ? (
                      <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-800 border border-amber-300">
                        CASH AT COUNTER
                      </span>
                    ) : (
                      <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80">
                        UNPAID
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Table Assistance Row */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => onCallStaff("CALL_WAITER")}
                  className="py-1.5 px-2.5 rounded-xl bg-white/85 border border-stone-200/70 hover:bg-stone-50 text-[#1C1D1A] flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-all shadow-2xs active:scale-97 cursor-pointer"
                >
                  <IconBellRinging className="w-3.5 h-3.5 text-amber-500" />
                  <span>Call Waiter</span>
                </button>
                <button
                  type="button"
                  onClick={() => onCallStaff("NEED_WATER")}
                  className="py-1.5 px-2.5 rounded-xl bg-white/85 border border-stone-200/70 hover:bg-stone-50 text-[#1C1D1A] flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-all shadow-2xs active:scale-97 cursor-pointer"
                >
                  <IconDroplet className="w-3.5 h-3.5 text-sky-500" />
                  <span>Need Water</span>
                </button>
              </div>

              {/* Action Buttons: Clean, Theme Adaptable & Inset Effect */}
              <div className="space-y-1.5 pt-0.5">
                {currentOrder && !isPaid ? (
                  <button
                    type="button"
                    onClick={() => onOpenUpiPay(currentOrder)}
                    style={{
                      boxShadow: `inset 0 1.5px 2.5px rgba(255, 255, 255, 0.45), inset 0 -2.5px 5px rgba(0, 0, 0, 0.22), 0 4px 14px ${visualTheme.buttonShadow || "rgba(0, 0, 0, 0.15)"}`,
                    }}
                    className={`w-full py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm text-white ring-1 ring-white/25 active:scale-[0.98] active:translate-y-0.5 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all cursor-pointer bg-gradient-to-r ${visualTheme.buttonGradient} flex items-center justify-center gap-2`}
                  >
                    {currentOrder.paymentMethod === "CASH" ? (
                      <IconCash className="w-4 h-4 stroke-[2.2]" />
                    ) : (
                      <IconQrcode className="w-4 h-4 stroke-[2.2]" />
                    )}
                    <span>
                      {currentOrder.paymentStatus === "PENDING_VERIFICATION"
                        ? "Payment Under Verification • View Status"
                        : currentOrder.paymentStatus === "PAYMENT_REJECTED"
                        ? `Payment Rejected • Retry ₹${currentOrder.total}`
                        : currentOrder.paymentMethod === "CASH"
                        ? `Pay ₹${currentOrder.total} Cash / Switch to UPI`
                        : `Pay ₹${currentOrder.total} via UPI / Cash`}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOrderMore) {
                        onOrderMore();
                      } else {
                        onClose();
                      }
                    }}
                    style={{
                      boxShadow: `inset 0 1.5px 2.5px rgba(255, 255, 255, 0.45), inset 0 -2.5px 5px rgba(0, 0, 0, 0.22), 0 4px 14px ${visualTheme.buttonShadow || "rgba(0, 0, 0, 0.15)"}`,
                    }}
                    className={`w-full py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm text-white ring-1 ring-white/25 active:scale-[0.98] active:translate-y-0.5 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all cursor-pointer bg-gradient-to-r ${visualTheme.buttonGradient} flex items-center justify-center gap-2`}
                  >
                    <IconPlus className="w-4 h-4 stroke-[2.4]" />
                    <span>Order More Items</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
                      if (typeof window !== "undefined") {
                        window.location.href = `/menu/${cafeSlug}`;
                      }
                    }
                  }}
                  className="w-full py-1.5 rounded-full font-semibold text-xs text-[#73716B] hover:text-[#1C1D1A] hover:bg-black/5 active:scale-98 transition-all cursor-pointer"
                >
                  Back to Menu
                </button>
              </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
