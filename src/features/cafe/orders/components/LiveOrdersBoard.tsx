"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Table } from "@/lib/db/schema/tables";
import { MenuItem } from "@/lib/db/schema/menu-items";
import { Category } from "@/lib/db/schema/categories";
import { ServiceRequest } from "@/lib/db/schema/orders";
import {
  OrderWithItems,
  OrderStatus,
  OrderStatsSummary,
  PaymentStatus,
  PaymentMethod,
} from "../types";
import { LiveOrderColumn } from "./LiveOrderColumn";
import { OrderDetailDrawer } from "./OrderDetailDrawer";
import { NewOrderModal } from "./NewOrderModal";
import { ServiceRequestAlerts } from "./ServiceRequestAlerts";
import { OrderHistoryView } from "./OrderHistoryView";
import { soundAlert } from "../utils/sound-chime";
import {
  IconSearch,
  IconPlus,
  IconRefresh,
  IconVolume,
  IconVolumeOff,
  IconFlame,
  IconCheck,
  IconChecks,
  IconArmchair,
  IconShoppingBag,
  IconHistory,
  IconLayoutKanban,
  IconBarcode,
} from "@tabler/icons-react";
import { useToast } from "@/components/ui/Toast";
import { parseReceiptToken } from "../utils/receipt-token";

interface LiveOrdersBoardProps {
  cafeSlug: string;
  cafeName: string;
  initialOrders: OrderWithItems[];
  initialStats: OrderStatsSummary;
  initialRequests: ServiceRequest[];
  tables: Table[];
  menuItems: MenuItem[];
  categories?: Category[];
}

export const LiveOrdersBoard: React.FC<LiveOrdersBoardProps> = ({
  cafeSlug,
  cafeName,
  initialOrders,
  initialStats,
  initialRequests,
  tables: initialTables,
  menuItems,
  categories,
}) => {
  const { toast } = useToast();

  const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders);
  const [tablesList, setTablesList] = useState<Table[]>(initialTables);
  const [stats, setStats] = useState<OrderStatsSummary>(initialStats);
  const [pendingRequests, setPendingRequests] = useState<ServiceRequest[]>(initialRequests);
  const [historyOrders, setHistoryOrders] = useState<OrderWithItems[]>([]);
  const [isMuted, setIsMuted] = useState(soundAlert.getMuted());

  // Views & Filters
  const [activeTab, setActiveTab] = useState<"LIVE" | "HISTORY">("LIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "DINE_IN" | "TAKEAWAY">("ALL");
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | PaymentStatus | "CASH">("ALL");

  // Interactive states
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [appendOrderIdForModal, setAppendOrderIdForModal] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [advancingOrderId, setAdvancingOrderId] = useState<string | null>(null);
  const [acknowledgingRequestId, setAcknowledgingRequestId] = useState<string | null>(null);

  // Keep track of previous order IDs & request IDs to trigger audio chime on new ones
  const prevOrderIdsRef = useRef<Set<string>>(new Set(initialOrders.map((o) => o.id)));
  const prevRequestIdsRef = useRef<Set<string>>(new Set(initialRequests.map((r) => r.id)));

  const fetchOrders = useCallback(
    async (isManual = false) => {
      try {
        if (isManual) setIsRefreshing(true);
        const url = `/api/cafe/${cafeSlug}/orders?history=${activeTab === "HISTORY" ? "true" : "false"}`;
        
        // Parallel fetch for orders and updated tables
        const [ordersRes, tablesRes] = await Promise.all([
          fetch(url),
          fetch(`/api/cafe/${cafeSlug}/tables`),
        ]);

        const json = await ordersRes.json();
        const tablesJson = await tablesRes.json();

        if (tablesJson.success && Array.isArray(tablesJson.data)) {
          setTablesList(tablesJson.data);
        }

        if (json.success) {
          const newOrders: OrderWithItems[] = json.data.liveOrders;
          const newRequests: ServiceRequest[] = json.data.pendingRequests;

          // Check if new orders arrived that weren't in previous set
          let hasNewOrder = false;
          for (const ord of newOrders) {
            if (!prevOrderIdsRef.current.has(ord.id) && ord.status === "NEW") {
              hasNewOrder = true;
              break;
            }
          }
          if (hasNewOrder) {
            soundAlert.playNewOrderChime();
          }

          // Check if new table calls arrived
          let hasNewRequest = false;
          for (const req of newRequests) {
            if (!prevRequestIdsRef.current.has(req.id)) {
              hasNewRequest = true;
              break;
            }
          }
          if (hasNewRequest) {
            soundAlert.playServiceAlertChime();
          }

          // Update refs
          prevOrderIdsRef.current = new Set(newOrders.map((o) => o.id));
          prevRequestIdsRef.current = new Set(newRequests.map((r) => r.id));

          setOrders(newOrders);
          setStats(json.data.stats);
          setPendingRequests(newRequests);

          if (json.data.history) {
            setHistoryOrders(json.data.history);
          }

          // Also keep selectedOrder updated if open
          if (selectedOrder) {
            const updatedSelected =
              newOrders.find((o) => o.id === selectedOrder.id) ||
              (json.data.history && json.data.history.find((o: OrderWithItems) => o.id === selectedOrder.id));
            if (updatedSelected) {
              setSelectedOrder(updatedSelected);
            }
          }
        }
      } catch (err) {
        console.error("Live order polling failed:", err);
      } finally {
        if (isManual) setIsRefreshing(false);
      }
    },
    [cafeSlug, activeTab, selectedOrder]
  );

  // Background Live Polling every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleToggleSound = () => {
    const nextMuted = soundAlert.toggleMuted();
    setIsMuted(nextMuted);
    toast({
      title: nextMuted ? "Sound Alert Muted" : "Sound Alert Enabled",
      description: nextMuted
        ? "New incoming orders and table calls will not chime."
        : "Two-tone chime will alert you when orders arrive.",
      variant: "info",
    });
  };

  const handleAdvanceStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      setAdvancingOrderId(orderId);

      // Optimistic state update for instant visual feedback on drag-drop & button clicks
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
      setSelectedOrder((prev) =>
        prev && prev.id === orderId ? { ...prev, status: nextStatus } : prev
      );

      const res = await fetch(`/api/cafe/${cafeSlug}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update order status");
      }

      await fetchOrders(false);
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message || "Could not advance order.",
        variant: "danger",
      });
      await fetchOrders(false);
    } finally {
      setAdvancingOrderId(null);
    }
  };

  const handleUpdateStatusInDrawer = async (
    orderId: string,
    nextStatus: OrderStatus,
    reason?: string
  ) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );
    setSelectedOrder((prev) =>
      prev && prev.id === orderId ? { ...prev, status: nextStatus } : prev
    );

    const res = await fetch(`/api/cafe/${cafeSlug}/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, cancellationReason: reason }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to update order status");
    }

    await fetchOrders(false);
    if (nextStatus === "COMPLETED" || nextStatus === "CANCELLED") {
      setSelectedOrder(null);
    }
  };

  const handleReleaseTable = async (tableId: string) => {
    const res = await fetch(`/api/cafe/${cafeSlug}/tables/${tableId}/release`, {
      method: "POST",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to release table");
    }
    await fetchOrders(false);
  };

  const handleUpdatePaymentInDrawer = async (
    orderId: string,
    paymentStatus: PaymentStatus,
    method?: PaymentMethod
  ) => {
    // Optimistic update for instant drawer and board feedback
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, paymentStatus, paymentMethod: method || o.paymentMethod }
          : o
      )
    );
    setSelectedOrder((prev) =>
      prev && prev.id === orderId
        ? { ...prev, paymentStatus, paymentMethod: method || prev.paymentMethod }
        : prev
    );

    const res = await fetch(`/api/cafe/${cafeSlug}/orders/${orderId}/payment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus, paymentMethod: method }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to update payment status");
    }

    await fetchOrders(false);
  };

  const handleAcknowledgeServiceRequest = async (requestId: string) => {
    try {
      setAcknowledgingRequestId(requestId);
      const res = await fetch(`/api/cafe/${cafeSlug}/service-requests/${requestId}`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to acknowledge request");
      }

      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast({
        title: "Attended",
        description: "Table service request marked as resolved.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Could not resolve request.",
        variant: "danger",
      });
    } finally {
      setAcknowledgingRequestId(null);
    }
  };

  // Barcode Scanning / Token verification handler
  const handleBarcodeScanOrSearch = async (queryVal: string) => {
    const trimmed = queryVal.trim();
    if (!trimmed) return;

    // 1. Try local match across live orders and history orders first
    const parsed = parseReceiptToken(trimmed);
    const targetOrderNum = parsed ? parsed.orderNumber : trimmed.replace(/[^0-9A-Za-z]/g, "");

    const matchedLocal =
      orders.find((o) => {
        const clean = o.orderNumber.replace(/[^0-9A-Za-z]/g, "");
        return (
          clean.toLowerCase() === targetOrderNum.toLowerCase() ||
          o.id.toLowerCase() === trimmed.toLowerCase() ||
          (parsed && clean.toLowerCase() === parsed.orderNumber.toLowerCase())
        );
      }) ||
      historyOrders.find((o) => {
        const clean = o.orderNumber.replace(/[^0-9A-Za-z]/g, "");
        return (
          clean.toLowerCase() === targetOrderNum.toLowerCase() ||
          o.id.toLowerCase() === trimmed.toLowerCase() ||
          (parsed && clean.toLowerCase() === parsed.orderNumber.toLowerCase())
        );
      });

    if (matchedLocal) {
      setSelectedOrder(matchedLocal);
      toast({
        title: "Receipt Scanned",
        description: `Verified barcode token → Opened Order #${matchedLocal.orderNumber}`,
        variant: "success",
      });
      return;
    }

    // 2. Query secure receipt verify endpoint
    try {
      const res = await fetch(`/api/cafe/${cafeSlug}/receipts/verify?token=${encodeURIComponent(trimmed)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedOrder(json.data);
        toast({
          title: "Receipt Verified",
          description: `Verified token ${trimmed} → Opened Order #${json.data.orderNumber}`,
          variant: "success",
        });
      } else {
        toast({
          title: "Order Not Found",
          description: `No active order found for barcode token: ${trimmed}`,
          variant: "danger",
        });
      }
    } catch {
      // Normal search continues
    }
  };

  // Filter live orders
  const filteredOrders = orders.filter((o) => {
    if (typeFilter !== "ALL" && o.orderType !== typeFilter) return false;
    if (paymentFilter === "CASH") {
      if (o.paymentMethod !== "CASH" || o.paymentStatus !== "UNPAID") return false;
    } else if (paymentFilter !== "ALL" && o.paymentStatus !== paymentFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const parsed = parseReceiptToken(searchQuery);
      const parsedOrderNum = parsed?.orderNumber?.toLowerCase();

      const matchNum =
        o.orderNumber.toLowerCase().includes(q) ||
        (parsedOrderNum ? o.orderNumber.toLowerCase().includes(parsedOrderNum) : false);
      const matchTable = o.tableNameSnapshot?.toLowerCase().includes(q);
      const matchCust = o.customerName?.toLowerCase().includes(q);
      return Boolean(matchNum || matchTable || matchCust);
    }
    return true;
  });

  const newOrders = filteredOrders.filter((o) => o.status === "NEW");
  const preparingOrders = filteredOrders.filter((o) => o.status === "PREPARING");
  const readyOrders = filteredOrders.filter((o) => o.status === "READY");
  const servedOrders = filteredOrders.filter((o) => o.status === "SERVED");
  const completedOrders = filteredOrders.filter((o) => o.status === "COMPLETED");

  return (
    <div className="space-y-5">
      {/* Top Header & Operational Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight text-[var(--color-foreground)]">
              Live Orders
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live (Auto-sync)</span>
            </div>
          </div>
          <p className="text-xs text-[var(--color-muted)] mt-0.5 font-normal">
            {stats.activeCount} active operational orders • {stats.completedTodayCount} completed today (₹{stats.estimatedRevenueToday.toLocaleString("en-IN")})
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sound Mute Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            title={isMuted ? "Unmute audio chime" : "Mute audio chime"}
            className={`h-8 px-2.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
              isMuted
                ? "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800"
            }`}
          >
            {isMuted ? <IconVolumeOff className="w-3.5 h-3.5" /> : <IconVolume className="w-3.5 h-3.5 text-amber-600" />}
            <span className="hidden sm:inline">{isMuted ? "Muted" : "Chime On"}</span>
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={() => fetchOrders(true)}
            disabled={isRefreshing}
            className="h-8 px-2.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-border-subtle)] text-[var(--color-foreground)] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            title="Refresh active tickets"
          >
            <IconRefresh className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* New Walk-in / Counter Order Modal */}
          <button
            type="button"
            onClick={() => setIsNewOrderModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs"
          >
            <IconPlus className="w-3.5 h-3.5" />
            <span>New Walk-in Order</span>
          </button>
        </div>
      </div>

      {/* Table Calls / Service Assistance Banner */}
      <ServiceRequestAlerts
        requests={pendingRequests}
        onAcknowledge={handleAcknowledgeServiceRequest}
        isAcknowledging={acknowledgingRequestId}
      />

      {/* Primary Tab Switch & Operational Toolbar */}
      <div className="p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Live Kanban vs History Tab Switcher */}
        <div className="inline-flex p-0.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border-subtle)] gap-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("LIVE")}
            className={`px-2.5 py-1.5 rounded-md font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "LIVE"
                ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-xs"
                : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            }`}
          >
            <IconLayoutKanban className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>Active Live Board</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] font-medium bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              {stats.activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("HISTORY")}
            className={`px-2.5 py-1.5 rounded-md font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "HISTORY"
                ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-xs"
                : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            }`}
          >
            <IconHistory className="w-3.5 h-3.5" />
            <span>Today's History</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] font-medium bg-[var(--color-border-subtle)] text-[var(--color-muted)]">
              {stats.completedTodayCount}
            </span>
          </button>
        </div>

        {/* Live Filters & Search */}
        {activeTab === "LIVE" && (
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            {/* Search / Barcode Scan */}
            <div className="relative w-48 sm:w-64">
              <input
                type="text"
                placeholder="Search order #, or scan barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleBarcodeScanOrSearch(searchQuery);
                  }
                }}
                className="w-full pl-8 pr-7 h-8 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] focus:bg-[var(--color-surface)] text-[var(--color-foreground)] placeholder-[var(--color-muted)]/70 focus:outline-none focus:border-[var(--color-primary)] shadow-xs transition-colors font-normal"
              />
              <IconSearch className="w-3.5 h-3.5 text-[var(--color-muted)] absolute left-2.5 top-2.5" />
              <button
                type="button"
                onClick={() => handleBarcodeScanOrSearch(searchQuery)}
                title="Verify scanned receipt token"
                className="absolute right-2 top-2 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
              >
                <IconBarcode className="w-4 h-4" />
              </button>
            </div>

            {/* Type Filter */}
            <div className="inline-flex p-0.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border-subtle)] gap-0.5 text-xs">
              {[
                { id: "ALL", label: "All Types" },
                { id: "DINE_IN", label: "Dine-in" },
                { id: "TAKEAWAY", label: "Takeaway" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTypeFilter(opt.id as any)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    typeFilter === opt.id
                      ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-xs"
                      : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Payment Filter */}
            <div className="inline-flex p-0.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border-subtle)] gap-0.5 text-xs">
              {[
                { id: "ALL", label: "All" },
                {
                  id: "PENDING_VERIFICATION",
                  label:
                    orders.filter((o) => o.paymentStatus === "PENDING_VERIFICATION").length > 0
                      ? `Verify UPI (${orders.filter((o) => o.paymentStatus === "PENDING_VERIFICATION").length})`
                      : "Verify UPI",
                },
                {
                  id: "CASH",
                  label:
                    orders.filter((o) => o.paymentMethod === "CASH" && o.paymentStatus === "UNPAID").length > 0
                      ? `Cash (${orders.filter((o) => o.paymentMethod === "CASH" && o.paymentStatus === "UNPAID").length})`
                      : "Cash",
                },
                { id: "UNPAID", label: "Unpaid" },
                { id: "PAID", label: "Paid" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPaymentFilter(opt.id as any)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    paymentFilter === opt.id
                      ? opt.id === "PENDING_VERIFICATION"
                        ? "bg-amber-500 text-white font-semibold shadow-xs"
                        : opt.id === "CASH"
                        ? "bg-emerald-600 text-white font-semibold shadow-xs"
                        : "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-xs"
                      : opt.id === "PENDING_VERIFICATION" &&
                        orders.some((o) => o.paymentStatus === "PENDING_VERIFICATION")
                      ? "text-amber-600 dark:text-amber-400 font-semibold hover:bg-amber-500/10"
                      : opt.id === "CASH" &&
                        orders.some((o) => o.paymentMethod === "CASH" && o.paymentStatus === "UNPAID")
                      ? "text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-500/10"
                      : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content: Live Kanban Board (5 Columns) or Today's History */}
      {activeTab === "LIVE" ? (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start w-full no-scrollbar">
          {/* Column 1: NEW */}
          <LiveOrderColumn
            id="NEW"
            title="New Orders"
            subtitle="Needs staff attention"
            orders={newOrders}
            onSelectOrder={setSelectedOrder}
            onAdvanceStatus={handleAdvanceStatus}
            advancingOrderId={advancingOrderId}
          />

          {/* Column 2: PREPARING */}
          <LiveOrderColumn
            id="PREPARING"
            title="In Preparation"
            subtitle="Kitchen / Bar working"
            orders={preparingOrders}
            onSelectOrder={setSelectedOrder}
            onAdvanceStatus={handleAdvanceStatus}
            advancingOrderId={advancingOrderId}
          />

          {/* Column 3: READY */}
          <LiveOrderColumn
            id="READY"
            title="Ready to Serve"
            subtitle="Food ready for table"
            orders={readyOrders}
            onSelectOrder={setSelectedOrder}
            onAdvanceStatus={handleAdvanceStatus}
            advancingOrderId={advancingOrderId}
          />

          {/* Column 4: SERVED */}
          <LiveOrderColumn
            id="SERVED"
            title="Served to Table"
            subtitle="Dining at table"
            orders={servedOrders}
            onSelectOrder={setSelectedOrder}
            onAdvanceStatus={handleAdvanceStatus}
            advancingOrderId={advancingOrderId}
          />

          {/* Column 5: COMPLETED */}
          <LiveOrderColumn
            id="COMPLETED"
            title="Completed"
            subtitle="Today's fulfilled orders"
            orders={completedOrders}
            onSelectOrder={setSelectedOrder}
            onAdvanceStatus={handleAdvanceStatus}
            advancingOrderId={advancingOrderId}
          />
        </div>
      ) : (
        <OrderHistoryView
          orders={historyOrders}
          onSelectOrder={setSelectedOrder}
        />
      )}

      {/* Slide-over Order Detail Drawer */}
      <OrderDetailDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatusInDrawer}
        onUpdatePayment={handleUpdatePaymentInDrawer}
        onAddMoreItems={(orderId) => {
          setAppendOrderIdForModal(orderId);
          setIsNewOrderModalOpen(true);
        }}
        onReleaseTable={handleReleaseTable}
        cafeSlug={cafeSlug}
      />

      {/* Walk-in Quick Order Modal */}
      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => {
          setIsNewOrderModalOpen(false);
          setAppendOrderIdForModal(null);
        }}
        cafeSlug={cafeSlug}
        tables={tablesList}
        menuItems={menuItems}
        categories={categories}
        activeOrders={orders}
        initialAppendOrderId={appendOrderIdForModal}
        onOrderCreated={() => fetchOrders(true)}
      />
    </div>
  );
};
