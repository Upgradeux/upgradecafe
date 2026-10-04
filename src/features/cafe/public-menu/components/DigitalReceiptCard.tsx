"use client";

import React, { useMemo } from "react";
import type { OrderWithItems } from "@/features/cafe/orders/types";
import type { Cafe } from "@/lib/db/schema/cafes";
import type { Table } from "@/lib/db/schema/tables";
import type { CafeSetting } from "@/lib/db/schema/cafe-settings";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import { getTypographyPreset } from "@/lib/theme/font-presets";
import { BarcodeCode128 } from "@/lib/barcode/BarcodeCode128";
import { generateReceiptToken } from "@/features/cafe/orders/utils/receipt-token";
import { useToast } from "@/components/ui/Toast";
import { IconArmchair, IconShoppingBag, IconCheck, IconX, IconCopy } from "@tabler/icons-react";

interface DigitalReceiptCardProps {
  order: OrderWithItems;
  cafe: Cafe;
  table?: Table | null;
  tableParamName?: string | null;
  settings?: CafeSetting | null;
  digitalMenuTheme?: string;
  className?: string;
}

/**
 * Generates an SVG zigzag path for realistic torn paper receipt edges.
 */
function generateZigzagPath(teethCount: number, toothWidth: number, toothHeight: number, isBottom: boolean): string {
  const totalWidth = teethCount * toothWidth;
  let d = isBottom ? `M 0,0` : `M 0,${toothHeight}`;

  for (let i = 0; i < teethCount; i++) {
    const xMid = i * toothWidth + toothWidth / 2;
    const xEnd = (i + 1) * toothWidth;
    if (isBottom) {
      d += ` L ${xMid},${toothHeight} L ${xEnd},0`;
    } else {
      d += ` L ${xMid},0 L ${xEnd},${toothHeight}`;
    }
  }

  if (isBottom) {
    d += ` L ${totalWidth},0 Z`;
  } else {
    d += ` L ${totalWidth},${toothHeight} Z`;
  }

  return d;
}

export const DigitalReceiptCard: React.FC<DigitalReceiptCardProps> = ({
  order,
  cafe,
  table,
  tableParamName,
  settings,
  digitalMenuTheme,
  className = "",
}) => {
  const { toast } = useToast();
  const visualTheme = getDigitalMenuVisualTheme(digitalMenuTheme || settings?.digitalMenuTheme || "roast");
  const typography = getTypographyPreset(settings?.fontFamily || "professional");

  // Generate real dynamic Code 128 barcode token (TRB1037A001)
  const receiptToken = useMemo(() => {
    return generateReceiptToken({
      orderId: order.id,
      orderNumber: order.orderNumber,
      cafeName: cafe.name,
      createdAt: order.createdAt,
    });
  }, [order.id, order.orderNumber, cafe.name, order.createdAt]);

  // Clean table number
  const cleanTableNum = useMemo(() => {
    const raw = table?.tableNumber || tableParamName || order.tableNameSnapshot || "";
    return raw.replace(/[^0-9]/g, "").padStart(2, "0");
  }, [table?.tableNumber, tableParamName, order.tableNameSnapshot]);

  // Format order number (e.g. "#1037")
  const formattedOrderNumber = useMemo(() => {
    const raw = String(order.orderNumber || "1001").replace(/^#+/, "");
    return `#${raw}`;
  }, [order.orderNumber]);

  // Format date & time (e.g. "29 Sept 2024, 02:37 AM")
  const formattedDate = useMemo(() => {
    const d = order.createdAt ? new Date(order.createdAt) : new Date();
    const dateStr = d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const timeStr = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateStr}, ${timeStr}`;
  }, [order.createdAt]);

  // Dynamic Tagline breakdown for top-right
  const taglineLines = useMemo(() => {
    if (cafe.description && cafe.description.length <= 40) {
      return cafe.description.split(/[·•|,\n]/).map((s) => s.trim().toUpperCase()).filter(Boolean);
    }
    return ["GOOD", "FOOD", "BRIGHTER", "DAYS"];
  }, [cafe.description]);

  // Copy receipt verification token to clipboard
  const handleCopyToken = () => {
    navigator.clipboard.writeText(receiptToken);
    toast({
      title: "Receipt Token Copied",
      description: `Reference ${receiptToken} copied to clipboard for staff scan.`,
      variant: "success",
    });
  };

  // SVG zigzag tear paths (28 teeth, width 10, height 5)
  const topZigzag = useMemo(() => generateZigzagPath(28, 10, 5, false), []);
  const bottomZigzag = useMemo(() => generateZigzagPath(28, 10, 5, true), []);

  const isTakeaway = order.orderType === "TAKEAWAY";
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className={`w-full max-w-[390px] sm:max-w-[420px] mx-auto relative ${className}`}>
      {/* Top Torn Receipt Perforation */}
      <div className="w-full h-2 overflow-hidden -mb-[1px] relative z-10">
        <svg
          viewBox="0 0 280 5"
          preserveAspectRatio="none"
          className="w-full h-full fill-[#FAF8F5] drop-shadow-[0_-1px_1px_rgba(0,0,0,0.04)]"
        >
          <path d={topZigzag} />
        </svg>
      </div>

      {/* Main Receipt Body (Warm, tactile, premium thermal paper feel) */}
      <div
        className="relative bg-[#FAF8F5] text-[#242321] px-5 sm:px-6 py-5 shadow-[0_20px_50px_rgba(0,0,0,0.14),0_6px_18px_rgba(0,0,0,0.06)] border-x border-[#EFECE6] overflow-hidden select-text"
        style={{
          fontFamily: typography.bodyFontVar,
        }}
      >
        {/* Realistic Coffee Ring Watermark on the right edge matching Image 1 */}
        <svg
          className="absolute -right-8 top-14 w-36 h-36 pointer-events-none opacity-25 select-none"
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="80" cy="80" r="62" stroke="#8C5E3C" strokeWidth="6" strokeDasharray="32 4 20 6 45 8" opacity="0.45" />
          <circle cx="80" cy="80" r="58" stroke="#8C5E3C" strokeWidth="2.5" strokeDasharray="14 8 28 4" opacity="0.35" />
          <circle cx="80" cy="80" r="66" stroke="#8C5E3C" strokeWidth="1.5" opacity="0.25" />
          <path d="M 125,45 Q 140,65 135,90" stroke="#8C5E3C" strokeWidth="4" strokeLinecap="round" opacity="0.3" filter="blur(0.5px)" />
        </svg>

        {/* 1. CAFÉ BRANDING & HEADER */}
        <div className="flex items-start justify-between gap-3 pb-3">
          <div className="space-y-1 min-w-0">
            {cafe.logoKey ? (
              <div className="flex items-center gap-2 mb-1">
                <img
                  src={
                    cafe.logoKey.startsWith("http") || cafe.logoKey.startsWith("/")
                      ? cafe.logoKey
                      : `/uploads/${cafe.logoKey}`
                  }
                  alt={cafe.name}
                  className="w-9 h-9 object-contain rounded-md"
                />
                <h1
                  className="text-lg sm:text-xl font-black tracking-tight text-[#1C1D1A] leading-tight truncate"
                  style={{ fontFamily: typography.headingFontVar }}
                >
                  {cafe.name}
                </h1>
              </div>
            ) : (
              <h1
                className="text-xl sm:text-2xl font-black tracking-tight text-[#1C1D1A] leading-tight font-serif"
                style={{ fontFamily: typography.headingFontVar }}
              >
                {cafe.name}
              </h1>
            )}

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#73716B]">
                Café & Kitchen
              </span>
              <div
                className="w-8 h-[2px] rounded-full"
                style={{ backgroundColor: visualTheme.avatarFallbackBg || "#8B5E3C" }}
              />
            </div>
          </div>

          {/* Right Tagline */}
          <div className="text-right space-y-0.5 shrink-0 pt-0.5">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8C8A84] leading-tight">
              {taglineLines.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
            <div className="text-[10px] text-[#A8A29E] tracking-widest leading-none">—</div>
          </div>
        </div>

        {/* Dashed Separator 1 */}
        <div className="border-t border-dashed border-[#D6D2C9] my-3" />

        {/* 2. ORDER INFORMATION & STATUS */}
        <div className="flex items-center justify-between gap-3 py-0.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black uppercase tracking-wider text-[#1C1D1A]">
                ORDER {formattedOrderNumber}
              </span>
            </div>
            <p className="text-[11px] text-[#73716B] font-medium">{formattedDate}</p>
            <p className="text-[11px] font-semibold text-[#1C1D1A] flex items-center gap-1">
              {isTakeaway ? (
                <>
                  <IconShoppingBag className="w-3.5 h-3.5 text-[#8C8A84]" />
                  <span>Takeaway</span>
                </>
              ) : (
                <>
                  <IconArmchair className="w-3.5 h-3.5 text-[#8C8A84]" />
                  <span>Dine-In • Table {cleanTableNum || "01"}</span>
                </>
              )}
            </p>
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-sm text-[10.5px] font-extrabold uppercase tracking-widest shadow-2xs ${
                isCancelled
                  ? "bg-rose-700 text-white"
                  : "bg-[#1C1D1A] text-white"
              }`}
            >
              {isCancelled ? (
                <>
                  <IconX className="w-3 h-3 stroke-[3]" />
                  <span>Cancelled</span>
                </>
              ) : (
                <>
                  <IconCheck className="w-3 h-3 stroke-[3]" />
                  <span>Completed</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Dashed Separator 2 */}
        <div className="border-t border-dashed border-[#D6D2C9] my-3" />

        {/* 3. ITEM TABLE (ITEM / QTY / PRICE) */}
        <div>
          {/* Table Header */}
          <div className="grid grid-cols-12 text-[10.5px] font-black uppercase tracking-[0.18em] text-[#8C8A84] pb-1.5 border-b border-black/[0.04]">
            <span className="col-span-8">ITEM</span>
            <span className="col-span-2 text-center">QTY</span>
            <span className="col-span-2 text-right">PRICE</span>
          </div>

          {/* Item Rows */}
          <div className="divide-y divide-black/[0.03] pt-0.5">
            {order.items?.map((it) => (
              <div key={it.id} className="py-2 first:pt-1 last:pb-1">
                <div className="grid grid-cols-12 items-baseline text-xs sm:text-[13px]">
                  <div className="col-span-8 pr-2">
                    <span className="font-bold text-[#1C1D1A] leading-snug block">
                      {it.itemName}
                    </span>
                    {it.preparationTimeMinutes ? (
                      <span className="text-[10.5px] text-[#73716B] block mt-0.5">
                        {it.preparationTimeMinutes} mins prep
                      </span>
                    ) : null}
                    {it.variantName && (
                      <span className="text-[10px] text-[#73716B] block">
                        Option: {it.variantName}
                      </span>
                    )}
                    {it.specialInstructions && (
                      <span className="text-[9.5px] text-amber-900 bg-amber-100/70 px-1 py-0.2 rounded-xs inline-block mt-0.5">
                        Note: {it.specialInstructions}
                      </span>
                    )}
                  </div>

                  <span className="col-span-2 text-center font-mono font-bold text-[#1C1D1A] text-xs">
                    {it.quantity}
                  </span>

                  <span className="col-span-2 text-right font-mono font-bold text-[#1C1D1A] text-xs sm:text-[13px]">
                    ₹{it.itemTotal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashed Separator 3 */}
        <div className="border-t border-dashed border-[#D6D2C9] my-3" />

        {/* 4. TOTALS BREAKDOWN */}
        <div className="space-y-1.5 text-xs sm:text-[12.5px]">
          <div className="flex justify-between text-[#73716B]">
            <span>Items Subtotal</span>
            <span className="font-mono font-semibold text-[#1C1D1A]">₹{order.subtotal || order.total}</span>
          </div>

          {order.tax ? (
            <div className="flex justify-between text-[#73716B]">
              <span>GST & Taxes</span>
              <span className="font-mono font-semibold text-[#1C1D1A]">₹{order.tax}</span>
            </div>
          ) : null}

          {order.discount ? (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Discount</span>
              <span className="font-mono">-₹{order.discount}</span>
            </div>
          ) : null}

          {/* Solid Line Divider */}
          <div className="border-t border-[#8C8A84]/40 pt-2 mt-2" />

          {/* Grand Total */}
          <div className="flex justify-between items-baseline text-sm sm:text-base">
            <span
              className="font-black uppercase tracking-tight text-[#1C1D1A]"
              style={{ fontFamily: typography.headingFontVar }}
            >
              Total Amount
            </span>
            <span className="font-mono font-black text-base sm:text-lg text-[#1C1D1A]">
              ₹{order.total?.toLocaleString("en-IN") || 0}
            </span>
          </div>
        </div>

        {/* Dashed Separator 4 */}
        <div className="border-t border-dashed border-[#D6D2C9] my-3.5" />

        {/* 5. THANK YOU & CAFE MOTTO */}
        <div className="flex items-center justify-between gap-4 py-1">
          {/* Organic Calligraphy Signature */}
          <div
            className="italic text-2xl sm:text-3xl text-[#1C1D1A] -rotate-3 select-none tracking-tight pl-1 font-serif"
            style={{ fontFamily: "'Caveat', 'Playfair Display', Georgia, cursive, serif" }}
          >
            Thank You!
          </div>

          {/* Dynamic Cafe Philosophy */}
          <div className="text-right space-y-0.5">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8C8A84] leading-tight">
              GREAT COFFEE<br />
              GOOD FOOD<br />
              BETTER COMPANY.
            </div>
            <div className="text-[9px] text-[#A8A29E] tracking-widest">—</div>
          </div>
        </div>

        {/* 6. DYNAMIC CODE 128 BARCODE */}
        <div
          onClick={handleCopyToken}
          title="Tap to copy receipt token for staff verification"
          className="pt-3 pb-1 cursor-pointer group transition-transform active:scale-98"
        >
          <BarcodeCode128
            value={receiptToken}
            height={50}
            barColor="#1C1D1A"
            textColor="#54524D"
          />
          <div className="flex items-center justify-center gap-1 text-[9.5px] text-[#8C8A84] group-hover:text-[#1C1D1A] transition-colors mt-1">
            <IconCopy className="w-2.5 h-2.5 opacity-60" />
            <span>Tap barcode to copy token</span>
          </div>
        </div>
      </div>

      {/* Bottom Torn Receipt Perforation */}
      <div className="w-full h-2 overflow-hidden -mt-[1px] relative z-10">
        <svg
          viewBox="0 0 280 5"
          preserveAspectRatio="none"
          className="w-full h-full fill-[#FAF8F5] drop-shadow-[0_1px_1px_rgba(0,0,0,0.04)]"
        >
          <path d={bottomZigzag} />
        </svg>
      </div>
    </div>
  );
};
