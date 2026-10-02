"use client";

import React, { useState } from "react";
import { MenuItem } from "@/lib/db/schema/menu-items";
import { Card } from "@/components/ui/Card";
import {
  IconEdit,
  IconTrash,
  IconClock,
  IconLeaf,
  IconStar,
  IconFlame,
  IconCup,
  IconSnowflake,
  IconToolsKitchen2,
  IconPhoto,
} from "@tabler/icons-react";
import { useToast } from "@/components/ui/Toast";
import { parseMenuItemImages } from "@/features/cafe/menu/utils/image-helpers";

interface MenuItemCardProps {
  item: MenuItem & {
    categoryName?: string | null;
    foodType?: string;
    isBestseller?: boolean;
    isSpicy?: boolean;
    temperature?: string;
    allergens?: string | null;
    calories?: number | null;
  };
  cafeSlug: string;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onViewDetails?: (item: any) => void;
  onToggleSuccess?: () => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  cafeSlug,
  onEdit,
  onDelete,
  onViewDetails,
  onToggleSuccess,
}) => {
  const { toast } = useToast();
  const [isAvailable, setIsAvailable] = useState(item.isAvailable);
  const [isToggling, setIsToggling] = useState(false);
  const [imageError, setImageError] = useState(false);

  const images = parseMenuItemImages(item.imageKey);
  const primaryImage = images[0];

  const handleToggleAvailability = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isAvailable;
    setIsAvailable(nextState); // optimistic update
    setIsToggling(true);

    try {
      const res = await fetch(`/api/cafe/${cafeSlug}/menu-items/${item.id}/toggle`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to update item availability");
      }

      toast({
        title: nextState ? "Item In Stock" : "Item Sold Out",
        description: `"${item.name}" is now marked as ${nextState ? "in stock" : "sold out on QR menu"}.`,
        variant: nextState ? "success" : "warning",
      });

      if (onToggleSuccess) {
        onToggleSuccess();
      }
    } catch {
      setIsAvailable(!nextState); // rollback
      toast({
        title: "Update Failed",
        description: "Could not toggle availability. Please try again.",
        variant: "danger",
      });
    } finally {
      setIsToggling(false);
    }
  };

  const foodType = item.foodType || (item.isVegetarian === false ? "NON_VEG" : "VEG");

  return (
    <Card
      onClick={() => onViewDetails && onViewDetails(item)}
      className={`p-3 border transition-all flex flex-col justify-between group cursor-pointer hover:shadow-md hover:-translate-y-0.5 duration-200 w-full ${
        isAvailable
          ? "border-[var(--color-border)] hover:border-[var(--color-primary)]/60 bg-[var(--color-surface)]"
          : "border-[var(--color-border-subtle)] bg-[var(--color-background)]/60 opacity-80"
      }`}
    >
      <div>
        {/* Food Photo Banner - properly fits edge-to-edge with no empty space */}
        <div className="relative w-full h-40 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-[var(--color-border-subtle)] flex-shrink-0">
          {primaryImage && !imageError ? (
            <img
              src={primaryImage}
              alt={item.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-500/5 via-neutral-100 to-neutral-200/50 dark:from-neutral-800 dark:to-neutral-900 text-[var(--color-muted)]">
              <IconToolsKitchen2 className="w-7 h-7 opacity-35 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                {item.categoryName || "UpgradeCafe"}
              </span>
            </div>
          )}

          {/* Floating Stock Status Badge in Top-Right Corner */}
          <div className="absolute top-2 right-2 z-10">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide whitespace-nowrap shadow-xs backdrop-blur-md ${
                isAvailable
                  ? "bg-white/95 text-emerald-800 border border-emerald-200"
                  : "bg-neutral-900/90 text-white"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isAvailable ? "bg-emerald-600" : "bg-red-400"
                }`}
              />
              <span>{isAvailable ? "In Stock" : "Sold Out"}</span>
            </span>
          </div>

          {/* Top-Left Highlights (Bestseller, Spicy, Photo Count) */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
            {item.isBestseller && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-medium bg-amber-500 text-white shadow-xs backdrop-blur-md">
                <IconStar className="w-2.5 h-2.5 fill-white" />
                <span>Bestseller</span>
              </span>
            )}
            {item.isSpicy && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9.5px] font-medium bg-red-600 text-white shadow-xs backdrop-blur-md">
                <IconFlame className="w-2.5 h-2.5" />
                <span>Spicy</span>
              </span>
            )}
            {images.length > 1 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-medium bg-black/60 text-white backdrop-blur-md">
                <IconPhoto className="w-2.5 h-2.5" />
                <span>{images.length}</span>
              </span>
            )}
          </div>

          {/* Dim Overlay when Sold Out */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-neutral-950/35 backdrop-blur-[0.5px] pointer-events-none" />
          )}
        </div>

        {/* Content Section */}
        <div className="pt-2 space-y-1">
          {/* Category & Price Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Dietary Symbol */}
              {foodType === "VEG" && (
                <span
                  className="w-3.5 h-3.5 rounded border border-emerald-600 flex items-center justify-center bg-white flex-shrink-0"
                  title="Pure Vegetarian"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                </span>
              )}
              {foodType === "NON_VEG" && (
                <span
                  className="w-3.5 h-3.5 rounded border border-red-700 flex items-center justify-center bg-white flex-shrink-0"
                  title="Non-Vegetarian"
                >
                  <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-red-700" />
                </span>
              )}
              {foodType === "EGG" && (
                <span
                  className="w-3.5 h-3.5 rounded border border-amber-600 flex items-center justify-center bg-white flex-shrink-0"
                  title="Contains Egg"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                </span>
              )}
              {foodType === "VEGAN" && (
                <span
                  className="w-3.5 h-3.5 rounded border border-teal-600 flex items-center justify-center bg-teal-50 flex-shrink-0"
                  title="100% Vegan"
                >
                  <IconLeaf className="w-2.5 h-2.5 text-teal-600" />
                </span>
              )}

              {item.categoryName && (
                <span className="text-[10px] uppercase font-medium tracking-wider text-[var(--color-muted)] truncate">
                  {item.categoryName}
                </span>
              )}
            </div>

            {/* Price */}
            <span className="text-sm font-semibold text-[var(--color-foreground)] flex-shrink-0">
              ₹{item.price}
            </span>
          </div>

          {/* Dish Name: Full 2 lines for complete readability */}
          <h4
            className="text-sm font-medium text-[var(--color-foreground)] line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors leading-snug"
            title={item.name}
          >
            {item.name}
          </h4>

          {/* Description */}
          {item.description && (
            <p className="text-xs text-[var(--color-muted)] line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Specs & Serving Temperature */}
          <div className="flex items-center gap-2 text-[10.5px] text-[var(--color-muted)] pt-0.5 flex-wrap">
            {item.temperature === "HOT" && (
              <span className="inline-flex items-center gap-0.5 text-orange-700 font-medium">
                <IconCup className="w-3 h-3" /> Hot
              </span>
            )}
            {item.temperature === "COLD" && (
              <span className="inline-flex items-center gap-0.5 text-sky-700 font-medium">
                <IconSnowflake className="w-3 h-3" /> Iced
              </span>
            )}
            {item.preparationTimeMinutes && (
              <span className="flex items-center gap-1">
                <IconClock className="w-3 h-3" />
                <span>{item.preparationTimeMinutes}m</span>
              </span>
            )}
            {item.calories && <span>• {item.calories} kcal</span>}
          </div>
        </div>
      </div>

      {/* Action Footer: Availability toggle switch + Edit + Delete */}
      <div className="pt-1 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleAvailability}
            disabled={isToggling}
            aria-label="Toggle availability"
            className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer ${
              isAvailable ? "bg-[var(--color-primary)]" : "bg-neutral-300"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white transition-transform transform ${
                isAvailable ? "translate-x-3.5" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className="text-[10.5px] font-medium text-[var(--color-muted)] whitespace-nowrap">
            {isAvailable ? "In Stock" : "Sold Out"}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="p-1.5 rounded-md text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] transition-colors cursor-pointer"
            title="Edit Item"
          >
            <IconEdit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
            className="p-1.5 rounded-md text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition-colors cursor-pointer"
            title="Delete Item"
          >
            <IconTrash className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
};
