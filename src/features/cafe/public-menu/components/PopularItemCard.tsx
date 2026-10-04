"use client";

import React from "react";
import { MenuItem } from "@/lib/db/schema/menu-items";
import { DigitalMenuCartItem } from "../types";
import { getMenuItemImageUrl } from "../utils/food-images";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import { IconHeart, IconStar, IconPlus, IconMinus } from "@tabler/icons-react";

export interface PopularItemCardProps {
  item: MenuItem;
  visualTheme: ReturnType<typeof getDigitalMenuVisualTheme>;
  isFav?: boolean;
  inCart?: DigitalMenuCartItem;
  onSelectItem?: (item: MenuItem) => void;
  onQuickAdd?: (item: MenuItem) => void;
  onQuickMinus?: (item: MenuItem) => void;
  onToggleFavorite?: (itemId: string) => void;
}

export const PopularItemCard: React.FC<PopularItemCardProps> = ({
  item,
  visualTheme,
  isFav = false,
  inCart,
  onSelectItem,
  onQuickAdd,
  onQuickMinus,
  onToggleFavorite,
}) => {
  const itemImg = getMenuItemImageUrl(item.imageKey, item.slug, item.name);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (target && target.closest("button, [data-interactive='true']")) {
      return;
    }
    onSelectItem?.(item);
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative p-3 sm:p-3.5 min-h-[225px] sm:min-h-[240px] flex flex-col justify-between group cursor-pointer transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] select-none"
    >
      {/* Contoured SVG Card Background with Dip Curve */}
      <svg
        viewBox="0 0 160 225"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
        style={{ color: visualTheme.cardBg }}
      >
        <path
          d="M 0,24 C 0,10 10,0 24,0 C 45,0 56,7 80,7 C 104,7 115,0 136,0 C 150,0 160,10 160,24 L 160,201 C 160,215 150,225 136,225 L 24,225 C 10,225 0,215 0,201 Z"
          fill="currentColor"
          stroke="rgba(0, 0, 0, 0.04)"
          strokeWidth="1"
        />
      </svg>

      <div className="relative z-10 flex flex-col justify-between h-full space-y-2">
        {/* Top Header Row: Veg/Non-Veg + Star Badge + Favorite Heart */}
        <div className="flex items-center justify-between gap-1 w-full pt-0.5">
          <div className="flex items-center gap-1.5">
            {item.isVegetarian ? (
              <span
                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-xs border border-emerald-600/70 p-0.5"
                title="Vegetarian"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 block" />
              </span>
            ) : (
              <span
                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-xs border border-rose-600/70 p-0.5"
                title="Non-Vegetarian"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 block" />
              </span>
            )}
            {item.isBestseller && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[9px] font-semibold"
                style={{
                  backgroundColor: visualTheme.badgeBg,
                  color: visualTheme.badgeText,
                }}
              >
                <IconStar className="w-2.5 h-2.5 fill-current" />
                Top
              </span>
            )}
          </div>

          <button
            type="button"
            data-interactive="true"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onToggleFavorite?.(item.id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1 -mr-1 text-[#333] hover:text-red-500 transition-colors cursor-pointer"
            aria-label="Add to favorites"
          >
            <IconHeart
              className={`w-4 h-4 stroke-[1.6] transition-colors pointer-events-none ${
                isFav ? "fill-red-500 text-red-500" : "text-[#4A4B48]"
              }`}
            />
          </button>
        </div>

        {/* Dish Photo */}
        <div className="w-full h-26 sm:h-28 rounded-xl overflow-hidden relative my-1 bg-[#F5F5F3] border border-black/[0.03]">
          <img
            src={itemImg}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Bottom Details Row: Name + Price + Add / Stepper */}
        <div>
          <h4 className="font-semibold text-xs sm:text-[13px] text-[#1C1D1A] truncate font-heading">
            {item.name}
          </h4>

          <div className="flex items-center justify-between pt-1 mt-0.5">
            <span className="text-xs sm:text-sm font-bold font-mono text-[#1C1D1A]">
              ₹{item.price}
            </span>

            {inCart ? (
              <div
                data-interactive="true"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="h-7 sm:h-8 px-1 rounded-full text-white flex items-center gap-1.5 ring-1.5 ring-white/20"
                style={{
                  backgroundColor: visualTheme.avatarFallbackBg,
                  boxShadow: `inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 8px ${visualTheme.buttonShadow}`,
                }}
              >
                <button
                  type="button"
                  data-interactive="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (onQuickMinus) onQuickMinus(item);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  title="Reduce quantity"
                  className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-90 transition-transform cursor-pointer"
                >
                  <IconMinus className="w-3.5 h-3.5 stroke-[2.5] pointer-events-none" />
                </button>
                <span className="text-[11px] font-bold font-mono min-w-[14px] text-center leading-none select-none pointer-events-none">
                  {inCart.quantity}
                </span>
                <button
                  type="button"
                  data-interactive="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onQuickAdd?.(item);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  title="Increase quantity"
                  className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-90 transition-transform cursor-pointer"
                >
                  <IconPlus className="w-3.5 h-3.5 stroke-[2.5] pointer-events-none" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-interactive="true"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onQuickAdd?.(item);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                title="Add to order"
                className="w-7 sm:w-8 h-7 sm:h-8 rounded-full text-white flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90"
                style={{
                  backgroundColor: visualTheme.avatarFallbackBg,
                  boxShadow: `0 2px 8px ${visualTheme.buttonShadow}`,
                }}
              >
                <IconPlus className="w-4 h-4 stroke-[2.2] pointer-events-none" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
