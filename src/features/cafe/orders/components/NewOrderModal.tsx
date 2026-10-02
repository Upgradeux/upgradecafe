"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Table } from "@/lib/db/schema/tables";
import { MenuItem } from "@/lib/db/schema/menu-items";
import { Category } from "@/lib/db/schema/categories";
import { CreateOrderInput, CreateOrderItemInput, OrderWithItems } from "../types";
import {
  IconX,
  IconPlus,
  IconMinus,
  IconTrash,
  IconArmchair,
  IconShoppingBag,
  IconSearch,
  IconLoader2,
  IconCheck,
  IconChevronDown,
  IconFlame,
  IconNotes,
  IconAlertCircle,
  IconTag,
  IconLayoutList,
  IconReceipt,
  IconUsers,
  IconRotateDot,
} from "@tabler/icons-react";
import { useToast } from "@/components/ui/Toast";

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafeSlug: string;
  tables: Table[];
  menuItems: MenuItem[];
  categories?: Category[];
  activeOrders?: OrderWithItems[];
  initialAppendOrderId?: string | null;
  onOrderCreated: () => void;
}

// Preset Quick-Instruction Chips for Fast Staff Operations
const BEVERAGE_QUICK_PRESETS = [
  "Less Sugar",
  "No Sugar",
  "Oat Milk",
  "Almond Milk",
  "Extra Hot",
  "Less Ice",
  "Strong",
];

const FOOD_QUICK_PRESETS = [
  "Extra Crispy",
  "Heat Up",
  "Less Spicy",
  "Extra Spicy",
  "No Onion",
  "Sauce on Side",
  "Pack Separately",
];

const GENERAL_ORDER_PRESETS = [
  "Rush Order",
  "Serve Together",
  "Parcel / Takeaway",
  "Water First",
];

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  cafeSlug,
  tables,
  menuItems,
  categories = [],
  activeOrders = [],
  initialAppendOrderId = null,
  onOrderCreated,
}) => {
  const { toast } = useToast();

  // Mobile View Tab Switcher (Catalog vs Ticket on small screens)
  const [mobileTab, setMobileTab] = useState<"CATALOG" | "TICKET">("CATALOG");

  // Order Setup State
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY">("DINE_IN");
  const [selectedTableId, setSelectedTableId] = useState<string>(() => {
    if (initialAppendOrderId) {
      const match = activeOrders.find((o) => o.id === initialAppendOrderId);
      if (match?.tableId) return match.tableId;
    }
    const firstAvailable = tables.find((t) => t.status === "AVAILABLE");
    return firstAvailable ? firstAvailable.id : tables[0]?.id || "";
  });
  const [guestCount, setGuestCount] = useState<number>(2);
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);
  const [tableFilterTab, setTableFilterTab] = useState<"AVAILABLE" | "ALL">("AVAILABLE");
  const [tableSearch, setTableSearch] = useState("");
  const tableDropdownRef = useRef<HTMLDivElement>(null);

  // Repeat Customer / Append to Active Order Mode
  const [appendMode, setAppendMode] = useState<"APPEND" | "NEW_SPLIT">("APPEND");

  // Customer / Notes State
  const [customerName, setCustomerName] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");

  // Catalog Filter State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [searchItem, setSearchItem] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<"ALL" | "VEG" | "BESTSELLER">("ALL");

  // Cart State
  const [cart, setCart] = useState<
    Array<{
      menuItem: MenuItem;
      quantity: number;
      specialInstructions: string;
    }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time table status resolver: if table has an active order (NEW, PREPARING, READY, SERVED), it is OCCUPIED
  const getTableEffectiveStatus = (t: Table) => {
    const hasActive = activeOrders.some(
      (o) =>
        o.tableId === t.id &&
        (o.status === "NEW" ||
          o.status === "PREPARING" ||
          o.status === "READY" ||
          o.status === "SERVED")
    );
    if (hasActive) return "OCCUPIED" as const;
    return t.status;
  };

  // Detect active order for the selected table (including SERVED orders)
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

  // Handle initialAppendOrderId changes
  useEffect(() => {
    if (initialAppendOrderId) {
      const match = activeOrders.find((o) => o.id === initialAppendOrderId);
      if (match?.tableId) {
        setSelectedTableId(match.tableId);
        setOrderType("DINE_IN");
        setAppendMode("APPEND");
      }
    }
  }, [initialAppendOrderId, activeOrders]);

  // Close table dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        tableDropdownRef.current &&
        !tableDropdownRef.current.contains(e.target as Node)
      ) {
        setIsTableDropdownOpen(false);
      }
    };
    if (isTableDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTableDropdownOpen]);

  // Track modal open transitions to cleanly reset draft state
  const prevIsOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (!initialAppendOrderId) {
        setCart([]);
        setCustomerName("");
        setGeneralNotes("");
        setSearchItem("");
        setSelectedCategoryId("ALL");
        setDietaryFilter("ALL");
      }
      if (tables.length > 0) {
        const firstAvail = tables.find((t) => getTableEffectiveStatus(t) === "AVAILABLE");
        setSelectedTableId(firstAvail ? firstAvail.id : tables[0].id);
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialAppendOrderId, tables]);

  if (!isOpen) return null;

  // Selected Table details
  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const selectedTableStatus = selectedTable
    ? getTableEffectiveStatus(selectedTable)
    : "AVAILABLE";

  // Filtered Tables for custom selector
  const availableTablesCount = tables.filter(
    (t) => getTableEffectiveStatus(t) === "AVAILABLE"
  ).length;
  const filteredTables = tables.filter((t) => {
    const effStatus = getTableEffectiveStatus(t);
    if (tableFilterTab === "AVAILABLE" && effStatus !== "AVAILABLE") {
      return false;
    }
    if (tableSearch.trim()) {
      return t.tableNumber.toLowerCase().includes(tableSearch.toLowerCase().trim());
    }
    return true;
  });

  // Category counts and list
  const categoryTabs = [
    { id: "ALL", name: "All Items", count: menuItems.length },
    ...categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      count: menuItems.filter((i) => i.categoryId === cat.id).length,
    })),
  ];

  // Filtered Menu Items
  const filteredMenuItems = menuItems.filter((item) => {
    if (selectedCategoryId !== "ALL" && item.categoryId !== selectedCategoryId) {
      return false;
    }
    if (dietaryFilter === "VEG" && !item.isVegetarian) {
      return false;
    }
    if (dietaryFilter === "BESTSELLER" && !item.isBestseller) {
      return false;
    }
    if (searchItem.trim()) {
      const q = searchItem.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      return matchName || matchDesc;
    }
    return true;
  });

  // Cart operations
  const handleAddItem = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItem: item, quantity: 1, specialInstructions: "" }];
    });
  };

  const handleDecreaseItem = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((c) =>
          c.menuItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
        );
      }
      return prev.filter((c) => c.menuItem.id !== itemId);
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItem.id !== itemId));
  };

  const handleInstructionChange = (itemId: string, val: string) => {
    setCart((prev) =>
      prev.map((c) =>
        c.menuItem.id === itemId ? { ...c, specialInstructions: val } : c
      )
    );
  };

  // Toggle quick preset tag on a specific cart line item
  const handleToggleItemPreset = (itemId: string, preset: string) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.menuItem.id !== itemId) return c;
        const current = c.specialInstructions.trim();
        const parts = current ? current.split(",").map((s) => s.trim()).filter(Boolean) : [];
        const exists = parts.includes(preset);
        let updated: string[];
        if (exists) {
          updated = parts.filter((p) => p !== preset);
        } else {
          updated = [...parts, preset];
        }
        return { ...c, specialInstructions: updated.join(", ") };
      })
    );
  };

  const isItemPresetActive = (instructions: string, preset: string) => {
    const parts = instructions.split(",").map((s) => s.trim());
    return parts.includes(preset);
  };

  // Toggle general order preset
  const handleToggleGeneralPreset = (preset: string) => {
    const parts = generalNotes.trim()
      ? generalNotes.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const exists = parts.includes(preset);
    let updated: string[];
    if (exists) {
      updated = parts.filter((p) => p !== preset);
    } else {
      updated = [...parts, preset];
    }
    setGeneralNotes(updated.join(", "));
  };

  const isGeneralPresetActive = (preset: string) => {
    const parts = generalNotes.split(",").map((s) => s.trim());
    return parts.includes(preset);
  };

  const totalItemCount = cart.reduce((sum, it) => sum + it.quantity, 0);
  const subtotal = cart.reduce((sum, it) => sum + it.menuItem.price * it.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  // Order submission
  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is Empty",
        description: "Please tap menu items to add them to this order.",
        variant: "danger",
      });
      return;
    }

    if (orderType === "DINE_IN" && !selectedTableId) {
      toast({
        title: "Table Required",
        description: "Please assign a dining table for dine-in orders.",
        variant: "danger",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const itemsPayload: CreateOrderItemInput[] = cart.map((it) => ({
        menuItemId: it.menuItem.id,
        itemName: it.menuItem.name,
        unitPrice: it.menuItem.price,
        quantity: it.quantity,
        specialInstructions: it.specialInstructions.trim() || null,
      }));

      // If appending to an active table order
      const shouldAppend =
        activeOrderForSelectedTable && appendMode === "APPEND";

      const payload: CreateOrderInput = {
        orderType,
        tableId: orderType === "DINE_IN" ? selectedTableId || null : null,
        tableNameSnapshot:
          orderType === "DINE_IN" ? selectedTable?.tableNumber || null : null,
        customerName:
          orderType === "TAKEAWAY"
            ? customerName.trim() || "Counter Guest"
            : null,
        items: itemsPayload,
        notes: generalNotes.trim() || null,
        paymentStatus: "UNPAID",
        guestCount: orderType === "DINE_IN" ? guestCount : null,
        existingOrderIdToAppend: shouldAppend
          ? activeOrderForSelectedTable.id
          : null,
      };

      const res = await fetch(`/api/cafe/${cafeSlug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to process order");
      }

      toast({
        title: shouldAppend ? "Items Added to Table" : "Order Dispatched",
        description: shouldAppend
          ? `Added ${totalItemCount} items to Order ${activeOrderForSelectedTable.orderNumber}.`
          : `Order ${json.data.orderNumber} successfully sent to the kitchen.`,
        variant: "success",
      });

      setCart([]);
      setCustomerName("");
      setGeneralNotes("");

      onOrderCreated();
      onClose();
    } catch (err: any) {
      toast({
        title: "Order Failed",
        description: err.message || "Failed to send order to kitchen.",
        variant: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-2 md:p-3 bg-black/70 backdrop-blur-xs">
      <div className="w-full h-full sm:h-[98vh] sm:max-w-[98vw] md:max-w-[97vw] lg:max-w-[96vw] xl:max-w-[1550px] rounded-none sm:rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Top Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-[var(--color-border-subtle)] flex items-center justify-between gap-3 bg-[var(--color-surface)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center shadow-xs">
              <IconNotes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                <span>Walk-in & Counter POS Terminal</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                  Full Screen POS
                </span>
              </h3>
              <p className="text-[11px] text-[var(--color-muted)] hidden sm:block">
                High-speed order composer with repeat table order support & seat tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Tab Switcher (< lg screens) */}
            <div className="flex lg:hidden items-center bg-[var(--color-background)] p-1 rounded-md border border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setMobileTab("CATALOG")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mobileTab === "CATALOG"
                    ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-xs"
                    : "text-[var(--color-muted)]"
                }`}
              >
                <IconLayoutList className="w-3.5 h-3.5" />
                <span>Catalog ({filteredMenuItems.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("TICKET")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mobileTab === "TICKET"
                    ? "bg-[var(--color-primary)] text-white shadow-xs"
                    : "text-[var(--color-muted)]"
                }`}
              >
                <IconReceipt className="w-3.5 h-3.5" />
                <span>Ticket ({totalItemCount}) • ₹{total}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setCart([]);
                setCustomerName("");
                setGeneralNotes("");
                onClose();
              }}
              className="p-1.5 rounded-md border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] transition-colors shadow-xs"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Body (Responsive Split Layout) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
          {/* ========================================================
              LEFT COLUMN: Catalog Search, Filters & Item Grid
             ======================================================== */}
          <div
            className={`lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-[var(--color-border-subtle)] overflow-hidden min-h-0 bg-[var(--color-background)] ${
              mobileTab === "TICKET" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Search & Dietary Filters Bar */}
            <div className="p-3 sm:p-4 border-b border-[var(--color-border-subtle)] space-y-2.5 bg-[var(--color-surface)] flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <IconSearch className="w-4 h-4 text-[var(--color-muted)] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search menu items by name or description..."
                    value={searchItem}
                    onChange={(e) => setSearchItem(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] shadow-xs"
                  />
                  {searchItem && (
                    <button
                      type="button"
                      onClick={() => setSearchItem("")}
                      className="absolute right-2.5 top-2.5 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                    >
                      <IconX className="w-3.5 h-3.5" />
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
                        : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDietaryFilter(dietaryFilter === "VEG" ? "ALL" : "VEG")
                    }
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      dietaryFilter === "VEG"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/30"
                        : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-xs border border-emerald-600 flex items-center justify-center p-0.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-600" />
                    </span>
                    <span>Veg</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDietaryFilter(
                        dietaryFilter === "BESTSELLER" ? "ALL" : "BESTSELLER"
                      )
                    }
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      dietaryFilter === "BESTSELLER"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold border border-amber-500/30"
                        : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                    }`}
                  >
                    <IconFlame className="w-3 h-3 text-amber-500" />
                    <span>Popular</span>
                  </button>
                </div>
              </div>

              {/* Clean Horizontal Category Pills (Custom hidden scrollbar with no ugly arrows) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth">
                {categoryTabs.map((cat) => {
                  const isActive = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 shadow-xs ${
                        isActive
                          ? "bg-[var(--color-primary)] text-white shadow-xs font-semibold"
                          : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:border-[var(--color-muted)]"
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-[var(--color-background)] text-[var(--color-muted)]"
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Menu Items Grid (Responsive 2-col on tablet, 3-col on wide screens) */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
              {filteredMenuItems.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[var(--color-muted)]">
                  <IconSearch className="w-10 h-10 stroke-1 text-[var(--color-muted)]/50 mb-2" />
                  <p className="text-xs font-medium">No menu items match your filter</p>
                  <p className="text-[11px] text-[var(--color-muted)] mt-1">
                    Try adjusting your search keyword or selected category.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredMenuItems.map((item) => {
                    const cartEntry = cart.find((c) => c.menuItem.id === item.id);
                    const qtyInCart = cartEntry?.quantity || 0;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-md border transition-all flex flex-col justify-between gap-2.5 shadow-xs ${
                          qtyInCart > 0
                            ? "bg-[var(--color-primary-light)]/40 border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30"
                            : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1.5 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              {/* Veg / Non-Veg Standard Indicator */}
                              {item.isVegetarian ? (
                                <span
                                  className="w-3.5 h-3.5 rounded-xs border border-emerald-600 flex items-center justify-center p-0.5 flex-shrink-0"
                                  title="Vegetarian"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                </span>
                              ) : (
                                <span
                                  className="w-3.5 h-3.5 rounded-xs border border-red-600 flex items-center justify-center p-0.5 flex-shrink-0"
                                  title="Non-Vegetarian"
                                >
                                  <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-red-600" />
                                </span>
                              )}

                              {item.isBestseller && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[9.5px] font-medium">
                                  <IconFlame className="w-2.5 h-2.5 text-amber-500" />
                                  <span>Popular</span>
                                </span>
                              )}
                            </div>

                            <span className="text-xs sm:text-sm font-semibold text-[var(--color-foreground)]">
                              ₹{item.price}
                            </span>
                          </div>

                          <h4 className="font-medium text-xs sm:text-[13px] text-[var(--color-foreground)] line-clamp-1">
                            {item.name}
                          </h4>

                          {item.description && (
                            <p className="text-[10.5px] text-[var(--color-muted)] line-clamp-2 mt-0.5 leading-snug">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Card Footer: Add or Stepper */}
                        <div className="pt-2 flex items-center justify-between border-t border-[var(--color-border-subtle)]/70">
                          <span className="text-[10px] font-medium text-[var(--color-muted)]">
                            ₹{item.price}
                          </span>

                          {qtyInCart > 0 ? (
                            <div className="flex items-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-primary)] rounded-md p-1 shadow-xs">
                              <button
                                type="button"
                                onClick={() => handleDecreaseItem(item.id)}
                                className="w-6 h-6 flex items-center justify-center rounded-md bg-[var(--color-background)] text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] transition-colors shadow-xs"
                              >
                                <IconMinus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-6 text-center text-xs font-semibold text-[var(--color-primary)]">
                                {qtyInCart}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddItem(item)}
                                className="w-6 h-6 flex items-center justify-center rounded-md bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs"
                              >
                                <IconPlus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddItem(item)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all shadow-xs cursor-pointer"
                            >
                              <IconPlus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================
              RIGHT COLUMN: Table Assignment, Guest Count & Ticket
             ======================================================== */}
          <div
            className={`lg:col-span-5 flex flex-col overflow-hidden min-h-0 bg-[var(--color-surface)] ${
              mobileTab === "CATALOG" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Order Setup Controls: Dine-In vs Takeaway */}
            <div className="p-3 sm:p-4 border-b border-[var(--color-border-subtle)] space-y-3 bg-[var(--color-surface)] flex-shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType("DINE_IN")}
                  className={`p-2.5 rounded-md border flex items-center justify-center gap-2 font-medium transition-all shadow-xs ${
                    orderType === "DINE_IN"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold shadow-xs"
                      : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  <IconArmchair className="w-4 h-4" />
                  <span className="text-xs">Dine-In Table</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType("TAKEAWAY")}
                  className={`p-2.5 rounded-md border flex items-center justify-center gap-2 font-medium transition-all shadow-xs ${
                    orderType === "TAKEAWAY"
                      ? "border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold shadow-xs"
                      : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  <IconShoppingBag className="w-4 h-4" />
                  <span className="text-xs">Takeaway / Counter</span>
                </button>
              </div>

              {/* Table Picker with Guest Count & Repeat Order Detection */}
              {orderType === "DINE_IN" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      Assigned Dining Table
                    </label>

                    {/* Guest / Seat Count Option */}
                    <div className="flex items-center gap-1.5 bg-[var(--color-background)] border border-[var(--color-border)] px-2 py-0.5 rounded-md shadow-xs">
                      <IconUsers className="w-3.5 h-3.5 text-[var(--color-muted)]" />
                      <span className="text-[10px] text-[var(--color-muted)] font-medium">Guests:</span>
                      <button
                        type="button"
                        onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                        className="w-4 h-4 rounded text-xs font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)]"
                      >
                        -
                      </button>
                      <span className="w-3 text-center text-xs font-semibold text-[var(--color-primary)]">
                        {guestCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setGuestCount((g) => g + 1)}
                        className="w-4 h-4 rounded text-xs font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {tables.length === 0 ? (
                    <div className="p-2.5 rounded-md border border-dashed text-center text-xs text-[var(--color-muted)]">
                      No dining tables configured on floor.
                    </div>
                  ) : (
                    <div className="relative" ref={tableDropdownRef}>
                      {/* Custom Table Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setIsTableDropdownOpen((prev) => !prev)}
                        className={`w-full p-2.5 rounded-md border text-left flex items-center justify-between gap-2 transition-all shadow-xs ${
                          isTableDropdownOpen
                            ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 bg-[var(--color-background)]"
                            : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-muted)]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <IconArmchair className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-[var(--color-foreground)] block truncate">
                              {selectedTable
                                ? selectedTable.tableNumber
                                : "Select Table"}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-[var(--color-muted)]">
                                {selectedTable?.capacity || 2} Seats Capacity •{" "}
                                {selectedTableStatus === "OCCUPIED"
                                  ? `${selectedTable?.currentGuests || guestCount} Seated`
                                  : `Party of ${guestCount}`}
                              </span>
                              <span className="text-[10px] text-[var(--color-border)]">•</span>
                              {selectedTableStatus === "AVAILABLE" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>Available</span>
                                </span>
                              )}
                              {selectedTableStatus === "OCCUPIED" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  <span>Occupied</span>
                                </span>
                              )}
                              {selectedTableStatus === "RESERVED" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  <span>Reserved</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <IconChevronDown
                          className={`w-4 h-4 text-[var(--color-muted)] transition-transform ${
                            isTableDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Dropdown Popover */}
                      {isTableDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 z-40 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl p-2 space-y-2 animate-in fade-in-50 zoom-in-95">
                          {/* Filter Bar */}
                          <div className="flex items-center justify-between gap-1 p-0.5 bg-[var(--color-background)] rounded-md border border-[var(--color-border)] shadow-xs">
                            <button
                              type="button"
                              onClick={() => setTableFilterTab("AVAILABLE")}
                              className={`flex-1 py-1 rounded-md text-[11px] font-medium text-center transition-all ${
                                tableFilterTab === "AVAILABLE"
                                  ? "bg-[var(--color-surface)] text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs"
                                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                              }`}
                            >
                              Available Only ({availableTablesCount})
                            </button>
                            <button
                              type="button"
                              onClick={() => setTableFilterTab("ALL")}
                              className={`flex-1 py-1 rounded-md text-[11px] font-medium text-center transition-all ${
                                tableFilterTab === "ALL"
                                  ? "bg-[var(--color-surface)] text-[var(--color-foreground)] font-semibold shadow-xs"
                                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                              }`}
                            >
                              All Tables ({tables.length})
                            </button>
                          </div>

                          {/* Quick Search */}
                          <div className="relative">
                            <IconSearch className="w-3.5 h-3.5 text-[var(--color-muted)] absolute left-2.5 top-2" />
                            <input
                              type="text"
                              placeholder="Search table number..."
                              value={tableSearch}
                              onChange={(e) => setTableSearch(e.target.value)}
                              className="w-full pl-7 pr-2 py-1 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-xs"
                            />
                          </div>

                          {/* Scrollable Table List */}
                          <div className="max-h-48 overflow-y-auto space-y-1 pr-0.5">
                            {filteredTables.length === 0 ? (
                              <div className="p-3 text-center text-xs text-[var(--color-muted)]">
                                No tables match this filter.
                              </div>
                            ) : (
                              filteredTables.map((t) => {
                                const isSelected = t.id === selectedTableId;
                                const effStatus = getTableEffectiveStatus(t);
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedTableId(t.id);
                                      setGuestCount(t.capacity || 2);
                                      setIsTableDropdownOpen(false);
                                    }}
                                    className={`w-full p-2 rounded-md text-left flex items-center justify-between gap-2 transition-colors ${
                                      isSelected
                                        ? "bg-[var(--color-primary-light)] border border-[var(--color-primary)] text-[var(--color-foreground)] font-medium"
                                        : "hover:bg-[var(--color-background)] border border-transparent"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`w-2 h-2 rounded-full ${
                                          effStatus === "AVAILABLE"
                                            ? "bg-emerald-500"
                                            : effStatus === "OCCUPIED"
                                            ? "bg-amber-500"
                                            : "bg-blue-500"
                                        }`}
                                      />
                                      <div>
                                        <div className="text-xs font-medium text-[var(--color-foreground)]">
                                          {t.tableNumber}
                                        </div>
                                        <div className="text-[10px] text-[var(--color-muted)]">
                                          {t.capacity} Seats Capacity
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                                          effStatus === "AVAILABLE"
                                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                            : effStatus === "OCCUPIED"
                                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                            : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                        }`}
                                      >
                                        {effStatus === "AVAILABLE"
                                          ? "Available"
                                          : effStatus === "OCCUPIED"
                                          ? "Occupied"
                                          : "Reserved"}
                                      </span>
                                      {isSelected && (
                                        <IconCheck className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                                      )}
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Repeat Customer / Occupied Table Intelligent Banner */}
                  {activeOrderForSelectedTable && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2 shadow-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <IconRotateDot className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 animate-spin" />
                          <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                            Active Session: {activeOrderForSelectedTable.orderNumber}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-[var(--color-foreground)]">
                          ₹{activeOrderForSelectedTable.total} running bill
                        </span>
                      </div>

                      <p className="text-[11px] text-[var(--color-muted)]">
                        Guests at this table want to order again (Round 2 / Add-on items).
                      </p>

                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setAppendMode("APPEND")}
                          className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-all text-center shadow-xs ${
                            appendMode === "APPEND"
                              ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                              : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                          }`}
                        >
                          Add to Order {activeOrderForSelectedTable.orderNumber} (Round 2)
                        </button>
                        <button
                          type="button"
                          onClick={() => setAppendMode("NEW_SPLIT")}
                          className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-all text-center shadow-xs ${
                            appendMode === "NEW_SPLIT"
                              ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                              : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                          }`}
                        >
                          New Split Bill
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1">
                    Customer Token / Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Token #14 or Rohit K."
                    className="w-full px-3 py-2 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-xs"
                  />
                </div>
              )}
            </div>

            {/* Cart Ticket Items & One-Tap Notes (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-0 bg-[var(--color-background)]/40">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Live Ticket ({totalItemCount} Items)
                </span>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-[10px] text-red-500 hover:text-red-600 font-semibold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-[var(--color-border)] rounded-lg flex flex-col items-center justify-center text-center p-4 text-[var(--color-muted)]">
                  <IconShoppingBag className="w-10 h-10 stroke-1 text-[var(--color-muted)]/50 mb-2" />
                  <p className="text-xs font-medium text-[var(--color-foreground)]">
                    Ticket is Empty
                  </p>
                  <p className="text-[11px] text-[var(--color-muted)] mt-0.5 max-w-[220px]">
                    Tap &quot;+ Add&quot; on items from the left menu to start building the order.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((entry) => {
                    const item = entry.menuItem;
                    const isBeverage =
                      item.name.toLowerCase().includes("coffee") ||
                      item.name.toLowerCase().includes("brew") ||
                      item.name.toLowerCase().includes("latte") ||
                      item.name.toLowerCase().includes("flat white") ||
                      item.name.toLowerCase().includes("espresso") ||
                      item.name.toLowerCase().includes("tonic") ||
                      item.name.toLowerCase().includes("tea");

                    const availablePresets = isBeverage
                      ? BEVERAGE_QUICK_PRESETS
                      : FOOD_QUICK_PRESETS;

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] space-y-2.5 shadow-xs"
                      >
                        {/* Item Row Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h5 className="text-xs font-medium text-[var(--color-foreground)] truncate">
                              {item.name}
                            </h5>
                            <span className="text-[11px] font-normal text-[var(--color-muted)]">
                              ₹{item.price} each • ₹{item.price * entry.quantity}
                            </span>
                          </div>

                          {/* Stepper + Remove */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className="flex items-center gap-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md p-0.5 shadow-xs">
                              <button
                                type="button"
                                onClick={() => handleDecreaseItem(item.id)}
                                className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)]"
                              >
                                <IconMinus className="w-3 h-3" />
                              </button>
                              <span className="w-4 text-center text-xs font-semibold text-[var(--color-foreground)]">
                                {entry.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddItem(item)}
                                className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)]"
                              >
                                <IconPlus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(item.id)}
                              className="p-1.5 rounded-md text-[var(--color-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors shadow-xs"
                              title="Remove item"
                            >
                              <IconTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Fast One-Tap Note Chips */}
                        <div>
                          <div className="flex items-center gap-1 mb-1 text-[10px] font-medium text-[var(--color-muted)] uppercase tracking-wider">
                            <IconTag className="w-2.5 h-2.5" />
                            <span>Quick Instructions (1-Tap)</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {availablePresets.map((preset) => {
                              const isActive = isItemPresetActive(
                                entry.specialInstructions,
                                preset
                              );
                              return (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() =>
                                    handleToggleItemPreset(item.id, preset)
                                  }
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all shadow-xs ${
                                    isActive
                                      ? "bg-[var(--color-primary)] text-white font-semibold"
                                      : "bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:border-[var(--color-muted)]"
                                  }`}
                                >
                                  {isActive ? `✓ ${preset}` : `+ ${preset}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Free-form Custom Note Input */}
                        <input
                          type="text"
                          placeholder="Custom note: e.g. Extra hot, separate bag..."
                          value={entry.specialInstructions}
                          onChange={(e) =>
                            handleInstructionChange(item.id, e.target.value)
                          }
                          className="w-full px-3 py-1.5 text-[11px] rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] shadow-xs"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* General Order Notes with One-Tap Chips */}
              {cart.length > 0 && (
                <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      Order / Kitchen Note
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {GENERAL_ORDER_PRESETS.map((preset) => {
                      const isActive = isGeneralPresetActive(preset);
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleToggleGeneralPreset(preset)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all shadow-xs ${
                            isActive
                              ? "bg-[var(--color-primary)] text-white font-semibold"
                              : "bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                          }`}
                        >
                          {isActive ? `✓ ${preset}` : `+ ${preset}`}
                        </button>
                      );
                    })}
                  </div>

                  <input
                    type="text"
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    placeholder="e.g. Serve dessert after main meal, rush order..."
                    className="w-full px-3 py-2 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] shadow-xs"
                  />
                </div>
              )}
            </div>

            {/* Bottom Footer & Dispatch Action */}
            <div className="p-3 sm:p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-3 flex-shrink-0">
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-[var(--color-muted)]">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between text-[var(--color-muted)]">
                  <span>GST / Tax (5%)</span>
                  <span>₹{tax.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border-subtle)] text-sm sm:text-base font-semibold text-[var(--color-foreground)]">
                  <span>Payable Total</span>
                  <span className="text-[var(--color-primary)]">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCart([]);
                    setCustomerName("");
                    setGeneralNotes("");
                    onClose();
                  }}
                  className="px-3 py-2 rounded-md text-xs font-medium bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] transition-colors shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || cart.length === 0}
                  onClick={handleSubmit}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <IconLoader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <IconCheck className="w-4 h-4" />
                  )}
                  <span>
                    {activeOrderForSelectedTable && appendMode === "APPEND"
                      ? `Add to ${activeOrderForSelectedTable.orderNumber}`
                      : "Place Live Order"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
