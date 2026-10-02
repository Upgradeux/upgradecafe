"use client";

import React, { useState, useMemo } from "react";
import {
  IconSearch,
  IconReceipt,
  IconShoppingBag,
  IconCoins,
  IconCash,
  IconQrcode,
  IconCreditCard,
  IconChevronDown,
  IconPrinter,
  IconRotateClockwise,
  IconDotsVertical,
  IconCalendar,
  IconDownload,
  IconX,
} from "@tabler/icons-react";
import { useToast } from "@/components/ui/Toast";
import type { Cafe } from "@/lib/db/schema/cafes";
import type { OrderWithItems, PaymentMethod } from "@/features/cafe/orders/types";
import { ThermalReceiptModal } from "./ThermalReceiptModal";

interface BillingDashboardProps {
  cafe: Cafe;
  initialOrders: OrderWithItems[];
}

// Fallback line item thumbnails
const ITEM_THUMBNAILS: Record<string, string> = {
  cappuccino: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=200&auto=format&fit=crop&q=80",
  croissant: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&auto=format&fit=crop&q=80",
  matcha: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=200&auto=format&fit=crop&q=80",
  latte: "https://images.unsplash.com/photo-1593443320739-77f74939d0da?w=200&auto=format&fit=crop&q=80",
  default: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&auto=format&fit=crop&q=80",
};

function getLineItemThumbnail(name: string): string {
  const n = name.toLowerCase();
  for (const [k, url] of Object.entries(ITEM_THUMBNAILS)) {
    if (n.includes(k)) return url;
  }
  return ITEM_THUMBNAILS.default;
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({
  cafe,
  initialOrders,
}) => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    initialOrders[0]?.id || ""
  );

  // Filters
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");

  // Receipt Modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptTargetOrder, setReceiptTargetOrder] = useState<OrderWithItems | null>(null);

  // Selected Order
  const selectedOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || orders[0] || null;
  }, [orders, selectedOrderId]);

  // Aggregate Metrics (KPI cards)
  const metrics = useMemo(() => {
    let totalSales = 0;
    let ordersCount = 0;
    let cashTotal = 0;
    let upiTotal = 0;
    let cardTotal = 0;

    for (const ord of orders) {
      if (ord.status === "CANCELLED") continue;
      ordersCount++;
      totalSales += ord.total;

      if (ord.paymentMethod === "CASH") cashTotal += ord.total;
      else if (ord.paymentMethod === "UPI") upiTotal += ord.total;
      else if (ord.paymentMethod === "CARD") cardTotal += ord.total;
    }

    const aov = ordersCount > 0 ? Math.round(totalSales / ordersCount) : 0;
    const cashPct = totalSales > 0 ? Math.round((cashTotal / totalSales) * 100) : 0;
    const upiPct = totalSales > 0 ? Math.round((upiTotal / totalSales) * 100) : 0;
    const cardPct = totalSales > 0 ? Math.round((cardTotal / totalSales) * 100) : 0;

    return {
      totalSales,
      ordersCount,
      aov,
      cashTotal,
      cashPct,
      upiTotal,
      upiPct,
      cardTotal,
      cardPct,
    };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filterMethod !== "ALL" && o.paymentMethod !== filterMethod) return false;
      if (filterStatus !== "ALL" && o.paymentStatus !== filterStatus) return false;
      if (filterType !== "ALL" && o.orderType !== filterType) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNum = o.orderNumber.toLowerCase().includes(q);
        const matchTable = o.tableNameSnapshot?.toLowerCase().includes(q);
        const matchCust = o.customerName?.toLowerCase().includes(q);
        return matchNum || matchTable || matchCust;
      }
      return true;
    });
  }, [orders, filterMethod, filterStatus, filterType, search]);

  const handleResetFilters = () => {
    setSearch("");
    setFilterMethod("ALL");
    setFilterStatus("ALL");
    setFilterType("ALL");
  };

  // Export to CSV simulation
  const handleExportCsv = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["OrderNumber,Date,Type,Table,Items,Total,Method,Status"]
        .concat(
          filteredOrders.map(
            (o) =>
              `${o.orderNumber},${new Date(o.createdAt).toLocaleDateString()},${o.orderType},${o.tableNameSnapshot || "Walk-in"},${o.items.length},${o.total},${o.paymentMethod || "UNPAID"},${o.paymentStatus}`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `billing-report-${cafe.slug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Report Exported",
      description: `Downloaded ${filteredOrders.length} billing records as CSV.`,
      variant: "success",
    });
  };

  // Refund simulation
  const handleRefund = (orderId: string) => {
    toast({
      title: "Transaction Refunded",
      description: `Order ${selectedOrder?.orderNumber} has been updated to REFUNDED.`,
      variant: "info",
    });
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: "REFUNDED" } : o))
    );
  };

  const todayDisplayDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="w-full flex flex-col bg-transparent text-[var(--color-foreground)] antialiased space-y-3">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. COMPACT HEADER ROW
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-[var(--color-foreground)] tracking-tight">
              Billing & Transactions
            </h1>
            <span className="text-[10.5px] font-medium text-[var(--color-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-0.5 rounded-md shadow-xs">
              {filteredOrders.length} {filteredOrders.length === 1 ? "Order" : "Orders"}
            </span>
          </div>
          <p className="text-[11px] text-[var(--color-muted)] mt-0.5 font-normal">
            Real-time financial records, tender breakdown, and receipt management
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Selector */}
          <button
            type="button"
            className="h-8 px-2.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-background)] text-xs font-medium text-[var(--color-foreground)] flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <IconCalendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>Today, {todayDisplayDate}</span>
            <IconChevronDown className="w-3 h-3 text-[var(--color-muted)]" />
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="h-8 px-2.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-background)] text-xs font-medium text-[var(--color-foreground)] flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <IconDownload className="w-3.5 h-3.5 text-[var(--color-muted)]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. COMPACT, THIN 6-METRIC KPI STRIP
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
        {/* 1. Total Sales */}
        <div className="px-3 py-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-medium text-[var(--color-muted)] uppercase tracking-wider">
              Total Sales
            </span>
            <IconReceipt className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm sm:text-base font-semibold text-[var(--color-foreground)] tracking-tight">
              ₹{metrics.totalSales.toLocaleString("en-IN")}
            </span>
            <span className="text-[9.5px] font-medium text-[var(--color-success)] bg-[var(--color-success-light)] px-1 py-0.2 rounded">
              +12%
            </span>
          </div>
        </div>

        {/* 2. Orders */}
        <div className="px-3 py-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-medium text-[var(--color-muted)] uppercase tracking-wider">
              Orders
            </span>
            <IconShoppingBag className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm sm:text-base font-semibold text-[var(--color-foreground)] tracking-tight">
              {metrics.ordersCount}
            </span>
            <span className="text-[9.5px] font-medium text-[var(--color-success)] bg-[var(--color-success-light)] px-1 py-0.2 rounded">
              +8%
            </span>
          </div>
        </div>

        {/* 3. Avg. Order Value */}
        <div className="px-3 py-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-medium text-[var(--color-muted)] uppercase tracking-wider">
              Avg. Order
            </span>
            <IconCoins className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm sm:text-base font-semibold text-[var(--color-foreground)] tracking-tight">
              ₹{metrics.aov}
            </span>
            <span className="text-[9.5px] font-medium text-[var(--color-success)] bg-[var(--color-success-light)] px-1 py-0.2 rounded">
              +5%
            </span>
          </div>
        </div>

        {/* 4. Cash */}
        <div className="px-3 py-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-medium text-[var(--color-muted)] uppercase tracking-wider">
              Cash
            </span>
            <IconCash className="w-3.5 h-3.5 text-[var(--color-success)]" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm sm:text-base font-semibold text-[var(--color-foreground)] tracking-tight">
              ₹{metrics.cashTotal.toLocaleString("en-IN")}
            </span>
            <span className="text-[9.5px] text-[var(--color-muted)] font-normal">
              {metrics.cashPct}%
            </span>
          </div>
        </div>

        {/* 5. UPI */}
        <div className="px-3 py-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-medium text-[var(--color-muted)] uppercase tracking-wider">
              UPI
            </span>
            <IconQrcode className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm sm:text-base font-semibold text-[var(--color-foreground)] tracking-tight">
              ₹{metrics.upiTotal.toLocaleString("en-IN")}
            </span>
            <span className="text-[9.5px] text-[var(--color-muted)] font-normal">
              {metrics.upiPct}%
            </span>
          </div>
        </div>

        {/* 6. Card */}
        <div className="px-3 py-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-medium text-[var(--color-muted)] uppercase tracking-wider">
              Card
            </span>
            <IconCreditCard className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm sm:text-base font-semibold text-[var(--color-foreground)] tracking-tight">
              ₹{metrics.cardTotal.toLocaleString("en-IN")}
            </span>
            <span className="text-[9.5px] text-[var(--color-muted)] font-normal">
              {metrics.cardPct}%
            </span>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. COMPACT FILTER BAR
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="p-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <IconSearch className="w-3.5 h-3.5 text-[var(--color-muted)] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by order no, table, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-3 h-8 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] focus:bg-[var(--color-surface)] text-[var(--color-foreground)] placeholder-[var(--color-muted)]/70 focus:outline-none focus:border-[var(--color-primary)] shadow-xs transition-colors font-normal"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-2 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              >
                <IconX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Payment Method Filter */}
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="h-8 px-2 text-xs font-medium rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-xs focus:outline-none focus:border-[var(--color-primary)]"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-8 px-2 text-xs font-medium rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-xs focus:outline-none focus:border-[var(--color-primary)]"
          >
            <option value="ALL">All Status</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          {/* Order Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-8 px-2 text-xs font-medium rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-xs focus:outline-none focus:border-[var(--color-primary)]"
          >
            <option value="ALL">All Order Types</option>
            <option value="DINE_IN">Dine-in</option>
            <option value="TAKEAWAY">Takeaway</option>
            <option value="DELIVERY">Delivery</option>
          </select>

          {(search || filterMethod !== "ALL" || filterStatus !== "ALL" || filterType !== "ALL") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-8 px-2 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] rounded-md hover:bg-[var(--color-background)] transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. CLEAN, THIN TRANSACTIONS TABLE (LEFT) & DETAIL INSPECTOR (RIGHT)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* LEFT 8 COLS: Clean & Thin Transactions Table */}
        <div className="lg:col-span-8 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-background)] text-[var(--color-muted)] font-medium uppercase tracking-wider text-[9px] border-b border-[var(--color-border)]">
                <tr>
                  <th className="py-2 px-3 w-16">Order</th>
                  <th className="py-2 px-2.5">Date & Time</th>
                  <th className="py-2 px-2.5">Type</th>
                  <th className="py-2 px-2.5">Table / Customer</th>
                  <th className="py-2 px-2.5">Items</th>
                  <th className="py-2 px-2.5">Amount</th>
                  <th className="py-2 px-2.5">Payment</th>
                  <th className="py-2 px-2.5">Status</th>
                  <th className="py-2 px-2 text-center w-12">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-[var(--color-muted)] text-xs">
                      No billing transactions match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const isSelected = ord.id === selectedOrderId;
                    const formattedTime = new Date(ord.createdAt).toLocaleTimeString(
                      "en-IN",
                      { hour: "2-digit", minute: "2-digit", hour12: true }
                    );
                    const formattedDate = new Date(ord.createdAt).toLocaleDateString(
                      "en-IN",
                      { day: "numeric", month: "short" }
                    );

                    return (
                      <tr
                        key={ord.id}
                        onClick={() => setSelectedOrderId(ord.id)}
                        className={`cursor-pointer transition-colors border-l-2 ${
                          isSelected
                            ? "bg-[var(--color-primary-light)] border-l-[var(--color-primary)]"
                            : "border-l-transparent hover:bg-[var(--color-background)]"
                        }`}
                      >
                        <td className="py-2 px-3 font-medium text-[var(--color-foreground)] font-mono text-xs">
                          {ord.orderNumber}
                        </td>
                        <td className="py-2 px-2.5 text-[var(--color-muted)] text-[11px] whitespace-nowrap font-normal">
                          {formattedDate}, {formattedTime}
                        </td>
                        <td className="py-2 px-2.5 text-[var(--color-muted)] text-[11px] font-normal">
                          {ord.orderType === "DINE_IN" ? "Dine-in" : "Takeaway"}
                        </td>
                        <td className="py-2 px-2.5 font-normal text-[var(--color-foreground)] text-xs truncate max-w-[130px]">
                          {ord.orderType === "DINE_IN"
                            ? ord.tableNameSnapshot || "Dine-In"
                            : ord.customerName || "Walk-in"}
                        </td>
                        <td className="py-2 px-2.5 text-[var(--color-muted)] text-[11px] whitespace-nowrap font-normal">
                          {ord.items.length} {ord.items.length === 1 ? "item" : "items"}
                        </td>
                        <td className="py-2 px-2.5 font-medium text-[var(--color-foreground)] text-xs whitespace-nowrap">
                          ₹{ord.total.toLocaleString("en-IN")}
                        </td>
                        <td className="py-2 px-2.5 text-[var(--color-muted)] font-normal text-[11px] whitespace-nowrap">
                          {ord.paymentMethod || "—"}
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-medium ${
                              ord.paymentStatus === "PAID"
                                ? "bg-[var(--color-success-light)] text-[var(--color-success)]"
                                : ord.paymentStatus === "REFUNDED"
                                ? "bg-[var(--color-danger-light)] text-[var(--color-danger)]"
                                : "bg-[var(--color-warning-light)] text-[var(--color-warning)]"
                            }`}
                          >
                            <span
                              className={`w-1 h-1 rounded-full ${
                                ord.paymentStatus === "PAID"
                                  ? "bg-[var(--color-success)]"
                                  : ord.paymentStatus === "REFUNDED"
                                  ? "bg-[var(--color-danger)]"
                                  : "bg-[var(--color-warning)]"
                              }`}
                            />
                            <span>{ord.paymentStatus}</span>
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            title="Print Receipt"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReceiptTargetOrder(ord);
                              setIsReceiptModalOpen(true);
                            }}
                            className="w-6 h-6 inline-flex items-center justify-center rounded text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-background)] transition-colors"
                          >
                            <IconPrinter className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT 4 COLS: Compact Transaction Inspection Panel */}
        <div className="lg:col-span-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] shadow-xs p-3 space-y-3">
          {selectedOrder ? (
            <>
              {/* Header: Dine-in Table / Timestamp */}
              <div className="flex items-start justify-between border-b border-[var(--color-border)] pb-2">
                <div>
                  <h3 className="text-xs font-semibold text-[var(--color-foreground)]">
                    {selectedOrder.orderType === "DINE_IN"
                      ? `Dine-in • ${selectedOrder.tableNameSnapshot || "Table"}`
                      : `Takeaway • ${selectedOrder.customerName || "Walk-in"}`}
                  </h3>
                  <p className="text-[10px] text-[var(--color-muted)] mt-0.5 font-normal">
                    {new Date(selectedOrder.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    •{" "}
                    {new Date(selectedOrder.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-medium ${
                    selectedOrder.paymentStatus === "PAID"
                      ? "bg-[var(--color-success-light)] text-[var(--color-success)]"
                      : selectedOrder.paymentStatus === "REFUNDED"
                      ? "bg-[var(--color-danger-light)] text-[var(--color-danger)]"
                      : "bg-[var(--color-warning-light)] text-[var(--color-warning)]"
                  }`}
                >
                  <span
                    className={`w-1 h-1 rounded-full ${
                      selectedOrder.paymentStatus === "PAID"
                        ? "bg-[var(--color-success)]"
                        : selectedOrder.paymentStatus === "REFUNDED"
                        ? "bg-[var(--color-danger)]"
                        : "bg-[var(--color-warning)]"
                    }`}
                  />
                  <span>{selectedOrder.paymentStatus}</span>
                </span>
              </div>

              {/* Itemized Lines */}
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {selectedOrder.items.map((item) => {
                  const thumb = getLineItemThumbnail(item.itemName);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 text-xs py-0.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumb}
                          alt={item.itemName}
                          className="w-6 h-6 rounded object-cover flex-shrink-0 bg-[var(--color-background)]"
                        />
                        <div className="min-w-0">
                          <h4 className="font-medium text-[var(--color-foreground)] truncate leading-tight text-xs">
                            {item.itemName}
                          </h4>
                          {item.specialInstructions && (
                            <p className="text-[9.5px] text-[var(--color-muted)] truncate font-normal">
                              {item.specialInstructions}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-[var(--color-muted)] font-normal">
                          {item.quantity} x
                        </span>
                        <span className="font-medium text-[var(--color-foreground)] w-12 text-right text-xs">
                          ₹{item.itemTotal.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Financial Breakdown */}
              <div className="border-t border-[var(--color-border)] pt-2 space-y-1 text-xs text-[var(--color-muted)]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-normal text-[var(--color-foreground)]">
                    ₹{selectedOrder.subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                {selectedOrder.discount ? (
                  <div className="flex justify-between text-[var(--color-success)]">
                    <span>Discount</span>
                    <span className="font-normal">
                      - ₹{selectedOrder.discount.toLocaleString("en-IN")}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between text-[11px]">
                  <span>GST (5%)</span>
                  <span className="font-normal text-[var(--color-foreground)]">
                    ₹{selectedOrder.tax.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1.5 border-t border-[var(--color-border)] text-xs font-medium text-[var(--color-foreground)]">
                  <span>Total</span>
                  <span className="text-sm font-semibold text-[var(--color-foreground)]">
                    ₹{selectedOrder.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border-t border-[var(--color-border)] pt-2 space-y-1 text-[11px] text-[var(--color-muted)]">
                <div className="flex justify-between">
                  <span>Payment Method</span>
                  <span className="font-medium text-[var(--color-foreground)]">
                    {selectedOrder.paymentMethod || "UNPAID"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Paid At</span>
                  <span className="font-normal text-[var(--color-foreground)]">
                    {new Date(selectedOrder.updatedAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Staff / Terminal</span>
                  <span className="font-normal text-[var(--color-foreground)] truncate max-w-[150px]">
                    {cafe.name} (POS-01)
                  </span>
                </div>
              </div>

              {/* Bottom Actions: Print Receipt & Refund */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => {
                    setReceiptTargetOrder(selectedOrder);
                    setIsReceiptModalOpen(true);
                  }}
                  className="h-8 px-2.5 rounded-md bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <IconPrinter className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  disabled={selectedOrder.paymentStatus === "REFUNDED"}
                  onClick={() => handleRefund(selectedOrder.id)}
                  className="h-8 px-2.5 rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger-light)] hover:bg-[var(--color-danger)]/15 text-[var(--color-danger)] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  <IconRotateClockwise className="w-3.5 h-3.5" />
                  <span>
                    {selectedOrder.paymentStatus === "REFUNDED"
                      ? "Refunded"
                      : "Refund"}
                  </span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-[var(--color-muted)] text-xs">
              Select a transaction on the left to inspect details.
            </div>
          )}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5. THERMAL RECEIPT MODAL
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {receiptTargetOrder && (
        <ThermalReceiptModal
          isOpen={isReceiptModalOpen}
          order={receiptTargetOrder}
          cafeName={cafe.name}
          cafeAddress="Artisanal Roastery & Café"
          onClose={() => {
            setIsReceiptModalOpen(false);
            setReceiptTargetOrder(null);
          }}
        />
      )}
    </div>
  );
};
