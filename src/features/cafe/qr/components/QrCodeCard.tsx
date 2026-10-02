"use client";

import React, { useState } from "react";
import { Table } from "@/lib/db/schema/tables";
import {
  IconPrinter,
  IconExternalLink,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react";
import { useToast } from "@/components/ui/Toast";
import { QrCustomizerConfig, QR_THEME_PRESETS } from "../types";
import { generatePrintHtml } from "../utils/print-template";

interface QrCodeCardProps {
  table: Table;
  cafeSlug: string;
  cafeName: string;
  config: QrCustomizerConfig;
}

export const QrCodeCard: React.FC<QrCodeCardProps> = ({
  table,
  cafeSlug,
  cafeName,
  config,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const preset = QR_THEME_PRESETS[config.preset] || QR_THEME_PRESETS.roast;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicMenuUrl = `${origin}/menu/${cafeSlug}?table=${encodeURIComponent(
    table.tableNumber
  )}&qr=${table.qrIdentifier}`;

  // Crisp QR code with color matched to selected theme preset
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    publicMenuUrl
  )}&bgcolor=FFFFFF&color=${preset.qrColor}&margin=1`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicMenuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Table Link Copied",
        description: `Direct menu URL for ${table.tableNumber} copied to clipboard.`,
        variant: "info",
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Unable to copy URL to clipboard.",
        variant: "danger",
      });
    }
  };

  const handlePrintSingle = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = generatePrintHtml(
      [table],
      cafeName,
      cafeSlug,
      config,
      origin
    );
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div
      className="w-full max-w-[340px] mx-auto rounded-lg border shadow-xs transition-all duration-150 flex flex-col justify-between overflow-hidden"
      style={{
        backgroundColor: preset.cardBg,
        borderColor: preset.borderColor,
      }}
    >
      {/* Table Stand Content */}
      <div className="p-4 sm:p-5 flex flex-col items-center text-center">
        {/* Brand Eyebrow */}
        <div
          className="text-[10px] font-medium uppercase tracking-[0.2em] line-clamp-1"
          style={{ color: preset.primaryColor }}
        >
          {cafeName}
        </div>

        {/* Table Title & Seat Pill */}
        <div className="flex items-center justify-center gap-2 mt-1.5 max-w-full px-2">
          <h3
            className="text-base font-medium tracking-tight truncate"
            style={{ color: preset.textColor }}
            title={table.tableNumber}
          >
            {table.tableNumber}
          </h3>
          {config.showSeats && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-md flex-shrink-0"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.05)",
                color: preset.mutedColor,
              }}
            >
              {table.capacity} Seats
            </span>
          )}
        </div>

        {/* Invitation Subtitle */}
        <p
          className="text-[11px] max-w-[220px] mx-auto truncate mt-1 leading-normal"
          style={{ color: preset.mutedColor }}
          title={config.subtitle}
        >
          {config.subtitle}
        </p>

        {/* Crisp QR Code Container */}
        <div
          className="relative my-3 p-2 bg-white rounded-md border inline-block"
          style={{ borderColor: preset.borderColor }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageUrl}
            alt={`QR Code for ${table.tableNumber}`}
            width={130}
            height={130}
            className="w-32 h-32 object-contain block rounded"
            loading="lazy"
          />

          {config.centerLogo !== "none" && (
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-md bg-white border flex items-center justify-center overflow-hidden shadow-xs"
              style={{ borderColor: preset.primaryColor }}
            >
              {config.centerLogo === "brand" ? (
                config.cafeLogoKey ? (
                  <img
                    src={config.cafeLogoKey}
                    alt={cafeName}
                    className="w-full h-full object-contain p-0.5"
                  />
                ) : (
                  <span
                    className="text-[10px] font-semibold uppercase"
                    style={{ color: preset.primaryColor }}
                  >
                    {cafeName.substring(0, 2).toUpperCase()}
                  </span>
                )
              ) : (
                <span
                  className="text-[10px] font-semibold uppercase"
                  style={{ color: preset.primaryColor }}
                >
                  {config.customInitials || cafeName.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Scan & Wi-Fi Micro Footnote */}
        <div
          className="flex items-center justify-center gap-1.5 text-[10px] font-medium max-w-full px-2"
          style={{ color: preset.mutedColor }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: preset.primaryColor }}
          />
          <span
            className="font-medium uppercase tracking-wider text-[9px] flex-shrink-0"
            style={{ color: preset.primaryColor }}
          >
            {config.scanPrompt || "Point camera to order"}
          </span>
          {config.showWifi && config.wifiText && (
            <>
              <span className="text-neutral-300">•</span>
              <span className="truncate max-w-[120px] font-normal">{config.wifiText}</span>
            </>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div
        className="px-3 py-2 border-t flex items-center justify-between gap-2"
        style={{
          borderColor: preset.borderColor,
          backgroundColor: "rgba(255, 255, 255, 0.45)",
        }}
      >
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleCopyUrl}
            title="Copy guest menu link"
            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-black/5 transition-colors"
          >
            {copied ? (
              <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <IconCopy className="w-3.5 h-3.5" />
            )}
          </button>

          <a
            href={publicMenuUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Preview customer menu in new tab"
            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-black/5 transition-colors inline-flex items-center"
          >
            <IconExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <button
          type="button"
          onClick={handlePrintSingle}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-white transition-opacity hover:opacity-95 shadow-xs"
          style={{ backgroundColor: preset.primaryColor }}
        >
          <IconPrinter className="w-3.5 h-3.5" />
          <span>Print Stand</span>
        </button>
      </div>
    </div>
  );
};
