"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Table } from "@/lib/db/schema/tables";
import { Floor } from "@/lib/db/schema/floors";
import { useToast } from "@/components/ui/Toast";

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafeSlug: string;
  floors?: Floor[];
  table?: (Table & { floorName?: string | null }) | null;
  onSuccess: () => void;
  onOpenFloorManager?: () => void;
}

export const TableModal: React.FC<TableModalProps> = ({
  isOpen,
  onClose,
  cafeSlug,
  floors = [],
  table,
  onSuccess,
  onOpenFloorManager,
}) => {
  const { toast } = useToast();
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("2");
  const [floorId, setFloorId] = useState("");
  const [status, setStatus] = useState("AVAILABLE");
  const [currentGuests, setCurrentGuests] = useState("");
  const [currentBillAmount, setCurrentBillAmount] = useState("");
  const [reservedForTime, setReservedForTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (table) {
      setTableNumber(table.tableNumber);
      setCapacity(table.capacity.toString());
      setFloorId(table.floorId || "");
      setStatus(table.status);
      setCurrentGuests(table.currentGuests ? table.currentGuests.toString() : "");
      setCurrentBillAmount(table.currentBillAmount ? table.currentBillAmount.toString() : "");
      setReservedForTime(table.reservedForTime || "");
      setNotes(table.notes || "");
    } else {
      setTableNumber("");
      setCapacity("2");
      setFloorId(floors[0]?.id || "");
      setStatus("AVAILABLE");
      setCurrentGuests("");
      setCurrentBillAmount("");
      setReservedForTime("");
      setNotes("");
    }
    setError(null);
  }, [table, isOpen, floors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const url = table
        ? `/api/cafe/${cafeSlug}/tables/${table.id}`
        : `/api/cafe/${cafeSlug}/tables`;
      const method = table ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber,
          capacity: parseInt(capacity) || 2,
          floorId: floorId || null,
          status,
          currentGuests: currentGuests ? parseInt(currentGuests) : null,
          currentBillAmount: currentBillAmount ? parseInt(currentBillAmount) : null,
          reservedForTime: reservedForTime.trim() ? reservedForTime.trim() : null,
          notes: notes.trim() ? notes.trim() : null,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to save table.");
      }

      toast({
        title: "Table Saved",
        description: `Table "${tableNumber}" has been ${table ? "updated" : "added to the floor"}.`,
        variant: "success",
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={table ? "Edit Dining Table" : "Add Dining Table"}
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-3 text-xs rounded-[var(--radius-button)] bg-[var(--color-danger-light)] text-[var(--color-danger)] font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Table Number / Label"
            required
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="e.g. Table 01, T-04, Balcony 2"
          />

          <div>
            <Select
              label="Floor / Dining Zone"
              value={floorId}
              onChange={(e) => setFloorId(e.target.value)}
              options={
                floors.length === 0
                  ? [{ label: "None (Single Open Floor)", value: "" }]
                  : [
                      { label: "No Specific Zone (Open Dining)", value: "" },
                      ...floors.map((f) => ({ label: f.name, value: f.id })),
                    ]
              }
            />
            <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)] mt-1 px-0.5">
              <span>
                {floors.length === 0 ? "Single room café (0 zones)" : `${floors.length} active zones`}
              </span>
              {onOpenFloorManager && (
                <button
                  type="button"
                  onClick={onOpenFloorManager}
                  className="text-[var(--color-primary)] font-semibold hover:underline cursor-pointer"
                >
                  {floors.length === 0 ? "+ Add Zones/Floors" : "Manage Zones"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Seating Capacity (Guests)"
            type="number"
            required
            min={1}
            max={50}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />

          <Select
            label="Initial Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { label: "Available (Ready to Seat)", value: "AVAILABLE" },
              { label: "Occupied (Guests Seated)", value: "OCCUPIED" },
              { label: "Reserved (Upcoming)", value: "RESERVED" },
            ]}
          />
        </div>

        {/* Dynamic fields based on status */}
        {status === "OCCUPIED" && (
          <div className="p-3.5 rounded-[var(--radius-card)] bg-red-50/50 border border-red-200 grid grid-cols-2 gap-3">
            <Input
              label="Current Guests"
              type="number"
              value={currentGuests}
              onChange={(e) => setCurrentGuests(e.target.value)}
              placeholder="e.g. 2"
            />
            <Input
              label="Running Bill (₹)"
              type="number"
              value={currentBillAmount}
              onChange={(e) => setCurrentBillAmount(e.target.value)}
              placeholder="e.g. 840"
            />
          </div>
        )}

        {status === "RESERVED" && (
          <div className="p-3.5 rounded-[var(--radius-card)] bg-amber-50/50 border border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Reservation Time"
              value={reservedForTime}
              onChange={(e) => setReservedForTime(e.target.value)}
              placeholder="e.g. 7:30 PM"
            />
            <Input
              label="Customer / Booking Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Birthday table for Mr. Mehta"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            {table ? "Save Changes" : "Create Table"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
