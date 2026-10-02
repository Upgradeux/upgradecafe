"use client";

import React, { useState, useEffect } from "react";
import { Table } from "@/lib/db/schema/tables";
import { Floor } from "@/lib/db/schema/floors";
import { TableGrid } from "./TableGrid";
import { TableList } from "./TableList";
import { TableModal } from "./TableModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { FloorManagerModal } from "./FloorManagerModal";
import {
  IconPlus,
  IconSearch,
  IconArmchair,
  IconQrcode,
  IconLayoutGrid,
  IconList,
  IconBuildingStore,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TableManagerProps {
  cafeSlug: string;
  initialTables: Array<Table & { floorName?: string | null }>;
  floors?: Floor[];
}

export const TableManager: React.FC<TableManagerProps> = ({
  cafeSlug,
  initialTables,
  floors = [],
}) => {
  const router = useRouter();
  const { toast } = useToast();

  const [tablesList, setTablesList] = useState<Array<Table & { floorName?: string | null }>>(initialTables);
  const [floorsList, setFloorsList] = useState<Floor[]>(floors);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AVAILABLE" | "OCCUPIED" | "RESERVED">("ALL");
  const [floorFilter, setFloorFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<(Table & { floorName?: string | null }) | null>(null);

  const [isFloorManagerOpen, setIsFloorManagerOpen] = useState(false);

  const [deletingTable, setDeletingTable] = useState<Table | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const refreshTables = async (silent: boolean = false) => {
    try {
      const res = await fetch(`/api/cafe/${cafeSlug}/tables`);
      const data = await res.json();
      if (data.success) {
        setTablesList(data.data);
      }
      if (!silent) {
        router.refresh();
      }
    } catch {
      if (!silent) {
        router.refresh();
      }
    }
  };

  // Real-time polling so dashboard table occupancy updates automatically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshTables(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [cafeSlug]);

  const refreshFloors = async () => {
    try {
      const res = await fetch(`/api/cafe/${cafeSlug}/floors`);
      const data = await res.json();
      if (data.success) {
        setFloorsList(data.data);
      }
      // Also refresh tables in case floor assignments or floor names changed
      await refreshTables();
    } catch {
      router.refresh();
    }
  };

  const handleStatusChange = async (tableId: string, status: "AVAILABLE" | "OCCUPIED" | "RESERVED") => {
    // Optimistic update
    setTablesList((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status } : t))
    );

    try {
      const res = await fetch(`/api/cafe/${cafeSlug}/tables/${tableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update table status.");

      toast({
        title: "Status Updated",
        description: `Table status changed to ${status}.`,
        variant: "info",
      });
    } catch {
      await refreshTables();
      toast({
        title: "Update Failed",
        description: "Could not update table status.",
        variant: "danger",
      });
    }
  };

  const handleDeleteTable = async () => {
    if (!deletingTable) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/cafe/${cafeSlug}/tables/${deletingTable.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete table.");

      toast({
        title: "Table Deleted",
        description: `Table "${deletingTable.tableNumber}" was removed from the floor.`,
        variant: "info",
      });

      setDeletingTable(null);
      await refreshTables();
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message,
        variant: "danger",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTables = tablesList.filter((table) => {
    const matchesSearch =
      searchQuery === "" ||
      table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (table.floorName && table.floorName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "ALL" || table.status === statusFilter;
    const matchesFloor =
      floorFilter === "ALL" || table.floorId === floorFilter || (floorFilter === "unassigned" && !table.floorId);
    return matchesSearch && matchesStatus && matchesFloor;
  });

  const availableCount = tablesList.filter((t) => t.status === "AVAILABLE").length;
  const occupiedCount = tablesList.filter((t) => t.status === "OCCUPIED").length;
  const reservedCount = tablesList.filter((t) => t.status === "RESERVED").length;
  const totalCapacity = tablesList.reduce((acc, t) => acc + (t.capacity || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--color-foreground)]">
            Floor & Table Management
          </h2>
          <p className="text-xs text-[var(--color-muted)]">
            Configure dining tables across zones, track live seating availability, and generate QR menus.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFloorManagerOpen(true)}
          >
            <IconBuildingStore className="w-3.5 h-3.5 mr-1.5 text-[var(--color-primary)]" />
            <span>Manage Zones / Floors</span>
          </Button>

          <Link
            href={`/cafe/${cafeSlug}/qr`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-button)] text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] transition-colors"
          >
            <IconQrcode className="w-3.5 h-3.5 text-[var(--color-muted)]" />
            <span>Print All QR Codes</span>
          </Link>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingTable(null);
              setIsModalOpen(true);
            }}
          >
            <IconPlus className="w-3.5 h-3.5 mr-1.5" />
            <span>Add Dining Table</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Card className="p-3.5 border border-[var(--color-border)] shadow-xs rounded-lg">
          <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)]">
            All Tables
          </div>
          <div className="text-xl font-semibold text-[var(--color-foreground)] mt-0.5">
            {tablesList.length}
          </div>
          <div className="text-[11px] text-[var(--color-muted)] mt-0.5 font-normal">
            {totalCapacity} guest seats total
          </div>
        </Card>

        <Card className="p-3.5 border border-[var(--color-border)] shadow-xs rounded-lg">
          <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-700">
            Available Tables
          </div>
          <div className="text-xl font-semibold text-emerald-700 mt-0.5">
            {availableCount}
          </div>
          <div className="text-[11px] text-[var(--color-muted)] mt-0.5 font-normal">
            Ready for seating
          </div>
        </Card>

        <Card className="p-3.5 border border-[var(--color-border)] shadow-xs rounded-lg">
          <div className="text-[10px] font-medium uppercase tracking-wider text-red-700">
            Occupied
          </div>
          <div className="text-xl font-semibold text-red-700 mt-0.5">
            {occupiedCount}
          </div>
          <div className="text-[11px] text-[var(--color-muted)] mt-0.5 font-normal">
            Guests currently dining
          </div>
        </Card>

        <Card className="p-3.5 border border-[var(--color-border)] shadow-xs rounded-lg">
          <div className="text-[10px] font-medium uppercase tracking-wider text-amber-700">
            Reserved
          </div>
          <div className="text-xl font-semibold text-amber-700 mt-0.5">
            {reservedCount}
          </div>
          <div className="text-[11px] text-[var(--color-muted)] mt-0.5 font-normal">
            Upcoming bookings
          </div>
        </Card>
      </div>

      {/* Controls Bar: Search + Floor Selector + Status Filter + Grid/List Toggle */}
      <div className="p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        {/* Search */}
        <div className="relative min-w-[220px]">
          <IconSearch className="w-3.5 h-3.5 text-[var(--color-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search table or zone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 h-8 text-xs rounded-md bg-[var(--color-background)] focus:bg-[var(--color-surface)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)] shadow-xs transition-colors font-normal"
          />
        </div>

        {/* Floor/Zone Dropdown: clean dropdown replaces horizontal scroll */}
        {floorsList.length > 0 && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs font-medium text-[var(--color-muted)] whitespace-nowrap">
              Zone:
            </span>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="h-8 px-2.5 text-xs font-medium rounded-md bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] shadow-xs cursor-pointer"
            >
              <option value="ALL">All Zones ({tablesList.length})</option>
              {floorsList.map((floor) => {
                const count = tablesList.filter((t) => t.floorId === floor.id).length;
                return (
                  <option key={floor.id} value={floor.id}>
                    {floor.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Right Side: Status Tabs + Grid/List View Toggle */}
        <div className="flex items-center gap-2 justify-between lg:justify-end flex-wrap">
          {/* Status filter */}
          <div className="flex items-center gap-1">
            {[
              { id: "ALL", label: "All" },
              { id: "AVAILABLE", label: "Available" },
              { id: "OCCUPIED", label: "Occupied" },
              { id: "RESERVED", label: "Reserved" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(s.id as any)}
                className={`h-8 px-2.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                  statusFilter === s.id
                    ? "bg-[var(--color-foreground)] text-[var(--color-background)] shadow-xs"
                    : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-background)]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                viewMode === "grid"
                  ? "bg-[var(--color-primary)] text-white shadow-xs"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
              title="Grid View"
            >
              <IconLayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                viewMode === "list"
                  ? "bg-[var(--color-primary)] text-white shadow-xs"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
              title="List View"
            >
              <IconList className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering: Grid vs List */}
      {filteredTables.length === 0 ? (
        <div className="p-12 text-center rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] space-y-3">
          <div className="w-12 h-12 rounded-full bg-[var(--color-background)] border border-[var(--color-border)] mx-auto flex items-center justify-center text-[var(--color-muted)]">
            <IconArmchair className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[var(--color-foreground)]">
            No tables found
          </h3>
          <p className="text-xs text-[var(--color-muted)] max-w-sm mx-auto">
            No tables match the current filter or search criteria.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("ALL");
              setFloorFilter("ALL");
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <TableGrid
          tables={filteredTables}
          cafeSlug={cafeSlug}
          onEdit={(t) => {
            setEditingTable(t);
            setIsModalOpen(true);
          }}
          onDelete={(t) => setDeletingTable(t)}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <TableList
          tables={filteredTables}
          cafeSlug={cafeSlug}
          onEdit={(t) => {
            setEditingTable(t);
            setIsModalOpen(true);
          }}
          onDelete={(t) => setDeletingTable(t)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Table Add / Edit Modal */}
      {isModalOpen && (
        <TableModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          cafeSlug={cafeSlug}
          floors={floorsList}
          table={editingTable}
          onSuccess={() => {
            refreshTables();
          }}
          onOpenFloorManager={() => {
            setIsModalOpen(false);
            setIsFloorManagerOpen(true);
          }}
        />
      )}

      {/* Dynamic Floor / Zone Manager Modal */}
      {isFloorManagerOpen && (
        <FloorManagerModal
          isOpen={isFloorManagerOpen}
          onClose={() => setIsFloorManagerOpen(false)}
          cafeSlug={cafeSlug}
          floors={floorsList}
          tables={tablesList}
          onFloorsChanged={() => {
            refreshFloors();
          }}
        />
      )}

      {/* Table Delete Confirmation Dialog */}
      {deletingTable && (
        <ConfirmDialog
          isOpen={true}
          title={`Delete "${deletingTable.tableNumber}"?`}
          description="Are you sure you want to remove this table? Its QR code will stop functioning."
          confirmText="Delete Table"
          variant="danger"
          isLoading={isDeleting}
          onClose={() => setDeletingTable(null)}
          onConfirm={handleDeleteTable}
        />
      )}
    </div>
  );
};
