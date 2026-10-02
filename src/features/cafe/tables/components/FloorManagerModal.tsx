"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Floor } from "@/lib/db/schema/floors";
import { Table } from "@/lib/db/schema/tables";
import { useToast } from "@/components/ui/Toast";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconBuildingStore,
  IconInfoCircle,
} from "@tabler/icons-react";

interface FloorManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafeSlug: string;
  floors: Floor[];
  tables: Array<Table & { floorName?: string | null }>;
  onFloorsChanged: () => void;
}

export const FloorManagerModal: React.FC<FloorManagerModalProps> = ({
  isOpen,
  onClose,
  cafeSlug,
  floors,
  tables,
  onFloorsChanged,
}) => {
  const { toast } = useToast();
  const [newFloorName, setNewFloorName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Inline editing state
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Deleting state
  const [deletingFloorId, setDeletingFloorId] = useState<string | null>(null);

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloorName.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch(`/api/cafe/${cafeSlug}/floors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFloorName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to create dining zone.");
      }

      toast({
        title: "Zone Created",
        description: `"${newFloorName.trim()}" has been added to your café floor plan.`,
        variant: "success",
      });

      setNewFloorName("");
      onFloorsChanged();
    } catch (err: any) {
      toast({
        title: "Creation Failed",
        description: err.message,
        variant: "danger",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleStartEdit = (floor: Floor) => {
    setEditingFloorId(floor.id);
    setEditingName(floor.name);
  };

  const handleCancelEdit = () => {
    setEditingFloorId(null);
    setEditingName("");
  };

  const handleSaveEdit = async (floorId: string) => {
    if (!editingName.trim()) return;

    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/cafe/${cafeSlug}/floors/${floorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update zone.");
      }

      toast({
        title: "Zone Renamed",
        description: `Zone renamed to "${editingName.trim()}".`,
        variant: "success",
      });

      setEditingFloorId(null);
      setEditingName("");
      onFloorsChanged();
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message,
        variant: "danger",
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteFloor = async (floor: Floor) => {
    const tableCount = tables.filter((t) => t.floorId === floor.id).length;
    const confirmMessage = tableCount > 0
      ? `Delete zone "${floor.name}"? The ${tableCount} table(s) in this zone will not be deleted; they will simply become "Unassigned / Open Floor".`
      : `Delete zone "${floor.name}"?`;

    if (!window.confirm(confirmMessage)) return;

    setDeletingFloorId(floor.id);
    try {
      const res = await fetch(`/api/cafe/${cafeSlug}/floors/${floor.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to delete zone.");
      }

      toast({
        title: "Zone Removed",
        description: `Zone "${floor.name}" was removed. Any tables were preserved as unassigned.`,
        variant: "info",
      });

      onFloorsChanged();
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message,
        variant: "danger",
      });
    } finally {
      setDeletingFloorId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Dining Zones & Floors"
    >
      <div className="space-y-5">
        {/* Informational Guidance Banner */}
        <div className="p-3.5 rounded-[var(--radius-card)] bg-[var(--color-background)] border border-[var(--color-border)] flex items-start gap-2.5 text-xs text-[var(--color-muted)]">
          <IconInfoCircle className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[var(--color-foreground)] block mb-0.5">
              Customize Your Café's Spaces
            </span>
            <span>
              If your café operates as a single room, you do not need any zones. Create zones only if you have multiple floors (e.g. Ground Floor, 1st Floor) or distinct dining areas (e.g. Rooftop, Patio, Garden, Private Room).
            </span>
          </div>
        </div>

        {/* Form to Add New Zone */}
        <form onSubmit={handleAddFloor} className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Add New Zone / Floor Name"
              value={newFloorName}
              onChange={(e) => setNewFloorName(e.target.value)}
              placeholder="e.g. Ground Floor, Rooftop, Garden, Patio"
              disabled={isAdding}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!newFloorName.trim() || isAdding}
            isLoading={isAdding}
          >
            <IconPlus className="w-4 h-4 mr-1" />
            <span>Add Zone</span>
          </Button>
        </form>

        {/* Existing Floors List */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
            Active Dining Zones ({floors.length})
          </div>

          {floors.length === 0 ? (
            <div className="p-6 text-center rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
              <IconBuildingStore className="w-8 h-8 text-[var(--color-muted)] mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium text-[var(--color-foreground)]">
                No custom zones configured
              </p>
              <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                All tables currently operate in a unified single open space.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border-subtle)] rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
              {floors.map((floor) => {
                const tableCount = tables.filter((t) => t.floorId === floor.id).length;
                const isEditing = editingFloorId === floor.id;
                const isDeleting = deletingFloorId === floor.id;

                return (
                  <div
                    key={floor.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-[var(--color-background)] transition-colors"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs rounded border border-[var(--color-primary)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none"
                          autoFocus
                          disabled={isSavingEdit}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(floor.id)}
                          disabled={!editingName.trim() || isSavingEdit}
                          className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer transition-colors"
                          title="Save Rename"
                        >
                          <IconCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isSavingEdit}
                          className="p-1 rounded bg-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] cursor-pointer transition-colors"
                          title="Cancel"
                        >
                          <IconX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[var(--color-foreground)]">
                              {floor.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--color-border-subtle)] text-[var(--color-muted)] font-medium">
                              {tableCount} {tableCount === 1 ? "table" : "tables"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(floor)}
                            className="p-1.5 rounded-md text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] transition-colors cursor-pointer"
                            title="Rename Zone"
                          >
                            <IconEdit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFloor(floor)}
                            disabled={isDeleting}
                            className="p-1.5 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Zone"
                          >
                            <IconTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-[var(--color-border-subtle)] text-right">
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
