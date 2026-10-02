"use client";

import React, { useState, useEffect } from "react";
import { OrderWithItems, OrderStatus } from "../types";
import {
  IconClock,
  IconArmchair,
  IconShoppingBag,
  IconCheck,
  IconFlame,
  IconChecks,
  IconChevronRight,
  IconLoader2,
  IconGripVertical,
  IconCash,
  IconQrcode,
} from "@tabler/icons-react";

interface LiveOrderCardProps {
  order: OrderWithItems;
  onSelect: (order: OrderWithItems) => void;
  onAdvanceStatus: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  isAdvancing?: boolean;
}

export const LiveOrderCard: React.FC<LiveOrderCardProps> = ({
  order,
  onSelect,
  onAdvanceStatus,
  isAdvancing = false,
}) => {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [elapsedFormatted, setElapsedFormatted] = useState("00:00");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const calculateElapsed = () => {
      const start = new Date(order.createdAt).getTime();
      const diffSec = Math.max(0, Math.floor((Date.now() - start) / 1000));
      const mins = Math.floor(diffSec / 60);
      const secs = diffSec % 60;
      setElapsedMinutes(mins);
      setElapsedFormatted(
        `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
      );
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  // Urgency Escalation Level
  const getUrgencyClasses = () => {
    if (order.status === "COMPLETED") {
      return {
        timer: "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800",
        border: "border-sky-100 dark:border-sky-900/30 hover:border-sky-300",
      };
    }
    if (elapsedMinutes >= 15) {
      return {
        timer: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60",
        border: "border-rose-200 dark:border-rose-900/40 hover:border-rose-400",
      };
    }
    if (elapsedMinutes >= 8) {
      return {
        timer: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60",
        border: "border-amber-200 dark:border-amber-900/40 hover:border-amber-400",
      };
    }
    return {
      timer: "text-[var(--color-muted)] bg-[var(--color-background)] border-[var(--color-border-subtle)]",
      border: "border-[var(--color-border)] hover:border-[var(--color-primary)]/40",
    };
  };

  const urgency = getUrgencyClasses();

  const getNextStatusAction = () => {
    switch (order.status) {
      case "NEW":
        return {
          label: "Start Preparing",
          nextStatus: "PREPARING" as OrderStatus,
          icon: <IconFlame className="w-3.5 h-3.5" />,
          btnClass:
            "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]",
        };
      case "PREPARING":
        return {
          label: "Mark Ready",
          nextStatus: "READY" as OrderStatus,
          icon: <IconCheck className="w-3.5 h-3.5" />,
          btnClass:
            "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500",
        };
      case "READY":
        return {
          label: order.orderType === "DINE_IN" ? "Serve to Table" : "Handover Order",
          nextStatus: order.orderType === "DINE_IN" ? ("SERVED" as OrderStatus) : ("COMPLETED" as OrderStatus),
          icon:
            order.orderType === "DINE_IN" ? (
              <IconArmchair className="w-3.5 h-3.5" />
            ) : (
              <IconShoppingBag className="w-3.5 h-3.5" />
            ),
          btnClass:
            order.orderType === "DINE_IN"
              ? "bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500"
              : "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500",
        };
      case "SERVED":
        return {
          label: "Full-Filled",
          nextStatus: "COMPLETED" as OrderStatus,
          icon: <IconChecks className="w-3.5 h-3.5" />,
          btnClass:
            "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500",
        };
      default:
        return null;
    }
  };

  const action = getNextStatusAction();

  const handleActionClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!action || isAdvancing) return;
    await onAdvanceStatus(order.id, action.nextStatus);
  };

  const totalItemCount = order.items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <div
      onClick={() => onSelect(order)}
      draggable={!isAdvancing}
      onDragStart={(e) => {
        setIsDragging(true);
        e.dataTransfer.setData("text/plain", order.id);
        e.dataTransfer.setData(
          "application/json",
          JSON.stringify({ orderId: order.id, currentStatus: order.status })
        );
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => {
        setIsDragging(false);
      }}
      className={`group rounded-md p-2.5 bg-[var(--color-surface)] border shadow-xs transition-all duration-150 cursor-grab active:cursor-grabbing hover:shadow-xs flex flex-col justify-between gap-2.5 select-none ${
        urgency.border
      } ${
        isDragging
          ? "opacity-40 scale-95 border-dashed border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20"
          : ""
      }`}
    >
      {/* Top Header: Order Number, Location & Elapsed Timer */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="text-[var(--color-muted)]/40 group-hover:text-[var(--color-muted)] transition-colors -ml-1 cursor-grab shrink-0"
              title="Drag to reorder across columns"
            >
              <IconGripVertical className="w-3.5 h-3.5" />
            </span>

            <span className="font-semibold text-xs tracking-tight text-[var(--color-foreground)] shrink-0 leading-none">
              {order.orderNumber}
            </span>

            {order.orderType === "DINE_IN" ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-[var(--color-primary-light)] text-[var(--color-primary)] shrink-0 leading-none">
                <IconArmchair className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[95px]">
                  {order.tableNameSnapshot || "Dine-in"}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0 leading-none">
                <IconShoppingBag className="w-3 h-3 flex-shrink-0" />
                <span>Takeaway</span>
              </span>
            )}
          </div>

          {/* Live Elapsed Timer or Completed Time */}
          <div
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border font-mono flex-shrink-0 leading-none ${urgency.timer}`}
            title={order.status === "COMPLETED" ? "Completion time" : "Elapsed preparation time"}
          >
            {order.status === "COMPLETED" ? (
              <IconChecks className="w-3 h-3 text-sky-600" />
            ) : (
              <IconClock className="w-3 h-3" />
            )}
            <span>
              {order.status === "COMPLETED" && order.completedAt
                ? new Date(order.completedAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                : elapsedFormatted}
            </span>
          </div>
        </div>

        {/* Customer Reference (if present) */}
        {order.customerName && (
          <div className="mt-1 flex items-center gap-1 text-[11px] min-w-0">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)] shrink-0">
              For:
            </span>
            <span className="font-medium text-[var(--color-foreground)] truncate" title={order.customerName}>
              {order.customerName}
            </span>
          </div>
        )}

        {/* Customer / Order Notes (if any) */}
        {order.notes && (
          <div className="mt-1 text-[10.5px] text-[var(--color-muted)] italic bg-[var(--color-background)] px-2 py-0.5 rounded-md border border-[var(--color-border-subtle)] truncate font-normal">
            "{order.notes}"
          </div>
        )}

        {/* Item Summary List */}
        <div className="mt-2 space-y-0.5">
          {order.items.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex items-baseline justify-between text-xs gap-2"
            >
              <div className="flex items-baseline gap-1.5 min-w-0 text-[var(--color-foreground)]">
                <span className="font-semibold text-[11px] text-[var(--color-primary)]">
                  {item.quantity}×
                </span>
                <span className="font-medium truncate">{item.itemName}</span>
                {item.variantName && (
                  <span className="text-[10px] text-[var(--color-muted)] truncate font-normal">
                    ({item.variantName})
                  </span>
                )}
              </div>

              {item.specialInstructions && (
                <span className="text-[9.5px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 py-0.2 rounded-md border border-amber-200 dark:border-amber-800 flex-shrink-0">
                  {item.specialInstructions}
                </span>
              )}
            </div>
          ))}

          {order.items.length > 3 && (
            <div className="text-[10px] font-normal text-[var(--color-muted)] pt-0.5">
              +{order.items.length - 3} more item(s)...
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer: Price, Payment Pill & Quick Advance Action */}
      <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-xs text-[var(--color-foreground)]">
            ₹{order.total.toLocaleString("en-IN")}
          </span>

          <span className="text-[10px] text-[var(--color-muted)]">•</span>

          {order.paymentStatus === "PAID" ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>Paid {order.paymentMethod ? `(${order.paymentMethod === "CASH" ? "Cash" : "UPI"})` : ""}</span>
            </span>
          ) : order.paymentStatus === "PENDING_VERIFICATION" ? (
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded-md border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
              <span>Verify UPI</span>
            </span>
          ) : order.paymentStatus === "PAYMENT_REJECTED" ? (
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-rose-700 dark:text-rose-400 bg-rose-500/15 px-1.5 py-0.5 rounded-md border border-rose-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
              <span>Rejected</span>
            </span>
          ) : order.paymentMethod === "CASH" ? (
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-amber-800 dark:text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded-md border border-amber-500/30">
              <IconCash className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Cash at Counter</span>
            </span>
          ) : order.paymentMethod === "UPI" ? (
            <span className="inline-flex items-center gap-1 text-[9.5px] font-medium text-sky-700 dark:text-sky-300 bg-sky-500/10 px-1.5 py-0.5 rounded-md border border-sky-500/25">
              <IconQrcode className="w-3 h-3 text-sky-600 dark:text-sky-400" />
              <span>UPI (Unpaid)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-normal text-[var(--color-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 inline-block" />
              <span>Unpaid</span>
            </span>
          )}
        </div>

        {/* Primary Action Button or Completed Badge */}
        {order.status === "COMPLETED" ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <IconChecks className="w-3 h-3 text-sky-600" />
            <span>Completed</span>
          </span>
        ) : action ? (
          <button
            type="button"
            disabled={isAdvancing}
            onClick={handleActionClick}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shadow-xs ${action.btnClass}`}
          >
            {isAdvancing ? (
              <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              action.icon
            )}
            <span>{isAdvancing ? "Updating..." : action.label}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};
