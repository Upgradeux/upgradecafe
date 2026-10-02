"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  IconSearch,
  IconReceipt,
  IconArmchair,
  IconShoppingBag,
  IconTrash,
  IconPlus,
  IconMinus,
  IconCash,
  IconQrcode,
  IconCreditCard,
  IconUsers,
  IconPrinter,
  IconPercentage,
  IconMaximize,
  IconMinimize,
  IconChartBar,
  IconCheck,
  IconClock,
  IconSparkles,
  IconLoader2,
  IconChevronDown,
} from "@tabler/icons-react";
import { useToast } from "@/components/ui/Toast";
import type { Cafe } from "@/lib/db/schema/cafes";
import type { Category } from "@/lib/db/schema/categories";
import type { MenuItem } from "@/lib/db/schema/menu-items";
import type { Table } from "@/lib/db/schema/tables";
import type { OrderWithItems, PaymentMethod } from "@/features/cafe/orders/types";

import { CashTenderModal } from "./CashTenderModal";
import { UpiQrModal } from "./UpiQrModal";
import { SplitBillModal } from "./SplitBillModal";
import { ThermalReceiptModal } from "./ThermalReceiptModal";
import { ActiveTabsDrawer } from "./ActiveTabsDrawer";
import { ShiftSummaryModal } from "./ShiftSummaryModal";
import type { SplitPaymentRecord } from "../services/billing.service";

interface BillingTerminalProps {
  cafe: Cafe;
  categories: Category[];
  initialMenuItems: MenuItem[];
  initialTables: Table[];
  initialActiveOrders: OrderWithItems[];
}

export const BillingTerminal: React.FC<BillingTerminalProps> = ({
  cafe,
  categories,
  initialMenuItems,
  initialTables,
  initialActiveOrders,
}) => {
  const { toast } = useToast();

  // Data state
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [menuItems] = useState<MenuItem[]>(initialMenuItems);
  const [activeOrders, setActiveOrders] =
    useState<OrderWithItems[]>(initialActiveOrders);

  // Search & Catalog Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [dietaryFilter, setDietaryFilter] = useState<
    "ALL" | "VEG" | "BESTSELLER"
  >("ALL");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Order Ticket Configuration State
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY">("DINE_IN");
  const [selectedTableId, setSelectedTableId] = useState<string>(() => {
    const firstAvail = initialTables.find((t) => t.status === "AVAILABLE");
    return firstAvail ? firstAvail.id : initialTables[0]?.id || "";
  });
  const [guestCount, setGuestCount] = useState<number>(2);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);

  // Cart / Line Items State
  const [cart, setCart] = useState<
    Array<{
      menuItem: MenuItem;
      quantity: number;
      specialInstructions: string;
    }>
  >([]);

  // Discount State
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customDiscountRupees, setCustomDiscountRupees] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>("");
  const [showDiscountCustom, setShowDiscountCustom] = useState<boolean>(false);

  // Submitting / Loading State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  // Modals & Drawers State
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isPreBillMode, setIsPreBillMode] = useState(false);
  const [receiptTargetOrder, setReceiptTargetOrder] =
    useState<OrderWithItems | null>(null);
  const [isActiveTabsDrawerOpen, setIsActiveTabsDrawerOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut: '/' focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Refresh data helper
  const refreshData = async () => {
    try {
      const [tablesRes, ordersRes] = await Promise.all([
        fetch(`/api/cafe/${cafe.slug}/tables`),
        fetch(`/api/cafe/${cafe.slug}/orders?history=false`),
      ]);
      const tablesJson = await tablesRes.json();
      const ordersJson = await ordersRes.json();
      if (tablesJson.success && tablesJson.data) setTables(tablesJson.data);
      if (ordersJson.success && ordersJson.data)
        setActiveOrders(ordersJson.data);
    } catch (err) {
      console.error("Failed refreshing billing data", err);
    }
  };

  // Selected Table & Active Session Resolution
  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const activeOrderForSelectedTable = useMemo(() => {
    if (orderType !== "DINE_IN" || !selectedTableId) return null;
    return (
      activeOrders.find(
        (o) =>
          o.tableId === selectedTableId &&
          (o.status === "NEW" ||
            o.status === "PREPARING" ||
            o.status === "READY" ||
            o.status === "SERVED")
      ) || null
    );
  }, [orderType, selectedTableId, activeOrders]);

  // Catalog Filtering
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (
        selectedCategoryId !== "ALL" &&
        item.categoryId !== selectedCategoryId
      ) {
        return false;
      }
      if (dietaryFilter === "VEG" && !item.isVegetarian) return false;
      if (dietaryFilter === "BESTSELLER" && !item.isBestseller) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        return matchName || matchDesc;
      }
      return true;
    });
  }, [menuItems, selectedCategoryId, dietaryFilter, searchQuery]);

  // Cart Calculations
  const subtotal = cart.reduce(
    (sum, it) => sum + it.menuItem.price * it.quantity,
    0
  );

  let discountAmount = 0;
  if (discountPercent > 0) {
    discountAmount = Math.round((subtotal * discountPercent) / 100);
  } else if (customDiscountRupees > 0) {
    discountAmount = Math.min(subtotal, customDiscountRupees);
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(taxableAmount * 0.05); // 5% GST standard
  const total = taxableAmount + tax;

  // Cart operations
  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          menuItem: item,
          quantity: 1,
          specialInstructions: "",
        },
      ];
    });
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.menuItem.id === itemId) {
            const nextQty = c.quantity + delta;
            return nextQty > 0 ? { ...c, quantity: nextQty } : null;
          }
          return c;
        })
        .filter(Boolean) as typeof prev
    );
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItem.id !== itemId));
  };

  const handleInstructionChange = (itemId: string, note: string) => {
    setCart((prev) =>
      prev.map((c) =>
        c.menuItem.id === itemId ? { ...c, specialInstructions: note } : c
      )
    );
  };

  const resetTicket = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setOrderNotes("");
    setDiscountPercent(0);
    setCustomDiscountRupees(0);
    setDiscountReason("");
    setShowDiscountCustom(false);
  };

  // Fullscreen toggle helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // 1. Process Quick Counter Checkout (Direct Cash / UPI / Card Settlement)
  const handleExecuteQuickCheckout = async (
    paymentMethod: PaymentMethod,
    amountTendered?: number,
    changeDue?: number
  ) => {
    if (cart.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Add menu items before checking out.",
        variant: "danger",
      });
      return;
    }

    try {
      setIsProcessing(true);

      const itemsPayload = cart.map((it) => ({
        menuItemId: it.menuItem.id,
        itemName: it.menuItem.name,
        unitPrice: it.menuItem.price,
        quantity: it.quantity,
        specialInstructions: it.specialInstructions.trim() || null,
      }));

      const res = await fetch(`/api/cafe/${cafe.slug}/billing/quick-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          tableId: orderType === "DINE_IN" ? selectedTableId || null : null,
          tableNameSnapshot:
            orderType === "DINE_IN" ? selectedTable?.tableNumber || null : null,
          customerName:
            orderType === "TAKEAWAY"
              ? customerName.trim() || "Counter Guest"
              : null,
          customerPhone: customerPhone.trim() || null,
          guestCount: orderType === "DINE_IN" ? guestCount : null,
          items: itemsPayload,
          notes: orderNotes.trim() || null,
          discount: discountAmount,
          discountReason: discountReason.trim() || null,
          paymentMethod,
          amountTendered: amountTendered || null,
          changeDue: changeDue || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to complete payment");
      }

      toast({
        title: "Order Paid & Dispatched",
        description: `Order ${json.data.orderNumber} settled via ${paymentMethod}.`,
        variant: "success",
      });

      // Show receipt
      setReceiptTargetOrder(json.data);
      setIsPreBillMode(false);
      setIsReceiptModalOpen(true);

      resetTicket();
      await refreshData();
    } catch (err: any) {
      toast({
        title: "Checkout Failed",
        description: err.message || "Failed to process payment",
        variant: "danger",
      });
    } finally {
      setIsProcessing(false);
      setIsCashModalOpen(false);
      setIsUpiModalOpen(false);
    }
  };

  // 2. Settle an Existing Dining Table Bill
  const handleSettleActiveOrder = async (
    orderId: string,
    paymentMethod: PaymentMethod,
    amountTendered?: number,
    changeDue?: number
  ) => {
    try {
      setIsProcessing(true);

      const res = await fetch(`/api/cafe/${cafe.slug}/billing/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentMethod,
          discount: discountAmount,
          discountReason: discountReason.trim() || null,
          amountTendered: amountTendered || null,
          changeDue: changeDue || null,
          shouldCompleteOrder: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to settle bill");
      }

      toast({
        title: "Table Bill Settled",
        description: `Order ${json.data.orderNumber} paid via ${paymentMethod}. Table cleared.`,
        variant: "success",
      });

      setReceiptTargetOrder(json.data);
      setIsPreBillMode(false);
      setIsReceiptModalOpen(true);

      resetTicket();
      await refreshData();
    } catch (err: any) {
      toast({
        title: "Settlement Failed",
        description: err.message || "Could not settle table bill",
        variant: "danger",
      });
    } finally {
      setIsProcessing(false);
      setIsCashModalOpen(false);
      setIsUpiModalOpen(false);
    }
  };

  // 3. Settle Split Bill
  const handleConfirmSplit = async (records: SplitPaymentRecord[]) => {
    if (!activeOrderForSelectedTable && cart.length === 0) {
      toast({
        title: "No Bill to Split",
        description: "Please assign items or select an active table order.",
        variant: "danger",
      });
      return;
    }

    try {
      setIsProcessing(true);

      // If already an active order, settle it
      if (activeOrderForSelectedTable) {
        const res = await fetch(`/api/cafe/${cafe.slug}/billing/settle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: activeOrderForSelectedTable.id,
            splitRecords: records,
            discount: discountAmount,
            discountReason: discountReason.trim() || null,
            shouldCompleteOrder: true,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed split settlement");
        }

        toast({
          title: "Split Bill Settled",
          description: `Order ${json.data.orderNumber} split across ${records.length} guests.`,
          variant: "success",
        });

        setReceiptTargetOrder(json.data);
        setIsPreBillMode(false);
        setIsReceiptModalOpen(true);
      } else {
        // Create order directly with primary method and note
        await handleExecuteQuickCheckout("CARD");
      }

      resetTicket();
      await refreshData();
    } catch (err: any) {
      toast({
        title: "Split Settlement Failed",
        description: err.message || "Could not process split",
        variant: "danger",
      });
    } finally {
      setIsProcessing(false);
      setIsSplitModalOpen(false);
    }
  };

  // 4. Place Unpaid Dine-in Order (Send KOT to kitchen without immediate payment)
  const handlePlaceDineInOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Add items to place table order.",
        variant: "danger",
      });
      return;
    }

    try {
      setIsProcessing(true);

      const itemsPayload = cart.map((it) => ({
        menuItemId: it.menuItem.id,
        itemName: it.menuItem.name,
        unitPrice: it.menuItem.price,
        quantity: it.quantity,
        specialInstructions: it.specialInstructions.trim() || null,
      }));

      const res = await fetch(`/api/cafe/${cafe.slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: "DINE_IN",
          tableId: selectedTableId,
          tableNameSnapshot: selectedTable?.tableNumber,
          guestCount,
          items: itemsPayload,
          notes: orderNotes.trim() || null,
          paymentStatus: "UNPAID",
          existingOrderIdToAppend: activeOrderForSelectedTable?.id || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to dispatch order");
      }

      toast({
        title: activeOrderForSelectedTable ? "Items Added to Table" : "Order Sent to Kitchen",
        description: `Order ${json.data.orderNumber} active on ${selectedTable?.tableNumber}.`,
        variant: "success",
      });

      resetTicket();
      await refreshData();
    } catch (err: any) {
      toast({
        title: "Failed to Dispatch",
        description: err.message || "Could not send order to kitchen",
        variant: "danger",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Preview Pre-Bill / Guest Check
  const handlePrintGuestCheck = () => {
    if (activeOrderForSelectedTable) {
      setReceiptTargetOrder(activeOrderForSelectedTable);
      setIsPreBillMode(true);
      setIsReceiptModalOpen(true);
    } else if (cart.length > 0) {
      // Create a transient snapshot
      const mockOrder: OrderWithItems = {
        id: "draft",
        cafeId: cafe.id,
        guestSessionId: null,
        customerId: null,
        orderNumber: "#DRAFT",
        orderType,
        tableId: selectedTableId || null,
        tableNameSnapshot: selectedTable?.tableNumber || null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        status: "NEW",
        paymentStatus: "UNPAID",
        paymentMethod: null,
        subtotal,
        discount: discountAmount,
        tax,
        total,
        notes: orderNotes || null,
        cancellationReason: null,
        createdAt: new Date(),
        confirmedAt: null,
        preparingAt: null,
        readyAt: null,
        servedAt: null,
        completedAt: null,
        cancelledAt: null,
        updatedAt: new Date(),
        items: cart.map((c, i) => ({
          id: `draft-${i}`,
          orderId: "draft",
          menuItemId: c.menuItem.id,
          itemName: c.menuItem.name,
          unitPrice: c.menuItem.price,
          quantity: c.quantity,
          itemTotal: c.menuItem.price * c.quantity,
          variantName: null,
          specialInstructions: c.specialInstructions || null,
          createdAt: new Date(),
        })),
      };
      setReceiptTargetOrder(mockOrder);
      setIsPreBillMode(true);
      setIsReceiptModalOpen(true);
    }
  };

  const openTabsCount = activeOrders.filter(
    (o) => o.paymentStatus === "UNPAID" && o.status !== "CANCELLED"
  ).length;

  return (
    <div className="w-full flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[var(--color-background)] select-none">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          TOP UTILITY & REGISTER HEADER
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="px-4 py-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center shadow-xs">
            <IconReceipt className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-semibold text-[var(--color-foreground)] tracking-tight">
                POS & Billing Terminal
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-xs">
                Register 01 • Open
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[var(--color-muted)] font-normal">
              <span>{cafe.name}</span>
              <span>•</span>
              <span className="font-mono">{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Right Navigation & Drawers */}
        <div className="flex items-center gap-2">
          {/* Active Tabs Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsActiveTabsDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)] text-xs font-medium text-[var(--color-foreground)] transition-all shadow-xs"
          >
            <IconArmchair className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>Active Tabs</span>
            {openTabsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-md text-[10px] font-medium bg-amber-500 text-white shadow-xs">
                {openTabsCount}
              </span>
            )}
          </button>

          {/* Shift Report Trigger */}
          <button
            type="button"
            onClick={() => setIsShiftModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-surface)] text-xs font-medium text-[var(--color-foreground)] transition-all shadow-xs"
          >
            <IconChartBar className="w-3.5 h-3.5 text-[var(--color-muted)]" />
            <span className="hidden sm:inline">Shift Report</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-md border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors hidden md:block shadow-xs"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <IconMinimize className="w-4 h-4" />
            ) : (
              <IconMaximize className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MAIN 3-ZONE LAYOUT
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
        {/* ================================================================
            ZONE 1: MENU CATALOG & SEARCH (Left 60% / 7 cols)
           ================================================================ */}
        <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-[var(--color-border-subtle)] bg-[var(--color-background)] overflow-hidden min-h-0">
          {/* Search Bar & Dietary Filter Pills */}
          <div className="p-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <IconSearch className="w-4 h-4 text-[var(--color-muted)] absolute left-3 top-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search coffee, pastry, food... (Press / to focus)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors shadow-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Dietary Filter Pills */}
              <div className="flex items-center gap-1 bg-[var(--color-background)] p-1 rounded-md border border-[var(--color-border)] flex-shrink-0 shadow-xs">
                <button
                  type="button"
                  onClick={() => setDietaryFilter("ALL")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    dietaryFilter === "ALL"
                      ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-xs font-semibold"
                      : "text-[var(--color-muted)]"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setDietaryFilter("VEG")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    dietaryFilter === "VEG"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold"
                      : "text-[var(--color-muted)]"
                  }`}
                >
                  Veg
                </button>
                <button
                  type="button"
                  onClick={() => setDietaryFilter("BESTSELLER")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    dietaryFilter === "BESTSELLER"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
                      : "text-[var(--color-muted)]"
                  }`}
                >
                  ★ Popular
                </button>
              </div>
            </div>

            {/* Category Scroll Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategoryId("ALL")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 border shadow-xs ${
                  selectedCategoryId === "ALL"
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs font-semibold"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                All Items ({menuItems.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 border shadow-xs ${
                    selectedCategoryId === cat.id
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs font-semibold"
                      : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Fast Grid */}
          <div className="flex-1 p-3 overflow-y-auto min-h-0">
            {filteredMenuItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--color-muted)]">
                <IconReceipt className="w-8 h-8 stroke-1 mb-2 opacity-40" />
                <p className="text-xs font-medium">No menu items found</p>
                <p className="text-[11px] opacity-70">
                  Try adjusting search or category filter
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {filteredMenuItems.map((item) => {
                  const inCartItem = cart.find((c) => c.menuItem.id === item.id);
                  const inCartQty = inCartItem?.quantity || 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleAddToCart(item)}
                      className={`p-3 rounded-md border text-left flex flex-col justify-between transition-all duration-150 cursor-pointer select-none active:scale-[0.98] shadow-xs ${
                        inCartQty > 0
                          ? "bg-[var(--color-primary-light)]/40 border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30"
                          : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                item.isVegetarian
                                  ? "bg-emerald-500"
                                  : "bg-rose-500"
                              }`}
                            />
                            {item.isBestseller && (
                              <span className="text-[9.5px] font-medium text-amber-600 dark:text-amber-400">
                                ★
                              </span>
                            )}
                          </div>

                          {inCartQty > 0 && (
                            <span className="w-5 h-5 rounded-md bg-[var(--color-primary)] text-white text-[10px] font-semibold flex items-center justify-center shadow-xs">
                              {inCartQty}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-medium text-[var(--color-foreground)] line-clamp-2 leading-tight">
                          {item.name}
                        </h4>
                      </div>

                      <div className="mt-2 pt-1 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--color-foreground)]">
                          ₹{item.price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] font-medium text-[var(--color-primary)]">
                          + Add
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================================================================
            ZONE 2 & 3: ACTIVE TICKET & FAST PAYMENT TRAY (Right 40% / 5 cols)
           ================================================================ */}
        <div className="lg:col-span-5 flex flex-col bg-[var(--color-surface)] overflow-hidden min-h-0">
          {/* Order Header: Dine-In vs Takeaway Selector */}
          <div className="p-3 border-b border-[var(--color-border-subtle)] space-y-2 flex-shrink-0 bg-[var(--color-surface)]">
            <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-[var(--color-background)] rounded-md border border-[var(--color-border)] shadow-xs">
              <button
                type="button"
                onClick={() => setOrderType("DINE_IN")}
                className={`py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  orderType === "DINE_IN"
                    ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-xs font-semibold"
                    : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                <IconArmchair className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>Dine-In Table</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType("TAKEAWAY")}
                className={`py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  orderType === "TAKEAWAY"
                    ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold"
                    : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                <IconShoppingBag className="w-3.5 h-3.5" />
                <span>Takeaway / Counter</span>
              </button>
            </div>

            {/* Dine-In Configuration: Table picker & Guest Count */}
            {orderType === "DINE_IN" ? (
              <div className="flex items-center gap-2">
                {/* Custom Table Picker Dropdown */}
                <div className="relative flex-1">
                  <button
                    type="button"
                    onClick={() => setIsTableDropdownOpen((prev) => !prev)}
                    className="w-full px-3 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-left flex items-center justify-between text-xs font-medium shadow-xs"
                  >
                    <span className="truncate">
                      {selectedTable
                        ? `${selectedTable.tableNumber} (${selectedTable.capacity} Seats)`
                        : "Select Table"}
                    </span>
                    <IconChevronDown className="w-3.5 h-3.5 text-[var(--color-muted)]" />
                  </button>

                  {isTableDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl p-1 max-h-48 overflow-y-auto space-y-0.5">
                      {tables.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedTableId(t.id);
                            setIsTableDropdownOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-md text-left text-xs font-medium flex items-center justify-between ${
                            t.id === selectedTableId
                              ? "bg-[var(--color-primary-light)] font-semibold text-[var(--color-foreground)]"
                              : "hover:bg-[var(--color-background)]"
                          }`}
                        >
                          <span>{t.tableNumber}</span>
                          <span
                            className={`text-[9.5px] font-medium px-1.5 py-0.2 rounded-md ${
                              t.status === "AVAILABLE"
                                ? "bg-emerald-500/10 text-emerald-700"
                                : "bg-amber-500/10 text-amber-700"
                            }`}
                          >
                            {t.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Guest Count Stepper */}
                <div className="flex items-center gap-1 px-2 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md flex-shrink-0 shadow-xs">
                  <IconUsers className="w-3.5 h-3.5 text-[var(--color-muted)]" />
                  <button
                    type="button"
                    onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                    className="w-4 h-4 text-xs font-semibold hover:bg-[var(--color-border-subtle)] rounded text-center"
                  >
                    -
                  </button>
                  <span className="w-4 text-center text-xs font-semibold text-[var(--color-primary)]">
                    {guestCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGuestCount((g) => g + 1)}
                    className="w-4 h-4 text-xs font-semibold hover:bg-[var(--color-border-subtle)] rounded text-center"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : (
              /* Takeaway: Customer Name Input */
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Customer Name (e.g. Sagar)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] shadow-xs"
                />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-32 px-3 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] shadow-xs"
                />
              </div>
            )}

            {/* Active Session Notification (if table is occupied) */}
            {activeOrderForSelectedTable && (
              <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs shadow-xs">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>
                    Active Tab: {activeOrderForSelectedTable.orderNumber} (₹
                    {activeOrderForSelectedTable.total})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setReceiptTargetOrder(activeOrderForSelectedTable);
                    setIsPreBillMode(true);
                    setIsReceiptModalOpen(true);
                  }}
                  className="px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-amber-500/40 text-[10px] font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition-colors shadow-xs"
                >
                  Print Pre-Bill
                </button>
              </div>
            )}
          </div>

          {/* Cart Itemized Ticket List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 min-h-0">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--color-muted)]">
                <IconReceipt className="w-8 h-8 stroke-1 mb-2 opacity-30" />
                <p className="text-xs font-medium">Live Ticket is Empty</p>
                <p className="text-[11px] opacity-70">
                  Tap items from the catalog on the left to add them
                </p>
              </div>
            ) : (
              cart.map((line) => (
                <div
                  key={line.menuItem.id}
                  className="p-2.5 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] space-y-1.5 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[var(--color-foreground)] truncate">
                      {line.menuItem.name}
                    </span>

                    <span className="text-xs font-semibold text-[var(--color-foreground)]">
                      ₹{(line.menuItem.price * line.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {/* Stepper */}
                    <div className="flex items-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] px-1.5 py-0.5 rounded-md shadow-xs">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(line.menuItem.id, -1)}
                        className="w-4 h-4 text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-foreground)] text-center"
                      >
                        -
                      </button>
                      <span className="w-4 text-center text-xs font-semibold text-[var(--color-foreground)]">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(line.menuItem.id, 1)}
                        className="w-4 h-4 text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-foreground)] text-center"
                      >
                        +
                      </button>
                    </div>

                    {/* Quick Item Instruction Input */}
                    <input
                      type="text"
                      placeholder="Special note (e.g. oat milk, less ice)"
                      value={line.specialInstructions}
                      onChange={(e) =>
                        handleInstructionChange(line.menuItem.id, e.target.value)
                      }
                      className="flex-1 px-2 py-0.5 text-[11px] rounded-lg border border-dashed border-[var(--color-border)] bg-transparent text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                    />

                    {/* Delete Item */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(line.menuItem.id)}
                      className="text-[var(--color-muted)] hover:text-rose-600 transition-colors p-1"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              ZONE 3: TOTALS, DISCOUNTS & FAST PAYMENT TRAY
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3 space-y-2.5 flex-shrink-0">
            {/* Quick Discount Pill Row */}
            <div className="flex items-center justify-between gap-1.5 text-[11px]">
              <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider flex items-center gap-1">
                <IconPercentage className="w-3 h-3" />
                <span>Discount:</span>
              </span>

              <div className="flex items-center gap-1">
                {[0, 5, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setDiscountPercent(pct);
                      setCustomDiscountRupees(0);
                      setShowDiscountCustom(false);
                      setDiscountReason(pct > 0 ? `${pct}% Loyalty Discount` : "");
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                      discountPercent === pct && !showDiscountCustom
                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                        : "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                    }`}
                  >
                    {pct === 0 ? "None" : `${pct}%`}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setShowDiscountCustom((prev) => !prev)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                    showDiscountCustom
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                      : "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  Custom ₹
                </button>
              </div>
            </div>

            {/* Custom Discount Input Expand */}
            {showDiscountCustom && (
              <div className="flex items-center gap-2 pt-1 animate-in fade-in-50">
                <input
                  type="number"
                  placeholder="Flat discount in ₹"
                  value={customDiscountRupees || ""}
                  onChange={(e) => {
                    setDiscountPercent(0);
                    setCustomDiscountRupees(parseFloat(e.target.value) || 0);
                  }}
                  className="w-28 px-2 py-1 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] font-bold text-right"
                />
                <input
                  type="text"
                  placeholder="Comp reason (e.g. Owner guest, staff meal)"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)]"
                />
              </div>
            )}

            {/* Financial Breakdown Table */}
            <div className="space-y-1 text-xs text-[var(--color-muted)] pt-1 border-t border-[var(--color-border-subtle)]">
              <div className="flex justify-between">
                <span>Subtotal ({cart.reduce((s, it) => s + it.quantity, 0)} items)</span>
                <span className="font-semibold text-[var(--color-foreground)]">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Discount ({discountReason || "Special Discount"})</span>
                  <span>- ₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex justify-between text-[11px]">
                <span>GST (5% SGST 2.5% + CGST 2.5%)</span>
                <span>₹{tax.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between items-baseline pt-1 border-t border-[var(--color-border)]">
                <span className="text-xs font-semibold text-[var(--color-foreground)]">
                  Payable Total
                </span>
                <span className="text-lg font-bold font-mono text-[var(--color-primary)]">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Multi-Tender Fast Action Matrix */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                disabled={isProcessing || total === 0}
                onClick={() => setIsCashModalOpen(true)}
                className="py-2.5 px-2 rounded-md text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-xs flex flex-col items-center gap-0.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <IconCash className="w-4 h-4" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                disabled={isProcessing || total === 0}
                onClick={() => setIsUpiModalOpen(true)}
                className="py-2.5 px-2 rounded-md text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 active:scale-95 transition-all shadow-xs flex flex-col items-center gap-0.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <IconQrcode className="w-4 h-4" />
                <span>UPI QR</span>
              </button>

              <button
                type="button"
                disabled={isProcessing || total === 0}
                onClick={() => {
                  if (activeOrderForSelectedTable) {
                    handleSettleActiveOrder(activeOrderForSelectedTable.id, "CARD");
                  } else {
                    handleExecuteQuickCheckout("CARD");
                  }
                }}
                className="py-2.5 px-2 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-xs flex flex-col items-center gap-0.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <IconCreditCard className="w-4 h-4" />
                <span>Card / EDC</span>
              </button>

              <button
                type="button"
                disabled={isProcessing || total === 0}
                onClick={() => setIsSplitModalOpen(true)}
                className="py-2.5 px-2 rounded-md text-xs font-medium bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-background)] active:scale-95 transition-all shadow-xs flex flex-col items-center gap-0.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <IconUsers className="w-4 h-4 text-[var(--color-muted)]" />
                <span>Split Bill</span>
              </button>
            </div>

            {/* Secondary Actions: Pre-Bill & Dine-in Dispatch */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={isProcessing || (total === 0 && !activeOrderForSelectedTable)}
                onClick={handlePrintGuestCheck}
                className="py-2 px-3 rounded-md text-xs font-medium bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-surface)] active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-xs"
              >
                <IconPrinter className="w-3.5 h-3.5 text-[var(--color-muted)]" />
                <span>Guest Check</span>
              </button>

              {orderType === "DINE_IN" ? (
                <button
                  type="button"
                  disabled={isProcessing || cart.length === 0}
                  onClick={handlePlaceDineInOrder}
                  className="py-2 px-3 rounded-md text-xs font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-40 cursor-pointer"
                >
                  {isProcessing ? (
                    <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <IconCheck className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {activeOrderForSelectedTable
                      ? "Add Round 2 (KOT)"
                      : "Send KOT to Kitchen"}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resetTicket}
                  className="py-2 px-3 rounded-md text-xs font-medium bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-rose-600 transition-colors shadow-xs"
                >
                  Clear Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODALS & DRAWERS
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 1. Cash Tender Modal */}
      <CashTenderModal
        isOpen={isCashModalOpen}
        totalPayable={activeOrderForSelectedTable ? activeOrderForSelectedTable.total : total}
        onConfirm={(tendered, change) => {
          if (activeOrderForSelectedTable) {
            handleSettleActiveOrder(
              activeOrderForSelectedTable.id,
              "CASH",
              tendered,
              change
            );
          } else {
            handleExecuteQuickCheckout("CASH", tendered, change);
          }
        }}
        onClose={() => setIsCashModalOpen(false)}
      />

      {/* 2. Dynamic UPI QR Modal */}
      <UpiQrModal
        isOpen={isUpiModalOpen}
        totalPayable={activeOrderForSelectedTable ? activeOrderForSelectedTable.total : total}
        cafeName={cafe.name}
        cafeSlug={cafe.slug}
        orderNumber={activeOrderForSelectedTable?.orderNumber}
        onConfirm={() => {
          if (activeOrderForSelectedTable) {
            handleSettleActiveOrder(activeOrderForSelectedTable.id, "UPI");
          } else {
            handleExecuteQuickCheckout("UPI");
          }
        }}
        onClose={() => setIsUpiModalOpen(false)}
      />

      {/* 3. Split Bill Modal */}
      <SplitBillModal
        isOpen={isSplitModalOpen}
        totalPayable={activeOrderForSelectedTable ? activeOrderForSelectedTable.total : total}
        onConfirm={handleConfirmSplit}
        onClose={() => setIsSplitModalOpen(false)}
      />

      {/* 4. Luxury 80mm Thermal Receipt Modal */}
      {receiptTargetOrder && (
        <ThermalReceiptModal
          isOpen={isReceiptModalOpen}
          order={receiptTargetOrder}
          cafe={cafe}
          isPreBill={isPreBillMode}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      )}

      {/* 5. Active Table Tabs Slide-Over Drawer */}
      <ActiveTabsDrawer
        isOpen={isActiveTabsDrawerOpen}
        tables={tables}
        activeOrders={activeOrders}
        onSelectTab={(tbl, ord) => {
          if (tbl) {
            setOrderType("DINE_IN");
            setSelectedTableId(tbl.id);
          } else {
            setOrderType("TAKEAWAY");
            if (ord.customerName) setCustomerName(ord.customerName);
          }
        }}
        onClose={() => setIsActiveTabsDrawerOpen(false)}
      />

      {/* 6. Shift Register & Day Close Modal */}
      <ShiftSummaryModal
        isOpen={isShiftModalOpen}
        cafeSlug={cafe.slug}
        cafeName={cafe.name}
        onClose={() => setIsShiftModalOpen(false)}
      />
    </div>
  );
};
