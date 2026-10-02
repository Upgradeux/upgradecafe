"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MenuItem } from "@/lib/db/schema/menu-items";
import {
  IconLeaf,
  IconStar,
  IconFlame,
  IconCup,
  IconSnowflake,
  IconClock,
  IconFlame as IconCalorie,
  IconAlertCircle,
  IconEdit,
} from "@tabler/icons-react";

import { parseMenuItemImages } from "@/features/cafe/menu/utils/image-helpers";

interface MenuItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: (MenuItem & {
    categoryName?: string | null;
    foodType?: string;
    isBestseller?: boolean;
    isSpicy?: boolean;
    temperature?: string;
    allergens?: string | null;
    calories?: number | null;
  }) | null;
  onEdit: (item: any) => void;
}

export const MenuItemDetailModal: React.FC<MenuItemDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  onEdit,
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = React.useState(0);

  React.useEffect(() => {
    setActivePhotoIdx(0);
  }, [item, isOpen]);

  if (!item) return null;

  const foodType = item.foodType || (item.isVegetarian === false ? "NON_VEG" : "VEG");
  const photos = parseMenuItemImages(item.imageKey);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.name}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Item Photo Gallery (Up to 3 Photos) */}
        {photos.length > 0 && (
          <div className="space-y-2">
            <div className="w-full h-56 rounded-[var(--radius-card)] overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-[var(--color-border)] relative flex items-center justify-center">
              {/* Ambient blur background */}
              <img
                src={photos[activePhotoIdx] || photos[0]}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-25 dark:opacity-20 pointer-events-none"
              />
              {/* Fully visible photo, no cutoff */}
              <img
                src={photos[activePhotoIdx] || photos[0]}
                alt={item.name}
                className="relative z-1 max-h-full max-w-full w-auto h-auto object-contain transition-all duration-200 drop-shadow-xs"
              />
              {photos.length > 1 && (
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/70 text-white backdrop-blur-md z-10">
                  {activePhotoIdx + 1} / {photos.length}
                </div>
              )}
            </div>

            {/* Thumbnail selector when multiple photos exist */}
            {photos.length > 1 && (
              <div className="flex items-center gap-2">
                {photos.map((photoUrl, idx) => (
                  <button
                    key={photoUrl}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`w-14 h-14 rounded-[var(--radius-button)] overflow-hidden border-2 transition-all cursor-pointer ${
                      activePhotoIdx === idx
                        ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/25 scale-105"
                        : "border-[var(--color-border)] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Header: Category + Dietary Tag + Price */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            {/* Dietary Symbol */}
            {foodType === "VEG" && (
              <span className="w-4 h-4 rounded border border-emerald-600 flex items-center justify-center bg-white flex-shrink-0" title="Pure Vegetarian">
                <div className="w-2 h-2 rounded-full bg-emerald-600" />
              </span>
            )}
            {foodType === "NON_VEG" && (
              <span className="w-4 h-4 rounded border border-red-700 flex items-center justify-center bg-white flex-shrink-0" title="Non-Vegetarian">
                <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-red-700" />
              </span>
            )}
            {foodType === "EGG" && (
              <span className="w-4 h-4 rounded border border-amber-600 flex items-center justify-center bg-white flex-shrink-0" title="Contains Egg">
                <div className="w-2 h-2 rounded-full bg-amber-600" />
              </span>
            )}
            {foodType === "VEGAN" && (
              <span className="w-4 h-4 rounded border border-teal-600 flex items-center justify-center bg-teal-50 flex-shrink-0" title="100% Vegan">
                <IconLeaf className="w-2.5 h-2.5 text-teal-600" />
              </span>
            )}

            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
              {item.categoryName || "General"}
            </span>
          </div>

          <div className="text-lg font-bold text-[var(--color-foreground)]">
            ₹{item.price}
          </div>
        </div>

        {/* Full Description */}
        {item.description ? (
          <div>
            <span className="text-xs font-bold text-[var(--color-muted)] block mb-1">
              Description
            </span>
            <p className="text-xs text-[var(--color-foreground)] leading-relaxed">
              {item.description}
            </p>
          </div>
        ) : (
          <p className="text-xs text-[var(--color-muted)] italic">
            No description provided for this dish.
          </p>
        )}

        {/* Feature Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              item.isAvailable
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                item.isAvailable ? "bg-emerald-600" : "bg-red-600"
              }`}
            />
            <span>{item.isAvailable ? "In Stock" : "Sold Out"}</span>
          </span>

          {item.isBestseller && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <IconStar className="w-3 h-3 fill-amber-700 text-amber-700" />
              <span>Bestseller</span>
            </span>
          )}

          {item.isSpicy && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300">
              <IconFlame className="w-3 h-3 text-red-700" />
              <span>Spicy Dish</span>
            </span>
          )}

          {item.temperature === "HOT" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-800 border border-orange-200">
              <IconCup className="w-3 h-3" />
              <span>Served Hot / Steamed</span>
            </span>
          )}

          {item.temperature === "COLD" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200">
              <IconSnowflake className="w-3 h-3" />
              <span>Served Iced / Chilled</span>
            </span>
          )}
        </div>

        {/* Nutritional & Operational Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-[var(--radius-card)] bg-[var(--color-background)] border border-[var(--color-border)] text-xs">
          <div>
            <span className="text-[10px] text-[var(--color-muted)] uppercase font-semibold block flex items-center gap-1">
              <IconClock className="w-3 h-3" /> Prep Time
            </span>
            <span className="font-bold text-[var(--color-foreground)] mt-0.5 block">
              {item.preparationTimeMinutes || 10} mins
            </span>
          </div>

          <div>
            <span className="text-[10px] text-[var(--color-muted)] uppercase font-semibold block flex items-center gap-1">
              <IconCalorie className="w-3 h-3 text-amber-600" /> Calories
            </span>
            <span className="font-bold text-[var(--color-foreground)] mt-0.5 block">
              {item.calories ? `${item.calories} kcal` : "Not specified"}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] text-[var(--color-muted)] uppercase font-semibold block flex items-center gap-1">
              <IconAlertCircle className="w-3 h-3 text-red-600" /> Allergens
            </span>
            <span className="font-medium text-[var(--color-foreground)] mt-0.5 block truncate" title={item.allergens || "None"}>
              {item.allergens || "None stated"}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)]">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onClose();
              onEdit(item);
            }}
          >
            <IconEdit className="w-3.5 h-3.5 mr-1" />
            <span>Edit This Dish</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
