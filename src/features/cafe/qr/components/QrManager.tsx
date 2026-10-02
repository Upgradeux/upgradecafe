"use client";

import React, { useState, useEffect } from "react";
import { Table } from "@/lib/db/schema/tables";
import { QrCodeCard } from "./QrCodeCard";
import { QrCustomizer } from "./QrCustomizer";
import {
  QrCustomizerConfig,
  DEFAULT_QR_CONFIG,
  QR_THEME_PRESETS,
  QrThemePresetId,
} from "../types";
import { generatePrintHtml } from "../utils/print-template";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  IconPrinter,
  IconSearch,
  IconArmchair,
  IconPlus,
} from "@tabler/icons-react";
import Link from "next/link";

interface QrManagerProps {
  cafeSlug: string;
  cafeName: string;
  tables: Table[];
  defaultPreset?: string;
  cafeLogoKey?: string | null;
}

export const QrManager: React.FC<QrManagerProps> = ({
  cafeSlug,
  cafeName,
  tables,
  defaultPreset,
  cafeLogoKey,
}) => {
  const initialPreset: QrThemePresetId =
    defaultPreset && defaultPreset in QR_THEME_PRESETS
      ? (defaultPreset as QrThemePresetId)
      : "roast";

  const [config, setConfig] = useState<QrCustomizerConfig>({
    ...DEFAULT_QR_CONFIG,
    preset: initialPreset,
    cafeLogoKey: cafeLogoKey || null,
  });

  // Automatically update preset if default theme changes from settings
  useEffect(() => {
    if (defaultPreset && defaultPreset in QR_THEME_PRESETS) {
      setConfig((prev) => ({
        ...prev,
        preset: defaultPreset as QrThemePresetId,
      }));
    }
  }, [defaultPreset]);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredTables = tables.filter((t) =>
    t.tableNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrintAll = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const html = generatePrintHtml(
      tables,
      cafeName,
      cafeSlug,
      config,
      origin
    );

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const preset = QR_THEME_PRESETS[config.preset] || QR_THEME_PRESETS.roast;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
            Table QR Stands
          </h2>
          <p className="text-xs text-[var(--color-muted)] font-normal">
            Customizable, print-ready tabletop stands linking guests directly to their table ordering menu.
          </p>
        </div>

        {tables.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrintAll}
              className="shadow-sm font-medium"
              style={{ backgroundColor: preset.primaryColor }}
            >
              <IconPrinter className="w-3.5 h-3.5 mr-1.5" />
              <span>Print All ({tables.length}) Stands</span>
            </Button>
          </div>
        )}
      </div>

      {/* Style & Aesthetic Studio */}
      <QrCustomizer
        config={config}
        onChange={setConfig}
        cafeSlug={cafeSlug}
        cafeName={cafeName}
        onLogoUpdated={(newLogoUrl) =>
          setConfig((prev) => ({ ...prev, cafeLogoKey: newLogoUrl }))
        }
      />

      {/* Search & Stats Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by table name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<IconSearch className="w-4 h-4 text-[var(--color-muted)]" />}
          />
        </div>

        <div className="text-xs text-[var(--color-muted)] font-medium">
          Showing {filteredTables.length} of {tables.length} table stands
        </div>
      </div>

      {/* Grid of Luxury Table QR Cards */}
      {filteredTables.length === 0 ? (
        <div className="p-12 text-center rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-dashed border-[var(--color-border)]">
          <div className="inline-flex p-3 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] mb-3">
            <IconArmchair className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[var(--color-foreground)]">
            No QR codes to display
          </h3>
          <p className="text-xs text-[var(--color-muted)] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No tables match "${searchQuery}".`
              : "Add dining tables on your floor to generate unique QR codes."}
          </p>
          <Link
            href={`/cafe/${cafeSlug}/tables`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-button)] text-xs font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors mt-4"
          >
            <IconPlus className="w-3.5 h-3.5" />
            <span>Go to Floor Management</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTables.map((table) => (
            <QrCodeCard
              key={table.id}
              table={table}
              cafeSlug={cafeSlug}
              cafeName={cafeName}
              config={config}
            />
          ))}
        </div>
      )}
    </div>
  );
};
