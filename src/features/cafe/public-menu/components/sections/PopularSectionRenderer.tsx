"use client";

import React from "react";
import { HomeSectionConfig } from "@/lib/db/schema/cafe-settings";
import { MenuItem } from "@/lib/db/schema/menu-items";
import { DigitalMenuCartItem } from "../../types";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import { PopularItemCard } from "../PopularItemCard";
import { IconChevronRight, IconArrowRight } from "@tabler/icons-react";

interface PopularSectionRendererProps {
  section: HomeSectionConfig;
  popularItems: MenuItem[];
  totalMenuItemsCount?: number;
  digitalMenuTheme?: string;
  cart?: DigitalMenuCartItem[];
  favorites?: string[];
  showAllPopular: boolean;
  onToggleShowAllPopular: () => void;
  onViewAllMenu?: () => void;
  onSelectItem?: (item: MenuItem) => void;
  onQuickAdd?: (item: MenuItem) => void;
  onQuickMinus?: (item: MenuItem) => void;
  onToggleFavorite?: (itemId: string) => void;
}

export const PopularSectionRenderer: React.FC<PopularSectionRendererProps> = ({
  section,
  popularItems,
  totalMenuItemsCount,
  digitalMenuTheme,
  cart = [],
  favorites = [],
  showAllPopular,
  onToggleShowAllPopular,
  onViewAllMenu,
  onSelectItem,
  onQuickAdd,
  onQuickMinus,
  onToggleFavorite,
}) => {
  const visualTheme = getDigitalMenuVisualTheme(digitalMenuTheme || "roast");
  const sectionTitle = section.title || "Popular Food";

  // Homepage Popular shows up to 4 items by default; "See all" shows all qualifying popular items (up to 12)
  const displayItems = showAllPopular ? popularItems : popularItems.slice(0, 4);

  return (
    <section key={section.id} className="w-full relative">
      <div className="relative -mx-4 pt-1">
        {/* Symmetrical Center Dip Top Divider */}
        <div className="w-full h-7 sm:h-8 overflow-hidden leading-none select-none pointer-events-none -mb-1">
          <svg
            viewBox="0 0 400 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full block text-white"
            preserveAspectRatio="none"
          >
            <path
              d="M 0,28 L 0,22 C 0,10 18,0 48,0 C 90,0 120,14 200,14 C 280,14 310,0 352,0 C 382,0 400,10 400,22 L 400,28 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Popular Food Surface Container */}
        <div className="bg-white px-4 pt-2 pb-20 shadow-xs space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1C1D1A] tracking-tight font-heading">
                {sectionTitle}
              </h3>
              {section.subtitle ? (
                <p className="text-[11px] text-[#73716B]">{section.subtitle}</p>
              ) : (
                <p className="text-[11px] text-[#73716B]">What customers usually order</p>
              )}
            </div>

            {popularItems.length > 4 && (
              <button
                type="button"
                onClick={onToggleShowAllPopular}
                className="text-xs font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                style={{ color: visualTheme.avatarFallbackBg }}
              >
                <span>{showAllPopular ? "Show Less" : "See all"}</span>
                <IconChevronRight
                  className={`w-3.5 h-3.5 stroke-[2] transition-transform ${
                    showAllPopular ? "-rotate-90" : "rotate-0"
                  }`}
                />
              </button>
            )}
          </div>

          {displayItems.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[var(--cafe-background)] border border-dashed border-black/10 text-xs text-[#73716B]">
              No popular dishes available.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {displayItems.map((item) => (
                <PopularItemCard
                  key={item.id}
                  item={item}
                  visualTheme={visualTheme}
                  isFav={favorites.includes(item.id)}
                  inCart={cart.find((c) => c.menuItem.id === item.id)}
                  onSelectItem={onSelectItem}
                  onQuickAdd={onQuickAdd}
                  onQuickMinus={onQuickMinus}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          )}

          {/* Bottom helper actions */}
          {!showAllPopular && popularItems.length > 4 && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onToggleShowAllPopular}
                className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-bold hover:underline transition-all cursor-pointer"
                style={{ color: visualTheme.avatarFallbackBg }}
              >
                <span>See all {popularItems.length} popular</span>
                <IconArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          )}

          {showAllPopular && popularItems.length > 4 && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onToggleShowAllPopular}
                className="inline-flex items-center gap-1 text-xs sm:text-[13px] font-semibold text-[#73716B] hover:underline transition-all cursor-pointer"
              >
                <span>Show less</span>
                <IconChevronRight className="w-3.5 h-3.5 stroke-[2] -rotate-90" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
