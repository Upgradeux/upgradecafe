"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  IconSearch,
  IconArmchair,
  IconShoppingBag,
  IconBike,
  IconPlus,
  IconMinus,
  IconTrash,
  IconDotsVertical,
  IconChevronDown,
  IconClock,
  IconBell,
  IconCash,
  IconQrcode,
  IconCreditCard,
  IconDots,
  IconPrinter,
  IconArrowRight,
  IconCheck,
  IconLoader2,
  IconCoins,
  IconNote,
  IconX,
  IconUsers,
  IconUser,
} from "@tabler/icons-react";
import { useToast } from "@/components/ui/Toast";
import type { Cafe } from "@/lib/db/schema/cafes";
import type { Category } from "@/lib/db/schema/categories";
import type { MenuItem } from "@/lib/db/schema/menu-items";
import type { Table } from "@/lib/db/schema/tables";
import type { OrderWithItems, PaymentMethod } from "@/features/cafe/orders/types";

import { CashTenderModal } from "@/features/cafe/billing/components/CashTenderModal";
import { UpiQrModal } from "@/features/cafe/billing/components/UpiQrModal";
import { SplitBillModal } from "@/features/cafe/billing/components/SplitBillModal";
import { ThermalReceiptModal } from "@/features/cafe/billing/components/ThermalReceiptModal";
import { ActiveTabsDrawer } from "@/features/cafe/billing/components/ActiveTabsDrawer";

interface PosTerminalProps {
  cafe: Cafe;
  categories: Category[];
  initialMenuItems: MenuItem[];
  initialTables: Table[];
  initialActiveOrders: OrderWithItems[];
  user: {
    name: string;
    email: string;
    role?: string;
  };
}

// Fallback high-resolution imagery for artisanal presentation
const DEFAULT_ITEM_IMAGES: Record<string, string> = {
  cappuccino: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&auto=format&fit=crop&q=80",
  latte: "https://images.unsplash.com/photo-1593443320739-77f74939d0da?w=400&auto=format&fit=crop&q=80",
  americano: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80",
  mocha: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400&auto=format&fit=crop&q=80",
  "cold brew": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&auto=format&fit=crop&q=80",
  matcha: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&auto=format&fit=crop&q=80",
  croissant: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=80",
  almond: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80",
  toast: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&auto=format&fit=crop&q=80",
  avocado: "https://images.unsplash.com/photo-1603046891744-76e6300f82ef?w=400&auto=format&fit=crop&q=80",
  sandwich: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&auto=format&fit=crop&q=80",
  muffin: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&auto=format&fit=crop&q=80",
  cake: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&auto=format&fit=crop&q=80",
  default: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80",
};

function getItemImageUrl(item: MenuItem): string {
  if (item.imageKey && item.imageKey.startsWith("http")) return item.imageKey;
  const nameLower = item.name.toLowerCase();
  for (const [key, url] of Object.entries(DEFAULT_ITEM_IMAGES)) {
    if (nameLower.includes(key)) return url;
  }
  return DEFAULT_ITEM_IMAGES.default;
}

// Item customization tag (supports dynamic add-ons & kitchen notes without hardcoding)
interface ItemModifier {
  name: string;
  priceAdjustment: number;
}

// Temporary held cart (order on hold / recall)
interface HeldCart {
  id: string;
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  selectedTableId: string;
  tableNameSnapshot?: string;
  customerName?: string;
  customerPhone?: string;
  guestCount: number;
  cart: Array<{
    cartItemId: string;
    menuItem: MenuItem;
    quantity: number;
    selectedModifiers: ItemModifier[];
    customNote?: string;
  }>;
  orderNote: string;
  discountAmount: number;
  discountReason: string;
  createdAt: Date;
  total: number;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({
  cafe,
  categories,
  initialMenuItems,
  initialTables,
  initialActiveOrders,
  user,
}) => {
  const { toast } = useToast();

  // State
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [menuItems] = useState<MenuItem[]>(initialMenuItems);
  const [activeOrders, setActiveOrders] = useState<OrderWithItems[]>(initialActiveOrders);

  // Search & Catalog Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Order Setup
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY" | "DELIVERY">("DINE_IN");
  const [selectedTableId, setSelectedTableId] = useState<string>(() => {
    const firstAvail = initialTables.find((t) => t.status === "AVAILABLE");
    return firstAvail ? firstAvail.id : initialTables[0]?.id || "";
  });
  const [guestCount, setGuestCount] = useState<number>(2);
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);
  const [orderNote, setOrderNote] = useState("");

  // Customer Selection (Optional for loyalty, repeat customers, takeaway receipts)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);

  // Cart / Line Items
  const [cart, setCart] = useState<
    Array<{
      cartItemId: string;
      menuItem: MenuItem;
      quantity: number;
      selectedModifiers: ItemModifier[];
      customNote?: string;
    }>
  >([]);
  const [selectedCartItemId, setSelectedCartItemId] = useState<string | null>(null);

  // Dedicated Item Customization Dialog State
  const [customizingItem, setCustomizingItem] = useState<{
    item: MenuItem;
    existingCartItemId?: string;
    selectedModifiers: ItemModifier[];
    customNote: string;
    quantity: number;
  } | null>(null);

  // Held Orders State (Hold & Recall)
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);

  // Custom Instruction Modal / Prompt state
  const [isInstructionPromptOpen, setIsInstructionPromptOpen] = useState(false);
  const [customInstructionInput, setCustomInstructionInput] = useState("");

  // Discount
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isDiscountOpen, setIsDiscountOpen] = useState<boolean>(false);
  const [discountReason, setDiscountReason] = useState<string>("");

  // Status & Timing
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Modals
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptTargetOrder, setReceiptTargetOrder] = useState<OrderWithItems | null>(null);
  const [isPreBillMode, setIsPreBillMode] = useState(false);
  const [isActiveTabsDrawerOpen, setIsActiveTabsDrawerOpen] = useState(false);

  // 1. Dynamic Add-ons derived from café's real categories (zero hardcoding)
  const addonCategory = useMemo(() => {
    return categories.find((c) =>
      ["add-on", "addon", "extra", "modifier", "customisation"].some((kw) =>
        c.name.toLowerCase().includes(kw)
      )
    );
  }, [categories]);

  const dynamicAddonItems = useMemo(() => {
    if (!addonCategory) return [];
    return menuItems.filter(
      (item) => item.categoryId === addonCategory.id && item.isAvailable
    );
  }, [addonCategory, menuItems]);

  // Fast kitchen notes (zero price adjustment, universal notes)
  const KITCHEN_QUICK_TAGS = [
    "Less Sugar",
    "No Sugar",
    "Extra Hot",
    "Iced",
    "Mild Spicy",
    "Pack To-Go",
  ];

  // Live Time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }) +
          " • " +
          now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Global '/' keyboard shortcut to focus search
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

  const refreshData = async () => {
    try {
      const [tRes, oRes] = await Promise.all([
        fetch(`/api/cafe/${cafe.slug}/tables`),
        fetch(`/api/cafe/${cafe.slug}/orders?history=false`),
      ]);
      const tJson = await tRes.json();
      const oJson = await oRes.json();
      if (tJson.success && tJson.data) {
        setTables(Array.isArray(tJson.data) ? tJson.data : []);
      }
      if (oJson.success && oJson.data) {
        const ordersList = Array.isArray(oJson.data)
          ? oJson.data
          : oJson.data?.liveOrders || [];
        setActiveOrders(ordersList);
      }
    } catch (e) {
      console.error("Failed to refresh tables/orders", e);
    }
  };

  const safeTables = Array.isArray(tables) ? tables : [];
  const safeActiveOrders = Array.isArray(activeOrders) ? activeOrders : [];

  const selectedTable = safeTables.find((t) => t.id === selectedTableId);
  const activeOrderForTable = useMemo(() => {
    if (orderType !== "DINE_IN" || !selectedTableId) return null;
    return (
      safeActiveOrders.find(
        (o) =>
          o.tableId === selectedTableId &&
          (o.status === "NEW" ||
            o.status === "PREPARING" ||
            o.status === "READY" ||
            o.status === "SERVED")
      ) || null
    );
  }, [orderType, selectedTableId, safeActiveOrders]);

  // Category counts for quick tabs
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: menuItems.filter((i) => i.isAvailable).length,
    };
    for (const item of menuItems) {
      if (item.isAvailable && item.categoryId) {
        counts[item.categoryId] = (counts[item.categoryId] || 0) + 1;
      }
    }
    return counts;
  }, [menuItems]);

  // Filtered Menu Items (Dynamically loaded from database, excluding standalone add-ons from main grid if configured)
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.isAvailable) return false;
      if (selectedCategoryId !== "ALL" && item.categoryId !== selectedCategoryId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [menuItems, selectedCategoryId, searchQuery]);

  // Cart Management
  const handleAddToCart = (item: MenuItem) => {
    const newId = `${item.id}-${Date.now()}`;
    setCart((prev) => {
      const existing = prev.find(
        (c) =>
          c.menuItem.id === item.id &&
          c.selectedModifiers.length === 0 &&
          !c.customNote
      );
      if (existing) {
        setSelectedCartItemId(existing.cartItemId);
        return prev.map((c) =>
          c.cartItemId === existing.cartItemId
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      setSelectedCartItemId(newId);
      return [
        ...prev,
        {
          cartItemId: newId,
          menuItem: item,
          quantity: 1,
          selectedModifiers: [],
        },
      ];
    });
  };

  const handleUpdateQty = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.cartItemId === cartItemId) {
            const nextQty = c.quantity + delta;
            return nextQty > 0 ? { ...c, quantity: nextQty } : null;
          }
          return c;
        })
        .filter(Boolean) as typeof prev
    );
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((c) => c.cartItemId !== cartItemId));
    if (selectedCartItemId === cartItemId) {
      setSelectedCartItemId(null);
    }
  };

  // Open item customization modal (either for a new item or editing an existing cart line)
  const handleOpenCustomize = (item: MenuItem, existingCartItemId?: string) => {
    if (existingCartItemId) {
      const line = cart.find((c) => c.cartItemId === existingCartItemId);
      if (line) {
        setCustomizingItem({
          item: line.menuItem,
          existingCartItemId,
          selectedModifiers: [...line.selectedModifiers],
          customNote: line.customNote || "",
          quantity: line.quantity,
        });
        return;
      }
    }
    setCustomizingItem({
      item,
      selectedModifiers: [],
      customNote: "",
      quantity: 1,
    });
  };

  const handleSaveCustomization = () => {
    if (!customizingItem) return;
    if (customizingItem.existingCartItemId) {
      setCart((prev) =>
        prev.map((c) =>
          c.cartItemId === customizingItem.existingCartItemId
            ? {
                ...c,
                selectedModifiers: customizingItem.selectedModifiers,
                customNote: customizingItem.customNote.trim() || undefined,
                quantity: customizingItem.quantity,
              }
            : c
        )
      );
    } else {
      const newId = `${customizingItem.item.id}-${Date.now()}`;
      setCart((prev) => [
        ...prev,
        {
          cartItemId: newId,
          menuItem: customizingItem.item,
          quantity: customizingItem.quantity,
          selectedModifiers: customizingItem.selectedModifiers,
          customNote: customizingItem.customNote.trim() || undefined,
        },
      ]);
      setSelectedCartItemId(newId);
    }
    setCustomizingItem(null);
  };

  // Hold current order so register is immediately freed for next customer
  const handleHoldCurrentOrder = () => {
    if (cart.length === 0) return;
    const newHeld: HeldCart = {
      id: `held-${Date.now()}`,
      orderType,
      selectedTableId,
      tableNameSnapshot: selectedTable?.tableNumber,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      guestCount,
      cart: [...cart],
      orderNote,
      discountAmount,
      discountReason,
      createdAt: new Date(),
      total,
    };
    setHeldCarts((prev) => [newHeld, ...prev]);
    resetOrder();
    toast({
      title: "Order Held",
      description: `Parked ${newHeld.cart.length} items. Terminal cleared for next sale.`,
      variant: "info",
    });
  };

  // Recall a held order back to the terminal
  const handleRecallHeldOrder = (held: HeldCart) => {
    setOrderType(held.orderType);
    setSelectedTableId(held.selectedTableId);
    setGuestCount(held.guestCount);
    setCustomerName(held.customerName || "");
    setCustomerPhone(held.customerPhone || "");
    setCart(held.cart);
    setOrderNote(held.orderNote);
    setDiscountAmount(held.discountAmount);
    setDiscountReason(held.discountReason);
    setHeldCarts((prev) => prev.filter((h) => h.id !== held.id));
    setIsHeldModalOpen(false);
    toast({
      title: "Order Recalled",
      description: "Restored held cart back to terminal ticket.",
      variant: "success",
    });
  };

  const handleDiscardHeldOrder = (heldId: string) => {
    setHeldCarts((prev) => prev.filter((h) => h.id !== heldId));
    toast({
      title: "Held Order Discarded",
      description: "Removed parked order from memory.",
      variant: "info",
    });
  };

  // Toggle modifier/instruction on currently selected or latest line item
  const handleToggleModifier = (mod: ItemModifier) => {
    if (cart.length === 0) {
      toast({
        title: "Select an item first",
        description: "Add an item from the menu before applying customisations.",
        variant: "info",
      });
      return;
    }

    const targetId = selectedCartItemId || cart[cart.length - 1].cartItemId;
    setCart((prev) =>
      prev.map((c) => {
        if (c.cartItemId !== targetId) return c;
        const exists = c.selectedModifiers.some((m) => m.name === mod.name);
        const updatedMods = exists
          ? c.selectedModifiers.filter((m) => m.name !== mod.name)
          : [...c.selectedModifiers, mod];
        return { ...c, selectedModifiers: updatedMods };
      })
    );
  };

  const handleAddCustomInstruction = (text: string) => {
    if (!text.trim() || cart.length === 0) return;
    const targetId = selectedCartItemId || cart[cart.length - 1].cartItemId;
    setCart((prev) =>
      prev.map((c) => (c.cartItemId === targetId ? { ...c, customNote: text.trim() } : c))
    );
    setCustomInstructionInput("");
    setIsInstructionPromptOpen(false);
  };

  // Cart Calculations
  const subtotal = cart.reduce((sum, line) => {
    const modTotal = line.selectedModifiers.reduce(
      (mSum, m) => mSum + m.priceAdjustment,
      0
    );
    return sum + (line.menuItem.price + modTotal) * line.quantity;
  }, 0);

  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(taxableSubtotal * 0.05); // 5% GST
  const total = taxableSubtotal + tax;

  const resetOrder = () => {
    setCart([]);
    setOrderNote("");
    setCustomerName("");
    setCustomerPhone("");
    setDiscountAmount(0);
    setDiscountReason("");
    setSelectedCartItemId(null);
  };

  // 1. Quick Checkout / Payment Submission
  const handleExecutePayment = async (
    paymentMethod: PaymentMethod,
    amountTendered?: number,
    changeDue?: number
  ) => {
    if (cart.length === 0) {
      toast({
        title: "Order is empty",
        description: "Add items from the menu before settling payment.",
        variant: "danger",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const itemsPayload = cart.map((line) => {
        const modTotal = line.selectedModifiers.reduce(
          (sum, m) => sum + m.priceAdjustment,
          0
        );
        const modTexts = [
          ...line.selectedModifiers.map((m) => m.name),
          ...(line.customNote ? [line.customNote] : []),
        ];
        return {
          menuItemId: line.menuItem.id,
          itemName: line.menuItem.name,
          unitPrice: line.menuItem.price + modTotal,
          quantity: line.quantity,
          specialInstructions: modTexts.join(", ") || null,
        };
      });

      const res = await fetch(`/api/cafe/${cafe.slug}/billing/quick-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          tableId: orderType === "DINE_IN" ? selectedTableId || null : null,
          tableNameSnapshot:
            orderType === "DINE_IN" ? selectedTable?.tableNumber || null : null,
          customerName:
            customerName.trim() || (orderType === "DINE_IN" ? null : "Walk-in Guest"),
          customerPhone: customerPhone.trim() || null,
          guestCount: orderType === "DINE_IN" ? guestCount : null,
          items: itemsPayload,
          notes: orderNote.trim() || null,
          discount: discountAmount,
          discountReason: discountReason || null,
          paymentMethod,
          amountTendered: amountTendered || null,
          changeDue: changeDue || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Payment checkout failed");
      }

      toast({
        title: "Payment Settled",
        description: `Order ${json.data.orderNumber} successfully closed via ${paymentMethod}.`,
        variant: "success",
      });

      setReceiptTargetOrder(json.data);
      setIsPreBillMode(false);
      setIsReceiptModalOpen(true);

      resetOrder();
      await refreshData();
    } catch (err: any) {
      toast({
        title: "Checkout failed",
        description: err.message || "Failed to process payment transaction",
        variant: "danger",
      });
    } finally {
      setIsSubmitting(false);
      setIsCashModalOpen(false);
      setIsUpiModalOpen(false);
    }
  };

  // 2. Send KOT to Kitchen for Dine-in
  const handleSendKot = async () => {
    if (cart.length === 0) {
      toast({
        title: "Order is empty",
        description: "Add items before sending KOT to kitchen.",
        variant: "danger",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const itemsPayload = cart.map((line) => {
        const modTotal = line.selectedModifiers.reduce(
          (sum, m) => sum + m.priceAdjustment,
          0
        );
        const modTexts = [
          ...line.selectedModifiers.map((m) => m.name),
          ...(line.customNote ? [line.customNote] : []),
        ];
        return {
          menuItemId: line.menuItem.id,
          itemName: line.menuItem.name,
          unitPrice: line.menuItem.price + modTotal,
          quantity: line.quantity,
          specialInstructions: modTexts.join(", ") || null,
        };
      });

      const res = await fetch(`/api/cafe/${cafe.slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: "DINE_IN",
          tableId: selectedTableId,
          tableNameSnapshot: selectedTable?.tableNumber,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          guestCount,
          items: itemsPayload,
          notes: orderNote.trim() || null,
          paymentStatus: "UNPAID",
          existingOrderIdToAppend: activeOrderForTable?.id || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to dispatch KOT");
      }

      toast({
        title: activeOrderForTable ? "Items Appended to Table" : "KOT Dispatched",
        description: `Order ${json.data.orderNumber} sent to kitchen queue.`,
        variant: "success",
      });

      resetOrder();
      await refreshData();
    } catch (err: any) {
      toast({
        title: "KOT Dispatch Error",
        description: err.message || "Failed to dispatch order to kitchen",
        variant: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Print Pre-Bill / Guest Check
  const handlePrintGuestCheck = () => {
    if (activeOrderForTable) {
      setReceiptTargetOrder(activeOrderForTable);
      setIsPreBillMode(true);
      setIsReceiptModalOpen(true);
    } else if (cart.length > 0) {
      const mockOrder: OrderWithItems = {
        id: "draft",
        cafeId: cafe.id,
        guestSessionId: null,
        customerId: null,
        orderNumber: "#DRAFT",
        orderType,
        tableId: selectedTableId || null,
        tableNameSnapshot: selectedTable?.tableNumber || null,
        customerName: "Walk-in Guest",
        customerPhone: null,
        status: "NEW",
        paymentStatus: "UNPAID",
        paymentMethod: null,
        subtotal,
        discount: discountAmount,
        tax,
        total,
        notes: orderNote || null,
        cancellationReason: null,
        createdAt: new Date(),
        confirmedAt: null,
        preparingAt: null,
        readyAt: null,
        servedAt: null,
        completedAt: null,
        cancelledAt: null,
        updatedAt: new Date(),
        items: cart.map((c, i) => {
          const modTotal = c.selectedModifiers.reduce(
            (sum, m) => sum + m.priceAdjustment,
            0
          );
          const modTexts = [
            ...c.selectedModifiers.map((m) => m.name),
            ...(c.customNote ? [c.customNote] : []),
          ];
          return {
            id: `draft-${i}`,
            orderId: "draft",
            menuItemId: c.menuItem.id,
            itemName: c.menuItem.name,
            unitPrice: c.menuItem.price + modTotal,
            quantity: c.quantity,
            itemTotal: (c.menuItem.price + modTotal) * c.quantity,
            variantName: null,
            specialInstructions: modTexts.join(", ") || null,
            createdAt: new Date(),
          };
        }),
      };
      setReceiptTargetOrder(mockOrder);
      setIsPreBillMode(true);
      setIsReceiptModalOpen(true);
    }
  };

  // 4. Directly Settle Table Active Unpaid Order (Order Created -> Sent to Kitchen -> Settle Payment)
  const handleSettleActiveTableOrder = async (method: PaymentMethod) => {
    if (!activeOrderForTable) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(
        `/api/cafe/${cafe.slug}/orders/${activeOrderForTable.id}/payment`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentStatus: "PAID",
            paymentMethod: method,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to settle table order");
      }
      toast({
        title: "Table Settle Complete",
        description: `Order ${activeOrderForTable.orderNumber} settled via ${method}.`,
        variant: "success",
      });
      setReceiptTargetOrder({
        ...activeOrderForTable,
        paymentStatus: "PAID",
        paymentMethod: method,
      });
      setIsPreBillMode(false);
      setIsReceiptModalOpen(true);
      await refreshData();
    } catch (err: any) {
      toast({
        title: "Settlement Error",
        description: err.message || "Failed to update payment status",
        variant: "danger",
      });
    } finally {
      setIsSubmitting(false);
      setIsCashModalOpen(false);
      setIsUpiModalOpen(false);
    }
  };

  // Payment Active State (Enabled only when there is an order or table to settle)
  const isPayableActive =
    total > 0 ||
    (cart.length === 0 &&
      !!activeOrderForTable &&
      activeOrderForTable.paymentStatus === "UNPAID");

  const payableTotal =
    cart.length === 0 && activeOrderForTable ? activeOrderForTable.total : total;

  // Dynamic Primary Action Configuration (Reflects Order State Lifecycle)
  const primaryActionConfig = useMemo(() => {
    // Case 1: Empty cart and no active table order
    if (cart.length === 0 && !activeOrderForTable) {
      return {
        label: "Select items to start order",
        amountText: "₹0",
        disabled: true,
        onClick: () => {},
      };
    }

    // Case 2: Cart has items, DINE_IN, and table has NO active order yet (New KOT)
    if (cart.length > 0 && orderType === "DINE_IN" && !activeOrderForTable) {
      return {
        label: "Send to Kitchen (KOT)",
        amountText: `₹${total.toLocaleString("en-IN")}`,
        disabled: false,
        onClick: handleSendKot,
      };
    }

    // Case 3: Cart has items, DINE_IN, and table ALREADY has an active order (Add new items to KOT)
    if (cart.length > 0 && orderType === "DINE_IN" && activeOrderForTable) {
      return {
        label: `Send New Items to KOT (${activeOrderForTable.orderNumber})`,
        amountText: `+₹${total.toLocaleString("en-IN")}`,
        disabled: false,
        onClick: handleSendKot,
      };
    }

    // Case 4: Cart is empty but table has an active unpaid order (Order Sent -> Settle Payment)
    if (cart.length === 0 && orderType === "DINE_IN" && activeOrderForTable) {
      return {
        label: `Settle Table ${selectedTable?.tableNumber || ""} (${activeOrderForTable.orderNumber})`,
        amountText: `₹${activeOrderForTable.total.toLocaleString("en-IN")}`,
        disabled: false,
        onClick: () => setIsCashModalOpen(true),
      };
    }

    // Case 5: Takeaway / Delivery with items in cart
    return {
      label: "Settle Payment",
      amountText: `₹${total.toLocaleString("en-IN")}`,
      disabled: false,
      onClick: () => setIsCashModalOpen(true),
    };
  }, [cart.length, orderType, activeOrderForTable, total, selectedTable]);

  const openTablesCount = tables.filter((t) => t.status === "OCCUPIED").length;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[var(--color-background,#F7F6F2)] select-none text-[var(--color-foreground,#242321)] antialiased">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. COMPACT TOP POS HEADER
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="px-3.5 py-1.5 border-b border-[var(--color-border,#E7E4DD)] bg-[var(--color-surface,#FFFFFF)] flex items-center justify-between gap-3 flex-shrink-0 h-11">
        {/* Left Title */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <h1 className="text-sm sm:text-base font-semibold tracking-tight text-[var(--color-foreground,#242321)] leading-none">
            POS Terminal
          </h1>
          <span className="text-[10px] text-[var(--color-muted,#73716B)] font-normal bg-[var(--color-background,#F7F6F2)] border border-[var(--color-border,#E7E4DD)] px-1.5 py-0.5 rounded">
            Live Register
          </span>
        </div>

        {/* Center Search Bar with Keyboard Shortcut */}
        <div className="relative w-full max-w-xs md:max-w-sm hidden sm:block">
          <IconSearch className="w-3.5 h-3.5 text-[var(--color-muted,#73716B)] absolute left-2.5 top-2" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search catalog... ( / )"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-7 h-7.5 text-xs rounded border border-[var(--color-border,#E7E4DD)] bg-[var(--color-background,#F7F6F2)] text-[var(--color-foreground,#242321)] placeholder-[var(--color-muted,#73716B)]/70 focus:outline-none focus:border-[var(--color-primary,#8B5E3C)] focus:bg-[var(--color-surface,#FFFFFF)] transition-colors font-normal"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-2 text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)]"
            >
              <IconX className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="absolute right-2 top-1.5 text-[9px] font-mono px-1 py-0.2 rounded bg-[var(--color-border,#E7E4DD)] text-[var(--color-muted,#73716B)]">
              /
            </span>
          )}
        </div>

        {/* Right Status & Cashier Profile */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Online status */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#66805F]/10 text-[#66805F] text-[10px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#66805F] animate-pulse" />
            <span>Online</span>
          </div>

          {/* Date & Time */}
          <span className="text-[10px] text-[var(--color-muted,#73716B)] font-normal hidden md:inline">
            {currentTime}
          </span>

          {/* Cashier Chip */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-[var(--color-border,#E7E4DD)]">
            <div className="w-6 h-6 rounded bg-[var(--color-primary,#8B5E3C)] text-white text-[10px] font-semibold flex items-center justify-center">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left leading-tight">
              <div className="text-xs font-medium text-[var(--color-foreground,#242321)] truncate max-w-[90px]">
                {user.name}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. ORDER CONTROLS STRIP (Dine-in / Takeaway, Tables, Held)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="px-3.5 py-1 border-b border-[var(--color-border,#E7E4DD)] bg-[var(--color-surface,#FFFFFF)] flex items-center justify-between gap-2 flex-shrink-0 flex-wrap min-h-9">
        <div className="flex items-center gap-2">
          {/* Order Type Segment: [Dine-in] [Takeaway] [Delivery] */}
          <div className="flex items-center bg-[var(--color-background,#F7F6F2)] p-0.5 rounded border border-[var(--color-border,#E7E4DD)] gap-0.5">
            <button
              type="button"
              onClick={() => setOrderType("DINE_IN")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                orderType === "DINE_IN"
                  ? "bg-[var(--color-primary,#8B5E3C)] text-white shadow-2xs"
                  : "text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)]"
              }`}
            >
              <IconArmchair className="w-3.5 h-3.5" />
              <span>Dine-in</span>
            </button>
            <button
              type="button"
              onClick={() => setOrderType("TAKEAWAY")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                orderType === "TAKEAWAY"
                  ? "bg-[var(--color-primary,#8B5E3C)] text-white shadow-2xs"
                  : "text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)]"
              }`}
            >
              <IconShoppingBag className="w-3.5 h-3.5" />
              <span>Takeaway</span>
            </button>
            <button
              type="button"
              onClick={() => setOrderType("DELIVERY")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                orderType === "DELIVERY"
                  ? "bg-[var(--color-primary,#8B5E3C)] text-white shadow-2xs"
                  : "text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)]"
              }`}
            >
              <IconBike className="w-3.5 h-3.5" />
              <span>Delivery</span>
            </button>
          </div>

          {/* Table Selector Dropdown */}
          {orderType === "DINE_IN" && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTableDropdownOpen((prev) => !prev)}
                className="px-2 py-1 rounded border border-[var(--color-border,#E7E4DD)] bg-[var(--color-surface,#FFFFFF)] hover:bg-[var(--color-background,#F7F6F2)] text-xs font-medium flex items-center gap-1.5 text-[var(--color-foreground,#242321)] transition-colors"
              >
                <IconArmchair className="w-3.5 h-3.5 text-[var(--color-primary,#8B5E3C)]" />
                <span className="font-medium text-xs">
                  {selectedTable ? selectedTable.tableNumber : "Select Table"}
                </span>
                <IconChevronDown className="w-3 h-3 text-[var(--color-muted,#73716B)]" />
              </button>

              {isTableDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 z-30 w-44 rounded-md bg-[var(--color-surface,#FFFFFF)] border border-[var(--color-border,#E7E4DD)] shadow-md p-1 max-h-48 overflow-y-auto">
                  {tables.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTableId(t.id);
                        setIsTableDropdownOpen(false);
                      }}
                      className={`w-full px-2 py-1 rounded text-left text-xs flex items-center justify-between transition-colors ${
                        t.id === selectedTableId
                          ? "bg-[var(--color-primary-light,#FAF7F2)] font-medium text-[var(--color-primary,#8B5E3C)]"
                          : "hover:bg-[var(--color-background,#F7F6F2)] text-[var(--color-foreground,#242321)]"
                      }`}
                    >
                      <span>{t.tableNumber}</span>
                      <span
                        className={`text-[9px] font-medium px-1 py-0.2 rounded ${
                          t.status === "AVAILABLE"
                            ? "bg-[#66805F]/10 text-[#66805F]"
                            : "bg-[#C4934A]/10 text-[#C4934A]"
                        }`}
                      >
                        {t.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Guests Stepper */}
          {orderType === "DINE_IN" && (
            <div className="flex items-center px-1.5 py-0.5 bg-[var(--color-surface,#FFFFFF)] border border-[var(--color-border,#E7E4DD)] rounded gap-1 text-xs">
              <span className="text-[10px] text-[var(--color-muted,#73716B)]">Guests</span>
              <button
                type="button"
                onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                className="w-4 h-4 rounded hover:bg-[var(--color-background,#F7F6F2)] font-medium flex items-center justify-center text-[var(--color-muted,#73716B)]"
              >
                -
              </button>
              <span className="font-semibold text-[var(--color-primary,#8B5E3C)] w-3 text-center text-xs">
                {guestCount}
              </span>
              <button
                type="button"
                onClick={() => setGuestCount((g) => g + 1)}
                className="w-4 h-4 rounded hover:bg-[var(--color-background,#F7F6F2)] font-medium flex items-center justify-center text-[var(--color-muted,#73716B)]"
              >
                +
              </button>
            </div>
          )}

          {/* Customer Selection Pill (Optional for Loyalty, Repeat Orders, Takeaway) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCustomerPopoverOpen((prev) => !prev)}
              className={`h-7 px-2 rounded border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                customerName
                  ? "bg-[var(--color-primary-light,#FAF7F2)] border-[var(--color-primary,#8B5E3C)]/40 text-[var(--color-primary,#8B5E3C)]"
                  : "bg-[var(--color-surface,#FFFFFF)] border-[var(--color-border,#E7E4DD)] text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)] hover:bg-[var(--color-background,#F7F6F2)]"
              }`}
            >
              <IconUser className="w-3.5 h-3.5 text-[var(--color-primary,#8B5E3C)]" />
              <span className="truncate max-w-[110px]">
                {customerName
                  ? customerName
                  : orderType === "DINE_IN"
                  ? "Customer"
                  : "Walk-in Guest"}
              </span>
              {customerPhone && (
                <span className="text-[9.5px] font-mono opacity-80 hidden sm:inline">
                  ({customerPhone.slice(-4)})
              </span>
              )}
              <IconChevronDown className="w-3 h-3 text-[var(--color-muted,#73716B)]" />
            </button>

            {isCustomerPopoverOpen && (
              <div className="absolute top-full left-0 mt-1 z-30 w-64 rounded-md bg-[var(--color-surface,#FFFFFF)] border border-[var(--color-border,#E7E4DD)] shadow-lg p-3 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-[var(--color-border,#E7E4DD)]">
                  <span className="text-xs font-semibold text-[var(--color-foreground,#242321)] flex items-center gap-1">
                    <IconUser className="w-3.5 h-3.5 text-[var(--color-primary,#8B5E3C)]" />
                    <span>Customer Details</span>
                  </span>
                  <span className="text-[10px] text-[var(--color-muted,#73716B)]">Optional</span>
                </div>

                <div className="space-y-1.5">
                  <div>
                    <label className="text-[10px] font-medium text-[var(--color-muted,#73716B)] block mb-0.5">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border,#E7E4DD)] bg-[var(--color-background,#F7F6F2)] text-[var(--color-foreground,#242321)] placeholder-[var(--color-muted,#73716B)]/60 focus:outline-none focus:border-[var(--color-primary,#8B5E3C)]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-[var(--color-muted,#73716B)] block mb-0.5">
                      Phone / Loyalty No.
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border,#E7E4DD)] bg-[var(--color-background,#F7F6F2)] text-[var(--color-foreground,#242321)] placeholder-[var(--color-muted,#73716B)]/60 focus:outline-none focus:border-[var(--color-primary,#8B5E3C)]"
                    />
                  </div>

                  {/* Quick Chips */}
                  <div className="flex items-center gap-1 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerName("Walk-in Guest");
                        setCustomerPhone("");
                      }}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-surface,#FFFFFF)] hover:bg-[var(--color-border,#E7E4DD)] border border-[var(--color-border,#E7E4DD)] text-[var(--color-muted,#73716B)] font-normal"
                    >
                      Walk-in
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerName("Regular Guest");
                      }}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-surface,#FFFFFF)] hover:bg-[var(--color-border,#E7E4DD)] border border-[var(--color-border,#E7E4DD)] text-[var(--color-muted,#73716B)] font-normal"
                    >
                      Regular
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerName("VIP Guest");
                      }}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-surface,#FFFFFF)] hover:bg-[var(--color-border,#E7E4DD)] border border-[var(--color-border,#E7E4DD)] text-[var(--color-muted,#73716B)] font-normal"
                    >
                      VIP
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border,#E7E4DD)]">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerName("");
                      setCustomerPhone("");
                      setIsCustomerPopoverOpen(false);
                    }}
                    className="text-[10px] text-[#B65D54] hover:underline font-medium"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCustomerPopoverOpen(false)}
                    className="px-2.5 py-0.5 rounded bg-[var(--color-primary,#8B5E3C)] hover:bg-[var(--color-primary-hover,#754C30)] text-white text-[11px] font-medium transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Action Utilities: Open Tables & Held Orders */}
        <div className="flex items-center gap-1.5">
          {/* Open Tables Button */}
          <button
            type="button"
            onClick={() => setIsActiveTabsDrawerOpen(true)}
            className="h-7 px-2 rounded border border-[var(--color-border,#E7E4DD)] bg-[var(--color-surface,#FFFFFF)] hover:bg-[var(--color-background,#F7F6F2)] text-xs font-medium text-[var(--color-foreground,#242321)] flex items-center gap-1.5 transition-colors"
          >
            <IconArmchair className="w-3.5 h-3.5 text-[var(--color-primary,#8B5E3C)]" />
            <span>Open Tables</span>
            {openTablesCount > 0 && (
              <span className="px-1 py-0.2 rounded text-[9px] font-medium bg-[var(--color-primary,#8B5E3C)] text-white">
                {openTablesCount}
              </span>
            )}
          </button>

          {/* Held Orders Button */}
          <button
            type="button"
            onClick={() => setIsHeldModalOpen(true)}
            className={`h-7 px-2 rounded border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              heldCarts.length > 0
                ? "bg-[#C4934A]/10 border-[#C4934A]/40 text-[var(--color-foreground,#242321)] hover:bg-[#C4934A]/20"
                : "bg-[var(--color-surface,#FFFFFF)] border-[var(--color-border,#E7E4DD)] text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)]"
            }`}
          >
            <IconClock className="w-3.5 h-3.5 text-[#C4934A]" />
            <span>Held</span>
            {heldCarts.length > 0 && (
              <span className="px-1 py-0.2 rounded text-[9px] font-medium bg-[#C4934A] text-white">
                {heldCarts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. MAIN SPLIT TERMINAL VIEW
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
        {/* ================================================================
            LEFT SECTION: Catalog Grid & Categories (NO HORIZONTAL SCROLL)
           ================================================================ */}
        <div className="lg:col-span-8 flex flex-col overflow-hidden min-h-0 border-r border-[var(--color-border,#E7E4DD)]">
          {/* Clean Wrapped Category Pills (Never horizontal scrolls) */}
          <div className="px-3.5 py-1.5 flex flex-wrap items-center gap-1.5 bg-[var(--color-surface,#FAF9F6)] border-b border-[var(--color-border,#E7E4DD)] flex-shrink-0">
            <button
              type="button"
              onClick={() => setSelectedCategoryId("ALL")}
              className={`h-6.5 px-2.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                selectedCategoryId === "ALL"
                  ? "bg-[var(--color-primary,#8B5E3C)] text-white shadow-2xs"
                  : "bg-[var(--color-surface,#FFFFFF)] border border-[var(--color-border,#E7E4DD)] text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)] hover:bg-[var(--color-background,#F7F6F2)]"
              }`}
            >
              <span>All Items</span>
              <span
                className={`text-[9.5px] px-1 py-0.2 rounded font-mono ${
                  selectedCategoryId === "ALL"
                    ? "bg-white/20 text-white"
                    : "bg-[var(--color-background,#F7F6F2)] text-[var(--color-muted,#73716B)]"
                }`}
              >
                {categoryCounts["ALL"] || 0}
              </span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`h-6.5 px-2.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                  selectedCategoryId === cat.id
                    ? "bg-[var(--color-primary,#8B5E3C)] text-white shadow-2xs"
                    : "bg-[var(--color-surface,#FFFFFF)] border border-[var(--color-border,#E7E4DD)] text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)] hover:bg-[var(--color-background,#F7F6F2)]"
                }`}
              >
                <span>{cat.name}</span>
                {categoryCounts[cat.id] !== undefined && (
                  <span
                    className={`text-[9.5px] px-1 py-0.2 rounded font-mono ${
                      selectedCategoryId === cat.id
                        ? "bg-white/20 text-white"
                        : "bg-[var(--color-background,#F7F6F2)] text-[var(--color-muted,#73716B)]"
                    }`}
                  >
                    {categoryCounts[cat.id]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Compact 4-Column Product Cards Grid (NO NUMBER BADGE ON PHOTO) */}
          <div className="flex-1 px-3 py-2 overflow-y-auto min-h-0 bg-[var(--color-background,#F7F6F2)]">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 pb-2">
              {filteredMenuItems.map((item) => {
                const imgUrl = getItemImageUrl(item);
                const inCart = cart.some((c) => c.menuItem.id === item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenCustomize(item)}
                    className={`rounded-md border bg-[var(--color-surface,#FFFFFF)] overflow-hidden transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99] ${
                      inCart
                        ? "border-[var(--color-primary,#8B5E3C)] ring-1 ring-[var(--color-primary,#8B5E3C)]/20 shadow-2xs"
                        : "border-[var(--color-border,#E7E4DD)] hover:border-[var(--color-primary,#8B5E3C)]/60"
                    }`}
                  >
                    {/* Dense & Fast Image (~28% reduced height for speed over beauty) */}
                    <div className="h-14 sm:h-16 w-full overflow-hidden bg-[var(--color-background,#F7F6F2)] relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>

                    {/* Compact Details & Quick Action */}
                    <div className="p-1.5 bg-[var(--color-surface,#FFFFFF)] flex flex-col justify-between flex-1">
                      <h4
                        className="text-[11.5px] font-medium text-[var(--color-foreground,#242321)] truncate leading-tight"
                        title={item.name}
                      >
                        {item.name}
                      </h4>

                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--color-foreground,#242321)] font-mono">
                          ₹{item.price.toLocaleString("en-IN")}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCustomize(item);
                            }}
                            className="text-[9.5px] text-[var(--color-primary,#8B5E3C)] hover:underline font-medium px-1 py-0.2 rounded hover:bg-[var(--color-primary-light,#FAF7F2)]"
                          >
                            Custom
                          </button>

                          {/* Fast Add Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(item);
                            }}
                            title="Add to order"
                            className="w-5 h-5 rounded-md bg-[var(--color-primary,#8B5E3C)] hover:bg-[var(--color-primary-hover,#754C30)] text-white flex items-center justify-center active:scale-90 transition-transform shadow-xs"
                          >
                            <IconPlus className="w-2.5 h-2.5 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================================================================
            RIGHT SECTION: Current Order Ticket
           ================================================================ */}
        <div className="lg:col-span-4 bg-[var(--color-surface,#FFFFFF)] flex flex-col overflow-hidden min-h-0">
          {/* Header */}
          <div className="px-3 py-2 border-b border-[var(--color-border,#E7E4DD)] flex items-center justify-between flex-shrink-0 h-10">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-semibold text-[var(--color-foreground,#242321)] uppercase tracking-wide">
                Current Order
              </h3>
              {cart.length > 0 && (
                <span className="text-[10px] bg-[var(--color-primary-light,#FAF7F2)] text-[var(--color-primary,#8B5E3C)] font-medium px-1.5 py-0.2 rounded-md font-mono shadow-xs">
                  {cart.reduce((s, c) => s + c.quantity, 0)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleHoldCurrentOrder}
                    className="text-[11px] font-medium text-[var(--color-primary,#8B5E3C)] hover:underline flex items-center gap-0.5 transition-colors"
                    title="Put order on hold"
                  >
                    <IconClock className="w-3 h-3" />
                    <span>Hold</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetOrder}
                    className="text-[11px] font-medium text-[#B65D54] hover:underline transition-colors"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Itemized Order List */}
          <div className="flex-1 px-2.5 py-1.5 overflow-y-auto space-y-1.5 min-h-0">
            {cart.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center text-center text-[var(--color-muted,#73716B)]">
                <div className="w-8 h-8 rounded-full bg-[var(--color-background,#FAF9F6)] border border-[var(--color-border,#E7E4DD)] flex items-center justify-center mb-1 text-[var(--color-primary,#8B5E3C)] shadow-2xs">
                  <IconShoppingBag className="w-4 h-4 stroke-[1.8]" />
                </div>
                <p className="text-xs font-medium text-[var(--color-foreground,#242321)]">No items yet</p>
                <p className="text-[10px] text-[var(--color-muted,#73716B)] mt-0.5 max-w-[200px]">
                  Select a product to start an order
                </p>
              </div>
            ) : (
              cart.map((line) => {
                const imgUrl = getItemImageUrl(line.menuItem);
                const isSelected = line.cartItemId === selectedCartItemId;
                const modTotal = line.selectedModifiers.reduce(
                  (sum, m) => sum + m.priceAdjustment,
                  0
                );
                const lineTotal = (line.menuItem.price + modTotal) * line.quantity;

                return (
                  <div
                    key={line.cartItemId}
                    onClick={() => setSelectedCartItemId(line.cartItemId)}
                    className={`p-2 rounded border transition-colors cursor-pointer ${
                      isSelected
                        ? "border-[var(--color-primary,#8B5E3C)] bg-[var(--color-primary-light,#FAF7F2)]"
                        : "border-[var(--color-border,#E7E4DD)] bg-[var(--color-surface,#FFFFFF)] hover:border-[var(--color-muted,#73716B)]/50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {/* Thumbnail Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={line.menuItem.name}
                        className="w-7 h-7 rounded object-cover flex-shrink-0 bg-[var(--color-background,#F7F6F2)]"
                      />

                      {/* Middle: Title & Modifiers */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-1">
                          <h4 className="text-xs font-medium text-[var(--color-foreground,#242321)] truncate leading-tight">
                            {line.menuItem.name}
                          </h4>
                          <span className="text-xs font-semibold text-[var(--color-foreground,#242321)] font-mono">
                            ₹{lineTotal.toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* Modifiers Chips with Click-to-Remove */}
                        <div className="flex items-center gap-1 flex-wrap mt-1">
                          {line.selectedModifiers.map((mod) => (
                            <span
                              key={mod.name}
                              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] bg-[var(--color-primary-light,#FAF7F2)] text-[var(--color-primary,#8B5E3C)] font-medium"
                            >
                              <span>{mod.name}</span>
                              {mod.priceAdjustment > 0 && (
                                <span>+₹{mod.priceAdjustment}</span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCart((prev) =>
                                    prev.map((c) =>
                                      c.cartItemId === line.cartItemId
                                        ? {
                                            ...c,
                                            selectedModifiers: c.selectedModifiers.filter(
                                              (m) => m.name !== mod.name
                                            ),
                                          }
                                        : c
                                    )
                                  );
                                }}
                                className="hover:text-[#B65D54] font-medium"
                              >
                                ×
                              </button>
                            </span>
                          ))}

                          {line.customNote && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] bg-[#C4934A]/10 text-[#C4934A] italic font-medium">
                              <span>{line.customNote}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCart((prev) =>
                                    prev.map((c) =>
                                      c.cartItemId === line.cartItemId
                                        ? { ...c, customNote: undefined }
                                        : c
                                    )
                                  );
                                }}
                                className="hover:text-[#B65D54] font-medium"
                              >
                                ×
                              </button>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCustomize(line.menuItem, line.cartItemId);
                            }}
                            className="text-[9.5px] text-[var(--color-primary,#8B5E3C)] hover:underline font-medium flex items-center gap-0.5"
                          >
                            <IconNote className="w-2.5 h-2.5" />
                            <span>
                              {line.selectedModifiers.length > 0 || line.customNote
                                ? "Edit"
                                : "+ Customize"}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Stepper & Trash */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="flex items-center bg-[var(--color-background,#F7F6F2)] border border-[var(--color-border,#E7E4DD)] px-1 py-0.2 rounded text-xs">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateQty(line.cartItemId, -1);
                            }}
                            className="w-3.5 h-3.5 font-medium text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)] flex items-center justify-center text-xs"
                          >
                            -
                          </button>
                          <span className="w-3 text-center font-semibold text-[var(--color-foreground,#242321)] text-xs font-mono">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateQty(line.cartItemId, 1);
                            }}
                            className="w-3.5 h-3.5 font-medium text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)] flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromCart(line.cartItemId);
                          }}
                          className="text-[var(--color-muted,#73716B)] hover:text-[#B65D54] transition-colors p-0.5"
                        >
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Totals & Payment Actions */}
          <div className="p-2.5 border-t border-[var(--color-border,#E7E4DD)] bg-[var(--color-surface,#FFFFFF)] space-y-1.5 flex-shrink-0">
            {/* Order Note Input */}
            <input
              type="text"
              placeholder="Order remarks (e.g. Table request, allergic to dairy)..."
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border,#E7E4DD)] bg-[var(--color-background,#F7F6F2)] text-[var(--color-foreground,#242321)] placeholder-[var(--color-muted,#73716B)]/70 focus:outline-none focus:border-[var(--color-primary,#8B5E3C)] font-normal"
            />

            {/* Financial Breakdown */}
            <div className="space-y-0.5 text-xs text-[var(--color-muted,#73716B)]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-[var(--color-foreground,#242321)] font-mono">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span>Discount</span>
                  <button
                    type="button"
                    onClick={() => setIsDiscountOpen((prev) => !prev)}
                    className="text-[9.5px] font-medium text-[var(--color-primary,#8B5E3C)] bg-[var(--color-primary-light,#FAF7F2)] px-1 py-0.2 rounded hover:bg-[var(--color-primary-light,#FAF7F2)]/80 transition-colors"
                  >
                    {discountAmount > 0 ? "Edit" : "+ Add"}
                  </button>
                </div>
                <span className="font-medium text-[var(--color-foreground,#242321)] font-mono">
                  - ₹{discountAmount.toLocaleString("en-IN")}
                </span>
              </div>

              {isDiscountOpen && (
                <div className="flex items-center gap-1 py-0.5">
                  {[0, 5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        const amt = Math.round((subtotal * pct) / 100);
                        setDiscountAmount(amt);
                        setDiscountReason(pct > 0 ? `${pct}% Off` : "");
                      }}
                      className="px-1.5 py-0.2 rounded text-[9px] font-medium border border-[var(--color-border,#E7E4DD)] hover:bg-[var(--color-background,#F7F6F2)]"
                    >
                      {pct === 0 ? "0%" : `${pct}%`}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-between text-[11px]">
                <span>GST (5%)</span>
                <span className="font-medium text-[var(--color-foreground,#242321)] font-mono">
                  ₹{tax.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Total */}
              <div className="flex justify-between items-baseline pt-1 border-t border-[var(--color-border,#E7E4DD)] text-xs font-semibold text-[var(--color-foreground,#242321)]">
                <span>Total</span>
                <span className="text-base font-bold text-[var(--color-foreground,#242321)] font-mono">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* 4 Payment Tender Buttons: [Cash] [UPI] [Card] [More] (Active only when needed) */}
            <div className="grid grid-cols-4 gap-1 pt-0.5">
              <button
                type="button"
                disabled={isSubmitting || !isPayableActive}
                onClick={() => setIsCashModalOpen(true)}
                className={`py-1 px-1 rounded border text-xs font-medium flex flex-col items-center gap-0.5 transition-colors ${
                  isPayableActive
                    ? "border-[var(--color-border,#E7E4DD)] bg-[var(--color-surface,#FFFFFF)] hover:bg-[var(--color-background,#F7F6F2)] text-[var(--color-foreground,#242321)] active:scale-95 shadow-2xs cursor-pointer"
                    : "border-[var(--color-border,#E7E4DD)]/60 bg-[var(--color-background,#F7F6F2)] text-[var(--color-muted,#73716B)]/50 cursor-not-allowed opacity-50"
                }`}
              >
                <IconCash className={`w-3.5 h-3.5 ${isPayableActive ? "text-[#66805F]" : "text-[var(--color-muted,#73716B)]/50"}`} />
                <span className="text-[10px]">Cash</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting || !isPayableActive}
                onClick={() => setIsUpiModalOpen(true)}
                className={`py-1 px-1 rounded border text-xs font-medium flex flex-col items-center gap-0.5 transition-colors ${
                  isPayableActive
                    ? "border-[var(--color-border,#E7E4DD)] bg-[var(--color-surface,#FFFFFF)] hover:bg-[var(--color-background,#F7F6F2)] text-[var(--color-foreground,#242321)] active:scale-95 shadow-2xs cursor-pointer"
                    : "border-[var(--color-border,#E7E4DD)]/60 bg-[var(--color-background,#F7F6F2)] text-[var(--color-muted,#73716B)]/50 cursor-not-allowed opacity-50"
                }`}
              >
                <IconQrcode className={`w-3.5 h-3.5 ${isPayableActive ? "text-[var(--color-primary,#8B5E3C)]" : "text-[var(--color-muted,#73716B)]/50"}`} />
                <span className="text-[10px]">UPI</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting || !isPayableActive}
                onClick={() => {
                  if (cart.length === 0 && activeOrderForTable) {
                    handleSettleActiveTableOrder("CARD");
                  } else {
                    handleExecutePayment("CARD");
                  }
                }}
                className={`py-1 px-1 rounded border text-xs font-medium flex flex-col items-center gap-0.5 transition-colors ${
                  isPayableActive
                    ? "border-[var(--color-border,#E7E4DD)] bg-[var(--color-surface,#FFFFFF)] hover:bg-[var(--color-background,#F7F6F2)] text-[var(--color-foreground,#242321)] active:scale-95 shadow-2xs cursor-pointer"
                    : "border-[var(--color-border,#E7E4DD)]/60 bg-[var(--color-background,#F7F6F2)] text-[var(--color-muted,#73716B)]/50 cursor-not-allowed opacity-50"
                }`}
              >
                <IconCreditCard className={`w-3.5 h-3.5 ${isPayableActive ? "text-[var(--color-primary,#8B5E3C)]" : "text-[var(--color-muted,#73716B)]/50"}`} />
                <span className="text-[10px]">Card</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting || !isPayableActive}
                onClick={() => setIsSplitModalOpen(true)}
                className={`py-1 px-1 rounded border text-xs font-medium flex flex-col items-center gap-0.5 transition-colors ${
                  isPayableActive
                    ? "border-[var(--color-border,#E7E4DD)] bg-[var(--color-surface,#FFFFFF)] hover:bg-[var(--color-background,#F7F6F2)] text-[var(--color-foreground,#242321)] active:scale-95 shadow-2xs cursor-pointer"
                    : "border-[var(--color-border,#E7E4DD)]/60 bg-[var(--color-background,#F7F6F2)] text-[var(--color-muted,#73716B)]/50 cursor-not-allowed opacity-50"
                }`}
              >
                <IconDots className={`w-3.5 h-3.5 ${isPayableActive ? "text-[var(--color-muted,#73716B)]" : "text-[var(--color-muted,#73716B)]/50"}`} />
                <span className="text-[10px]">More</span>
              </button>
            </div>

            {/* Dynamic State Primary Action Button (Reflects Order State Lifecycle) */}
            <button
              type="button"
              disabled={isSubmitting || primaryActionConfig.disabled}
              onClick={primaryActionConfig.onClick}
              className="w-full py-2 rounded bg-[var(--color-primary,#8B5E3C)] hover:bg-[var(--color-primary-hover,#754C30)] text-white active:scale-[0.99] font-semibold text-xs flex items-center justify-between px-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              {isSubmitting ? (
                <div className="w-full flex items-center justify-center">
                  <IconLoader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : (
                <>
                  <span className="truncate pr-2">{primaryActionConfig.label}</span>
                  <div className="flex items-center gap-1 font-mono flex-shrink-0">
                    <span>{primaryActionConfig.amountText}</span>
                    {!primaryActionConfig.disabled && <IconArrowRight className="w-3.5 h-3.5" />}
                  </div>
                </>
              )}
            </button>

            {/* Secondary Action: Print Guest Check */}
            <button
              type="button"
              disabled={cart.length === 0 && !activeOrderForTable}
              onClick={handlePrintGuestCheck}
              className="w-full py-1 rounded border border-[var(--color-border,#E7E4DD)] hover:bg-[var(--color-background,#F7F6F2)] text-[11px] font-medium text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)] flex items-center justify-center gap-1 transition-colors disabled:opacity-40"
            >
              <IconPrinter className="w-3.5 h-3.5" />
              <span>Print Guest Check</span>
            </button>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. ITEM CUSTOMIZATION MODAL (Clear Selection & Control)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. ITEM CUSTOMIZATION MODAL (Clear Selection & Control)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[var(--color-surface,#FFFFFF)] rounded-lg border border-[var(--color-border,#E7E4DD)] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-3 border-b border-[var(--color-border,#E7E4DD)] flex items-center justify-between bg-[var(--color-surface,#FAF9F6)]">
              <div className="flex items-center gap-2.5">
                <img
                  src={getItemImageUrl(customizingItem.item)}
                  alt={customizingItem.item.name}
                  className="w-9 h-9 rounded object-cover bg-white border border-[var(--color-border,#E7E4DD)]"
                />
                <div>
                  <h3 className="text-xs font-semibold text-[var(--color-foreground,#242321)]">
                    {customizingItem.item.name}
                  </h3>
                  <p className="text-[11px] text-[var(--color-primary,#8B5E3C)] font-semibold font-mono">
                    Base: ₹{customizingItem.item.price.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomizingItem(null)}
                className="w-6 h-6 rounded-md bg-white border border-[var(--color-border,#E7E4DD)] flex items-center justify-center text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)] shadow-xs"
              >
                <IconX className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3.5 overflow-y-auto space-y-3.5 text-xs">
              {/* Add-ons from dynamic category */}
              {dynamicAddonItems.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted,#73716B)] block mb-1.5">
                    Add-ons & Extras
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {dynamicAddonItems.map((addon) => {
                      const isSelected = customizingItem.selectedModifiers.some(
                        (m) => m.name === addon.name
                      );
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => {
                            setCustomizingItem((prev) => {
                              if (!prev) return null;
                              const exists = prev.selectedModifiers.some(
                                (m) => m.name === addon.name
                              );
                              const updated = exists
                                ? prev.selectedModifiers.filter((m) => m.name !== addon.name)
                                : [
                                    ...prev.selectedModifiers,
                                    { name: addon.name, priceAdjustment: addon.price },
                                  ];
                              return { ...prev, selectedModifiers: updated };
                            });
                          }}
                          className={`p-2 rounded border text-left flex items-center justify-between transition-colors ${
                            isSelected
                              ? "bg-[var(--color-primary,#8B5E3C)] text-white border-[var(--color-primary,#8B5E3C)]"
                              : "bg-[var(--color-background,#F7F6F2)] border-[var(--color-border,#E7E4DD)] text-[var(--color-foreground,#242321)] hover:bg-white"
                          }`}
                        >
                          <span className="font-medium text-xs truncate mr-1">
                            {addon.name}
                          </span>
                          <span
                            className={`text-[10.5px] font-semibold font-mono flex-shrink-0 ${
                              isSelected ? "text-white/90" : "text-[var(--color-primary,#8B5E3C)]"
                            }`}
                          >
                            +₹{addon.price}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Kitchen Quick Instructions */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted,#73716B)] block mb-1.5">
                  Preparation Instructions
                </span>
                <div className="flex flex-wrap gap-1">
                  {KITCHEN_QUICK_TAGS.map((tag) => {
                    const isSelected = customizingItem.selectedModifiers.some(
                      (m) => m.name === tag
                    );
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setCustomizingItem((prev) => {
                            if (!prev) return null;
                            const exists = prev.selectedModifiers.some(
                              (m) => m.name === tag
                            );
                            const updated = exists
                              ? prev.selectedModifiers.filter((m) => m.name !== tag)
                              : [...prev.selectedModifiers, { name: tag, priceAdjustment: 0 }];
                            return { ...prev, selectedModifiers: updated };
                          });
                        }}
                        className={`px-2 py-1 rounded border text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-[var(--color-primary,#8B5E3C)] text-white border-[var(--color-primary,#8B5E3C)]"
                            : "bg-[var(--color-background,#F7F6F2)] border-[var(--color-border,#E7E4DD)] text-[var(--color-foreground,#242321)] hover:bg-white"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Request Custom Note */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted,#73716B)] block mb-1">
                  Custom Notes / Special Request
                </span>
                <input
                  type="text"
                  placeholder="e.g. Extra hot milk, sprinkle cinnamon, less ice..."
                  value={customizingItem.customNote}
                  onChange={(e) =>
                    setCustomizingItem((prev) =>
                      prev ? { ...prev, customNote: e.target.value } : null
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-[var(--color-border,#E7E4DD)] bg-[var(--color-background,#F7F6F2)] text-[var(--color-foreground,#242321)] placeholder-[var(--color-muted,#73716B)]/70 focus:outline-none focus:border-[var(--color-primary,#8B5E3C)] focus:bg-white font-normal"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[var(--color-border,#E7E4DD)] bg-[var(--color-surface,#FAF9F6)] flex items-center justify-between gap-3">
              {/* Quantity Stepper */}
              <div className="flex items-center bg-white border border-[var(--color-border,#E7E4DD)] rounded px-2 py-1 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCustomizingItem((prev) =>
                      prev ? { ...prev, quantity: Math.max(1, prev.quantity - 1) } : null
                    )
                  }
                  className="w-4 h-4 font-medium text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)] flex items-center justify-center text-xs"
                >
                  -
                </button>
                <span className="font-semibold text-[var(--color-foreground,#242321)] w-3 text-center text-xs font-mono">
                  {customizingItem.quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCustomizingItem((prev) =>
                      prev ? { ...prev, quantity: prev.quantity + 1 } : null
                    )
                  }
                  className="w-4 h-4 font-medium text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)] flex items-center justify-center text-xs"
                >
                  +
                </button>
              </div>

              {/* Total & Action */}
              {(() => {
                const modTotal = customizingItem.selectedModifiers.reduce(
                  (sum, m) => sum + m.priceAdjustment,
                  0
                );
                const computedTotal =
                  (customizingItem.item.price + modTotal) * customizingItem.quantity;
                return (
                  <button
                    type="button"
                    onClick={handleSaveCustomization}
                    className="flex-1 py-1.5 px-3 rounded bg-[var(--color-primary,#8B5E3C)] hover:bg-[var(--color-primary-hover,#754C30)] text-white text-xs font-semibold flex items-center justify-between transition-colors shadow-2xs"
                  >
                    <span>
                      {customizingItem.existingCartItemId
                        ? "Update Item"
                        : "Add to Order"}
                    </span>
                    <span className="font-mono">
                      ₹{computedTotal.toLocaleString("en-IN")}
                    </span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5. HELD ORDERS MODAL (Recall & Settle)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {isHeldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[var(--color-surface,#FFFFFF)] rounded-lg border border-[var(--color-border,#E7E4DD)] shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-3 border-b border-[var(--color-border,#E7E4DD)] flex items-center justify-between bg-[var(--color-surface,#FAF9F6)]">
              <div className="flex items-center gap-2">
                <IconClock className="w-4 h-4 text-[var(--color-primary,#8B5E3C)]" />
                <h3 className="text-xs font-semibold text-[var(--color-foreground,#242321)] uppercase tracking-wide">
                  Held Orders ({heldCarts.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHeldModalOpen(false)}
                className="w-6 h-6 rounded-md bg-white border border-[var(--color-border,#E7E4DD)] flex items-center justify-center text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)] shadow-xs"
              >
                <IconX className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 overflow-y-auto space-y-2 flex-1">
              {heldCarts.length === 0 ? (
                <div className="py-10 text-center text-[var(--color-muted,#73716B)] text-xs font-normal">
                  No orders currently on hold.
                </div>
              ) : (
                heldCarts.map((held) => (
                  <div
                    key={held.id}
                    className="p-2.5 rounded border border-[var(--color-border,#E7E4DD)] bg-[var(--color-surface,#FAF9F6)] flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[var(--color-foreground,#242321)]">
                          {held.orderType === "DINE_IN"
                            ? `Dine-in • ${held.tableNameSnapshot || "Table"}`
                            : "Takeaway"}
                        </span>
                        <span className="text-[10px] text-[var(--color-muted,#73716B)] font-normal">
                          ({held.cart.length} items)
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--color-muted,#73716B)] mt-0.5 font-normal">
                        Held at{" "}
                        {new Date(held.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <div className="text-xs font-semibold text-[var(--color-primary,#8B5E3C)] mt-0.5 font-mono">
                        ₹{held.total.toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleRecallHeldOrder(held)}
                        className="px-2.5 py-1 rounded bg-[var(--color-primary,#8B5E3C)] hover:bg-[var(--color-primary-hover,#754C30)] text-white text-xs font-medium transition-colors"
                      >
                        Recall
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDiscardHeldOrder(held.id)}
                        className="p-1 rounded text-[var(--color-muted,#73716B)] hover:text-[#B65D54] transition-colors"
                        title="Discard"
                      >
                        <IconTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          6. MODALS & DRAWERS
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <CashTenderModal
        isOpen={isCashModalOpen}
        totalPayable={payableTotal}
        onConfirm={(tendered, change) => {
          if (cart.length === 0 && activeOrderForTable) {
            handleSettleActiveTableOrder("CASH");
          } else {
            handleExecutePayment("CASH", tendered, change);
          }
        }}
        onClose={() => setIsCashModalOpen(false)}
      />

      <UpiQrModal
        isOpen={isUpiModalOpen}
        amount={payableTotal}
        orderNumber={activeOrderForTable?.orderNumber || "NEW-SALE"}
        cafeName={cafe.name}
        onConfirm={() => {
          if (cart.length === 0 && activeOrderForTable) {
            handleSettleActiveTableOrder("UPI");
          } else {
            handleExecutePayment("UPI");
          }
        }}
        onClose={() => setIsUpiModalOpen(false)}
      />

      <SplitBillModal
        isOpen={isSplitModalOpen}
        total={payableTotal}
        orderNumber={activeOrderForTable?.orderNumber || "NEW-SALE"}
        onClose={() => setIsSplitModalOpen(false)}
        onPaid={() => {
          if (cart.length === 0 && activeOrderForTable) {
            handleSettleActiveTableOrder("CARD");
          } else {
            handleExecutePayment("CARD");
          }
          setIsSplitModalOpen(false);
        }}
      />

      <ActiveTabsDrawer
        isOpen={isActiveTabsDrawerOpen}
        tables={tables}
        activeOrders={activeOrders}
        onSelectTable={(tableId) => {
          setOrderType("DINE_IN");
          setSelectedTableId(tableId);
        }}
        onClose={() => setIsActiveTabsDrawerOpen(false)}
      />

      {receiptTargetOrder && (
        <ThermalReceiptModal
          isOpen={isReceiptModalOpen}
          order={receiptTargetOrder}
          cafeName={cafe.name}
          cafeAddress="Artisanal Roastery & Café"
          isPreBill={isPreBillMode}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setReceiptTargetOrder(null);
          }}
        />
      )}
    </div>
  );
};
