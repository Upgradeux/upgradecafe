"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Cafe } from "@/lib/db/schema/cafes";
import { Category } from "@/lib/db/schema/categories";
import { MenuItem } from "@/lib/db/schema/menu-items";
import { Table } from "@/lib/db/schema/tables";
import {
  ServiceRequestType,
  CreateOrderInput,
  CreateOrderItemInput,
  OrderWithItems,
} from "@/features/cafe/orders/types";
import {
  DigitalMenuCartItem,
  CustomerProfile,
  TableReservationRequest,
} from "../types";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import { getMenuItemImageUrl } from "../utils/food-images";
import { transitionNavigate } from "../utils/transitions";
import { CustomerCartDrawer } from "./CustomerCartDrawer";
import { LiveOrderTrackerModal } from "./LiveOrderTrackerModal";
import { CustomerProfileModal } from "./CustomerProfileModal";
import { CustomerUpiModal } from "./CustomerUpiModal";
import { TableReservationModal } from "./TableReservationModal";
import { CustomerFeedbackModal } from "./CustomerFeedbackModal";
import { CustomerOffersModal } from "./CustomerOffersModal";
import { CafeSetting } from "@/lib/db/schema/cafe-settings";
import { Offer } from "@/lib/db/schema/offers";
import { evaluateOffer } from "@/features/cafe/offers/utils/offer-evaluator";
import {
  IconSearch,
  IconPlus,
  IconMinus,
  IconArmchair,
  IconBellRinging,
  IconDroplet,
  IconCheck,
  IconX,
  IconClock,
  IconStar,
  IconFlame,
  IconLoader2,
  IconShoppingBag,
  IconUser,
  IconChevronRight,
  IconShare,
  IconDownload,
  IconAward,
  IconCalendarTime,
  IconSparkles,
} from "@tabler/icons-react";
import {
  ModernAppLayout,
  ClassicListLayout,
  MenuLayoutType,
  MenuLayoutProps,
  CustomerPastOrder,
} from "../layouts";
import { useToast } from "@/components/ui/Toast";
import { calculatePopularItems } from "../utils/popular-calculator";

interface PublicMenuCustomerViewProps {
  cafe: Cafe;
  categories: Category[];
  menuItems: MenuItem[];
  initialOffers?: Offer[];
  salesStats30d?: Record<string, number>;
  table: Table | null;
  tableParamName?: string | null;
  initialLayout?: MenuLayoutType;
  settings?: CafeSetting | null;
  isAllMenuPage?: boolean;
  initialCategoryId?: string;
  initialDietFilter?: "ALL" | "VEG" | "NON_VEG" | "VEGAN" | "BESTSELLER" | "FAVORITES";
  initialBottomTab?: "home" | "menu" | "offers" | "orders" | "cart" | "profile";
}

export const PublicMenuCustomerView: React.FC<PublicMenuCustomerViewProps> = ({
  cafe,
  categories,
  menuItems,
  initialOffers = [],
  salesStats30d = {},
  table,
  tableParamName,
  initialLayout = "modern_app",
  settings,
  isAllMenuPage = false,
  initialCategoryId,
  initialDietFilter,
  initialBottomTab,
}) => {
  const router = useRouter();
  const { toast } = useToast();

  const visualTheme = getDigitalMenuVisualTheme(settings?.digitalMenuTheme || settings?.themePreset || "roast");

  const [layout, setLayout] = useState<MenuLayoutType>(initialLayout);
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (itemId: string) => {
    setFavorites((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const [claimedTableName, setClaimedTableName] = useState<string | null>(null);

  // Helper: "Takeaway" is NOT a real table — it's a stale URL artifact from past takeaway orders
  const isTakeawayParam = (name: string | null | undefined): boolean =>
    !!name && name.toLowerCase() === "takeaway";

  const activeTableName = (() => {
    if (table?.tableNumber && !isTakeawayParam(table.tableNumber)) return table.tableNumber;
    if (tableParamName && !isTakeawayParam(tableParamName)) return tableParamName;
    if (claimedTableName && !isTakeawayParam(claimedTableName)) return claimedTableName;
    return null;
  })();

  // Filter & Search States
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategoryId || "ALL");
  const [dietFilter, setDietFilter] = useState<"ALL" | "VEG" | "NON_VEG" | "VEGAN" | "BESTSELLER" | "FAVORITES">(initialDietFilter || "ALL");

  // Cart State (stored in local memory / persistent)
  const [cart, setCart] = useState<DigitalMenuCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Active / Live Orders State (multi-order tracking supported via server-side session or customerId)
  const [activeOrders, setActiveOrders] = useState<OrderWithItems[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrderNumber, setActiveOrderNumber] = useState<string | null>(null);
  const [isLiveTrackerOpen, setIsLiveTrackerOpen] = useState(false);

  // Modals States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [upiOrderData, setUpiOrderData] = useState<{
    orderId?: string;
    amount: number;
    orderNumber: string;
  } | null>(null);
  const [pendingOrderOptions, setPendingOrderOptions] = useState<{
    orderType: "DINE_IN" | "TAKEAWAY";
    tableName: string | null;
    customerName: string;
    customerPhone: string;
    notes: string;
    discount?: number;
    amount: number;
  } | null>(null);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isOffersOpen, setIsOffersOpen] = useState(false);
  const [claimedOfferCode, setClaimedOfferCode] = useState<string | null>(null);
  const [claimedOfferCodes, setClaimedOfferCodes] = useState<string[]>([]);

  // Call Staff Quick Request Modal
  const [isCallStaffOpen, setIsCallStaffOpen] = useState(false);
  const [callType, setCallType] = useState<ServiceRequestType>("CALL_WAITER");
  const [callNotes, setCallNotes] = useState("");
  const [isSendingCall, setIsSendingCall] = useState(false);

  // Customer Profile (saved in localStorage)
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [pastOrders, setPastOrders] = useState<CustomerPastOrder[]>([]);

  // PWA install prompt handler
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  // Initialize from LocalStorage and sync across navigation
  useEffect(() => {
    try {
      localStorage.setItem("recent_cafe_slug", cafe.slug);

      // Load saved customer profile
      const savedProfile = localStorage.getItem(`cafe_customer_profile_${cafe.slug}`);
      if (savedProfile) {
        setCustomerProfile(JSON.parse(savedProfile));
      }

      // Load saved cart
      const savedCart = localStorage.getItem(`cafe_cart_${cafe.slug}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }

      // Load active order id
      const savedActiveOrderId = localStorage.getItem(`cafe_active_order_id_${cafe.slug}`);
      const savedActiveOrderNum = localStorage.getItem(`cafe_active_order_num_${cafe.slug}`);
      if (savedActiveOrderId) {
        setActiveOrderId(savedActiveOrderId);
        setActiveOrderNumber(savedActiveOrderNum);
      }

      // Load past orders
      const savedPast = localStorage.getItem(`cafe_past_orders_${cafe.slug}`);
      if (savedPast) {
        setPastOrders(JSON.parse(savedPast));
      }

      // Load applied and claimed coupon offers
      const savedAppliedCoupon = localStorage.getItem(`cafe_applied_coupon_${cafe.slug}`);
      if (savedAppliedCoupon) {
        setClaimedOfferCode(savedAppliedCoupon);
      }
      const savedClaimedList = localStorage.getItem(`cafe_claimed_offers_${cafe.slug}`);
      if (savedClaimedList) {
        try {
          const parsed = JSON.parse(savedClaimedList);
          if (Array.isArray(parsed)) {
            setClaimedOfferCodes(parsed);
          }
        } catch {}
      } else if (savedAppliedCoupon) {
        setClaimedOfferCodes([savedAppliedCoupon.toUpperCase()]);
      }

      // Load claimed table session or persist URL table if scanned
      if (table?.tableNumber) {
        const isOccupied = (table.status || "").toUpperCase() === "OCCUPIED";
        const hasActiveOrder = savedActiveOrderId != null;
        if (!isOccupied || hasActiveOrder) {
          try {
            localStorage.setItem(
              `cafe_claimed_table_${cafe.slug}`,
              JSON.stringify({
                id: table.id,
                tableNumber: table.tableNumber,
                qrIdentifier: table.qrIdentifier || null,
                claimedAt: Date.now(),
              })
            );
          } catch {}
        }
      } else if (!table && !tableParamName) {
        const savedClaim = localStorage.getItem(`cafe_claimed_table_${cafe.slug}`);
        if (savedClaim) {
          const parsed = JSON.parse(savedClaim);
          // If customer has NO active order, purge stale claim from previous visits!
          if (!savedActiveOrderId) {
            localStorage.removeItem(`cafe_claimed_table_${cafe.slug}`);
            setClaimedTableName(null);
          } else if (
            parsed?.tableNumber &&
            (!parsed.claimedAt || Date.now() - parsed.claimedAt < 4 * 60 * 60 * 1000)
          ) {
            setClaimedTableName(parsed.tableNumber);
          }
        }
      }
    } catch (e) {
      // LocalStorage access safe guard
    }

    const handleSyncCart = () => {
      try {
        const savedCart = localStorage.getItem(`cafe_cart_${cafe.slug}`);
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }

        const savedAppliedCoupon = localStorage.getItem(`cafe_applied_coupon_${cafe.slug}`);
        if (savedAppliedCoupon) {
          setClaimedOfferCode(savedAppliedCoupon);
        }
        const savedClaimedList = localStorage.getItem(`cafe_claimed_offers_${cafe.slug}`);
        if (savedClaimedList) {
          try {
            const parsed = JSON.parse(savedClaimedList);
            if (Array.isArray(parsed)) {
              setClaimedOfferCodes(parsed);
            }
          } catch {}
        }

        if (!table && !tableParamName) {
          const savedActiveOrderId = localStorage.getItem(`cafe_active_order_id_${cafe.slug}`);
          const savedClaim = localStorage.getItem(`cafe_claimed_table_${cafe.slug}`);
          if (savedClaim && savedActiveOrderId) {
            const parsed = JSON.parse(savedClaim);
            if (
              parsed?.tableNumber &&
              (!parsed.claimedAt || Date.now() - parsed.claimedAt < 4 * 60 * 60 * 1000)
            ) {
              setClaimedTableName(parsed.tableNumber);
              return;
            }
          }
          setClaimedTableName(null);
        }
      } catch (e) {}
    };

    window.addEventListener("focus", handleSyncCart);
    window.addEventListener("storage", handleSyncCart);

    // PWA install listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPwa(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("focus", handleSyncCart);
      window.removeEventListener("storage", handleSyncCart);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [cafe.slug]);

  // Intelligent mobile prefetching for instant perceived navigation
  useEffect(() => {
    const q = activeTableName ? `?table=${encodeURIComponent(activeTableName)}` : "";
    router.prefetch(`/menu/${cafe.slug}/cart${q}`);
    router.prefetch(`/menu/${cafe.slug}/profile${q}`);
    router.prefetch(`/menu/${cafe.slug}/orders${q}`);
  }, [cafe.slug, activeTableName, router]);

  // Sync active orders from server (guest session cookie, active order ID, or customerId)
  const syncActiveOrders = useCallback(async () => {
    try {
      const customerId = customerProfile && !customerProfile.isGuest ? customerProfile.id : null;
      const savedOrderId = typeof window !== "undefined" ? localStorage.getItem(`cafe_active_order_id_${cafe.slug}`) : null;

      const headers: Record<string, string> = {};
      if (customerId) headers["x-customer-id"] = customerId;
      if (customerProfile?.phone) headers["x-customer-phone"] = customerProfile.phone;
      if (savedOrderId) headers["x-order-id"] = savedOrderId;

      const queryParts: string[] = [];
      if (customerId) queryParts.push(`customerId=${encodeURIComponent(customerId)}`);
      if (customerProfile?.phone) queryParts.push(`phone=${encodeURIComponent(customerProfile.phone)}`);
      if (savedOrderId) queryParts.push(`orderId=${encodeURIComponent(savedOrderId)}`);
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
          setActiveOrderNumber(latest.orderNumber);
          try {
            localStorage.setItem(`cafe_active_order_id_${cafe.slug}`, latest.id);
            localStorage.setItem(`cafe_active_order_num_${cafe.slug}`, latest.orderNumber);
          } catch {}
        } else if (json.isTerminal || json.data.length === 0) {
          // Clear active order and claimed table if server confirms order has completed or cancelled
          setActiveOrders([]);
          setActiveOrderId(null);
          setActiveOrderNumber(null);
          try {
            localStorage.removeItem(`cafe_active_order_id_${cafe.slug}`);
            localStorage.removeItem(`cafe_active_order_num_${cafe.slug}`);
          } catch {}

          const hasUrlTable = Boolean(table?.tableNumber || tableParamName);
          if (!hasUrlTable) {
            try {
              localStorage.removeItem(`cafe_claimed_table_${cafe.slug}`);
            } catch {}
            setClaimedTableName(null);
          }
        }
      }
    } catch {
      // safe fallback
    }
  }, [cafe.slug, customerProfile]);

  useEffect(() => {
    // Initial fetch on mount
    syncActiveOrders();

    // Only establish recurring polling if active order exists
    const hasActive = activeOrders.length > 0 || Boolean(activeOrderId);
    if (!hasActive) return;

    let intervalId: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (intervalId || (typeof document !== "undefined" && document.visibilityState === "hidden")) return;
      intervalId = setInterval(syncActiveOrders, 10000);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
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
  }, [syncActiveOrders, activeOrders.length, activeOrderId]);

  // Handle PWA Install click
  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setCanInstallPwa(false);
      }
      setDeferredPrompt(null);
    } else {
      toast({
        title: "Install App",
        description: "Tap your browser's share or settings icon and choose 'Add to Home Screen'.",
        variant: "info",
      });
    }
  };

  // Handle Share Menu
  const handleShareMenu = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cafe.name} Menu`,
          text: `Explore the artisanal digital menu at ${cafe.name}!`,
          url,
        });
      } catch (e) {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Menu URL copied to clipboard.",
        variant: "success",
      });
    }
  };

  // Add Item to Cart (with localStorage persistence)
  const handleAddToCart = (newCartItem: DigitalMenuCartItem) => {
    setCart((prev) => {
      let updated: DigitalMenuCartItem[];
      const existingIdx = prev.findIndex(
        (c) => c.cartItemId === newCartItem.cartItemId
      );
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += newCartItem.quantity;
        copy[existingIdx].totalPrice =
          copy[existingIdx].unitPrice * copy[existingIdx].quantity;
        updated = copy;
      } else {
        updated = [...prev, newCartItem];
      }

      try {
        localStorage.setItem(`cafe_cart_${cafe.slug}`, JSON.stringify(updated));
      } catch {}

      return updated;
    });

    toast({
      title: "Added to Order",
      description: `${newCartItem.quantity}× ${newCartItem.menuItem.name} added`,
      variant: "success",
    });
  };

  // Quick Fast-Add (+ Button on card)
  const handleQuickAdd = (item: MenuItem) => {
    // If it has complex customizations or is a beverage, navigate to slug page to customize
    const isBeverage =
      item.temperature === "HOT" ||
      item.temperature === "COLD" ||
      item.name.toLowerCase().includes("coffee") ||
      item.name.toLowerCase().includes("latte") ||
      item.name.toLowerCase().includes("tea");

    if (isBeverage) {
      const tableQuery = activeTableName ? `?table=${encodeURIComponent(activeTableName)}` : "";
      transitionNavigate(router, `/menu/${cafe.slug}/${item.slug}${tableQuery}`);
      return;
    }

    const cartItem: DigitalMenuCartItem = {
      cartItemId: `${item.id}-default`,
      menuItem: item,
      quantity: 1,
      unitPrice: item.price,
      totalPrice: item.price,
      customization: {},
      variantSnapshotText: "",
    };
    handleAddToCart(cartItem);
  };

  // Quick Fast-Minus (- Button on card)
  const handleQuickMinus = (item: MenuItem) => {
    const inCart = cart.find((c) => c.menuItem.id === item.id);
    if (!inCart) return;

    if (inCart.quantity > 1) {
      handleUpdateQuantity(inCart.cartItemId, inCart.quantity - 1);
      toast({
        title: "Order Updated",
        description: `${inCart.quantity - 1}× ${item.name} in order`,
        variant: "info",
      });
    } else {
      handleRemoveFromCart(inCart.cartItemId);
      toast({
        title: "Item Removed",
        description: `${item.name} removed from order`,
        variant: "info",
      });
    }
  };

  // Update Cart Item Quantity
  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    setCart((prev) => {
      const updated = prev.map((c) =>
        c.cartItemId === cartItemId
          ? { ...c, quantity: newQty, totalPrice: c.unitPrice * newQty }
          : c
      );
      try {
        localStorage.setItem(`cafe_cart_${cafe.slug}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Remove Item from Cart
  const handleRemoveFromCart = (cartItemId: string) => {
    setCart((prev) => {
      const updated = prev.filter((c) => c.cartItemId !== cartItemId);
      try {
        localStorage.setItem(`cafe_cart_${cafe.slug}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Save Customer Profile
  const handleSaveProfile = (profile: CustomerProfile) => {
    setCustomerProfile(profile);
    try {
      localStorage.setItem(`cafe_customer_profile_${cafe.slug}`, JSON.stringify(profile));
    } catch (e) {}
    toast({
      title: "Profile Saved",
      description: `Welcome, ${profile.name}! 50 Bean Points earned.`,
      variant: "success",
    });
    setIsProfileOpen(false);
  };

  // Logout Profile
  const handleLogoutProfile = () => {
    setCustomerProfile(null);
    try {
      localStorage.removeItem(`cafe_customer_profile_${cafe.slug}`);
    } catch (e) {}
    setIsProfileOpen(false);
  };

  // Send Call Staff / Service Request
  const handleSendCallStaff = async (typeOverride?: ServiceRequestType) => {
    try {
      setIsSendingCall(true);
      const reqType = typeOverride || callType;

      const payload = {
        tableId: table?.id || null,
        tableNameSnapshot: activeTableName || "Customer Counter",
        requestType: reqType,
        notes: callNotes.trim() || null,
      };

      const res = await fetch(`/api/cafe/${cafe.slug}/service-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to call staff.");
      }

      toast({
        title: "Staff Alerted",
        description: "A team member is on the way to your table.",
        variant: "success",
      });

      setIsCallStaffOpen(false);
      setCallNotes("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to notify staff.",
        variant: "danger",
      });
    } finally {
      setIsSendingCall(false);
    }
  };

  // Execute Place Order (called immediately for Cash, or after UPI confirmation for UPI)
  const executePlaceOrder = async (
    options: {
      orderType: "DINE_IN" | "TAKEAWAY";
      tableName: string | null;
      customerName: string;
      customerPhone: string;
      notes: string;
      discount?: number;
    },
    paymentMethod: "CASH" | "UPI",
    paymentStatus: "UNPAID" | "PENDING_VERIFICATION"
  ) => {
    if (cart.length === 0) return;

    try {
      setIsPlacingOrder(true);

      const itemsPayload: CreateOrderItemInput[] = cart.map((it) => ({
        menuItemId: it.menuItem.id,
        itemName: it.menuItem.name,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        variantName: it.variantSnapshotText || null,
        specialInstructions: it.customization.specialInstructions || null,
      }));

      const payload: CreateOrderInput = {
        orderType: options.orderType,
        tableId: table?.id || null,
        tableNameSnapshot: options.tableName,
        customerId: customerProfile && !customerProfile.isGuest ? customerProfile.id : null,
        customerName: options.customerName || (options.orderType === "DINE_IN" ? "Dine-in Guest" : "Takeaway Guest"),
        customerPhone: options.customerPhone || null,
        items: itemsPayload,
        notes: options.notes || null,
        discount: options.discount || 0,
        paymentStatus,
        paymentMethod,
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

      // Update active order in state and localStorage
      setActiveOrderId(createdOrder.id);
      setActiveOrderNumber(createdOrder.orderNumber);
      setActiveOrders((prev) => [...prev.filter((o) => o.id !== createdOrder.id), createdOrder]);
      syncActiveOrders();
      try {
        localStorage.setItem(`cafe_active_order_id_${cafe.slug}`, createdOrder.id);
        localStorage.setItem(`cafe_active_order_num_${cafe.slug}`, createdOrder.orderNumber);
      } catch (e) {}

      // Clear Cart & Close Cart Drawer & Modal
      setCart([]);
      setIsCartOpen(false);
      setPendingOrderOptions(null);
      setUpiOrderData(null);
      setIsUpiModalOpen(false);

      // Open live tracker immediately!
      setIsLiveTrackerOpen(true);

      toast({
        title: "Order Placed!",
        description: `Order ${createdOrder.orderNumber} sent directly to the kitchen.`,
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Order Failed",
        description: err.message || "Could not place order.",
        variant: "danger",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Handle Place Order
  const handlePlaceOrder = async (options: {
    orderType: "DINE_IN" | "TAKEAWAY";
    tableName: string | null;
    customerName: string;
    customerPhone: string;
    notes: string;
    discount?: number;
    paymentPreference: "COUNTER" | "UPI_NOW";
  }) => {
    if (cart.length === 0) return;

    const subtotal = cart.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    const discount = options.discount || 0;
    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.round(taxable * 0.05);
    const total = taxable + tax;

    if (options.paymentPreference === "UPI_NOW") {
      // Pre-order UPI flow: open UPI modal first without placing order in DB
      setPendingOrderOptions({
        ...options,
        amount: total,
      });
      setUpiOrderData({
        amount: total,
        orderNumber: "",
      });
      setIsCartOpen(false);
      setIsUpiModalOpen(true);
    } else {
      // Cash flow: place order directly
      await executePlaceOrder(options, "CASH", "UNPAID");
    }
  };

  // Memoized Filter Menu Items (prevents unnecessary re-filtering on un-related state changes)
  const filteredItems = useMemo(() => {
    const trimmedSearch = search.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (!item.isAvailable) return false;

      // Category filter
      if (selectedCategoryId !== "ALL" && item.categoryId !== selectedCategoryId) {
        return false;
      }

      // Dietary & favorites filter
      if (dietFilter === "VEG" && !item.isVegetarian) return false;
      if (dietFilter === "NON_VEG" && item.isVegetarian) return false;
      if (dietFilter === "VEGAN" && item.foodType !== "VEGAN") return false;
      if (dietFilter === "BESTSELLER" && !item.isBestseller) return false;
      if (dietFilter === "FAVORITES" && !favorites.includes(item.id)) return false;

      // Search query match
      if (trimmedSearch) {
        const matchName = item.name.toLowerCase().includes(trimmedSearch);
        const matchDesc = item.description?.toLowerCase().includes(trimmedSearch);
        return matchName || matchDesc;
      }

      return true;
    });
  }, [menuItems, selectedCategoryId, dietFilter, favorites, search]);

  const bestsellers = useMemo(
    () => menuItems.filter((it) => it.isBestseller && it.isAvailable),
    [menuItems]
  );

  const popularItems = useMemo(() => {
    return calculatePopularItems(menuItems, salesStats30d);
  }, [menuItems, salesStats30d]);

  const totalCartCount = useMemo(
    () => cart.reduce((sum, it) => sum + it.quantity, 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, it) => sum + it.totalPrice, 0),
    [cart]
  );

  const menuItemNamesById = useMemo(() => {
    const map: Record<string, string> = {};
    (menuItems || []).forEach((m) => {
      map[m.id] = m.name;
    });
    return map;
  }, [menuItems]);

  const categoryNamesById = useMemo(() => {
    const map: Record<string, string> = {};
    (categories || []).forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const handleClaimOffer = useCallback((offerCode: string) => {
    if (!offerCode) return;
    const cleanCode = offerCode.trim().toUpperCase();

    // 1. Find matching active offer
    const matchingOffer = initialOffers?.find(
      (o) => o.code.toUpperCase() === cleanCode && o.isActive
    );

    const subtotal = cart.reduce((sum, it) => sum + it.totalPrice, 0);

    if (!matchingOffer) {
      toast({
        title: `Invalid Offer ${cleanCode}`,
        description: "This promo code is not active or available.",
        variant: "warning",
      });
      return;
    }

    // 2. Strict evaluation of eligibility
    const evaluation = evaluateOffer(matchingOffer, {
      cart,
      subtotal,
      customerProfile,
      hasPastOrders: pastOrders.length > 0,
      channel: "DIGITAL_MENU",
      cafeSlug: cafe.slug,
      orderType: activeTableName ? "DINE_IN" : undefined,
      menuItemNamesById,
      categoryNamesById,
    });

    if (!evaluation.isEligible) {
      // NOT ELIGIBLE! Do NOT claim, do NOT turn black & white!
      const reason = evaluation.ineligibleReason || "Requirements not met for this offer.";
      toast({
        title: `Offer ${cleanCode} Locked 🔒`,
        description: reason,
        variant: "warning",
      });
      setIsOffersOpen(true);
      return;
    }

    // 3. User is eligible! Apply coupon to state and localStorage
    setClaimedOfferCode(cleanCode);
    try {
      localStorage.setItem(`cafe_applied_coupon_${cafe.slug}`, cleanCode);
      const savedClaimed = localStorage.getItem(`cafe_claimed_offers_${cafe.slug}`);
      const list: string[] = savedClaimed ? JSON.parse(savedClaimed) : [];
      if (!list.includes(cleanCode)) {
        list.push(cleanCode);
        localStorage.setItem(`cafe_claimed_offers_${cafe.slug}`, JSON.stringify(list));
      }
      setClaimedOfferCodes(list);
    } catch {}

    // 4. If FREE_ITEM offer, auto-inject complimentary reward item into cart
    let nextCart = cart;
    if (matchingOffer.discountType === "FREE_ITEM" && matchingOffer.rewardItemId) {
      const rewardId = matchingOffer.rewardItemId;
      const rewardName = matchingOffer.rewardItemName || "Complimentary Item";
      const alreadyInCart = cart.some(
        (it) => it.menuItem.id === rewardId && it.unitPrice === 0
      );
      if (!alreadyInCart) {
        const realItem = menuItems.find((it) => it.id === rewardId);
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
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any,
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          customization: {},
          variantSnapshotText: "Complimentary Free Item 🎁",
        };
        nextCart = [
          ...cart.filter(
            (it) => it.unitPrice !== 0 && !it.cartItemId.startsWith("free_")
          ),
          freeItem,
        ];
        setCart(nextCart);
        try {
          localStorage.setItem(`cafe_cart_${cafe.slug}`, JSON.stringify(nextCart));
        } catch {}
      }
    }

    // 5. UX Decision:
    // If cart has items, immediately navigate user to /cart so they see the discount and free reward applied!
    // If cart is empty, notify user that coupon is active and ready for dishes from the menu.
    const shouldIncludeTable = Boolean(
      table?.tableNumber ||
      tableParamName ||
      (activeTableName && (activeOrders.length > 0 || activeOrderId))
    );
    const q = shouldIncludeTable && activeTableName
      ? `?table=${encodeURIComponent(activeTableName)}${table?.qrIdentifier ? `&qr=${encodeURIComponent(table.qrIdentifier)}` : ""}`
      : "";

    if (nextCart.length > 0) {
      toast({
        title: `Offer ${cleanCode} Applied! 🎉`,
        description: matchingOffer.discountType === "FREE_ITEM"
          ? `Free ${matchingOffer.rewardItemName || "item"} added! Taking you to cart...`
          : `${matchingOffer.title || `${matchingOffer.discountValue}% OFF`} applied! Taking you to cart...`,
        variant: "success",
      });
      transitionNavigate(router, `/menu/${cafe.slug}/cart${q}`);
    } else {
      toast({
        title: `Offer ${cleanCode} Activated! 🎉`,
        description: "Promo code active! Add dishes from the menu to see your discount in cart.",
        variant: "success",
      });
    }
  }, [
    cafe.slug,
    initialOffers,
    cart,
    customerProfile,
    pastOrders.length,
    menuItemNamesById,
    categoryNamesById,
    menuItems,
    table,
    tableParamName,
    activeTableName,
    activeOrders.length,
    activeOrderId,
    router,
    toast,
  ]);

  const layoutProps: MenuLayoutProps = {
    cafe,
    categories,
    menuItems,
    filteredItems,
    bestsellers,
    popularItems,
    salesStats30d,
    activeTableName,
    table,
    customerProfile,
    activeOrders,
    activeOrderId,
    activeOrderNumber,
    homeSections: settings?.homeSections || undefined,
    offers: initialOffers,
    pastOrders,
    search,
    setSearch,
    selectedCategoryId,
    setSelectedCategoryId,
    dietFilter,
    setDietFilter,
    favorites,
    toggleFavorite,
    cart,
    cartCount: totalCartCount,
    cartTotal: cartSubtotal,
    onSelectItem: (item) => {
      const shouldIncludeTable = Boolean(
        table?.tableNumber ||
        tableParamName ||
        (activeTableName && (activeOrders.length > 0 || activeOrderId))
      );
      const q = shouldIncludeTable && activeTableName
        ? `?table=${encodeURIComponent(activeTableName)}${table?.qrIdentifier ? `&qr=${encodeURIComponent(table.qrIdentifier)}` : ""}`
        : "";
      transitionNavigate(router, `/menu/${cafe.slug}/${item.slug}${q}`);
    },
    onQuickAdd: (item) => handleQuickAdd(item),
    onQuickMinus: (item) => handleQuickMinus(item),
    onOpenCart: () => {
      const shouldIncludeTable = Boolean(
        table?.tableNumber ||
        tableParamName ||
        (activeTableName && (activeOrders.length > 0 || activeOrderId))
      );
      const q = shouldIncludeTable && activeTableName
        ? `?table=${encodeURIComponent(activeTableName)}${table?.qrIdentifier ? `&qr=${encodeURIComponent(table.qrIdentifier)}` : ""}`
        : "";
      transitionNavigate(router, `/menu/${cafe.slug}/cart${q}`);
    },
    onOpenOrders: () => {
      const shouldIncludeTable = Boolean(
        table?.tableNumber ||
        tableParamName ||
        (activeTableName && (activeOrders.length > 0 || activeOrderId))
      );
      const q = shouldIncludeTable && activeTableName
        ? `?table=${encodeURIComponent(activeTableName)}${table?.qrIdentifier ? `&qr=${encodeURIComponent(table.qrIdentifier)}` : ""}`
        : "";
      transitionNavigate(router, `/menu/${cafe.slug}/orders${q}`);
    },
    onOpenLiveTracker: () => setIsLiveTrackerOpen(true),
    onOpenProfile: () => {
      const shouldIncludeTable = Boolean(
        table?.tableNumber ||
        tableParamName ||
        (activeTableName && (activeOrders.length > 0 || activeOrderId))
      );
      const q = shouldIncludeTable && activeTableName
        ? `?table=${encodeURIComponent(activeTableName)}${table?.qrIdentifier ? `&qr=${encodeURIComponent(table.qrIdentifier)}` : ""}`
        : "";
      transitionNavigate(router, `/menu/${cafe.slug}/profile${q}`);
    },
    onOpenOffers: (_offerCode?: string) => {
      setIsOffersOpen(true);
    },
    onClaimOffer: handleClaimOffer,
    claimedOfferCodes,
    appliedOfferCode: claimedOfferCode,
    menuItemNamesById,
    categoryNamesById,
    onOpenCallStaff: () => setIsCallStaffOpen(true),
    onShareMenu: handleShareMenu,
    digitalMenuTheme: settings?.digitalMenuTheme || settings?.themePreset || "roast",
    isAllMenuPage,
    initialBottomTab,
    isOffersOpen,
    deferredPrompt,
  };

  return (
    <>
      {layout === "modern_app" ? (
        <ModernAppLayout {...layoutProps} />
      ) : (
        <ClassicListLayout {...layoutProps} />
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODALS & SLIDE-OVER DRAWERS
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

      {/* Cart & Checkout Sheet */}
      <CustomerCartDrawer
        isOpen={isCartOpen}
        cart={cart}
        activeTableName={activeTableName}
        customerProfile={customerProfile}
        isPlacingOrder={isPlacingOrder}
        allowOrderNotes={settings?.allowOrderNotes ?? true}
        enableOffers={settings?.enableOffers ?? true}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onOpenAuth={() => setIsProfileOpen(true)}
        onApplyPromo={handleClaimOffer}
        onPlaceOrder={handlePlaceOrder}
      />

      {/* Live Order Tracker Modal */}
      {(activeOrderId || activeOrders.length > 0) && (
        <LiveOrderTrackerModal
          orderId={activeOrderId}
          activeOrders={activeOrders}
          customerId={customerProfile && !customerProfile.isGuest ? customerProfile.id : null}
          cafeSlug={cafe.slug}
          digitalMenuTheme={settings?.digitalMenuTheme || undefined}
          isOpen={isLiveTrackerOpen}
          onClose={() => setIsLiveTrackerOpen(false)}
          onRefreshActiveOrders={setActiveOrders}
          onCallStaff={(type) => handleSendCallStaff(type)}
          onOpenUpiPay={(ord) => {
            setUpiOrderData({
              orderId: ord.id,
              amount: ord.total,
              orderNumber: ord.orderNumber,
            });
            setIsUpiModalOpen(true);
          }}
          onOrderMore={() => setIsLiveTrackerOpen(false)}
        />
      )}

      {/* Optional Customer Profile / VIP Modal */}
      <CustomerProfileModal
        isOpen={isProfileOpen}
        profile={customerProfile}
        onClose={() => setIsProfileOpen(false)}
        onSaveProfile={handleSaveProfile}
        onLogout={handleLogoutProfile}
        onOpenReservation={() => setIsReservationOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        pastOrders={pastOrders}
        cafe={cafe}
        visualTheme={visualTheme}
      />

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
          digitalMenuTheme={settings?.digitalMenuTheme}
          onClose={() => {
            setIsUpiModalOpen(false);
            setUpiOrderData(null);
            if (pendingOrderOptions) {
              setPendingOrderOptions(null);
              setIsCartOpen(true);
            }
          }}
          onConfirmPaid={async (method) => {
            if (upiOrderData.orderId) {
              // Existing order payment
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
                  description: "Staff will verify your UPI receipt shortly.",
                  variant: "success",
                });
              }
            } else if (pendingOrderOptions) {
              // Pre-order payment flow: user confirmed payment in modal, now place the order in DB!
              await executePlaceOrder(
                pendingOrderOptions,
                method === "CASH" ? "CASH" : "UPI",
                method === "CASH" ? "UNPAID" : "PENDING_VERIFICATION"
              );
            }
          }}
        />
      )}

      {/* Table Reservation Modal */}
      <TableReservationModal
        isOpen={isReservationOpen}
        cafeName={cafe.name}
        defaultName={customerProfile?.name || ""}
        defaultPhone={customerProfile?.phone || ""}
        onClose={() => setIsReservationOpen(false)}
        onSubmitReservation={(resData) => {
          toast({
            title: "Booking Requested",
            description: `Table requested for ${resData.guests} guests on ${resData.date}.`,
            variant: "success",
          });
        }}
      />

      {/* Customer Review & Feedback Modal */}
      <CustomerFeedbackModal
        isOpen={isFeedbackOpen}
        cafeName={cafe.name}
        orderNumber={activeOrderNumber || undefined}
        googleReviewUrl={settings?.googleReviewUrl || null}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmitFeedback={(fbData) => {
          toast({
            title: "Review Submitted",
            description: `Thank you for rating us ${fbData.rating} stars!`,
            variant: "success",
          });
        }}
      />

      {/* Customer Offers & Perks Modal */}
      <CustomerOffersModal
        isOpen={isOffersOpen}
        cafeName={cafe.name}
        cafeSlug={cafe.slug}
        offers={initialOffers}
        cart={cart}
        customerProfile={customerProfile}
        hasPastOrders={pastOrders.length > 0}
        appliedCode={claimedOfferCode}
        menuItemNamesById={menuItemNamesById}
        categoryNamesById={categoryNamesById}
        orderType={activeTableName ? "DINE_IN" : undefined}
        onClose={() => setIsOffersOpen(false)}
        onApplyCode={(code) => {
          if (code) {
            handleClaimOffer(code);
          }
          setIsOffersOpen(false);
        }}
        cartSubtotal={cart.reduce((sum, item) => sum + item.totalPrice, 0)}
        digitalMenuTheme={settings?.digitalMenuTheme || settings?.themePreset || "roast"}
      />

      {/* Call Staff Quick Modal */}
      {isCallStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-4 sm:p-5 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-500/15 text-amber-700">
                  <IconBellRinging className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
                    Call Staff to {activeTableName || "Table"}
                  </h3>
                  <p className="text-[10px] text-[var(--color-muted)]">
                    Select assistance type for your server.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCallStaffOpen(false)}
                className="p-1 rounded-md text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                {
                  id: "CALL_WAITER" as ServiceRequestType,
                  label: "Call Waiter",
                  icon: <IconBellRinging className="w-4 h-4 text-amber-600" />,
                },
                {
                  id: "NEED_WATER" as ServiceRequestType,
                  label: "Water Refill",
                  icon: <IconDroplet className="w-4 h-4 text-blue-600" />,
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCallType(opt.id)}
                  className={`p-3 rounded-md border flex flex-col items-center justify-center gap-1.5 font-medium transition-colors shadow-xs ${
                    callType === opt.id
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium"
                      : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)]"
                  }`}
                >
                  {opt.icon}
                  <span className="text-[11px]">{opt.label}</span>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--color-muted)] mb-1">
                Optional note:
              </label>
              <input
                type="text"
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="e.g. Extra glasses, cutlery, etc."
                className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] shadow-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCallStaffOpen(false)}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSendingCall}
                onClick={() => handleSendCallStaff()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-xs cursor-pointer"
              >
                {isSendingCall ? (
                  <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <IconBellRinging className="w-3.5 h-3.5" />
                )}
                <span>Send Alert to Staff</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
