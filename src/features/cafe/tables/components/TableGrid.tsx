"use client";

import React from "react";
import { Table } from "@/lib/db/schema/tables";
import { TableAvatar } from "./TableAvatar";
import {
  IconArmchair,
  IconUsers,
  IconQrcode,
  IconEdit,
  IconTrash,
  IconReceipt,
  IconClock,
  IconAlertCircle,
} from "@tabler/icons-react";
import Link from "next/link";

interface TableGridProps {
  tables: Array<Table & { floorName?: string | null }>;
  cafeSlug: string;
  onEdit: (table: any) => void;
  onDelete: (table: any) => void;
  onStatusChange: (tableId: string, status: "AVAILABLE" | "OCCUPIED" | "RESERVED") => void;
}

export const TableGrid: React.FC<TableGridProps> = ({
  tables,
  cafeSlug,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  // Check if any tables have custom floors assigned
  const hasCustomFloors = tables.some((t) => !!t.floorName);

  // Group tables by floor (or single flat list if no floors exist)
  const groupedByFloor: Record<string, Array<Table & { floorName?: string | null }>> = {};
  tables.forEach((t) => {
    const floor = t.floorName || (hasCustomFloors ? "Open Dining / General" : "");
    if (!groupedByFloor[floor]) groupedByFloor[floor] = [];
    groupedByFloor[floor].push(t);
  });

  return (
    <div className="space-y-6">
      {Object.entries(groupedByFloor).map(([floorName, floorTables]) => (
        <div key={floorName || "all"} className="space-y-3">
          {/* Floor / Zone Section Header (only rendered if custom floors exist) */}
          {floorName && (
            <div className="flex items-center justify-between pb-1.5 border-b border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-foreground)]">
                  {floorName}
                </h3>
                <span className="text-[11px] text-[var(--color-muted)] font-medium">
                  ({floorTables.length} {floorTables.length === 1 ? "table" : "tables"})
                </span>
              </div>
              <div className="text-[11px] font-semibold text-[var(--color-muted)]">
                {floorTables.filter((t) => t.status === "AVAILABLE").length} available
              </div>
            </div>
          )}

          {/* Clean, Spacious Table Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {floorTables.map((table) => {
              const isOccupied = table.status === "OCCUPIED";
              const isReserved = table.status === "RESERVED";
              const isAvailable = table.status === "AVAILABLE";
              const needsAttention = (table.occupiedSinceMinutes || 0) >= 40;

              return (
                <div
                  key={table.id}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xs p-3.5 transition-all flex flex-col justify-between relative"
                >
                  {/* Top Row: Avatar + Title & Capacity + Status Chip */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <TableAvatar tableNumber={table.tableNumber} size="sm" />
                        <div className="min-w-0">
                          <h4
                            className="font-medium text-xs text-[var(--color-foreground)] leading-tight truncate"
                            title={table.tableNumber}
                          >
                            {table.tableNumber}
                          </h4>
                          <span className="text-[11px] text-[var(--color-muted)] font-normal flex items-center gap-1 mt-0.5">
                            <IconUsers className="w-3 h-3" />
                            <span>{table.capacity} seats</span>
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex-shrink-0">
                        {isAvailable && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Available</span>
                          </span>
                        )}
                        {isOccupied && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-red-50 text-red-800 border border-red-200/80 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span>Occupied</span>
                          </span>
                        )}
                        {isReserved && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Reserved</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Live Table Activity Details */}
                    {isOccupied && (
                      <div className="my-3 p-2.5 rounded-[var(--radius-button)] bg-[var(--color-background)] border border-[var(--color-border-subtle)] text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--color-muted)] flex items-center gap-1">
                            <IconClock className="w-3.5 h-3.5 text-red-500" />
                            <span>Seated:</span>
                          </span>
                          <span className="font-semibold text-[var(--color-foreground)]">
                            {table.occupiedSinceMinutes || 20}m
                          </span>
                        </div>
                        {table.currentBillAmount && (
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--color-muted)] flex items-center gap-1">
                              <IconReceipt className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                              <span>Bill:</span>
                            </span>
                            <span className="font-bold text-[var(--color-primary)]">
                              ₹{table.currentBillAmount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        )}
                        {needsAttention && (
                          <div className="text-[10px] font-bold text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <IconAlertCircle className="w-3 h-3 text-amber-700" />
                            <span>Check Table (40m+)</span>
                          </div>
                        )}
                      </div>
                    )}

                    {isReserved && (
                      <div className="my-3 p-2.5 rounded-[var(--radius-button)] bg-[var(--color-background)] border border-[var(--color-border-subtle)] text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--color-muted)] flex items-center gap-1">
                            <IconClock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Reserved For:</span>
                          </span>
                          <span className="font-bold text-amber-800">
                            {table.reservedForTime || "7:30 PM"}
                          </span>
                        </div>
                        {table.notes && (
                          <p className="text-[11px] text-[var(--color-muted)] italic truncate" title={table.notes}>
                            "{table.notes}"
                          </p>
                        )}
                      </div>
                    )}

                    {isAvailable && (
                      <div className="my-3 py-2.5 px-3 rounded-[var(--radius-button)] bg-[var(--color-background)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-muted)] flex items-center gap-2">
                        <IconArmchair className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Vacant & ready to seat</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom: Clean 1-Click Segmented Status Bar + Actions */}
                  <div className="space-y-1.5 pt-2 border-t border-[var(--color-border-subtle)]">
                    <div className="flex items-center p-0.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] text-[10px] font-medium">
                      <button
                        type="button"
                        onClick={() => onStatusChange(table.id, "AVAILABLE")}
                        className={`flex-1 py-1 rounded-md transition-colors text-center cursor-pointer ${
                          isAvailable
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                        }`}
                      >
                        Available
                      </button>
                      <button
                        type="button"
                        onClick={() => onStatusChange(table.id, "OCCUPIED")}
                        className={`flex-1 py-1 rounded-md transition-colors text-center cursor-pointer ${
                          isOccupied
                            ? "bg-red-600 text-white shadow-xs"
                            : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                        }`}
                      >
                        Occupied
                      </button>
                      <button
                        type="button"
                        onClick={() => onStatusChange(table.id, "RESERVED")}
                        className={`flex-1 py-1 rounded-md transition-colors text-center cursor-pointer ${
                          isReserved
                            ? "bg-amber-600 text-white shadow-xs"
                            : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                        }`}
                      >
                        Reserved
                      </button>
                    </div>

                    {/* Secondary Actions Bar */}
                    <div className="flex items-center justify-between text-xs text-[var(--color-muted)] pt-0.5">
                      <Link
                        href={`/cafe/${cafeSlug}/qr?table=${encodeURIComponent(table.tableNumber)}`}
                        className="hover:text-[var(--color-primary)] font-semibold inline-flex items-center gap-1 text-[11px] transition-colors"
                        title="View printable QR code"
                      >
                        <IconQrcode className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                        <span>Table QR</span>
                      </Link>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(table)}
                          className="p-1 rounded text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-background)] transition-colors cursor-pointer"
                          title="Edit Table"
                        >
                          <IconEdit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(table)}
                          className="p-1 rounded text-[var(--color-muted)] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Table"
                        >
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
