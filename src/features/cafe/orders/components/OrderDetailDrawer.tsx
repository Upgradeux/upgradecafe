"use client";

import React, { useState, useEffect } from "react";
import { OrderWithItems, OrderStatus, PaymentStatus, PaymentMethod } from "../types";
import {
  IconX,
  IconCheck,
  IconClock,
  IconPrinter,
  IconChecks,
  IconRotateClockwise2,
  IconLoader2,
  IconAlertTriangle,
  IconPlus,
  IconDoorExit,
  IconCopy,
  IconArmchair,
  IconShoppingBag,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useToast } from "@/components/ui/Toast";

/* ─── Custom Animated SVG Icons ─── */

const AnimatedFlameIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2C12 2 5 9 5 14a7 7 0 0014 0c0-5-7-12-7-12z"
      fill="currentColor"
      opacity="0.2"
    >
      <animate attributeName="d" dur="1.5s" repeatCount="indefinite"
        values="M12 2C12 2 5 9 5 14a7 7 0 0014 0c0-5-7-12-7-12z;M12 3C12 3 6 9.5 6 14a6 6 0 0012 0c0-4.5-6-11-6-11z;M12 2C12 2 5 9 5 14a7 7 0 0014 0c0-5-7-12-7-12z"
      />
    </path>
    <path
      d="M12 2C12 2 5 9 5 14a7 7 0 0014 0c0-5-7-12-7-12z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <animate attributeName="d" dur="1.5s" repeatCount="indefinite"
        values="M12 2C12 2 5 9 5 14a7 7 0 0014 0c0-5-7-12-7-12z;M12 3C12 3 6 9.5 6 14a6 6 0 0012 0c0-4.5-6-11-6-11z;M12 2C12 2 5 9 5 14a7 7 0 0014 0c0-5-7-12-7-12z"
      />
    </path>
    <path d="M12 12c0 0-2 2-2 4a2 2 0 004 0c0-2-2-4-2-4z" fill="currentColor" opacity="0.5">
      <animate attributeName="opacity" dur="0.8s" repeatCount="indefinite" values="0.5;0.9;0.5" />
    </path>
  </svg>
);

const AnimatedClockIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="56.5" strokeDashoffset="14">
      <animate attributeName="stroke-dashoffset" dur="3s" repeatCount="indefinite" values="56.5;0;56.5" />
    </circle>
    <line x1="12" y1="12" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="12" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="8s" repeatCount="indefinite" />
    </line>
  </svg>
);

const AnimatedBellIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g>
      <animateTransform attributeName="transform" type="rotate" values="-3 12 4;3 12 4;-3 12 4" dur="0.6s" repeatCount="indefinite" />
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AnimatedCheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="62.8" strokeDashoffset="0">
      <animate attributeName="stroke-dashoffset" dur="0.6s" values="62.8;0" fill="freeze" />
    </circle>
    <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="20" strokeDashoffset="0">
      <animate attributeName="stroke-dashoffset" dur="0.4s" begin="0.3s" values="20;0" fill="freeze" />
    </path>
  </svg>
);

const UpiIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M13 7l-3 4h4l-2 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CashIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 12h.01M18 12h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CardIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1.5" />
    <rect x="5" y="14" width="4" height="2" rx="0.5" fill="currentColor" opacity="0.3" />
  </svg>
);



const NoteIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="8" y1="17" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const PulseRingIcon = ({ color = "rose" }: { color?: string }) => (
  <span className="relative flex h-2 w-2">
    <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping bg-${color}-400`} />
    <span className={`relative inline-flex h-2 w-2 rounded-full bg-${color}-500`} />
  </span>
);

/* ─── Helper Formatters ─── */

const format12h = (d: string | Date | null | undefined) => {
  if (!d) return "";
  return new Date(d).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const formatDate = (d: string | Date | null | undefined) => {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const formatFullDT = (d: string | Date | null | undefined, sec = false) => {
  if (!d) return "";
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: sec ? "2-digit" : undefined, hour12: true,
  });
};

const formatElapsed = (createdAt: string | Date) => {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m ago`;
};

/* ─── Status Config Map ─── */

const STATUS_CONFIG: Record<string, { label: string; color: string; bgClass: string; dotClass: string; ringClass: string }> = {
  NEW: { label: "New Order", color: "rose", bgClass: "bg-rose-500/8", dotClass: "bg-rose-500", ringClass: "ring-rose-500/20" },
  PREPARING: { label: "Preparing", color: "amber", bgClass: "bg-amber-500/8", dotClass: "bg-amber-500", ringClass: "ring-amber-500/20" },
  READY: { label: "Ready to Serve", color: "emerald", bgClass: "bg-emerald-500/8", dotClass: "bg-emerald-500", ringClass: "ring-emerald-500/20" },
  SERVED: { label: "Served to Table", color: "teal", bgClass: "bg-teal-500/8", dotClass: "bg-teal-500", ringClass: "ring-teal-500/20" },
  COMPLETED: { label: "Completed", color: "sky", bgClass: "bg-sky-500/8", dotClass: "bg-sky-500", ringClass: "ring-sky-500/20" },
  CANCELLED: { label: "Cancelled", color: "neutral", bgClass: "bg-neutral-500/8", dotClass: "bg-neutral-400", ringClass: "ring-neutral-500/20" },
};

/* ─── Component Props ─── */

interface OrderDetailDrawerProps {
  order: OrderWithItems | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, nextStatus: OrderStatus, reason?: string) => Promise<void>;
  onUpdatePayment: (orderId: string, status: PaymentStatus, method?: PaymentMethod) => Promise<void>;
  onAddMoreItems?: (orderId: string, tableId?: string | null) => void;
  onReleaseTable?: (tableId: string) => Promise<void>;
  cafeSlug: string;
}

/* ─── Main Component ─── */

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  order,
  onClose,
  onUpdateStatus,
  onUpdatePayment,
  onAddMoreItems,
  onReleaseTable,
  cafeSlug,
}) => {
  const { toast } = useToast();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [isReleasingTable, setIsReleasingTable] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [elapsed, setElapsed] = useState("");

  // Live elapsed timer
  useEffect(() => {
    if (!order) return;
    setElapsed(formatElapsed(order.createdAt));
    const interval = setInterval(() => setElapsed(formatElapsed(order.createdAt)), 30000);
    return () => clearInterval(interval);
  }, [order?.createdAt, order]);

  if (!order) return null;

  const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.NEW;
  const totalItems = order.items.reduce((a, it) => a + it.quantity, 0);

  const handleAdvance = async (nextStatus: OrderStatus) => {
    try {
      setIsUpdatingStatus(true);
      await onUpdateStatus(order.id, nextStatus);
    } catch {
      toast({ title: "Update Failed", description: "Could not update order status.", variant: "danger" });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCancelSubmit = async () => {
    try {
      setIsUpdatingStatus(true);
      await onUpdateStatus(order.id, "CANCELLED", cancelReason);
      setIsCancelModalOpen(false);
      onClose();
    } catch {
      toast({ title: "Cancellation Failed", description: "Could not cancel order.", variant: "danger" });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePayment = async (status: PaymentStatus, method?: PaymentMethod) => {
    try {
      setIsUpdatingPayment(true);
      await onUpdatePayment(order.id, status, method);
      toast({
        title: status === "PAID" ? "Payment Settled" : "Marked Unpaid",
        description: status === "PAID" ? `Recorded via ${method || "UPI"}.` : "Payment reset to pending.",
        variant: "success",
      });
    } catch {
      toast({ title: "Payment Update Failed", description: "Could not update payment.", variant: "danger" });
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleVacate = async () => {
    if (!order.tableId || !onReleaseTable) return;
    try {
      setIsReleasingTable(true);
      await onReleaseTable(order.tableId);
      toast({ title: "Table Released", description: `${order.tableNameSnapshot || "Table"} is now available.`, variant: "success" });
    } catch {
      toast({ title: "Action Failed", description: "Could not release table.", variant: "danger" });
    } finally {
      setIsReleasingTable(false);
    }
  };

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const html = `<!DOCTYPE html><html><head><title>Order ${order.orderNumber}</title>
      <style>body{font-family:monospace;padding:18px;font-size:13px;max-width:320px;margin:0 auto;color:#000}
      .hdr{text-align:center;border-bottom:1px dashed #000;padding-bottom:8px;margin-bottom:8px}
      .row{display:flex;justify-content:space-between;margin:3px 0}.itm{margin:6px 0}
      .spec{font-size:11px;padding-left:8px;color:#444;font-style:italic}
      .ftr{border-top:1px dashed #000;margin-top:8px;padding-top:8px;text-align:center}</style></head>
      <body><div class="hdr"><h2 style="margin:0;font-size:18px">${order.orderNumber}</h2>
      <div style="font-weight:bold;margin-top:4px">${order.orderType === "DINE_IN" ? order.tableNameSnapshot || "Dine-in" : "Takeaway"}</div>
      <div style="font-size:11px;color:#555;margin-top:2px">${formatFullDT(order.createdAt, true)}</div></div>
      <div>${order.items.map(it => `<div class="itm"><div class="row"><span style="font-weight:bold">${it.quantity}x ${it.itemName}</span><span>₹${it.itemTotal}</span></div>
      ${it.variantName ? `<div class="spec">(${it.variantName})</div>` : ""}
      ${it.specialInstructions ? `<div class="spec">Note: ${it.specialInstructions}</div>` : ""}</div>`).join("")}</div>
      <div class="ftr"><div class="row" style="font-weight:bold;font-size:14px"><span>Total</span><span>₹${order.total}</span></div>
      <div style="margin-top:4px;font-size:11px">Payment: ${order.paymentStatus}${order.paymentMethod ? ` (${order.paymentMethod})` : ""}</div>
      ${order.notes ? `<div style="margin-top:4px;font-size:11px;font-style:italic">"${order.notes}"</div>` : ""}</div>
      <script>window.onload=function(){window.print();window.close()}</script></body></html>`;
    w.document.write(html);
    w.document.close();
  };

  const handleCopyOrder = () => {
    const text = `${order.orderNumber} | ${order.orderType === "DINE_IN" ? order.tableNameSnapshot : "Takeaway"}\n${order.items.map(it => `${it.quantity}x ${it.itemName} - ₹${it.itemTotal}`).join("\n")}\nTotal: ₹${order.total}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Order details copied to clipboard.", variant: "success" });
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity" />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[440px] bg-[var(--color-surface)] border-l border-[var(--color-border)]/60 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">

        {/* ━━━ Header ━━━ */}
        <div className="px-4 py-3 border-b border-[var(--color-border)]/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-[var(--color-foreground)]">
              {order.orderNumber}
            </h2>
            {order.orderType === "DINE_IN" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-[var(--color-primary)]/8 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/15">
                <IconArmchair className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[100px]">{order.tableNameSnapshot || "Dine-in"}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-violet-500/8 text-violet-600 ring-1 ring-violet-500/15">
                <IconShoppingBag className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[100px]">{order.customerName || "Takeaway"}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button type="button" onClick={handleCopyOrder} title="Copy order details"
              className="p-1.5 rounded-md text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-background)] transition-all cursor-pointer">
              <IconCopy className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={handlePrint} title="Print kitchen ticket"
              className="p-1.5 rounded-md text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-background)] transition-all cursor-pointer">
              <IconPrinter className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={onClose}
              className="p-1.5 rounded-md text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-background)] transition-all cursor-pointer">
              <IconX className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ━━━ Status Ribbon ━━━ */}
        <div className={`mx-4 mt-3 px-3 py-2 rounded-lg ${sc.bgClass} ring-1 ${sc.ringClass} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            {order.status === "NEW" ? (
              <PulseRingIcon color="rose" />
            ) : (
              <span className={`w-2 h-2 rounded-full ${sc.dotClass}`} />
            )}
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-foreground)]">
              {sc.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10.5px] text-[var(--color-muted)]">
            <AnimatedClockIcon className="w-3 h-3 opacity-50" />
            <span className="font-mono">{format12h(order.createdAt)}</span>
            <span className="text-[var(--color-border)]">|</span>
            <span className="font-medium text-[var(--color-foreground)]">{elapsed}</span>
          </div>
        </div>

        {/* ━━━ Scrollable Content ━━━ */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 space-y-3 scrollbar-none [&::-webkit-scrollbar]:hidden">

          {/* Chef / Kitchen Note */}
          {order.notes && (
            <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border-l-[3px] border-amber-500 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-widest">
                <NoteIcon className="w-3 h-3" />
                <span>Kitchen Instructions</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {order.notes.split(",").map(n => n.trim()).filter(Boolean).map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 ring-1 ring-amber-200 dark:ring-amber-800/40">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Items Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
                Items ({totalItems})
              </span>
              {order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
                <button type="button" onClick={() => onAddMoreItems?.(order.id, order.tableId)}
                  className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-[var(--color-primary)] hover:underline cursor-pointer transition-colors">
                  <IconPlus className="w-3 h-3" />
                  <span>Add Items</span>
                </button>
              )}
            </div>

            <div className="rounded-lg border border-[var(--color-border)]/60 divide-y divide-[var(--color-border)]/40 bg-[var(--color-background)] overflow-hidden">
              {order.items.map((item) => {
                const tags = item.specialInstructions?.split(",").map(s => s.trim()).filter(Boolean) || [];
                return (
                  <div key={item.id} className="px-3 py-2 hover:bg-[var(--color-surface)]/60 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-medium font-mono bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex-shrink-0 shadow-xs">
                          {item.quantity}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-[var(--color-foreground)] leading-snug truncate">
                            {item.itemName}
                          </div>
                          {item.variantName && (
                            <div className="text-[10px] text-[var(--color-muted)] mt-0.5">{item.variantName}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-semibold text-[var(--color-foreground)] font-mono">
                          ₹{item.itemTotal.toLocaleString("en-IN")}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-[9px] text-[var(--color-muted)]">₹{item.unitPrice} ea</div>
                        )}
                      </div>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 pl-7">
                        {tags.map((tag, i) => (
                          <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/30">
                            <NoteIcon className="w-2 h-2" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bill Summary */}
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 space-y-1 shadow-xs">
            <div className="flex justify-between text-[11px] text-[var(--color-muted)]">
              <span>Subtotal</span>
              <span className="font-mono">₹{order.subtotal.toLocaleString("en-IN")}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-[11px] text-emerald-600 font-medium">
                <span>Discount</span>
                <span className="font-mono">-₹{order.discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px] text-[var(--color-muted)]">
              <span>Tax (5%)</span>
              <span className="font-mono">₹{order.tax.toLocaleString("en-IN")}</span>
            </div>
            <div className="pt-1.5 mt-1 border-t border-[var(--color-border)]/40 flex justify-between items-center">
              <span className="text-xs font-semibold text-[var(--color-foreground)]">Total</span>
              <span className="text-sm font-semibold text-[var(--color-primary)] font-mono">
                ₹{order.total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* ━━━ Payment Settlement ━━━ */}
          <div className="rounded-lg border border-[var(--color-border)]/70 bg-[var(--color-surface)] p-3 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1 h-3 rounded-full bg-[var(--color-primary)]" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-foreground)]">
                  Payment Settle
                </span>
              </div>

              {order.paymentStatus === "PAID" ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Paid via {order.paymentMethod || "UPI"}</span>
                </span>
              ) : order.paymentStatus === "PENDING_VERIFICATION" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10.5px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  <span>⚠️ Needs Verification</span>
                </span>
              ) : order.paymentStatus === "PAYMENT_REJECTED" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10.5px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Payment Rejected</span>
                </span>
              ) : order.paymentMethod === "CASH" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10.5px] font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  <CashIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Cash at Counter (₹{order.total.toLocaleString("en-IN")})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10.5px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>₹{order.total.toLocaleString("en-IN")} Due</span>
                </span>
              )}
            </div>

            {/* Cash at Counter Notice & One-Click Settle for Staff */}
            {order.paymentStatus === "UNPAID" && order.paymentMethod === "CASH" && (
              <div className="p-3 rounded-lg border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-950/20 space-y-2">
                <div className="flex items-start gap-2">
                  <CashIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-amber-950 dark:text-amber-200">
                      Customer Paying Cash at Counter
                    </div>
                    <div className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-snug">
                      Collect ₹{order.total.toLocaleString("en-IN")} at register or table, then confirm.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isUpdatingPayment}
                  onClick={() => handlePayment("PAID", "CASH")}
                  className="w-full h-8 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <IconCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Collect ₹{order.total.toLocaleString("en-IN")} Cash &amp; Mark Paid</span>
                </button>
              </div>
            )}

            {/* Verification Alert Banner for Staff */}
            {order.paymentStatus === "PENDING_VERIFICATION" && (
              <div className="p-3 rounded-lg border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-950/20 space-y-2.5">
                <div className="flex items-start gap-2">
                  <IconAlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                      Customer Reported UPI Payment Sent
                    </div>
                    <div className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-snug">
                      Check your UPI merchant app / soundbox / bank notification for ₹{order.total.toLocaleString("en-IN")}.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    disabled={isUpdatingPayment}
                    onClick={() => handlePayment("PAID", "UPI")}
                    className="h-8 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <IconCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Confirm Payment</span>
                  </button>
                  <button
                    type="button"
                    disabled={isUpdatingPayment}
                    onClick={() => handlePayment("PAYMENT_REJECTED", "UPI")}
                    className="h-8 px-2.5 rounded-md bg-rose-600/15 hover:bg-rose-600/25 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <IconX className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            )}

            {/* Rejected Info & Recovery */}
            {order.paymentStatus === "PAYMENT_REJECTED" && (
              <div className="p-2.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/20 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-medium text-[11px]">
                  <IconAlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Payment rejected. Customer must pay cash at counter or retry UPI.</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isUpdatingPayment}
                    onClick={() => handlePayment("PAID", "CASH")}
                    className="h-7 px-2.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] font-medium text-[var(--color-foreground)] hover:bg-[var(--color-background)] transition-colors cursor-pointer"
                  >
                    Mark Paid (Cash)
                  </button>
                  <button
                    type="button"
                    disabled={isUpdatingPayment}
                    onClick={() => handlePayment("PAID", "UPI")}
                    className="h-7 px-2.5 rounded-md bg-emerald-600 text-white text-[11px] font-medium hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    Confirm (UPI Received)
                  </button>
                </div>
              </div>
            )}

            {/* Regular Unpaid Settlements (Cash / UPI / Card) */}
            {order.paymentStatus === "UNPAID" && (
              <div className="grid grid-cols-3 gap-2">
                {([
                  { method: "CASH" as PaymentMethod, label: "Cash (Counter)", Icon: CashIcon },
                  { method: "UPI" as PaymentMethod, label: "UPI Pay", Icon: UpiIcon },
                  { method: "CARD" as PaymentMethod, label: "Card", Icon: CardIcon },
                ] as const).map(({ method, label, Icon }) => (
                  <button
                    key={method}
                    type="button"
                    disabled={isUpdatingPayment}
                    onClick={() => handlePayment("PAID", method)}
                    className="group relative h-9 px-2 rounded-md border border-[var(--color-border)]/80 bg-[var(--color-background)] hover:bg-[var(--color-surface)] hover:border-[var(--color-foreground)]/30 hover:shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                  >
                    <Icon className="w-3.5 h-3.5 text-[var(--color-muted)] group-hover:text-[var(--color-foreground)] transition-colors shrink-0" />
                    <span className="text-[11.5px] font-medium text-[var(--color-foreground)] tracking-tight">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {order.paymentStatus === "PAID" && (
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--color-border)]/40 px-0.5">
                <span className="text-[var(--color-muted)] text-[10.5px]">
                  Recorded ₹{order.total.toLocaleString("en-IN")} via {order.paymentMethod || "UPI"}
                </span>
                <button
                  type="button"
                  disabled={isUpdatingPayment}
                  onClick={() => handlePayment("UNPAID")}
                  className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)] hover:text-rose-600 cursor-pointer transition-colors"
                >
                  Reset Unpaid
                </button>
              </div>
            )}
          </div>

          {/* Table Release */}
          {order.orderType === "DINE_IN" && order.tableId && order.status === "COMPLETED" && (
            <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-[var(--color-border)]/60 px-3 py-2 flex items-center justify-between gap-2 shadow-xs">
              <div>
                <div className="text-[11px] font-medium text-[var(--color-foreground)]">
                  {order.tableNameSnapshot || "Assigned Table"}
                </div>
                <div className="text-[10px] text-[var(--color-muted)]">Clear for next guests</div>
              </div>
              <button type="button" disabled={isReleasingTable} onClick={handleVacate}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[10.5px] font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-all cursor-pointer active:scale-[0.97] shadow-xs">
                {isReleasingTable ? <IconLoader2 className="w-3.5 h-3.5 animate-spin" /> : <IconDoorExit className="w-3.5 h-3.5" />}
                <span>Vacate</span>
              </button>
            </div>
          )}

          {/* ━━━ Order Journey ━━━ */}
          <div className="rounded-lg border border-[var(--color-border)]/70 bg-[var(--color-surface)] p-3 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <IconClock className="w-3.5 h-3.5 text-[var(--color-muted)]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-foreground)]">
                  Order Journey
                </span>
                <span className="text-[10px] text-[var(--color-muted)]/60 font-medium">
                  • {formatDate(order.createdAt)}
                </span>
              </div>

              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9.5px] font-medium bg-[var(--color-background)] border border-[var(--color-border)]/60 text-[var(--color-muted)]">
                {order.status === "COMPLETED"
                  ? order.completedAt && order.createdAt
                    ? `${Math.max(1, Math.round((new Date(order.completedAt).getTime() - new Date(order.createdAt).getTime()) / 60000))}m total`
                    : "Completed"
                  : elapsed}
              </span>
            </div>

            {/* Minimalist 5-Stage Stepper */}
            <div className="relative pt-1 pb-0.5">
              {/* Stepper Base Line */}
              <div className="absolute top-[9px] left-[10%] right-[10%] h-[1.5px] bg-[var(--color-border)]/60 -z-0" />

              {/* Progress Track Line */}
              {(() => {
                const orderSteps = ["NEW", "PREPARING", "READY", "SERVED", "COMPLETED"];
                const currentIdx = orderSteps.indexOf(order.status);
                if (currentIdx <= 0) return null;
                const pct = (Math.min(currentIdx, 4) / 4) * 80;
                return (
                  <div
                    className="absolute top-[9px] left-[10%] h-[1.5px] bg-neutral-900 dark:bg-neutral-100 transition-all duration-500 -z-0"
                    style={{ width: `${pct}%` }}
                  />
                );
              })()}

              <div className="grid grid-cols-5 relative z-10">
                {[
                  {
                    key: "NEW",
                    label: "Placed",
                    time: order.createdAt,
                    stepIndex: 0,
                  },
                  {
                    key: "PREPARING",
                    label: "Kitchen",
                    time: order.preparingAt,
                    stepIndex: 1,
                  },
                  {
                    key: "READY",
                    label: "Ready",
                    time: order.readyAt,
                    stepIndex: 2,
                  },
                  {
                    key: "SERVED",
                    label: order.orderType === "DINE_IN" ? "Served" : "Handover",
                    time: order.servedAt,
                    stepIndex: 3,
                  },
                  {
                    key: "COMPLETED",
                    label: "Done",
                    time: order.completedAt,
                    stepIndex: 4,
                  },
                ].map((step) => {
                  const orderSteps = ["NEW", "PREPARING", "READY", "SERVED", "COMPLETED"];
                  const currentIdx = orderSteps.indexOf(order.status);
                  const isDone = order.status === "COMPLETED" ? true : step.stepIndex < currentIdx;
                  const isCurrent = order.status === "COMPLETED" ? false : step.stepIndex === currentIdx;

                  return (
                    <div key={step.key} className="flex flex-col items-center text-center">
                      {/* Node Dot */}
                      <div
                        className={`w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all bg-[var(--color-surface)] ${
                          isCurrent
                            ? "border-2 border-[var(--color-primary)] ring-3 ring-[var(--color-primary)]/15 shadow-xs"
                            : isDone
                            ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-2xs"
                            : "border border-[var(--color-border)]"
                        }`}
                      >
                        {isCurrent ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
                        ) : isDone ? (
                          <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2.5 6.2L4.8 8.5L9.5 3.5"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
                        )}
                      </div>

                      {/* Step Title */}
                      <span
                        className={`text-[9.5px] uppercase tracking-wider font-medium mt-1.5 leading-none transition-colors ${
                          isCurrent
                            ? "text-[var(--color-primary)] font-semibold"
                            : isDone
                            ? "text-[var(--color-foreground)]"
                            : "text-[var(--color-muted)]/50"
                        }`}
                      >
                        {step.label}
                      </span>

                      {/* Step Time */}
                      <span
                        className={`text-[9px] font-mono mt-1 leading-none tracking-tight transition-colors ${
                          step.time
                            ? isCurrent
                              ? "text-[var(--color-foreground)] font-semibold"
                              : "text-[var(--color-muted)]"
                            : "text-[var(--color-muted)]/30"
                        }`}
                      >
                        {step.time ? format12h(step.time).toLowerCase() : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ━━━ Bottom Action Bar ━━━ */}
        <div className="px-4 py-3 border-t border-[var(--color-border)]/40 bg-[var(--color-surface)] flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            {order.status === "PREPARING" && (
              <button type="button" disabled={isUpdatingStatus} onClick={() => handleAdvance("NEW")}
                className="p-2 rounded-md border border-[var(--color-border)]/60 hover:bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-all cursor-pointer shadow-xs" title="Back to New">
                <IconRotateClockwise2 className="w-4 h-4" />
              </button>
            )}
            {order.status === "READY" && (
              <button type="button" disabled={isUpdatingStatus} onClick={() => handleAdvance("PREPARING")}
                className="p-2 rounded-md border border-[var(--color-border)]/60 hover:bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-all cursor-pointer shadow-xs" title="Back to Preparing">
                <IconRotateClockwise2 className="w-4 h-4" />
              </button>
            )}
            {order.status === "SERVED" && (
              <button type="button" disabled={isUpdatingStatus} onClick={() => handleAdvance("READY")}
                className="p-2 rounded-md border border-[var(--color-border)]/60 hover:bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-all cursor-pointer shadow-xs" title="Back to Ready">
                <IconRotateClockwise2 className="w-4 h-4" />
              </button>
            )}
            {order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
              <button type="button" disabled={isUpdatingStatus} onClick={() => setIsCancelModalOpen(true)}
                className="p-2 rounded-md border border-rose-200/60 dark:border-rose-900/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer shadow-xs" title="Cancel order">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="8" y1="8" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          {/* Primary Action */}
          {order.status === "NEW" && (
            <button type="button" disabled={isUpdatingStatus} onClick={() => handleAdvance("PREPARING")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-xs cursor-pointer active:scale-[0.98]">
              {isUpdatingStatus ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <AnimatedFlameIcon className="w-4 h-4" />}
              <span>Start Preparing</span>
            </button>
          )}
          {order.status === "PREPARING" && (
            <button type="button" disabled={isUpdatingStatus} onClick={() => handleAdvance("READY")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 transition-all shadow-xs cursor-pointer active:scale-[0.98]">
              {isUpdatingStatus ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <AnimatedBellIcon className="w-4 h-4" />}
              <span>Mark Ready</span>
            </button>
          )}
          {order.status === "READY" && (
            <button
              type="button"
              disabled={isUpdatingStatus}
              onClick={() => handleAdvance(order.orderType === "DINE_IN" ? "SERVED" : "COMPLETED")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium text-white shadow-xs cursor-pointer active:scale-[0.98] transition-all ${
                order.orderType === "DINE_IN"
                  ? "bg-teal-600 hover:bg-teal-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {isUpdatingStatus ? (
                <IconLoader2 className="w-4 h-4 animate-spin" />
              ) : order.orderType === "DINE_IN" ? (
                <IconArmchair className="w-4 h-4" />
              ) : (
                <IconShoppingBag className="w-4 h-4" />
              )}
              <span>{order.orderType === "DINE_IN" ? "Serve to Table" : "Handover Order"}</span>
            </button>
          )}
          {order.status === "SERVED" && (
            <button type="button" disabled={isUpdatingStatus} onClick={() => handleAdvance("COMPLETED")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xs cursor-pointer active:scale-[0.98]">
              {isUpdatingStatus ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconChecks className="w-4 h-4" />}
              <span>Complete Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-5 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-600">
              <IconAlertTriangle className="w-4 h-4" />
              <h3 className="font-semibold text-sm text-[var(--color-foreground)]">Cancel {order.orderNumber}</h3>
            </div>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              This order will be removed from the live board and marked as cancelled.
            </p>
            <div>
              <label className="block text-[10px] font-medium text-[var(--color-muted)] mb-1 uppercase tracking-wider">
                Reason (optional)
              </label>
              <input type="text" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer changed mind..."
                className="w-full px-3 py-2 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-1 focus:ring-rose-500 shadow-xs" />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={() => setIsCancelModalOpen(false)}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-background)] cursor-pointer shadow-xs">
                Keep Order
              </button>
              <button type="button" disabled={isUpdatingStatus} onClick={handleCancelSubmit}
                className="px-4 py-1.5 rounded-md text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 cursor-pointer shadow-xs">
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
