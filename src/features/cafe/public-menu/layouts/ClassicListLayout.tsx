"use client";

import React from "react";
import { MenuLayoutProps } from "./types";
import { getMenuItemImageUrl } from "../utils/food-images";
import {
  IconSearch,
  IconArmchair,
  IconClock,
  IconStar,
  IconFlame,
  IconChevronRight,
  IconShare,
  IconAward,
  IconBellRinging,
  IconX,
} from "@tabler/icons-react";

export const ClassicListLayout: React.FC<MenuLayoutProps> = ({
  cafe,
  categories,
  filteredItems,
  activeTableName,
  customerProfile,
  activeOrders = [],
  activeOrderId,
  activeOrderNumber,
  search,
  setSearch,
  selectedCategoryId,
  setSelectedCategoryId,
  dietFilter,
  setDietFilter,
  cart = [],
  cartCount,
  cartTotal,
  onSelectItem,
  onQuickAdd,
  onOpenCart,
  onOpenLiveTracker,
  onOpenProfile,
  onOpenCallStaff,
  onShareMenu,
  digitalMenuTheme,
}) => {
  const hasActiveOrders = Boolean((activeOrders && activeOrders.length > 0) || activeOrderId);
  const activeOrdersCount = activeOrders && activeOrders.length > 0 ? activeOrders.length : activeOrderId ? 1 : 0;
  const singleOrderNumber = activeOrders && activeOrders.length > 0 ? activeOrders[0].orderNumber : activeOrderNumber;
  const formattedOrderNumber = singleOrderNumber
    ? String(singleOrderNumber).replace(/^#+/, "")
    : "Live";
  const latestCartItem = cart && cart.length > 0 ? cart[cart.length - 1] : null;
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] pb-28">
      {/* Brand Header */}
      <header className="sticky top-0 z-30 bg-[var(--color-surface)]/95 backdrop-blur-md border-b border-[var(--color-border)] shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md overflow-hidden bg-white p-1 border border-[var(--color-border-subtle)] flex-shrink-0 flex items-center justify-center shadow-xs">
              {cafe.logoKey ? (
                <img
                  src={cafe.logoKey}
                  alt={cafe.name}
                  width={32}
                  height={32}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xs font-semibold text-[var(--color-primary)]">
                  {cafe.name.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="text-sm font-semibold tracking-tight text-[var(--color-foreground)] truncate">
                {cafe.name}
              </h1>
              {activeTableName ? (
                <div className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-primary)]">
                  <IconArmchair className="w-3 h-3 flex-shrink-0" />
                  <span>{activeTableName}</span>
                </div>
              ) : (
                <div className="text-[10.5px] text-[var(--color-muted)]">
                  Digital Menu
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={onShareMenu}
              className="p-1.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] shadow-xs"
            >
              <IconShare className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onOpenProfile}
              className="px-2.5 py-1.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-medium shadow-xs"
            >
              <IconAward className="w-3.5 h-3.5 text-amber-500 inline mr-1" />
              <span>{customerProfile && !customerProfile.isGuest ? `${customerProfile.loyaltyPoints ?? 0} Pts` : "Sign in"}</span>
            </button>
            <button
              type="button"
              onClick={onOpenCallStaff}
              className="px-2.5 py-1.5 rounded-md bg-amber-500/10 text-amber-700 border border-amber-500/20 text-xs font-medium shadow-xs"
            >
              <IconBellRinging className="w-3.5 h-3.5 inline mr-1" />
              <span>Staff</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 pt-3 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs"
          />
          <IconSearch className="w-4 h-4 text-[var(--color-muted)] absolute left-3 top-2.5" />
        </div>

        {/* Categories Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategoryId("ALL")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors shadow-xs ${
              selectedCategoryId === "ALL"
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)]"
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors shadow-xs inline-flex items-center gap-1.5 ${
                selectedCategoryId === cat.id
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)]"
              }`}
            >
              {cat.imageUrl && (
                <img
                  src={cat.imageUrl}
                  alt=""
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                />
              )}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Item List */}
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            const itemImg = getMenuItemImageUrl(item.imageKey, item.slug, item.name);
            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex items-center justify-between gap-3 hover:border-[var(--color-primary)]/40 transition-colors cursor-pointer"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="font-medium text-xs text-[var(--color-foreground)] truncate">
                    {item.name}
                  </h4>
                  {item.description && (
                    <p className="text-[11px] text-[var(--color-muted)] line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <span className="font-semibold text-xs font-mono text-[var(--color-foreground)]">
                    ₹{item.price}
                  </span>
                </div>
                <div className="w-16 h-16 rounded-md overflow-hidden bg-[var(--color-background)] border border-[var(--color-border-subtle)] flex-shrink-0">
                  <img
                    src={itemImg}
                    alt={item.name}
                    width={64}
                    height={64}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Bottom Bar: Active Orders & Cart */}
      {(hasActiveOrders || cartCount > 0) && (
        <div className="fixed bottom-4 inset-x-4 max-w-2xl mx-auto z-40 flex flex-col items-stretch gap-2 pointer-events-auto">
          {hasActiveOrders && (
            <div className="w-full p-2.5 rounded-lg bg-[#242321] text-white shadow-xl flex items-center justify-between gap-3 border border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-xs font-semibold truncate">
                  {activeOrdersCount > 1
                    ? `${activeOrdersCount} Active Orders`
                    : `Order #${formattedOrderNumber}`}
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenLiveTracker}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-500 text-white shadow-xs shrink-0 hover:bg-emerald-600 transition-colors cursor-pointer"
              >
                Track Live →
              </button>
            </div>
          )}

          {cartCount > 0 && (
            <div className="w-full p-2.5 rounded-lg bg-[var(--color-foreground)] text-[var(--color-background)] shadow-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {latestCartItem && (
                  <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/30 shadow-2xs shrink-0 bg-white">
                    <img
                      src={getMenuItemImageUrl(latestCartItem.menuItem.imageKey, latestCartItem.menuItem.name)}
                      alt={latestCartItem.menuItem.name}
                      width={36}
                      height={36}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 text-left">
                  <span className="block truncate text-xs font-semibold">
                    {latestCartItem
                      ? cart.length > 1
                        ? `${latestCartItem.menuItem.name} + ${cart.length - 1} more`
                        : latestCartItem.menuItem.name
                      : "Cart"}
                  </span>
                  <span className="block text-[11px] opacity-80 font-mono">
                    {cartCount} items • ₹{cartTotal}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenCart}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-[var(--color-primary)] text-white shadow-xs shrink-0 cursor-pointer flex items-center gap-1"
              >
                <span>View Cart</span>
                <IconChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
