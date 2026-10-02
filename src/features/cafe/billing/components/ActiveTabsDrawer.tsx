"use client";

import React, { useState } from "react";
import {
  IconArmchair,
  IconShoppingBag,
  IconClock,
  IconReceipt,
  IconX,
  IconSearch,
  IconArrowRight,
} from "@tabler/icons-react";
import type { Table } from "@/lib/db/schema/tables";
import type { OrderWithItems } from "@/features/cafe/orders/types";

interface ActiveTabsDrawerProps {
  isOpen: boolean;
  tables: Table[];
  activeOrders: OrderWithItems[];
  onSelectTable?: (tableId: string) => void;
  onSelectTab?: (table: Table | null, order: OrderWithItems) => void;
  onClose: () => void;
}

export const ActiveTabsDrawer: React.FC<ActiveTabsDrawerProps> = ({
  isOpen,
  tables,
  activeOrders,
  onSelectTable,
  onSelectTab,
  onClose,
}) => {
  const [search, setSearch] = useState("");
  const [tabType, setTabType] = useState<"ALL" | "TABLES" | "TAKEAWAY">("ALL");

  if (!isOpen) return null;

  // Unpaid or active orders
  const unsettledOrders = activeOrders.filter(
    (o) =>
      o.status !== "CANCELLED" &&
      (o.paymentStatus === "UNPAID" || o.status !== "COMPLETED")
  );

  const filteredOrders = unsettledOrders.filter((o) => {
    if (tabType === "TABLES" && o.orderType !== "DINE_IN") return false;
    if (tabType === "TAKEAWAY" && o.orderType !== "TAKEAWAY") return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchTable = o.tableNameSnapshot?.toLowerCase().includes(q);
      const matchCust = o.customerName?.toLowerCase().includes(q);
      return matchNum || matchTable || matchCust;
    }
    return true;
  });

  const totalUnsettledAmount = unsettledOrders.reduce(
    (sum, o) => (o.paymentStatus === "UNPAID" ? sum + o.total : sum),
    0
  );

  const handleSelect = (order: OrderWithItems) => {
    if (order.tableId && onSelectTable) {
      onSelectTable(order.tableId);
    }
    if (onSelectTab) {
      const table = tables.find((t) => t.id === order.tableId) || null;
      onSelectTab(table, order);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md h-full bg-[var(--color-surface,#FFFFFF)] border-l border-[var(--color-border,#E7E4DD)] shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border,#E7E4DD)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[var(--color-primary-light,#FAF7F2)] text-[var(--color-primary,#8B5E3C)] flex items-center justify-center">
              <IconReceipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[var(--color-foreground,#242321)]">
                Active Tables & Tabs
              </h3>
              <p className="text-[10px] text-[var(--color-muted,#73716B)]">
                {unsettledOrders.length} active bills • ₹
                {totalUnsettledAmount.toLocaleString("en-IN")} total
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)] hover:bg-[var(--color-background,#F7F6F2)] transition-colors"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-3 border-b border-[var(--color-border,#E7E4DD)] space-y-2 bg-[var(--color-background,#F7F6F2)]">
          <div className="relative">
            <IconSearch className="w-3.5 h-3.5 text-[var(--color-muted,#73716B)] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search table, order, or guest..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[var(--color-border,#E7E4DD)] bg-white text-[var(--color-foreground,#242321)] placeholder-[var(--color-muted,#73716B)]/70 focus:outline-none focus:border-[var(--color-primary,#8B5E3C)] font-normal"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTabType("ALL")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                tabType === "ALL"
                  ? "bg-[var(--color-primary,#8B5E3C)] text-white shadow-2xs"
                  : "bg-white border border-[var(--color-border,#E7E4DD)] text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)]"
              }`}
            >
              All ({unsettledOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setTabType("TABLES")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                tabType === "TABLES"
                  ? "bg-[var(--color-primary,#8B5E3C)] text-white shadow-2xs"
                  : "bg-white border border-[var(--color-border,#E7E4DD)] text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)]"
              }`}
            >
              Tables
            </button>
            <button
              type="button"
              onClick={() => setTabType("TAKEAWAY")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                tabType === "TAKEAWAY"
                  ? "bg-[var(--color-primary,#8B5E3C)] text-white shadow-2xs"
                  : "bg-white border border-[var(--color-border,#E7E4DD)] text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)]"
              }`}
            >
              Takeaway
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-[var(--color-muted,#73716B)] text-xs font-normal">
              No active tables or unpaid tabs match your search.
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const formattedTime = new Date(ord.createdAt).toLocaleTimeString(
                "en-IN",
                { hour: "2-digit", minute: "2-digit", hour12: true }
              );

              return (
                <div
                  key={ord.id}
                  onClick={() => handleSelect(ord)}
                  className="p-3 rounded-md border border-[var(--color-border,#E7E4DD)] bg-[var(--color-surface,#FFFFFF)] hover:border-[var(--color-primary,#8B5E3C)] hover:bg-[var(--color-background,#F7F6F2)] transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {ord.orderType === "DINE_IN" ? (
                        <div className="w-6 h-6 rounded bg-[var(--color-primary-light,#FAF7F2)] text-[var(--color-primary,#8B5E3C)] flex items-center justify-center">
                          <IconArmchair className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded bg-[#C4934A]/10 text-[#C4934A] flex items-center justify-center">
                          <IconShoppingBag className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-medium text-[var(--color-foreground,#242321)]">
                          {ord.orderType === "DINE_IN"
                            ? ord.tableNameSnapshot || "Dine-In Table"
                            : ord.customerName || "Takeaway Walk-in"}
                        </h4>
                        <span className="text-[10px] text-[var(--color-muted,#73716B)] font-mono">
                          {ord.orderNumber}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-semibold text-[var(--color-foreground,#242321)] font-mono">
                        ₹{ord.total.toLocaleString("en-IN")}
                      </div>
                      <span
                        className={`text-[9.5px] font-medium px-1.5 py-0.2 rounded ${
                          ord.paymentStatus === "PAID"
                            ? "bg-[#66805F]/10 text-[#66805F]"
                            : "bg-[#C4934A]/10 text-[#C4934A]"
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Summary of Items */}
                  <div className="text-[10.5px] text-[var(--color-muted,#73716B)] truncate">
                    {ord.items.map((i) => `${i.quantity}x ${i.itemName}`).join(", ")}
                  </div>

                  {/* Footer Timestamp & Action */}
                  <div className="flex items-center justify-between text-[10px] text-[var(--color-muted,#73716B)] pt-1 border-t border-[var(--color-border,#E7E4DD)]">
                    <div className="flex items-center gap-1">
                      <IconClock className="w-3 h-3 text-[var(--color-muted,#73716B)]" />
                      <span>{formattedTime}</span>
                    </div>
                    <span className="font-medium text-[var(--color-primary,#8B5E3C)] flex items-center gap-0.5">
                      <span>Open Ticket</span>
                      <IconArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
