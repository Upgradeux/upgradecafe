"use client";

import React, { useState } from "react";
import { Category } from "@/lib/db/schema/categories";
import { MenuItem } from "@/lib/db/schema/menu-items";
import { CategoryModal } from "./CategoryModal";
import { MenuItemModal } from "./MenuItemModal";
import { MenuItemCard } from "./MenuItemCard";
import { MenuItemDetailModal } from "./MenuItemDetailModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconFolderPlus,
  IconToolsKitchen2,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";

interface MenuManagerProps {
  cafeSlug: string;
  initialCategories: Category[];
  initialItems: Array<MenuItem & { categoryName?: string | null }>;
  defaultCategoryId?: string;
}

export const MenuManager: React.FC<MenuManagerProps> = ({
  cafeSlug,
  initialCategories,
  initialItems,
  defaultCategoryId,
}) => {
  const router = useRouter();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [items, setItems] = useState<Array<MenuItem & { categoryName?: string | null }>>(initialItems);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    defaultCategoryId && initialCategories.some((c) => c.id === defaultCategoryId)
      ? defaultCategoryId
      : "all"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [availabilityFilter, setAvailabilityFilter] = useState<"ALL" | "IN_STOCK" | "SOLD_OUT">("ALL");

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [detailItem, setDetailItem] = useState<(MenuItem & { categoryName?: string | null }) | null>(null);

  // Deletion confirm state
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Refetch data
  const refreshData = async () => {
    try {
      const [catRes, itemRes] = await Promise.all([
        fetch(`/api/cafe/${cafeSlug}/categories`),
        fetch(`/api/cafe/${cafeSlug}/menu-items`),
      ]);
      const catData = await catRes.json();
      const itemData = await itemRes.json();

      if (catData.success) setCategories(catData.data);
      if (itemData.success) setItems(itemData.data);
      router.refresh();
    } catch {
      router.refresh();
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategoryId === "all" || item.categoryId === selectedCategoryId;
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesAvailability =
      availabilityFilter === "ALL" ||
      (availabilityFilter === "IN_STOCK" && item.isAvailable) ||
      (availabilityFilter === "SOLD_OUT" && !item.isAvailable);

    return matchesCategory && matchesSearch && matchesAvailability;
  });

  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/cafe/${cafeSlug}/menu-items/${deletingItem.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete menu item.");

      toast({
        title: "Item Deleted",
        description: `"${deletingItem.name}" has been removed from the menu.`,
        variant: "info",
      });

      setDeletingItem(null);
      await refreshData();
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

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/cafe/${cafeSlug}/categories/${deletingCategory.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete category.");

      toast({
        title: "Category Deleted",
        description: `Category "${deletingCategory.name}" and associated items were deleted.`,
        variant: "info",
      });

      if (selectedCategoryId === deletingCategory.id) {
        setSelectedCategoryId("all");
      }
      setDeletingCategory(null);
      await refreshData();
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

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--color-foreground)]">
            Menu Catalog & Availability
          </h2>
          <p className="text-xs text-[var(--color-muted)]">
            Organize categories, configure menu items, and manage live stock availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
          >
            <IconFolderPlus className="w-3.5 h-3.5 mr-1.5" />
            <span>Add Category</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={categories.length === 0}
            onClick={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
          >
            <IconPlus className="w-3.5 h-3.5 mr-1.5" />
            <span>Add Menu Item</span>
          </Button>
        </div>
      </div>

      {/* Categories Bar & Quick Management */}
      <div className="p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Categories ({categories.length})
          </span>
          {selectedCategoryId !== "all" && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const cat = categories.find((c) => c.id === selectedCategoryId);
                  if (cat) {
                    setEditingCategory(cat);
                    setIsCategoryModalOpen(true);
                  }
                }}
                className="text-[11px] font-normal text-[var(--color-muted)] hover:text-[var(--color-foreground)] flex items-center gap-1"
              >
                <IconEdit className="w-3 h-3" />
                <span>Edit Section</span>
              </button>
              <span className="text-neutral-300">|</span>
              <button
                onClick={() => {
                  const cat = categories.find((c) => c.id === selectedCategoryId);
                  if (cat) setDeletingCategory(cat);
                }}
                className="text-[11px] font-normal text-[var(--color-danger)] hover:underline flex items-center gap-1"
              >
                <IconTrash className="w-3 h-3" />
                <span>Delete Section</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategoryId("all")}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors shadow-xs ${
              selectedCategoryId === "all"
                ? "bg-[var(--color-primary)] text-white shadow-xs"
                : "bg-[var(--color-background)] text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] border border-[var(--color-border)]"
            }`}
          >
            All Items ({items.length})
          </button>

          {categories.map((cat) => {
            const count = items.filter((i) => i.categoryId === cat.id).length;
            const isSelected = selectedCategoryId === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-xs ${
                  isSelected
                    ? "bg-[var(--color-primary)] text-white shadow-xs"
                    : "bg-[var(--color-background)] text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] border border-[var(--color-border)]"
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-[var(--color-border-subtle)] text-[var(--color-muted)]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search items by name or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<IconSearch className="w-4 h-4 text-[var(--color-muted)]" />}
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-xs text-[var(--color-muted)] flex items-center gap-1 mr-1 font-normal">
            <IconFilter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>
          {(["ALL", "IN_STOCK", "SOLD_OUT"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setAvailabilityFilter(filter)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shadow-xs ${
                availabilityFilter === filter
                  ? "bg-[var(--color-foreground)] text-[var(--color-background)] shadow-xs"
                  : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {filter === "ALL" ? "All" : filter === "IN_STOCK" ? "In Stock" : "Sold Out"}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-lg bg-[var(--color-surface)] border border-dashed border-[var(--color-border)]">
          <div className="inline-flex p-3 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] mb-3">
            <IconToolsKitchen2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[var(--color-foreground)]">
            No menu items found
          </h3>
          <p className="text-xs text-[var(--color-muted)] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No items match "${searchQuery}". Try changing your search or filter.`
              : categories.length === 0
              ? "Start by adding your first category, then create menu items."
              : "Click 'Add Menu Item' above to start populating this category."}
          </p>
          {categories.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => {
                setEditingItem(null);
                setIsItemModalOpen(true);
              }}
            >
              <IconPlus className="w-3.5 h-3.5 mr-1.5" />
              <span>Add Menu Item</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
          {filteredItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              cafeSlug={cafeSlug}
              onViewDetails={(it) => setDetailItem(it)}
              onEdit={(it) => {
                setEditingItem(it);
                setIsItemModalOpen(true);
              }}
              onDelete={(it) => setDeletingItem(it)}
              onToggleSuccess={refreshData}
            />
          ))}
        </div>
      )}

      {/* Menu Item Detail Modal */}
      <MenuItemDetailModal
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        item={detailItem}
        onEdit={(it) => {
          setEditingItem(it);
          setIsItemModalOpen(true);
        }}
      />

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        cafeSlug={cafeSlug}
        category={editingCategory}
        onSuccess={refreshData}
      />

      {/* Menu Item Modal */}
      <MenuItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        cafeSlug={cafeSlug}
        categories={categories}
        item={editingItem}
        selectedCategoryId={selectedCategoryId}
        onSuccess={refreshData}
      />

      {/* Item Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        title="Delete Menu Item"
        description={`Are you sure you want to delete "${deletingItem?.name}"? This action is permanent and removes the item from the QR menu.`}
        confirmText="Delete Item"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteItem}
      />

      {/* Category Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        title="Delete Category"
        description={`Are you sure you want to delete the category "${deletingCategory?.name}"? Any items currently in this category will also be deleted.`}
        confirmText="Delete Category"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteCategory}
      />
    </div>
  );
};
