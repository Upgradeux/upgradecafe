"use client";

import React, { useState } from "react";
import { OrderWithItems } from "../types";
import {
  IconSearch,
  IconArmchair,
  IconShoppingBag,
  IconReceipt,
  IconCheck,
  IconBan,
  IconEye,
  IconInbox,
} from "@tabler/icons-react";

interface OrderHistoryViewProps {
  orders: OrderWithItems[];
  onSelectOrder: (order: OrderWithItems) => void;
  isLoading?: boolean;
}

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  orders,
  onSelectOrder,
  isLoading = false,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "COMPLETED" | "CANCELLED">("ALL");

  const filtered = orders.filter((o) => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNumber = o.orderNumber.toLowerCase().includes(q);
      const matchTable = o.tableNameSnapshot?.toLowerCase().includes(q);
      const matchCustomer = o.customerName?.toLowerCase().includes(q);
      return matchNumber || matchTable || matchCustomer;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search order #, table, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] shadow-xs"
          />
          <IconSearch className="w-4 h-4 text-[var(--color-muted)] absolute left-2.5 top-2" />
        </div>

        {/* Status Pills */}
        <div className="inline-flex p-0.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] gap-1 text-xs shadow-xs">
          {[
            { id: "ALL", label: "All History" },
            { id: "COMPLETED", label: "Completed" },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id as any)}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === pill.id
                  ? "bg-[var(--color-surface)] text-[var(--color-foreground)] font-semibold shadow-xs"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-lg bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)]">
            <IconInbox className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-semibold text-[var(--color-foreground)]">
            No historical orders found
          </h4>
          <p className="text-[11px] text-[var(--color-muted)] max-w-xs leading-relaxed">
            {search
              ? `No orders matching "${search}".`
              : "Completed and cancelled orders from today will appear here."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)] text-[10px] uppercase font-medium text-[var(--color-muted)] tracking-wider">
                  <th className="p-3.5">Order</th>
                  <th className="p-3.5">Type & Location</th>
                  <th className="p-3.5">Items</th>
                  <th className="p-3.5">Total & Payment</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Time</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => onSelectOrder(order)}
                    className="hover:bg-[var(--color-background)]/60 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-semibold text-[var(--color-foreground)]">
                      {order.orderNumber}
                    </td>

                    <td className="p-3.5">
                      {order.orderType === "DINE_IN" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)]">
                          <IconArmchair className="w-3.5 h-3.5" />
                          <span>{order.tableNameSnapshot || "Dine-in"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600">
                          <IconShoppingBag className="w-3.5 h-3.5" />
                          <span>Takeaway {order.customerName ? `(${order.customerName})` : ""}</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 max-w-[200px] truncate text-[var(--color-muted)]">
                      {order.items.map((i) => `${i.quantity}× ${i.itemName}`).join(", ")}
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-[var(--color-foreground)]">
                        ₹{order.total.toLocaleString("en-IN")}
                      </div>
                      <div className="text-[10px] text-[var(--color-muted)]">
                        {order.paymentStatus === "PAID" ? (
                          <span className="text-emerald-600 font-medium">● Paid</span>
                        ) : (
                          <span className="text-neutral-400 font-medium">● Unpaid</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5">
                      {order.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <IconCheck className="w-3 h-3" />
                          <span>Served</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <IconBan className="w-3 h-3" />
                          <span>Cancelled</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-[11px] text-[var(--color-muted)] whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectOrder(order);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--color-background)] border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-xs transition-colors"
                      >
                        <IconEye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
