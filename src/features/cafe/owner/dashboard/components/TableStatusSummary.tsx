"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { IconArmchair, IconArrowRight, IconCheck, IconUserCheck, IconClock } from "@tabler/icons-react";
import { Table } from "@/lib/db/schema/tables";

interface TableStatusSummaryProps {
  cafeSlug: string;
  totalTables: number;
  availableCount: number;
  occupiedCount: number;
  reservedCount: number;
  tables?: Table[];
}

export const TableStatusSummary: React.FC<TableStatusSummaryProps> = ({
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

  return (
    <Card className="p-5 border border-[var(--color-border)] h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[var(--radius-button)] bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <IconArmchair className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-[var(--color-foreground)]">
                Live Table Seating
              </h3>
              <p className="text-[11px] text-[var(--color-muted)]">
                {totalTables} tables · {availableCapacity} of {totalCapacity || totalTables * 3} seats vacant
              </p>
            </div>
          </div>
          <Link
            href={`/cafe/${cafeSlug}/tables`}
            className="text-xs font-semibold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
          >
            <span>Manage Floor</span>
            <IconArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Instant Glance Status Bar */}
        <div className="grid grid-cols-3 gap-2 text-center py-2.5 px-3 rounded-[var(--radius-card)] bg-[var(--color-background)] border border-[var(--color-border)] mb-3.5">
          <div className="flex flex-col items-center">
            <span className="text-base font-bold text-emerald-600 flex items-center gap-1">
              <IconCheck className="w-3.5 h-3.5" />
              {availableCount}
            </span>
            <span className="text-[11px] font-medium text-[var(--color-muted)]">
              Vacant
            </span>
          </div>

          <div className="flex flex-col items-center border-x border-[var(--color-border)]">
            <span className="text-base font-bold text-red-600 flex items-center gap-1">
              <IconUserCheck className="w-3.5 h-3.5" />
              {occupiedCount}
            </span>
            <span className="text-[11px] font-medium text-[var(--color-muted)]">
              Occupied
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-base font-bold text-amber-600 flex items-center gap-1">
              <IconClock className="w-3.5 h-3.5" />
              {reservedCount}
            </span>
            <span className="text-[11px] font-medium text-[var(--color-muted)]">
              Reserved
            </span>
          </div>
        </div>

        {/* Visual Mini Table Grid */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-muted)]">
            Table Status Snapshot:
          </div>

          {tables.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {tables.slice(0, 6).map((table) => {
                const isAvail = table.status === "AVAILABLE";
                const isOcc = table.status === "OCCUPIED";

                return (
                  <Link
                    key={table.id}
                    href={`/cafe/${cafeSlug}/tables`}
                    className={`p-2 rounded-[var(--radius-button)] border text-left transition-all hover:scale-[1.02] flex flex-col justify-between ${
                      isAvail
                        ? "border-emerald-500/40 bg-emerald-50/40 hover:border-emerald-600"
                        : isOcc
                        ? "border-red-500/40 bg-red-50/40 hover:border-red-600"
                        : "border-amber-500/40 bg-amber-50/40 hover:border-amber-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-foreground)]">
                        {table.tableNumber}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isAvail
                            ? "bg-emerald-600"
                            : isOcc
                            ? "bg-red-600"
                            : "bg-amber-500"
                        }`}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-[var(--color-muted)]">
                      <span>{table.capacity} seats</span>
                      <span
                        className={`font-semibold ${
                          isAvail
                            ? "text-emerald-700"
                            : isOcc
                            ? "text-red-700"
                            : "text-amber-700"
                        }`}
                      >
                        {isAvail ? "Ready" : isOcc ? "Seated" : "Booked"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-[var(--color-muted)] bg-[var(--color-background)] rounded-[var(--radius-button)]">
              No tables configured yet.
            </div>
          )}
        </div>
      </div>

      {/* Legend footer */}
      <div className="mt-3.5 pt-2.5 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px] text-[var(--color-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
          <span>Vacant & Ready</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
          <span>Guests Seated</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
          <span>Reserved</span>
        </span>
      </div>
    </Card>
  );
};
