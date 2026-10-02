"use client";

import React, { useState, useRef } from "react";
import {
  QrCustomizerConfig,
  QR_THEME_PRESETS,
  QrStandFormat,
  CenterLogoType,
} from "../types";
import {
  IconArmchair,
  IconWifi,
  IconAdjustmentsHorizontal,
  IconX,
  IconUpload,
  IconPhoto,
  IconLetterCase,
  IconBan,
  IconLoader2,
} from "@tabler/icons-react";
import { useToast } from "@/components/ui/Toast";

interface QrCustomizerProps {
  config: QrCustomizerConfig;
  onChange: (updated: QrCustomizerConfig) => void;
  cafeSlug: string;
  cafeName: string;
  onLogoUpdated?: (newLogoUrl: string | null) => void;
}

export const QrCustomizer: React.FC<QrCustomizerProps> = ({
  config,
  onChange,
  cafeSlug,
  cafeName,
  onLogoUpdated,
}) => {
  const { toast } = useToast();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presets = Object.values(QR_THEME_PRESETS);

  const subtitlePresets = [
    "Scan to browse digital menu & place order",
    "Digital menu & contactless table ordering",
    "Welcome! Scan to view today's specialties",
    "Scan for contactless menu & easy billing",
  ];

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);

    setIsUploading(true);
    try {
      const res = await fetch(`/api/cafe/${cafeSlug}/logo`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to upload logo.");
      }

      const newLogoUrl = json.data.logoKey;
      onChange({
        ...config,
        cafeLogoKey: newLogoUrl,
        centerLogo: "brand",
      });
      if (onLogoUpdated) onLogoUpdated(newLogoUrl);

      toast({
        title: "Logo Updated",
        description: "Café brand logo updated across your profile and QR stands.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to upload logo.",
        variant: "danger",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {/* Sleek Minimal Toolbar */}
      <div className="p-2.5 sm:p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Style Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] select-none">
            Style:
          </span>
          <div className="inline-flex p-0.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border-subtle)] gap-0.5">
            {presets.map((p) => {
              const isSelected = config.preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange({ ...config, preset: p.id })}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    isSelected
                      ? "bg-[var(--color-surface)] text-[var(--color-foreground)] font-medium shadow-xs"
                      : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                    style={{ backgroundColor: p.primaryColor }}
                  />
                  <span className="whitespace-nowrap">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Format, Toggles & Customize Button */}
        <div className="flex items-center gap-3 flex-wrap ml-auto">
          {/* Format Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] select-none">
              Format:
            </span>
            <div className="inline-flex p-0.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border-subtle)] gap-0.5">
              {[
                { id: "acrylic", label: "Acrylic" },
                { id: "tent", label: "Folded Tent" },
                { id: "coaster", label: "Coaster" },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() =>
                    onChange({ ...config, standFormat: fmt.id as QrStandFormat })
                  }
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                    config.standFormat === fmt.id
                      ? "bg-[var(--color-surface)] text-[var(--color-foreground)] font-semibold shadow-xs"
                      : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Display Toggles */}
          <div className="flex items-center gap-2.5 border-l border-[var(--color-border-subtle)] pl-3">
            <label className="inline-flex items-center gap-1 cursor-pointer select-none text-xs text-[var(--color-foreground)]">
              <input
                type="checkbox"
                checked={config.showSeats}
                onChange={(e) => onChange({ ...config, showSeats: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-0"
              />
              <IconArmchair className="w-3.5 h-3.5 text-[var(--color-muted)]" />
              <span className="text-[11px] font-medium">Seats</span>
            </label>

            <label className="inline-flex items-center gap-1 cursor-pointer select-none text-xs text-[var(--color-foreground)]">
              <input
                type="checkbox"
                checked={config.showWifi}
                onChange={(e) => onChange({ ...config, showWifi: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-0"
              />
              <IconWifi className="w-3.5 h-3.5 text-[var(--color-muted)]" />
              <span className="text-[11px] font-medium">Wi-Fi</span>
            </label>
          </div>

          {/* Edit Text & Logo Button */}
          <button
            type="button"
            onClick={() => setIsEditorOpen(!isEditorOpen)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors border shadow-xs ${
              isEditorOpen
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                : "bg-[var(--color-surface)] text-[var(--color-foreground)] border-[var(--color-border)] hover:bg-[var(--color-border-subtle)]"
            }`}
          >
            <IconAdjustmentsHorizontal className="w-3.5 h-3.5" />
            <span>Customize Text & Logo</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input for Logo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleLogoUpload}
        className="hidden"
      />

      {/* Clean Customizer Drawer */}
      {isEditorOpen && (
        <div className="p-4 sm:p-5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-4 text-xs animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
            <div>
              <h3 className="font-medium text-xs text-[var(--color-foreground)]">
                Table Stand Brand Logo & Content
              </h3>
              <p className="text-[11px] text-[var(--color-muted)] font-normal">
                Use your official café logo or initials. Updating the logo syncs with your profile & Super Admin overview.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditorOpen(false)}
              className="p-1 rounded-md text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Center Brand Logo Controls */}
            <div className="space-y-3">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">
                QR Center Emblem:
              </label>

              {/* Mode Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ ...config, centerLogo: "brand" })}
                  className={`p-2.5 rounded-md border text-center transition-colors flex flex-col items-center justify-center gap-1 ${
                    config.centerLogo === "brand"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium shadow-xs"
                      : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)]/40 text-[var(--color-foreground)]"
                  }`}
                >
                  <IconPhoto className="w-4 h-4" />
                  <span className="text-xs">Café Logo</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChange({ ...config, centerLogo: "initials" })}
                  className={`p-2.5 rounded-md border text-center transition-colors flex flex-col items-center justify-center gap-1 ${
                    config.centerLogo === "initials"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium shadow-xs"
                      : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)]/40 text-[var(--color-foreground)]"
                  }`}
                >
                  <IconLetterCase className="w-4 h-4" />
                  <span className="text-xs">Monogram</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChange({ ...config, centerLogo: "none" })}
                  className={`p-2.5 rounded-md border text-center transition-colors flex flex-col items-center justify-center gap-1 ${
                    config.centerLogo === "none"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium shadow-xs"
                      : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)]/40 text-[var(--color-foreground)]"
                  }`}
                >
                  <IconBan className="w-4 h-4" />
                  <span className="text-xs">No Logo</span>
                </button>
              </div>

              {/* Brand Logo Upload / Preview Card */}
              {config.centerLogo === "brand" && (
                <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-[var(--color-border)] p-1 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs">
                      {config.cafeLogoKey ? (
                        <img
                          src={config.cafeLogoKey}
                          alt={cafeName}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-[var(--color-primary)]">
                          {cafeName.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-xs text-[var(--color-foreground)]">
                        {config.cafeLogoKey ? "Active Profile Logo" : "Default Monogram Logo"}
                      </div>
                      <div className="text-[10px] text-[var(--color-muted)]">
                        {config.cafeLogoKey
                          ? "Synced with café profile & Super Admin"
                          : "Upload a custom PNG/SVG logo for your brand"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-border-subtle)] text-[var(--color-foreground)] flex items-center gap-1.5 transition-colors flex-shrink-0 shadow-xs"
                  >
                    {isUploading ? (
                      <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <IconUpload className="w-3.5 h-3.5" />
                    )}
                    <span>{config.cafeLogoKey ? "Replace Logo" : "Upload Logo"}</span>
                  </button>
                </div>
              )}

              {/* Monogram Initials Input */}
              {config.centerLogo === "initials" && (
                <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] flex items-center gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-[var(--color-muted)] mb-1">
                      Café Initials (1-3 letters):
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={config.customInitials}
                      onChange={(e) =>
                        onChange({ ...config, customInitials: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g. RB"
                      className="w-24 px-2.5 py-1 text-xs uppercase font-bold rounded border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div className="text-[11px] text-[var(--color-muted)] pt-3">
                    Renders in the center of the QR code in luxury serif font.
                  </div>
                </div>
              )}
            </div>

            {/* 2. Text Content Controls */}
            <div className="space-y-3">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">
                Printed Stand Messaging:
              </label>

              {/* Subtitle Invitation */}
              <div>
                <label className="block text-[10px] font-medium text-[var(--color-muted)] mb-1">
                  Invitation Subtitle:
                </label>
                <input
                  type="text"
                  value={config.subtitle}
                  onChange={(e) => onChange({ ...config, subtitle: e.target.value })}
                  placeholder="Scan to browse digital menu & place order"
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {subtitlePresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onChange({ ...config, subtitle: preset })}
                      className="text-[10px] text-[var(--color-muted)] hover:text-[var(--color-primary)] underline decoration-dotted"
                    >
                      Preset {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scan Prompt & Wi-Fi */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--color-muted)] mb-1">
                    Scan Prompt:
                  </label>
                  <input
                    type="text"
                    value={config.scanPrompt}
                    onChange={(e) => onChange({ ...config, scanPrompt: e.target.value })}
                    placeholder="Point camera to order"
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[var(--color-muted)] mb-1">
                    Wi-Fi Note:
                  </label>
                  <input
                    type="text"
                    value={config.wifiText}
                    onChange={(e) => onChange({ ...config, wifiText: e.target.value })}
                    placeholder="Complimentary Guest Wi-Fi"
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
