"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import {
  IconArmchair,
  IconArrowRight,
  IconCheck,
  IconUserCheck,
  IconClock,
  IconAlertCircle,
  IconUsers,
  IconReceipt,
} from "@tabler/icons-react";
import { Table } from "@/lib/db/schema/tables";
import { TableAvatar } from "@/features/cafe/tables/components/TableAvatar";

interface LiveFloorSummaryProps {
  cafeSlug: string;
  totalTables: number;
  availableCount: number;
  occupiedCount: number;
  reservedCount: number;
  tables?: Array<Table & { floorName?: string | null }>;
}

export const LiveFloorSummary: React.FC<LiveFloorSummaryProps> = ({
  cafeSlug,
  totalTables,
  availableCount,
  occupiedCount,
  reservedCount,
  tables = [],
}) => {
  const totalCapacity = tables.reduce((acc, t) => acc + (t.capacity || 2), 0);
  const availableCapacity = tables
    .filter((t) => t.status === "AVAILABLE")
    .reduce((acc, t) => acc + (t.capacity || 2), 0);

  // Group by floor for zone overview - only include tables with an actual floor assigned
  const floorCounts: Record<string, { total: number; available: number }> = {};
  tables.forEach((t) => {
    if (!t.floorName) return; // Skip unassigned tables so single-room cafés don't get artificial zones
    const floor = t.floorName;
    if (!floorCounts[floor]) {
      floorCounts[floor] = { total: 0, available: 0 };
    }
    floorCounts[floor].total += 1;
    if (t.status === "AVAILABLE") floorCounts[floor].available += 1;
  });

  // Filter active tables requiring attention or currently seated/reserved
  const activeTables = tables.filter(
    (t) => t.status === "OCCUPIED" || t.status === "RESERVED"
  );

  return (
    <Card className="p-4 border border-[var(--color-border)] shadow-xs rounded-lg w-full space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[var(--color-border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] flex-shrink-0">
              <IconArmchair className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium tracking-tight text-[var(--color-foreground)]">
                  Live Floor Summary
                </h2>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-[var(--color-muted)] mt-0.5 font-normal">
                <span className="text-[var(--color-foreground)] font-medium">
                  {availableCount} of {totalTables} tables available
                </span>
                <span className="mx-1.5 opacity-60">•</span>
                <span>
                  {availableCapacity} of {totalCapacity || totalTables * 2} seats vacant
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Status Counters & Manage Shortcut */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1 p-0.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] text-xs">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-medium flex items-center gap-1 text-[11px]">
              <IconCheck className="w-3 h-3 text-emerald-600" />
              <span>{availableCount} Available</span>
            </span>

            <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-800 font-medium flex items-center gap-1 text-[11px]">
              <IconUserCheck className="w-3 h-3 text-red-600" />
              <span>{occupiedCount} Occupied</span>
            </span>

            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-medium flex items-center gap-1 text-[11px]">
              <IconClock className="w-3 h-3 text-amber-600" />
              <span>{reservedCount} Reserved</span>
            </span>
          </div>

          <Link
            href={`/cafe/${cafeSlug}/tables`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs whitespace-nowrap"
          >
            <span>Manage Tables</span>
            <IconArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Zone / Floor Quick Breakdown */}
      {Object.keys(floorCounts).length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[10px] uppercase font-medium tracking-wider text-[var(--color-muted)] mr-1">
            Zones:
          </span>
          {Object.entries(floorCounts).map(([name, counts]) => (
            <span
              key={name}
              className="px-2 py-0.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] font-normal text-xs flex items-center gap-1.5"
            >
              <span>{name}</span>
              <span className="text-[11px] font-medium text-[var(--color-primary)]">
                ({counts.available}/{counts.total} free)
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Busy Now / Floor Activity Table */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)] flex items-center gap-1.5">
            <IconUserCheck className="w-3.5 h-3.5 text-red-600" />
            <span>Floor Activity & Busy Now</span>
          </span>
          <span className="text-[11px] text-[var(--color-muted)] font-normal">
            Tables requiring staff attention
          </span>
        </div>

        {activeTables.length === 0 ? (
          <div className="p-4 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-center text-xs text-[var(--color-muted)] font-normal">
            All tables are currently vacant and ready to seat guests.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border-subtle)] rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] overflow-hidden shadow-xs">
            {activeTables.map((table) => {
              const isOccupied = table.status === "OCCUPIED";
              const isReserved = table.status === "RESERVED";
              const needsAttention = (table.occupiedSinceMinutes || 0) >= 40;

              return (
                <div
                  key={table.id}
                  className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[var(--color-surface)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Safe Table Avatar - Prevents Long Name Overflow */}
                    <TableAvatar
                      tableNumber={table.tableNumber}
                      capacity={table.capacity}
                      size="md"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[var(--color-foreground)]">
                          {table.tableNumber}
                        </span>
                        {table.floorName && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[var(--color-border-subtle)] text-[var(--color-muted)] font-normal">
                            {table.floorName}
                          </span>
                        )}
                        {needsAttention && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                            <IconAlertCircle className="w-2.5 h-2.5 text-amber-700" />
                            <span>Check Table (40m+)</span>
                          </span>
                        )}
                      </div>

                      {/* Guest info or reservation notes */}
                      <div className="text-[11px] text-[var(--color-muted)] mt-0.5 flex items-center gap-3 flex-wrap font-normal">
                        {isOccupied && (
                          <>
                            <span className="flex items-center gap-1">
                              <IconUsers className="w-3 h-3" />
                              <span>{table.currentGuests || table.capacity} guests</span>
                            </span>
                            {table.currentBillAmount && (
                              <span className="flex items-center gap-0.5 font-medium text-[var(--color-foreground)]">
                                <IconReceipt className="w-3 h-3 text-[var(--color-primary)]" />
                                <span>₹{table.currentBillAmount.toLocaleString("en-IN")}</span>
                              </span>
                            )}
                            {table.occupiedSinceMinutes && (
                              <span className="flex items-center gap-1">
                                <IconClock className="w-3 h-3" />
                                <span>{table.occupiedSinceMinutes} min seated</span>
                              </span>
                            )}
                          </>
                        )}

                        {isReserved && (
                          <>
                            <span className="font-medium text-amber-700 flex items-center gap-1">
                              <IconClock className="w-3 h-3" />
                              <span>{table.reservedForTime || "Upcoming Booking"}</span>
                            </span>
                            {table.notes && (
                              <span className="italic truncate max-w-xs text-[var(--color-muted)]">
                                "{table.notes}"
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Action */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isOccupied && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        <span>Occupied</span>
                      </span>
                    )}
                    {isReserved && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                        <span>Reserved</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View all tables link */}
        <div className="pt-2 text-right">
          <Link
            href={`/cafe/${cafeSlug}/tables`}
            className="text-xs font-semibold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
          >
            <span>View all {totalTables} tables →</span>
          </Link>
        </div>
      </div>
    </Card>
  );
};
