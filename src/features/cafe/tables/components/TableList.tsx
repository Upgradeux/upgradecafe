"use client";

import React from "react";
import { Table as TableType } from "@/lib/db/schema/tables";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import {
  IconQrcode,
  IconEdit,
  IconTrash,
  IconUsers,
  IconClock,
  IconReceipt,
} from "@tabler/icons-react";
import Link from "next/link";
import { TableAvatar } from "./TableAvatar";

interface TableListProps {
  tables: Array<TableType & { floorName?: string | null }>;
  cafeSlug: string;
  onEdit: (table: any) => void;
  onDelete: (table: any) => void;
  onStatusChange: (tableId: string, status: "AVAILABLE" | "OCCUPIED" | "RESERVED") => void;
}

export const TableList: React.FC<TableListProps> = ({
  tables,
  cafeSlug,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Table</TableHead>
            <TableHead>Floor / Zone</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Live Status</TableHead>
            <TableHead>Current Activity</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tables.map((table) => {
            const isOccupied = table.status === "OCCUPIED";
            const isReserved = table.status === "RESERVED";
            const isAvailable = table.status === "AVAILABLE";

            return (
              <TableRow key={table.id}>
                {/* Table Number */}
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <TableAvatar tableNumber={table.tableNumber} size="sm" />
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-[var(--color-foreground)] block truncate" title={table.tableNumber}>
                        {table.tableNumber}
                      </span>
                      <span className="text-[10px] text-[var(--color-muted)] font-mono block truncate">
                        {table.qrIdentifier}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Floor / Zone */}
                <TableCell>
                  <span className="text-xs font-medium text-[var(--color-foreground)]">
                    {table.floorName || "Open Dining / General"}
                  </span>
                </TableCell>

                {/* Capacity */}
                <TableCell>
                  <span className="text-xs text-[var(--color-foreground)] flex items-center gap-1">
                    <IconUsers className="w-3.5 h-3.5 text-[var(--color-muted)]" />
                    <span>{table.capacity} seats</span>
                  </span>
                </TableCell>

                {/* Status with 1-click switcher */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onStatusChange(table.id, "AVAILABLE")}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded cursor-pointer transition-colors ${
                        isAvailable
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-emerald-700"
                      }`}
                      title="Mark as Available"
                    >
                      Available
                    </button>
                    <button
                      type="button"
                      onClick={() => onStatusChange(table.id, "OCCUPIED")}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded cursor-pointer transition-colors ${
                        isOccupied
                          ? "bg-red-600 text-white shadow-2xs"
                          : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-red-700"
                      }`}
                      title="Mark as Occupied"
                    >
                      Occupied
                    </button>
                    <button
                      type="button"
                      onClick={() => onStatusChange(table.id, "RESERVED")}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded cursor-pointer transition-colors ${
                        isReserved
                          ? "bg-amber-500 text-white shadow-2xs"
                          : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-amber-700"
                      }`}
                      title="Mark as Reserved"
                    >
                      Reserved
                    </button>
                  </div>
                </TableCell>

                {/* Live Activity (Running bill, minutes, reservation time) */}
                <TableCell>
                  {isOccupied && (
                    <div className="text-xs space-y-0.5">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="font-semibold text-[var(--color-foreground)] flex items-center gap-0.5">
                          <IconReceipt className="w-3 h-3 text-[var(--color-primary)]" />
                          <span>₹{table.currentBillAmount || 0}</span>
                        </span>
                        <span className="text-[var(--color-muted)] flex items-center gap-0.5">
                          <IconClock className="w-3 h-3" />
                          <span>{table.occupiedSinceMinutes || 15}m seated</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {isReserved && (
                    <div className="text-xs text-amber-800 font-medium flex items-center gap-1">
                      <IconClock className="w-3 h-3 text-amber-600" />
                      <span>{table.reservedForTime || "Reserved"}</span>
                      {table.notes && <span className="text-[10px] text-[var(--color-muted)] italic truncate max-w-[120px]">({table.notes})</span>}
                    </div>
                  )}

                  {isAvailable && (
                    <span className="text-[11px] text-emerald-700 font-medium">
                      Vacant & Clean
                    </span>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/cafe/${cafeSlug}/qr?table=${encodeURIComponent(table.tableNumber)}`}
                      className="p-1 rounded-[var(--radius-button)] text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border-subtle)] transition-colors"
                      title="View QR Code"
                    >
                      <IconQrcode className="w-4 h-4" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => onEdit(table)}
                      className="p-1 rounded-[var(--radius-button)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] transition-colors cursor-pointer"
                      title="Edit Table"
                    >
                      <IconEdit className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(table)}
                      className="p-1 rounded-[var(--radius-button)] text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition-colors cursor-pointer"
                      title="Delete Table"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
