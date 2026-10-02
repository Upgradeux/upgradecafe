"use client";

import React from "react";
import {
  IconPrinter,
  IconX,
  IconReceipt,
} from "@tabler/icons-react";
import type { OrderWithItems } from "@/features/cafe/orders/types";
import type { Cafe } from "@/lib/db/schema/cafes";

interface ThermalReceiptModalProps {
  isOpen: boolean;
  order: OrderWithItems;
  cafe?: Cafe;
  cafeName?: string;
  cafeAddress?: string;
  isPreBill?: boolean;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  order,
  cafe,
  cafeName,
  cafeAddress = "Artisanal Roastery & Café",
  isPreBill = false,
  onClose,
}) => {
  if (!isOpen || !order) return null;

  const resolvedCafeName = cafeName || cafe?.name || "UpgradeCafé";

  const handlePrint = () => {
    window.print();
  };

  const discount = order.discount || 0;
  const taxableSubtotal = Math.max(0, order.subtotal - discount);
  const cgst = Math.round(taxableSubtotal * 0.025);
  const sgst = Math.round(taxableSubtotal * 0.025);

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedTime = new Date(order.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #thermal-receipt-container,
          #thermal-receipt-container * {
            visibility: visible;
          }
          #thermal-receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 4mm;
            margin: 0;
            background: white !important;
            color: black !important;
            font-family: "Courier New", Courier, monospace !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      <div className="w-full max-w-sm rounded-lg bg-[var(--color-surface,#FFFFFF)] border border-[var(--color-border,#E7E4DD)] shadow-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-4 py-2.5 border-b border-[var(--color-border,#E7E4DD)] flex items-center justify-between bg-[var(--color-surface,#FFFFFF)] print:hidden">
          <div className="flex items-center gap-2">
            <IconReceipt className="w-4 h-4 text-[var(--color-primary,#8B5E3C)]" />
            <span className="text-xs font-semibold text-[var(--color-foreground,#242321)]">
              {isPreBill ? "Pre-Bill / Guest Check" : "Thermal Receipt (80mm)"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-muted,#73716B)] hover:text-[var(--color-foreground,#242321)] hover:bg-[var(--color-background,#F7F6F2)] transition-colors"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-4 overflow-y-auto flex-1 bg-[var(--color-background,#F7F6F2)] flex justify-center">
          {/* Printable 80mm Thermal Receipt Ticket */}
          <div
            id="thermal-receipt-container"
            className="w-full max-w-[280px] bg-white border border-[var(--color-border,#E7E4DD)] shadow-xs p-4 text-[#242321] font-mono text-xs space-y-3"
          >
            {/* Café Header */}
            <div className="text-center space-y-0.5 border-b border-dashed border-[var(--color-border,#E7E4DD)] pb-3">
              <h2 className="text-sm font-bold tracking-tight uppercase">
                {resolvedCafeName}
              </h2>
              <p className="text-[10px] text-[var(--color-muted,#73716B)]">{cafeAddress}</p>
              <div className="text-[10px] font-semibold mt-1 text-[var(--color-primary,#8B5E3C)]">
                {isPreBill ? "*** GUEST CHECK ***" : "TAX INVOICE / RECEIPT"}
              </div>
            </div>

            {/* Order & Metadata */}
            <div className="text-[10px] space-y-0.5 border-b border-dashed border-[#E7E4DD] pb-2 text-[#73716B]">
              <div className="flex justify-between">
                <span>Receipt:</span>
                <span className="font-bold text-[#242321]">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span>
                  {formattedDate} {formattedTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-semibold text-[#242321]">
                  {order.orderType === "DINE_IN"
                    ? `Dine-in (${order.tableNameSnapshot || "Table"})`
                    : "Takeaway"}
                </span>
              </div>
              {order.customerName && order.customerName !== "Walk-in Guest" && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{order.customerName}</span>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="space-y-1.5 border-b border-dashed border-[#E7E4DD] pb-2 text-[11px]">
              <div className="flex justify-between font-bold text-[10px] uppercase text-[#73716B] pb-0.5">
                <span>Item</span>
                <span className="text-right">Amt</span>
              </div>
              {order.items.map((item) => (
                <div key={item.id} className="space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-[#242321] truncate max-w-[170px]">
                      {item.itemName}
                    </span>
                    <span className="font-bold text-right text-[#242321]">
                      ₹{item.itemTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-[#73716B]">
                    <span>
                      {item.quantity} x ₹{item.unitPrice}
                    </span>
                    {item.specialInstructions && (
                      <span className="italic truncate max-w-[130px]">
                        {item.specialInstructions}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-[#E7E4DD] pb-2">
              <div className="flex justify-between text-[#73716B]">
                <span>Subtotal:</span>
                <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#B65D54]">
                  <span>Discount:</span>
                  <span>- ₹{discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-[#73716B] text-[10px]">
                <span>CGST (2.5%):</span>
                <span>₹{cgst.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-[#73716B] text-[10px]">
                <span>SGST (2.5%):</span>
                <span>₹{sgst.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-baseline text-sm font-bold pt-1 border-t border-[#E7E4DD]">
                <span>TOTAL:</span>
                <span>₹{order.total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="text-[10px] space-y-0.5 border-b border-dashed border-[#E7E4DD] pb-2">
              <div className="flex justify-between">
                <span>Tender Mode:</span>
                <span className="font-bold">{order.paymentMethod || "UNPAID"}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <span className="font-bold">{order.paymentStatus}</span>
              </div>
            </div>

            {/* Footer Message */}
            <div className="text-center text-[10px] text-[#73716B] space-y-0.5 pt-1">
              <p>Thank you for visiting {resolvedCafeName}!</p>
              <p className="text-[9px]">Powered by UpgradeCafé POS</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3 border-t border-[var(--color-border,#E7E4DD)] bg-[var(--color-surface,#FFFFFF)] flex items-center justify-end gap-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-[var(--color-border,#E7E4DD)] text-xs font-medium text-[var(--color-muted,#73716B)] hover:bg-[var(--color-background,#F7F6F2)] transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-md bg-[var(--color-primary,#8B5E3C)] hover:bg-[var(--color-primary-hover,#754C30)] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <IconPrinter className="w-4 h-4" />
            <span>Print 80mm Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
