"use client";

import React from "react";
import { OrderWithItems, OrderStatus } from "../types";
import { LiveOrderCard } from "./LiveOrderCard";
import {
  IconFlame,
  IconClock,
  IconCheck,
  IconSparkles,
} from "@tabler/icons-react";

interface LiveOrderColumnProps {
  id: "NEW" | "PREPARING" | "READY" | "SERVED" | "COMPLETED";
  title: string;
  subtitle: string;
  orders: OrderWithItems[];
  onSelectOrder: (order: OrderWithItems) => void;
  onAdvanceStatus: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  advancingOrderId?: string | null;
}

export const LiveOrderColumn: React.FC<LiveOrderColumnProps> = ({
  id,
  title,
  subtitle,
  orders,
  onSelectOrder,
  onAdvanceStatus,
  advancingOrderId,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const getColumnHeaderMeta = () => {
    switch (id) {
      case "NEW":
        return {
          dotColor: "bg-rose-500",
          badgeColor: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800",
          icon: <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />,
        };
      case "PREPARING":
        return {
          dotColor: "bg-amber-500",
          badgeColor: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
          icon: <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />,
        };
      case "READY":
        return {
          dotColor: "bg-emerald-500",
          badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
          icon: <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />,
        };
      case "SERVED":
        return {
          dotColor: "bg-teal-500",
          badgeColor: "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200 dark:border-teal-800",
          icon: <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />,
        };
      case "COMPLETED":
        return {
          dotColor: "bg-sky-500",
          badgeColor: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200 dark:border-sky-800",
          icon: <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />,
        };
    }
  };

  const meta = getColumnHeaderMeta();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dataStr =
      e.dataTransfer.getData("application/json") ||
      e.dataTransfer.getData("text/plain");
    if (!dataStr) return;

    try {
      let orderId = dataStr;
      let currentStatus: string | undefined;
      if (dataStr.startsWith("{")) {
        const parsed = JSON.parse(dataStr);
        orderId = parsed.orderId;
        currentStatus = parsed.currentStatus;
      }
      if (currentStatus !== id) {
        onAdvanceStatus(orderId, id);
      }
    } catch {
      onAdvanceStatus(dataStr, id);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!isDragOver) setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOver(false);
        }
      }}
      onDrop={handleDrop}
      className={`w-[275px] sm:w-[295px] shrink-0 flex flex-col rounded-lg bg-[var(--color-surface)] border p-2.5 space-y-2.5 shadow-xs transition-all duration-200 ${
        isDragOver
          ? "border-[var(--color-primary)] ring-2 ring-dashed ring-[var(--color-primary)]/40 bg-[var(--color-primary-light)]/20 shadow-md"
          : "border-[var(--color-border)]"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)] px-1">
        <div className="flex items-center gap-2">
          <span className="relative flex items-center justify-center w-3 h-3">
            <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
          </span>
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]">
              {title}
            </h3>
            <p className="text-[10px] text-[var(--color-muted)] font-normal">{subtitle}</p>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-md text-xs font-medium ${meta.badgeColor}`}
        >
          {orders.length}
        </span>
      </div>

      {/* Cards List or Empty State */}
      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
        {isDragOver && (
          <div className="p-3 rounded-md border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-primary-light)]/40 text-[var(--color-primary)] text-center text-xs font-medium animate-pulse">
            Drop here to mark as {title}
          </div>
        )}

        {orders.length === 0 && !isDragOver ? (
          <div className="p-6 text-center rounded-lg border border-dashed border-[var(--color-border)] flex flex-col items-center justify-center gap-2 my-1">
            <div className="w-7 h-7 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] shadow-xs">
              <IconSparkles className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-medium text-[var(--color-foreground)]">
              No orders {title.toLowerCase()}
            </div>
            <div className="text-[10.5px] text-[var(--color-muted)] max-w-[180px]">
              {id === "NEW"
                ? "New orders placed via Table QR or counter will appear here."
                : id === "PREPARING"
                ? "Orders currently being prepared in kitchen will show here."
                : id === "READY"
                ? "Orders ready to be served will wait here."
                : id === "SERVED"
                ? "Orders served to table will stay here until completed."
                : "Orders completed today will appear here."}
            </div>
          </div>
        ) : (
          orders.map((order) => (
            <LiveOrderCard
              key={order.id}
              order={order}
              onSelect={onSelectOrder}
              onAdvanceStatus={onAdvanceStatus}
              isAdvancing={advancingOrderId === order.id}
            />
          ))
        )}
      </div>
    </div>
  );
};
