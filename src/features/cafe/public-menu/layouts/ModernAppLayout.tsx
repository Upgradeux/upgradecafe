"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { MenuLayoutProps } from "./types";
import {
  getMenuItemImageUrl,
  getCategoryVisualConfig,
} from "../utils/food-images";
import { transitionNavigate } from "../utils/transitions";
import {
  IconSearch,
  IconAdjustmentsHorizontal,
  IconArmchair,
  IconMapPin,
  IconBell,
  IconHeart,
  IconShoppingBag,
  IconHome,
  IconSmartHome,
  IconTag,
  IconShoppingCart,
  IconMessageDots,
  IconClock,
  IconUser,
  IconStar,
  IconSparkles,
  IconPlus,
  IconMinus,
  IconCheck,
  IconX,
  IconChevronRight,
  IconChevronDown,
  IconChevronUp,
  IconArrowBackUp,
  IconToolsKitchen2,
  IconLayoutGrid,
  IconLeaf,
  IconClipboardList,
  IconDownload,
  IconWallet,
  IconGift,
} from "@tabler/icons-react";
import { DEFAULT_HOME_SECTIONS, HomeSectionConfig } from "@/lib/db/schema/cafe-settings";
import { MenuItem } from "@/lib/db/schema/menu-items";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import { FeaturedSectionRenderer } from "../components/sections/FeaturedSectionRenderer";
import { OffersSectionRenderer } from "../components/sections/OffersSectionRenderer";
import { PopularSectionRenderer } from "../components/sections/PopularSectionRenderer";
import { PopularItemCard } from "../components/PopularItemCard";
import { MemberWalletModal } from "../components/MemberWalletModal";
import { GetAppModal } from "../components/GetAppModal";
import { calculatePopularItems } from "../utils/popular-calculator";

export const ModernAppLayout: React.FC<MenuLayoutProps> = ({
  cafe,
  categories,
  menuItems,
  filteredItems,
  bestsellers,
  popularItems: passedPopularItems,
  salesStats30d = {},
  activeTableName,
  customerProfile,
  activeOrders = [],
  activeOrderId,
  activeOrderNumber,
  homeSections,
  offers = [],
  pastOrders,
  digitalMenuTheme,
  isAllMenuPage = false,
  initialBottomTab,
  isOffersOpen,
  deferredPrompt,
  search,
  setSearch,
  selectedCategoryId,
  setSelectedCategoryId,
  dietFilter,
  setDietFilter,
  favorites,
  toggleFavorite,
  cart,
  cartCount,
  cartTotal,
  onSelectItem,
  onQuickAdd,
  onQuickMinus,
  onOpenCart,
  onOpenOrders,
  onOpenLiveTracker,
  onOpenProfile,
  onOpenOffers,
  onClaimOffer,
  claimedOfferCodes,
  appliedOfferCode,
  menuItemNamesById,
  categoryNamesById,
  onOpenCallStaff,
}) => {
  const router = useRouter();
  const tableQuery = activeTableName ? `?table=${encodeURIComponent(activeTableName)}` : "";

  const [showFilters, setShowFilters] = useState(false);
  const [currentMainTab, setCurrentMainTab] = useState<"home" | "menu">(
    isAllMenuPage ? "menu" : "home"
  );
  const [activeBottomTab, setActiveBottomTab] = useState<
    "home" | "menu" | "offers" | "orders" | "cart" | "profile" | "get_app" | "wallet" | "rewards"
  >(initialBottomTab || (isAllMenuPage ? "menu" : "home"));

  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isGetAppOpen, setIsGetAppOpen] = useState(false);

  // Detect PWA Installation status (standalone mode or previously recorded install)
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const checkInstalled = () => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches;
      const iosStandalone = (window.navigator as any).standalone === true;
      const localFlag = localStorage.getItem(`cafe_pwa_installed_${cafe.slug}`) === "true";
      setIsAppInstalled(Boolean(standalone || iosStandalone || localFlag));
    };

    checkInstalled();

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      try {
        localStorage.setItem(`cafe_pwa_installed_${cafe.slug}`, "true");
      } catch {}
    };

    window.addEventListener("appinstalled", handleAppInstalled);
    return () => window.removeEventListener("appinstalled", handleAppInstalled);
  }, [cafe.slug]);

  // Synchronize browser history and bottom dock seamlessly on back/forward
  React.useEffect(() => {
    const handlePopState = () => {
      if (typeof window === "undefined") return;
      const path = window.location.pathname;
      if (path.includes("/all-menu")) {
        setActiveBottomTab("menu");
        setCurrentMainTab("menu");
      } else if (path.endsWith(`/menu/${cafe.slug}`) || path.endsWith(`/menu/${cafe.slug}/`)) {
        setActiveBottomTab("home");
        setCurrentMainTab("home");
        setSelectedCategoryId("ALL");
        setDietFilter("ALL");
        setSearch("");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [cafe.slug, setSelectedCategoryId, setDietFilter, setSearch]);

  // When offers modal closes, return active dock pill to currentMainTab smoothly
  React.useEffect(() => {
    if (isOffersOpen === false && activeBottomTab === "offers") {
      setActiveBottomTab(currentMainTab);
    }
  }, [isOffersOpen, currentMainTab, activeBottomTab]);

  const [showAllPopular, setShowAllPopular] = useState(false);
  const [isStackedPillsOpen, setIsStackedPillsOpen] = useState(false);

  const visualTheme = getDigitalMenuVisualTheme(digitalMenuTheme || "roast");

  const hasActiveOrders = Boolean((activeOrders && activeOrders.length > 0) || activeOrderId);
  const activeOrdersCount = activeOrders && activeOrders.length > 0 ? activeOrders.length : activeOrderId ? 1 : 0;
  const singleOrderNumber = activeOrders && activeOrders.length > 0 ? activeOrders[0].orderNumber : activeOrderNumber;
  const formattedOrderNumber = singleOrderNumber
    ? String(singleOrderNumber).replace(/^#+/, "")
    : "Live";
  const hasCart = cartCount > 0;
  const latestCartItem = cart && cart.length > 0 ? cart[cart.length - 1] : null;
  const previousCartItem = cart && cart.length > 1 ? cart[cart.length - 2] : null;

  const themeRgb = React.useMemo(() => {
    const hex = (visualTheme.avatarFallbackBg || "#FF6FAE").replace("#", "");
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
      };
    }
    return { r: 255, g: 111, b: 174 };
  }, [visualTheme.avatarFallbackBg]);

  const themeLighterLinear = React.useMemo(() => {
    const { r, g, b } = themeRgb;
    const blend = (weight: number) => {
      const red = Math.round(r * weight + 255 * (1 - weight));
      const green = Math.round(g * weight + 255 * (1 - weight));
      const blue = Math.round(b * weight + 255 * (1 - weight));
      return `rgb(${red}, ${green}, ${blue})`;
    };

    return {
      start: blend(0.24), // soft luminous tint of primary theme color
      mid: blend(0.14),   // gentle mid tone transition
      end: blend(0.06),   // near-white luminous porcelain tone
      border: `rgba(${r}, ${g}, ${b}, 0.28)`,
      borderDark: `rgba(${r}, ${g}, ${b}, 0.16)`,
    };
  }, [themeRgb]);

  // Calculate qualifying popular items (top 50% of actively selling items, capped at 12)
  const popularList = React.useMemo(() => {
    if (passedPopularItems && passedPopularItems.length > 0) {
      return passedPopularItems;
    }
    return calculatePopularItems(menuItems, salesStats30d);
  }, [passedPopularItems, menuItems, salesStats30d]);

  const activeSections = React.useMemo(() => {
    const rawList = homeSections && homeSections.length > 0 ? homeSections : DEFAULT_HOME_SECTIONS;
    return [...rawList]
      .filter((s) => s.enabled !== false)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [homeSections]);

  const offersSection = React.useMemo(() => {
    return activeSections.find((s) => s.type === "OFFERS" && s.enabled !== false);
  }, [activeSections]);

  const rewardsSection = React.useMemo(() => {
    return activeSections.find((s) => s.type === "REWARDS" && s.enabled !== false);
  }, [activeSections]);

  const isDefaultHomeView =
    (activeBottomTab === "home" || (activeBottomTab === "offers" && currentMainTab === "home")) &&
    selectedCategoryId === "ALL" &&
    !search.trim() &&
    dietFilter === "ALL";

  const selectedCategoryName =
    selectedCategoryId === "ALL"
      ? (activeBottomTab === "menu" ? "All Dishes" : "Popular Food")
      : categories.find((c) => c.id === selectedCategoryId)?.name || "Menu Selection";

  return (
    <div className="min-h-screen bg-[var(--cafe-background)] text-[var(--color-foreground)] pb-24 relative overflow-x-hidden selection:bg-[var(--color-primary-light)]">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. RICH THEMED GRADIENT & AMBIENT BLOOM BACKDROP
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="absolute top-0 inset-x-0 h-[460px] pointer-events-none -z-0 overflow-hidden select-none">
        {/* Soft atmospheric base gradient */}
        <div className={`absolute inset-0 bg-gradient-to-b ${visualTheme.backdropBase}`} />

        {/* Top-center lush radial bloom */}
        <div className={`absolute -top-20 left-1/2 -translate-x-1/2 w-[420px] h-[360px] rounded-full bg-gradient-to-b ${visualTheme.radialBloom} blur-3xl`} />

        {/* Top-left subtle warmth */}
        <div
          className="absolute -top-12 -left-12 w-72 h-72 rounded-full blur-3xl"
          style={{ backgroundColor: visualTheme.radialWarmth, opacity: 0.6 }}
        />

        {/* Top-right soft glow */}
        <div
          className="absolute -top-12 -right-12 w-72 h-72 rounded-full blur-3xl"
          style={{ backgroundColor: visualTheme.radialGlow, opacity: 0.35 }}
        />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. TOP HEADER BAR: Left Cafe Logo & Name | Right Glass Capsule Pill
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="sticky top-0 z-30 px-4 pt-4 pb-2 transition-colors">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {/* Left: Cafe Logo (No background plate, inset effect & inner shadow) + Cafe Name & Table Info */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo: Image only with inset effect and inner shadow */}
            {cafe.logoKey ? (
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/60 shadow-[0_3px_12px_rgba(0,0,0,0.08)]">
                <img
                  src={cafe.logoKey}
                  alt={cafe.name}
                  width={48}
                  height={48}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                {/* Inset specular highlight and inner shadow */}
                <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-2px_4px_rgba(0,0,0,0.22)] pointer-events-none" />
              </div>
            ) : (
              <div
                className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold text-sm border border-white/60"
                style={{
                  backgroundColor: visualTheme.avatarFallbackBg,
                  boxShadow: `0 3px 12px ${visualTheme.badgeBorder}`,
                }}
              >
                {cafe.name.substring(0, 2).toUpperCase()}
                <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.3)] pointer-events-none" />
              </div>
            )}

            {/* Cafe Name & Table info (Location removed) */}
            <div className="min-w-0">
              <h1 className="text-base sm:text-[17px] font-bold text-[#1C1D1A] tracking-tight leading-snug truncate font-heading">
                {cafe.name}
              </h1>
              {activeTableName ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-tight"
                    style={{
                      backgroundColor: visualTheme.badgeBg,
                      borderColor: visualTheme.badgeBorder,
                      borderWidth: 1,
                      color: visualTheme.badgeText,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: visualTheme.avatarFallbackBg }}
                    />
                    {activeTableName}
                  </span>
                </div>
              ) : (
                <span className="text-[11px] font-medium text-[#73716B] tracking-tight block mt-0.5">
                  Digital Menu
                </span>
              )}
            </div>
          </div>

          {/* Right: Compact Contoured Glass Capsule (Avatar big, left side slightly smaller, snug spacing with subtle center bend) */}
          <div className="relative w-[88px] h-[48px] flex items-center justify-between flex-shrink-0 select-none">
            {/* Frosted Glass Backdrop with matching clipped contour */}
            <div
              className="absolute inset-0 backdrop-blur-xl bg-white/45 pointer-events-none"
              style={{
                clipPath: "path('M 19,6 C 28,6 33,8 39,8 C 47,8 54,2 63,2 A 22,22 0 0,1 63,46 C 54,46 47,40 39,40 C 33,40 28,42 19,42 A 18,18 0 0,1 19,6 Z')",
              }}
            />

            {/* SVG Contoured Border with Subtle Top/Bottom Center Bend & Snug Proportions */}
            <svg
              viewBox="0 0 88 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
              preserveAspectRatio="none"
            >
              {/* Base path stroke & semi-transparent tint */}
              <path
                d="M 19,6 C 28,6 33,8 39,8 C 47,8 54,2 63,2 A 22,22 0 0,1 63,46 C 54,46 47,40 39,40 C 33,40 28,42 19,42 A 18,18 0 0,1 19,6 Z"
                className="fill-white/35 stroke-white/80"
                strokeWidth="1.5"
              />
              {/* Top Specular Ridge Highlight */}
              <path
                d="M 20,7.5 C 28,7.5 33,9.5 39,9.5 C 47,9.5 54,3.5 62,3.5"
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              {/* Bottom Soft Inner Ambient Shadow */}
              <path
                d="M 62,44.5 C 54,44.5 47,38.5 39,38.5 C 33,38.5 28,40.5 20,40.5"
                stroke="rgba(0, 0, 0, 0.05)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>

            {/* Left: Call Staff Bell inside slightly smaller round bulb */}
            <button
              type="button"
              onClick={onOpenCallStaff}
              title="Call Staff / Assistance"
              className="relative z-10 w-8 h-8 ml-1 flex items-center justify-center text-[#1C1D1A] hover:opacity-80 active:scale-90 transition-all focus:outline-none cursor-pointer"
            >
              <IconBell className="w-4.5 h-4.5 stroke-[1.8]" />
            </button>

            {/* Right: Big User Profile Avatar in larger round bulb */}
            <button
              type="button"
              onClick={onOpenProfile}
              title="Customer Profile & Rewards"
              className="relative z-10 w-[42px] h-[42px] mr-0.5 rounded-full overflow-hidden border border-white/90 shadow-xs flex-shrink-0 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform focus:outline-none cursor-pointer"
              style={{ backgroundColor: visualTheme.avatarFallbackBg }}
            >
              {customerProfile && !customerProfile.isGuest ? (
                customerProfile.avatarUrl ? (
                  <img
                    src={customerProfile.avatarUrl}
                    alt={customerProfile.name}
                    width={32}
                    height={32}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-xs text-white">
                    {customerProfile.name.substring(0, 2).toUpperCase()}
                  </span>
                )
              ) : (
                <img
                  src="/avatar-3d.jpg"
                  alt="3D Avatar"
                  width={32}
                  height={32}
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 pt-2 space-y-4 relative z-10">
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            3. FROSTED GLASS SEARCH BAR WITH INSET GLOW
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="relative flex items-center h-12 sm:h-13 px-4 rounded-full bg-white/40 backdrop-blur-xl border border-white/70 shadow-[inset_0_2px_4px_rgba(255,255,255,0.85),inset_0_-1.5px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.04)] focus-within:ring-2 focus-within:ring-[var(--cafe-primary)]/30 transition-all">
          <IconSearch className="w-5 h-5 text-[#73716B] flex-shrink-0 stroke-[1.8]" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent px-3 text-sm text-[#1C1D1A] placeholder-[#8C8A84] focus:outline-none font-normal"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="p-1 text-[#8C8A84] hover:text-[#1C1D1A]"
            >
              <IconX className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
              showFilters || dietFilter !== "ALL"
                ? "text-white"
                : "text-[#4A4B48] hover:bg-black/5"
            }`}
            style={
              showFilters || dietFilter !== "ALL"
                ? { backgroundColor: visualTheme.avatarFallbackBg }
                : undefined
            }
          >
            <IconAdjustmentsHorizontal className="w-5 h-5 stroke-[1.8]" />
          </button>
        </div>

        {/* Dietary Filters Pill Strip */}
        {(showFilters || dietFilter !== "ALL") && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 no-scrollbar animate-in fade-in slide-in-from-top-1 text-xs">
            {[
              {
                id: "ALL" as const,
                label: "All Items",
                activeCls: "font-semibold shadow-xs",
                inactiveCls:
                  "bg-white/90 text-[#333530] border-black/10 font-medium shadow-2xs hover:bg-black/5",
                activeStyle: {
                  backgroundColor: visualTheme.badgeBg,
                  color: visualTheme.badgeText,
                  borderColor: visualTheme.badgeBorder,
                },
                icon: (
                  <IconLayoutGrid
                    className="w-3.5 h-3.5 stroke-[2] shrink-0"
                    style={{ color: visualTheme.avatarFallbackBg }}
                  />
                ),
              },
              {
                id: "VEG" as const,
                label: "Veg Only",
                activeCls:
                  "bg-emerald-50/80 text-emerald-950 border-emerald-200/80 font-semibold shadow-xs",
                inactiveCls:
                  "bg-white/90 hover:bg-emerald-50/40 text-[#333530] hover:text-emerald-900 border-emerald-100/60 font-medium shadow-2xs",
                icon: (
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
                    <rect
                      x="1"
                      y="1"
                      width="14"
                      height="14"
                      rx="3.5"
                      stroke="#16a34a"
                      strokeWidth="1.8"
                      fill="#ffffff"
                    />
                    <circle cx="8" cy="8" r="3.8" fill="#16a34a" />
                  </svg>
                ),
              },
              {
                id: "NON_VEG" as const,
                label: "Non-Veg",
                activeCls:
                  "bg-rose-50/80 text-rose-950 border-rose-200/80 font-semibold shadow-xs",
                inactiveCls:
                  "bg-white/90 hover:bg-rose-50/40 text-[#333530] hover:text-rose-900 border-rose-100/60 font-medium shadow-2xs",
                icon: (
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
                    <rect
                      x="1"
                      y="1"
                      width="14"
                      height="14"
                      rx="3.5"
                      stroke="#e11d48"
                      strokeWidth="1.8"
                      fill="#ffffff"
                    />
                    <polygon points="8,3.8 12.2,11.8 3.8,11.8" fill="#e11d48" />
                  </svg>
                ),
              },
              {
                id: "VEGAN" as const,
                label: "Vegan",
                activeCls:
                  "bg-teal-50/80 text-teal-950 border-teal-200/80 font-semibold shadow-xs",
                inactiveCls:
                  "bg-white/90 hover:bg-teal-50/40 text-[#333530] hover:text-teal-900 border-teal-100/60 font-medium shadow-2xs",
                icon: (
                  <IconLeaf className="w-3.5 h-3.5 stroke-[2] shrink-0 text-teal-600" />
                ),
              },
              {
                id: "BESTSELLER" as const,
                label: "Popular",
                activeCls:
                  "bg-amber-50/80 text-amber-950 border-amber-200/80 font-semibold shadow-xs",
                inactiveCls:
                  "bg-white/90 hover:bg-amber-50/40 text-[#333530] hover:text-amber-900 border-amber-100/60 font-medium shadow-2xs",
                icon: (
                  <IconStar className="w-3.5 h-3.5 shrink-0 stroke-[1.2] fill-amber-400 text-amber-500" />
                ),
              },
            ].map((f) => {
              const isActive = dietFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() =>
                    setDietFilter(
                      isActive && f.id !== "ALL" ? "ALL" : (f.id as any)
                    )
                  }
                  style={isActive && "activeStyle" in f ? (f as any).activeStyle : undefined}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full whitespace-nowrap text-xs border cursor-pointer outline-none focus:outline-none transition-all duration-150 select-none active:scale-[0.97] ${
                    isActive ? f.activeCls : f.inactiveCls
                  }`}
                >
                  {f.icon}
                  <span className="leading-none">{f.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            4. CATEGORIES: ROUND PILLS WITH ACCENT RINGS
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="pt-1 pb-2">
          <div className="-mx-4 px-4 py-2.5 flex items-start gap-4 sm:gap-5 overflow-x-auto no-scrollbar horizontal-scroll-touch touch-pan-x overscroll-x-contain">
            {/* "All" Category Perfect Circle */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryId("ALL");
                setDietFilter("ALL");
                setSearch("");
              }}
              className="flex flex-col items-center flex-shrink-0 group focus:outline-none cursor-pointer"
            >
              <div
                className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full relative flex items-center justify-center transition-all duration-200 backdrop-blur-xl bg-white/40 border border-white/70 shadow-[inset_0_2px_4px_rgba(255,255,255,0.85),inset_0_-1.5px_3px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.04)] ${
                  selectedCategoryId === "ALL"
                    ? "scale-105"
                    : "group-hover:scale-105 group-active:scale-95"
                }`}
                style={
                  selectedCategoryId === "ALL"
                    ? {
                        boxShadow: `0 0 0 2px rgba(255,255,255,0.95), 0 0 0 4px ${visualTheme.avatarFallbackBg}`,
                      }
                    : undefined
                }
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center"
                  style={{ color: visualTheme.avatarFallbackBg }}
                >
                  <IconSparkles className="w-6 h-6" />
                </div>
                <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.85),inset_0_-1.5px_3px_rgba(0,0,0,0.04)] pointer-events-none" />
              </div>
              <span
                className={`text-xs sm:text-[13px] text-center mt-2 truncate max-w-[76px] tracking-tight leading-snug transition-colors ${
                  selectedCategoryId === "ALL"
                    ? "font-bold text-[#1C1D1A]"
                    : "font-medium text-[#383A35] group-hover:text-[#1C1D1A]"
                }`}
              >
                All
              </span>
            </button>

            {/* Each Dish Category */}
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              const { imageUrl } = getCategoryVisualConfig(cat.slug, cat.name, cat.imageUrl);

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className="flex flex-col items-center flex-shrink-0 group focus:outline-none cursor-pointer"
                >
                  <div
                    className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden relative transition-all duration-200 backdrop-blur-xl border border-white/70 shadow-[inset_0_2px_4px_rgba(255,255,255,0.85),inset_0_-1.5px_3px_rgba(0,0,0,0.12),0_6px_20px_rgba(0,0,0,0.04)] ${
                      isSelected
                        ? "scale-105"
                        : "group-hover:scale-105 group-active:scale-95"
                    }`}
                    style={
                      isSelected
                        ? {
                            boxShadow: `0 0 0 2px rgba(255,255,255,0.95), 0 0 0 4px ${visualTheme.avatarFallbackBg}`,
                          }
                        : undefined
                    }
                  >
                    <img
                      src={imageUrl}
                      alt={cat.name}
                      width={72}
                      height={72}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-[0.5px] pointer-events-none" />
                    <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.85),inset_0_-1.5px_3px_rgba(0,0,0,0.18)] pointer-events-none" />
                  </div>

                  <span
                    className={`text-xs sm:text-[13px] text-center mt-2 truncate max-w-[76px] tracking-tight leading-snug transition-colors ${
                      isSelected
                        ? "font-bold text-[#1C1D1A]"
                        : "font-medium text-[#383A35] group-hover:text-[#1C1D1A]"
                    }`}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            5. SEPARATE STANDALONE SECTIONS
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <AnimatePresence mode="wait" initial={false}>
          {isDefaultHomeView ? (
            <motion.div
              key="home-sections-view"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6 pt-1"
            >
            {activeSections
              .filter((sec) => sec.type !== "CATEGORIES")
              .map((sec) => {
                switch (sec.type) {
                  case "FEATURED": {
                    return (
                      <FeaturedSectionRenderer
                        key={sec.id}
                        section={sec}
                        menuItems={menuItems}
                        bestsellers={bestsellers}
                        cart={cart}
                        digitalMenuTheme={digitalMenuTheme}
                        onSelectItem={onSelectItem}
                        onQuickAdd={onQuickAdd}
                        onQuickMinus={onQuickMinus}
                      />
                    );
                  }

                  case "POPULAR": {
                    return (
                      <PopularSectionRenderer
                        key={sec.id}
                        section={sec}
                        popularItems={popularList}
                        totalMenuItemsCount={menuItems.length}
                        digitalMenuTheme={digitalMenuTheme}
                        cart={cart}
                        favorites={favorites}
                        showAllPopular={showAllPopular}
                        onToggleShowAllPopular={() => setShowAllPopular(!showAllPopular)}
                        onViewAllMenu={() => {
                          setActiveBottomTab("menu");
                          setCurrentMainTab("menu");
                          if (typeof window !== "undefined") {
                            window.history.pushState(null, "", `/menu/${cafe.slug}/all-menu${tableQuery}`);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                        onSelectItem={onSelectItem}
                        onQuickAdd={onQuickAdd}
                        onQuickMinus={onQuickMinus}
                        onToggleFavorite={toggleFavorite}
                      />
                    );
                  }

                  case "TODAYS_PICKS": {
                    const picks =
                      bestsellers.length >= 3 ? bestsellers.slice(1, 6) : menuItems.slice(0, 5);
                    if (picks.length === 0) return null;

                    return (
                      <section key={sec.id} className="w-full relative -mt-16 sm:-mt-18 z-10">
                        <div className="relative -mx-4 pt-1">
                          {/* Symmetrical Center Dip Top Divider */}
                          <div className="w-full h-7 sm:h-8 overflow-hidden leading-none select-none pointer-events-none -mb-1">
                            <svg
                              viewBox="0 0 400 28"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-full h-full block"
                              style={{ color: visualTheme.accentSurface }}
                              preserveAspectRatio="none"
                            >
                              <path
                                d="M 0,28 L 0,22 C 0,10 18,0 48,0 C 90,0 120,14 200,14 C 280,14 310,0 352,0 C 382,0 400,10 400,22 L 400,28 Z"
                                fill="currentColor"
                              />
                            </svg>
                          </div>

                          {/* Today's Picks Surface Container in Palette Accent Surface */}
                          <div
                            className="px-4 pt-2 pb-3 space-y-3.5"
                            style={{ backgroundColor: visualTheme.accentSurface }}
                          >
                            <div className="flex items-center justify-between px-1">
                              <div>
                                <h3 className="text-base sm:text-lg font-bold text-[#1C1D1A] tracking-tight font-heading">
                                  {sec.title || "Today's Picks"}
                                </h3>
                                <p
                                  className="text-[11px] font-semibold"
                                  style={{ color: visualTheme.accentSurfaceSubtext }}
                                >
                                  {sec.subtitle || "Curated by our baristas"}
                                </p>
                              </div>
                            </div>

                            {/* Horizontal Carousel of Slightly Big Rectangular Cards with Center Bend */}
                            <div className="-mx-4 px-4 flex items-center gap-3.5 overflow-x-auto no-scrollbar pb-4 pt-2 snap-x snap-mandatory scroll-smooth">
                              {picks.map((item, idx) => {
                                const itemImg = getMenuItemImageUrl(item.imageKey, item.slug, item.name);
                                const isFav = favorites.includes(item.id);
                                const inCart = cart.find((c) => c.menuItem.id === item.id);

                                return (
                                  <div
                                    key={item.id}
                                    onClick={(e) => {
                                      const target = e.target as HTMLElement | null;
                                      if (target && target.closest("button, [data-interactive='true']")) {
                                        return;
                                      }
                                      onSelectItem(item);
                                    }}
                                    className={`flex-shrink-0 w-56 sm:w-60 relative p-3 sm:p-3.5 min-h-[255px] sm:min-h-[265px] flex flex-col justify-between group cursor-pointer snap-center transition-all duration-300 ease-out hover:!rotate-0 hover:scale-[1.04] active:scale-[0.97] ${idx % 2 === 0 ? '-rotate-[2deg]' : 'rotate-[2deg]'}`}
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                  >
                                    {/* Rectangular Card Surface with Top Center Bend */}
                                    <svg
                                      viewBox="0 0 240 260"
                                      preserveAspectRatio="none"
                                      className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                                      style={{ color: visualTheme.cardBg }}
                                    >
                                      <path
                                        d="M 0,24 C 0,10 10,0 24,0 C 65,0 85,8 120,8 C 155,8 175,0 216,0 C 230,0 240,10 240,24 L 240,236 C 240,250 230,260 216,260 L 24,260 C 10,260 0,250 0,236 Z"
                                        fill="currentColor"
                                        stroke="rgba(0, 0, 0, 0.04)"
                                        strokeWidth="1"
                                      />
                                    </svg>

                                    <div className="relative z-10 flex flex-col justify-between h-full space-y-2">
                                      {/* Top Row: Dietary Dot, Star Badge, Heart Favorite */}
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
                                          <span
                                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[9px] font-semibold"
                                            style={{
                                              backgroundColor: visualTheme.badgeBg,
                                              color: visualTheme.badgeText,
                                            }}
                                          >
                                            <IconSparkles className="w-2.5 h-2.5 fill-current" />
                                            Pick
                                          </span>
                                        </div>

                                        <button
                                          type="button"
                                          data-interactive="true"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            toggleFavorite(item.id);
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

                                      {/* Landscape Rectangular Image */}
                                      <div className="w-full h-32 sm:h-34 rounded-xl overflow-hidden relative my-1 bg-[#F5F5F3] border border-black/[0.03]">
                                        <img
                                          src={itemImg}
                                          alt={item.name}
                                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                          loading="lazy"
                                          decoding="async"
                                        />
                                        <div className="absolute inset-0 rounded-xl shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.7),inset_0_-1.5px_2px_rgba(0,0,0,0.08)] pointer-events-none" />
                                      </div>

                                      {/* Title, Price, Stepper / Add Button */}
                                      <div>
                                        <h4 className="font-bold text-xs sm:text-[13px] text-[#1C1D1A] truncate font-heading">
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
                                                  onQuickAdd(item);
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
                                                onQuickAdd(item);
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
                              })}
                            </div>
                          </div>

                          {/* Symmetrical Center Bend Bottom Divider */}
                          <div className="w-full h-7 sm:h-8 overflow-hidden leading-none select-none pointer-events-none -mt-1 rotate-180">
                            <svg
                              viewBox="0 0 400 28"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-full h-full block"
                              style={{ color: visualTheme.accentSurface }}
                              preserveAspectRatio="none"
                            >
                              <path
                                d="M 0,28 L 0,22 C 0,10 18,0 48,0 C 90,0 120,14 200,14 C 280,14 310,0 352,0 C 382,0 400,10 400,22 L 400,28 Z"
                                fill="currentColor"
                              />
                            </svg>
                          </div>
                        </div>
                      </section>
                    );
                  }

                  case "OFFERS": {
                    return (
                      <OffersSectionRenderer
                        key={sec.id}
                        section={sec}
                        offers={offers}
                        digitalMenuTheme={digitalMenuTheme}
                        onOpenOffers={onOpenOffers}
                        onClaimOffer={onClaimOffer}
                        claimedOfferCodes={claimedOfferCodes}
                        appliedOfferCode={appliedOfferCode}
                        cafeName={cafe.name}
                        cafeSlug={cafe.slug}
                        orderType={activeTableName ? "DINE_IN" : undefined}
                        cart={cart}
                        cartSubtotal={cartTotal}
                        customerProfile={customerProfile}
                        hasPastOrders={pastOrders && pastOrders.length > 0}
                        menuItemNamesById={menuItemNamesById}
                        categoryNamesById={categoryNamesById}
                      />
                    );
                  }

                  case "REWARDS": {
                    const isLoggedIn = Boolean(customerProfile && !customerProfile.isGuest);
                    const isStampsMode =
                      typeof window !== "undefined" &&
                      localStorage.getItem(`cafe_loyalty_mode_${cafe.slug}`) === "STAMPS";

                    return (
                      <section key={sec.id} className="w-full">
                        <div
                          onClick={() => onOpenProfile?.()}
                          className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br ${visualTheme.bannerGradient} border border-black/5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),0_4px_16px_rgba(0,0,0,0.04)] cursor-pointer group hover:shadow-md transition-shadow`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-amber-500 font-bold text-xs">
                                  {isStampsMode ? "⚡" : "★"}
                                </span>
                                <span
                                  className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider"
                                  style={{ color: visualTheme.badgeText }}
                                >
                                  {isStampsMode
                                    ? isLoggedIn
                                      ? "★ Bean Club Stamps"
                                      : "Bean Club Stamps"
                                    : isLoggedIn
                                    ? `★ ${customerProfile?.memberTier || "Member"}`
                                    : "Bean Club Rewards"}
                                </span>
                              </div>

                              <div className="text-base sm:text-lg font-bold text-[#1C1D1A] tracking-tight">
                                {isStampsMode
                                  ? isLoggedIn
                                    ? `${customerProfile?.stampsCollected ?? 0} / ${
                                        customerProfile?.stampsRequired ?? 0
                                      } Stamps Collected`
                                    : "Collect stamps with every sip"
                                  : isLoggedIn
                                  ? `${customerProfile?.loyaltyPoints ?? 0} Points Available`
                                  : "Earn points with every sip"}
                              </div>

                              <p className="text-[11px] sm:text-xs text-[#555850] leading-snug">
                                {isStampsMode
                                  ? isLoggedIn
                                    ? "Collect 2 more stamps to get a free coffee!"
                                    : "Collect stamps every time you order & unlock free rewards."
                                  : isLoggedIn
                                  ? "Here's what you've earned and what you can unlock next."
                                  : "Earn points every time you order & unlock free rewards."}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenProfile?.();
                              }}
                              className="flex-shrink-0 inline-flex items-center gap-1 px-3.5 py-2 rounded-full bg-[#242321] text-white text-xs font-semibold shadow-xs cursor-pointer group-hover:scale-105 transition-transform"
                            >
                              <span>
                                {isStampsMode
                                  ? isLoggedIn
                                    ? "View Stamps"
                                    : "Join Stamps"
                                  : isLoggedIn
                                  ? "View Rewards"
                                  : "Join Rewards"}
                              </span>
                              <IconChevronRight className="w-3.5 h-3.5 stroke-[2.2]" />
                            </button>
                          </div>
                        </div>
                      </section>
                    );
                  }

                  case "RECENTLY_ORDERED": {
                    if (!pastOrders || pastOrders.length === 0) return null;

                    const pastItems: MenuItem[] = [];
                    const seenIds = new Set<string>();

                    for (const order of pastOrders) {
                      if (order.items && order.items.length > 0) {
                        for (const it of order.items) {
                          if (!seenIds.has(it.menuItemId)) {
                            seenIds.add(it.menuItemId);
                            const found = menuItems.find((m) => m.id === it.menuItemId);
                            if (found) pastItems.push(found);
                          }
                        }
                      }
                    }

                    if (pastItems.length === 0) {
                      bestsellers.slice(0, 3).forEach((item) => pastItems.push(item));
                    }

                    if (pastItems.length === 0) return null;

                    return (
                      <section key={sec.id} className="w-full space-y-2.5">
                        <div className="flex items-center justify-between px-1">
                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-[#1C1D1A] tracking-tight">
                              {sec.title || "Order Again"}
                            </h3>
                            <p className="text-[11px] text-[#73716B]">
                              {sec.subtitle || "Quickly reorder your past favorites"}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {pastItems.slice(0, 3).map((item) => {
                            const itemImg = getMenuItemImageUrl(item.imageKey, item.slug, item.name);
                            const inCart = cart.find((c) => c.menuItem.id === item.id);

                            return (
                              <div
                                key={item.id}
                                onClick={(e) => {
                                  const target = e.target as HTMLElement | null;
                                  if (target && target.closest("button, [data-interactive='true']")) {
                                    return;
                                  }
                                  onSelectItem(item);
                                }}
                                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-black/5 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer group"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-12 h-12 rounded-xl overflow-hidden relative flex-shrink-0 bg-[#E8EDE6]">
                                    <img
                                      src={itemImg}
                                      alt={item.name}
                                      width={48}
                                      height={48}
                                      loading="lazy"
                                      decoding="async"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs sm:text-[13px] font-semibold text-[#1C1D1A] truncate">
                                      {item.name}
                                    </h4>
                                    <span className="text-xs font-bold font-mono text-[#1C1D1A]">
                                      ₹{item.price}
                                    </span>
                                  </div>
                                </div>

                                {inCart ? (
                                  <div
                                    data-interactive="true"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="h-7 px-1.5 rounded-full text-white flex items-center gap-1.5"
                                    style={{ backgroundColor: visualTheme.avatarFallbackBg }}
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
                                      className="w-4 h-4 flex items-center justify-center hover:bg-white/20 rounded-full"
                                    >
                                      <IconMinus className="w-3.5 h-3.5 stroke-[2.5] pointer-events-none" />
                                    </button>
                                    <span className="text-[11px] font-bold font-mono min-w-[12px] text-center select-none pointer-events-none">
                                      {inCart.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      data-interactive="true"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        onQuickAdd(item);
                                      }}
                                      onPointerDown={(e) => e.stopPropagation()}
                                      className="w-4 h-4 flex items-center justify-center hover:bg-white/20 rounded-full"
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
                                      onQuickAdd(item);
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95"
                                    style={{ backgroundColor: visualTheme.avatarFallbackBg }}
                                  >
                                    <IconPlus className="w-3.5 h-3.5 stroke-[2.5] pointer-events-none" />
                                    <span>Add Again</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  }

                  default:
                    return null;
                }
              })}
            </motion.div>
          ) : (
            /* Filtered / Category Browsing View */
            <motion.div
              key={`menu-sections-view-${activeBottomTab === "menu" ? "all-menu" : selectedCategoryId}-${dietFilter}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4 pt-1"
            >
            <div className="relative -mx-4 pt-1">
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

              <div className="bg-white px-4 pt-2 pb-6 shadow-xs rounded-b-3xl space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#1C1D1A] tracking-tight font-heading">
                      {activeBottomTab === "menu" && selectedCategoryId === "ALL" && !search.trim()
                        ? "Full Café Menu"
                        : selectedCategoryName}
                    </h3>
                    <p className="text-[11px] text-[#73716B]">
                      {filteredItems.length} {filteredItems.length === 1 ? "dish" : "dishes"} available
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveBottomTab("home");
                      setCurrentMainTab("home");
                      setSelectedCategoryId("ALL");
                      setDietFilter("ALL");
                      setSearch("");
                      if (typeof window !== "undefined") {
                        window.history.pushState(null, "", `/menu/${cafe.slug}${tableQuery}`);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className="text-xs font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    style={{ color: visualTheme.avatarFallbackBg }}
                  >
                    <IconArrowBackUp className="w-3.5 h-3.5" />
                    <span>Home View</span>
                  </button>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-[var(--cafe-background)] border border-dashed border-black/10 text-xs text-[#73716B] space-y-2">
                    <p>No dishes found matching your selection.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId("ALL");
                        setDietFilter("ALL");
                        setSearch("");
                      }}
                      className="px-3 py-1 rounded-full text-white text-xs font-semibold cursor-pointer"
                      style={{ backgroundColor: visualTheme.avatarFallbackBg }}
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3.5 pb-2">
                    {filteredItems.map((item) => (
                      <PopularItemCard
                        key={item.id}
                        item={item}
                        visualTheme={visualTheme}
                        isFav={favorites.includes(item.id)}
                        inCart={cart.find((c) => c.menuItem.id === item.id)}
                        onSelectItem={onSelectItem}
                        onQuickAdd={onQuickAdd}
                        onQuickMinus={onQuickMinus}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Standalone sections at end of All Menu (if enabled by owner) */}
            {(isAllMenuPage || activeBottomTab === "menu") && (
              <>
                {offersSection && (
                  <OffersSectionRenderer
                    key={offersSection.id}
                    section={offersSection}
                    offers={offers}
                    digitalMenuTheme={digitalMenuTheme}
                    onOpenOffers={onOpenOffers}
                    onClaimOffer={onClaimOffer}
                    claimedOfferCodes={claimedOfferCodes}
                    appliedOfferCode={appliedOfferCode}
                    cafeName={cafe.name}
                    cafeSlug={cafe.slug}
                    orderType={activeTableName ? "DINE_IN" : undefined}
                    cart={cart}
                    cartSubtotal={cartTotal}
                    customerProfile={customerProfile}
                    hasPastOrders={pastOrders && pastOrders.length > 0}
                    menuItemNamesById={menuItemNamesById}
                    categoryNamesById={categoryNamesById}
                  />
                )}

                {rewardsSection && (
                  <section key={rewardsSection.id} className="w-full">
                    <div
                      onClick={() => onOpenProfile?.()}
                      className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br ${visualTheme.bannerGradient} border border-black/5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),0_4px_16px_rgba(0,0,0,0.04)] cursor-pointer group hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          {(() => {
                            const isStampsMode =
                              typeof window !== "undefined" &&
                              localStorage.getItem(`cafe_loyalty_mode_${cafe.slug}`) === "STAMPS";
                            const isLoggedIn = Boolean(customerProfile && !customerProfile.isGuest);

                            return (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-amber-500 font-bold text-xs">
                                    {isStampsMode ? "⚡" : "★"}
                                  </span>
                                  <span
                                    className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider"
                                    style={{ color: visualTheme.badgeText }}
                                  >
                                    {isStampsMode
                                      ? isLoggedIn
                                        ? "★ Bean Club Stamps"
                                        : "Bean Club Stamps"
                                      : isLoggedIn
                                      ? `★ ${customerProfile?.memberTier || "Member"}`
                                      : "Bean Club Rewards"}
                                  </span>
                                </div>

                                <div className="text-base sm:text-lg font-bold text-[#1C1D1A] tracking-tight">
                                  {isStampsMode
                                    ? isLoggedIn
                                      ? `${customerProfile?.stampsCollected ?? 0} / ${
                                          customerProfile?.stampsRequired ?? 0
                                        } Stamps Collected`
                                      : "Collect stamps with every sip"
                                    : isLoggedIn
                                    ? `${customerProfile?.loyaltyPoints ?? 0} Points Available`
                                    : "Earn points with every sip"}
                                </div>

                                <p className="text-[11px] sm:text-xs text-[#555850] leading-snug">
                                  {isStampsMode
                                    ? isLoggedIn
                                      ? "Collect 2 more stamps to get a free coffee!"
                                      : "Collect stamps every time you order & unlock free rewards."
                                    : isLoggedIn
                                    ? "Here's what you've earned and what you can unlock next."
                                    : "Earn points every time you order & unlock free rewards."}
                                </p>
                              </>
                            );
                          })()}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenProfile?.();
                          }}
                          className="flex-shrink-0 inline-flex items-center gap-1 px-3.5 py-2 rounded-full bg-[#242321] text-white text-xs font-semibold shadow-xs cursor-pointer group-hover:scale-105 transition-transform"
                        >
                          <span>
                            {typeof window !== "undefined" &&
                            localStorage.getItem(`cafe_loyalty_mode_${cafe.slug}`) === "STAMPS"
                              ? customerProfile && !customerProfile.isGuest
                                ? "View Stamps"
                                : "Join Stamps"
                              : customerProfile && !customerProfile.isGuest
                              ? "View Rewards"
                              : "Join Rewards"}
                          </span>
                          <IconChevronRight className="w-3.5 h-3.5 stroke-[2.2]" />
                        </button>
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          6. FLOATING LIVE KITCHEN ORDER TRACKER & QUICK CART PILL
          Cart pill must remain visible even when active orders exist!
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

      {/* Case 1: BOTH Active Orders AND Cart items exist: Stacked on top of each other, full width, thin when closed */}
      {hasActiveOrders && hasCart && (
        <>
          {!isStackedPillsOpen ? (
            /* THIN (CLOSED) MODE: Stacked on top of each other, full width, sleek slim height */
            <div className="fixed bottom-20 inset-x-3 sm:inset-x-4 max-w-sm sm:max-w-md mx-auto z-40 flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Thin Tracker Pill: Click to expand */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsStackedPillsOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsStackedPillsOpen(true);
                  }
                }}
                className="w-full h-9 px-3 rounded-full flex items-center justify-between text-xs border border-white/15 transition-all cursor-pointer select-none active:scale-[0.99]"
                style={{
                  background: "linear-gradient(135deg, #404040, #262626, #171717)",
                  boxShadow:
                    "inset 0 1px 1.5px rgba(255, 255, 255, 0.22), inset 0 -1px 1.5px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.12)",
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Bare green blink dot (no background container) */}
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="truncate font-semibold text-[11.5px] text-white/95">
                    {activeOrdersCount > 1
                      ? `${activeOrdersCount} Active Orders • In Kitchen`
                      : `Order #${formattedOrderNumber} • In Kitchen`}
                  </span>
                </div>

                {/* Live Tracker CTA: No background, text color white */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLiveTracker();
                  }}
                  className="text-white text-[11px] font-bold flex items-center gap-0.5 shrink-0 transition-transform active:scale-95 hover:opacity-85 cursor-pointer ml-2"
                >
                  <span>Live Tracker</span>
                  <IconChevronRight className="w-3.5 h-3.5 stroke-[2.8]" />
                </button>
              </div>

              {/* Thin Cart Pill: Click to expand */}
              {latestCartItem && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsStackedPillsOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsStackedPillsOpen(true);
                    }
                  }}
                  className="w-full h-9.5 px-3 rounded-full flex items-center justify-between text-xs border transition-all cursor-pointer select-none active:scale-[0.99]"
                  style={{
                    background: `linear-gradient(135deg, ${themeLighterLinear.start}, ${themeLighterLinear.mid})`,
                    borderColor: themeLighterLinear.border,
                    boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.95), inset 0 -1px 2px rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)`,
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    {/* Circular Left Image: rounded-full */}
                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/90 shadow-2xs shrink-0 bg-stone-100">
                      <img
                        src={getMenuItemImageUrl(latestCartItem.menuItem.imageKey, latestCartItem.menuItem.name)}
                        alt={latestCartItem.menuItem.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="truncate font-bold text-[11.5px] text-[#1C1D1A]">
                      {cart.length > 1
                        ? `${latestCartItem.menuItem.name} + ${cart.length - 1} more`
                        : latestCartItem.menuItem.name}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#595753] shrink-0">
                      ₹{cartTotal}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCart();
                    }}
                    className="text-[10.5px] font-bold px-2.5 py-1 rounded-full text-white shrink-0 flex items-center gap-0.5 shadow-2xs cursor-pointer active:scale-95"
                    style={{
                      backgroundColor: visualTheme.avatarFallbackBg,
                      boxShadow: `0 2px 6px ${visualTheme.buttonShadow || "rgba(0,0,0,0.18)"}`,
                    }}
                  >
                    <span>View Cart</span>
                    <IconChevronRight className="w-3 h-3 stroke-[2.8]" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* OPEN (EXPANDED) MODE: Both pills compact (h-12 / 48px) with center bend, click pill to close, no corner arrows */
            <div className="fixed bottom-20 inset-x-3 sm:inset-x-4 max-w-sm sm:max-w-md mx-auto z-40 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Compact Sculpted Center Bend Tracker Pill (h-12 / 48px) */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsStackedPillsOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsStackedPillsOpen(false);
                  }
                }}
                className="group relative w-full h-12 flex items-center justify-between px-3 sm:px-4 cursor-pointer select-none active:scale-[0.98] transition-all"
                style={{
                  filter:
                    "drop-shadow(0 8px 20px rgba(0, 0, 0, 0.16)) drop-shadow(0 2px 5px rgba(0, 0, 0, 0.08))",
                }}
              >
                {/* Center Bend SVG Surface: Compact 48px height */}
                <svg
                  viewBox="0 0 400 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id={`trackerPillGradStacked_${cafe.slug}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#404040" />
                      <stop offset="50%" stopColor="#262626" />
                      <stop offset="100%" stopColor="#171717" />
                    </linearGradient>
                  </defs>
                  {/* Signature Center Bend Pill path (48px height) */}
                  <path
                    d="M 0,24 C 0,11 11,0 24,0 C 95,0 135,5 200,5 C 265,5 305,0 376,0 C 389,0 400,11 400,24 C 400,37 389,48 376,48 L 24,48 C 11,48 0,37 0,24 Z"
                    fill={`url(#trackerPillGradStacked_${cafe.slug})`}
                    stroke="rgba(255, 255, 255, 0.16)"
                    strokeWidth="1"
                  />
                  {/* Top Specular Inset Highlight */}
                  <path
                    d="M 24,1.2 C 95,1.2 135,5.5 200,5.5 C 265,5.5 305,1.2 376,1.2"
                    stroke="rgba(255, 255, 255, 0.28)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  {/* Bottom Ambient Inner Shadow */}
                  <path
                    d="M 24,46.8 L 376,46.8"
                    stroke="rgba(0, 0, 0, 0.55)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Left Content: Bare green blink dot + Order Info */}
                <div className="relative z-20 flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <span className="relative flex h-2.5 w-2.5 shrink-0 ml-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>

                  <div className="min-w-0 flex-1 text-left">
                    <div className="font-extrabold text-xs sm:text-[12.5px] text-white truncate leading-tight tracking-tight">
                      {activeOrdersCount > 1
                        ? `${activeOrdersCount} Active Orders`
                        : `Order #${formattedOrderNumber}`}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[10.5px] font-medium text-stone-300 leading-tight mt-0.5">
                      <span className="text-emerald-400 font-semibold">In Kitchen</span>
                      <span className="text-stone-500">•</span>
                      <span className="text-stone-400 font-medium">Live Updates</span>
                    </div>
                  </div>
                </div>

                {/* Right Content: Live Tracker text (NO background, text color white, NO corner arrow) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLiveTracker();
                  }}
                  className="relative z-20 text-white font-bold text-xs flex items-center gap-1 shrink-0 transition-transform active:scale-95 hover:opacity-85 cursor-pointer py-1 px-1"
                >
                  <span>Live Tracker</span>
                  <IconChevronRight className="w-3.5 h-3.5 stroke-[2.8]" />
                </button>
              </div>

              {/* Compact Sculpted Center Bend Cart Pill (h-12 / 48px - same small size as track pill) */}
              {latestCartItem && (
                <div
                  onClick={() => setIsStackedPillsOpen(false)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsStackedPillsOpen(false);
                    }
                  }}
                  className="group relative w-full h-12 flex items-center justify-between px-3 sm:px-4 cursor-pointer select-none active:scale-[0.98] transition-all"
                  style={{
                    filter: "drop-shadow(0 8px 20px rgba(0, 0, 0, 0.08)) drop-shadow(0 2px 5px rgba(0, 0, 0, 0.04))",
                  }}
                >
                  {/* Sculpted Center Bend SVG Surface: Compact 48px height */}
                  <svg
                    viewBox="0 0 400 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id={`cartPillGradStacked_${cafe.slug}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={themeLighterLinear.start} />
                        <stop offset="50%" stopColor={themeLighterLinear.mid} />
                        <stop offset="100%" stopColor={themeLighterLinear.end} />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,24 C 0,11 11,0 24,0 C 95,0 135,5 200,5 C 265,5 305,0 376,0 C 389,0 400,11 400,24 C 400,37 389,48 376,48 L 24,48 C 11,48 0,37 0,24 Z"
                      fill={`url(#cartPillGradStacked_${cafe.slug})`}
                      stroke={themeLighterLinear.border}
                      strokeWidth="1"
                    />
                    {/* Top Specular Inset Highlight */}
                    <path
                      d="M 24,1.2 C 95,1.2 135,5.5 200,5.5 C 265,5.5 305,1.2 376,1.2"
                      stroke="rgba(255, 255, 255, 0.6)"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Left Content: Item Photo (rounded-full, fits 48px height) + Item Name & Price */}
                  <div className="relative z-20 flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    {/* Thumbnail Container: rounded-full */}
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/90 shadow-2xs shrink-0 bg-stone-100">
                      <img
                        src={getMenuItemImageUrl(latestCartItem.menuItem.imageKey, latestCartItem.menuItem.name)}
                        alt={latestCartItem.menuItem.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1 text-left">
                      <div className="font-extrabold text-xs sm:text-[12.5px] text-[#1C1D1A] truncate leading-tight tracking-tight">
                        {cart.length > 1
                          ? `${latestCartItem.menuItem.name} + ${cart.length - 1} more`
                          : latestCartItem.menuItem.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-[10.5px] font-medium text-[#73716B] leading-tight mt-0.5">
                        <span className="font-mono font-bold text-[#1C1D1A]">₹{cartTotal}</span>
                        <span className="text-stone-300">•</span>
                        <span className="text-[10px] text-[#595753] font-medium">
                          {cartCount === 1 ? "1 item added" : `${cartCount} items in cart`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Content: Premium "View Cart" CTA Pill (NO corner arrow) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCart();
                    }}
                    className="relative z-20 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-white text-xs font-bold shadow-xs flex items-center gap-1 shrink-0 transition-transform active:scale-95 group-hover:opacity-95 cursor-pointer"
                    style={{
                      backgroundColor: visualTheme.avatarFallbackBg,
                      boxShadow: `0 2px 8px ${visualTheme.buttonShadow || "rgba(0,0,0,0.18)"}`,
                    }}
                  >
                    <span>View Cart</span>
                    <IconChevronRight className="w-3.5 h-3.5 stroke-[2.8]" />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Case 2: ONLY Active Orders exist (Cart is empty): Compact Sculpted Center Bend tracker pill (h-12) */}
      {hasActiveOrders && !hasCart && (
        <div className="fixed bottom-20 inset-x-3 sm:inset-x-4 max-w-sm sm:max-w-md mx-auto z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div
            onClick={onOpenLiveTracker}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenLiveTracker();
              }
            }}
            className="group relative w-full h-12 flex items-center justify-between px-3 sm:px-4 cursor-pointer select-none active:scale-[0.98] transition-all"
            style={{
              filter:
                "drop-shadow(0 8px 20px rgba(0, 0, 0, 0.16)) drop-shadow(0 2px 5px rgba(0, 0, 0, 0.08))",
            }}
          >
            {/* Center Bend SVG Surface: Compact 48px height */}
            <svg
              viewBox="0 0 400 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id={`trackerPillGradSingle_${cafe.slug}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#404040" />
                  <stop offset="50%" stopColor="#262626" />
                  <stop offset="100%" stopColor="#171717" />
                </linearGradient>
              </defs>
              <path
                d="M 0,24 C 0,11 11,0 24,0 C 95,0 135,5 200,5 C 265,5 305,0 376,0 C 389,0 400,11 400,24 C 400,37 389,48 376,48 L 24,48 C 11,48 0,37 0,24 Z"
                fill={`url(#trackerPillGradSingle_${cafe.slug})`}
                stroke="rgba(255, 255, 255, 0.16)"
                strokeWidth="1"
              />
              {/* Top Specular Inset Highlight */}
              <path
                d="M 24,1.2 C 95,1.2 135,5.5 200,5.5 C 265,5.5 305,1.2 376,1.2"
                stroke="rgba(255, 255, 255, 0.28)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              {/* Bottom Ambient Inner Shadow */}
              <path
                d="M 24,46.8 L 376,46.8"
                stroke="rgba(0, 0, 0, 0.55)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>

            {/* Left Content: Bare green blink dot + Order Info */}
            <div className="relative z-20 flex items-center gap-2.5 min-w-0 flex-1 pr-2">
              <span className="relative flex h-2.5 w-2.5 shrink-0 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>

              <div className="min-w-0 flex-1 text-left">
                <div className="font-extrabold text-xs sm:text-[12.5px] text-white truncate leading-tight tracking-tight">
                  {activeOrdersCount > 1
                    ? `${activeOrdersCount} Active Orders`
                    : `Order #${formattedOrderNumber}`}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[10.5px] font-medium text-stone-300 leading-tight mt-0.5">
                  <span className="text-emerald-400 font-semibold">In Kitchen</span>
                  <span className="text-stone-500">•</span>
                  <span className="text-stone-400 font-medium">Live Updates</span>
                </div>
              </div>
            </div>

            {/* Right Content: Live Tracker (NO background, text color white) */}
            <div className="relative z-20 text-white font-bold text-xs flex items-center gap-1 shrink-0 transition-transform active:scale-95 group-hover:opacity-85 cursor-pointer py-1 px-1">
              <span>Live Tracker</span>
              <IconChevronRight className="w-3.5 h-3.5 stroke-[2.8]" />
            </div>
          </div>
        </div>
      )}

      {/* Case 3: ONLY Cart items exist (No active orders): Compact Sculpted Center Bend Cart Pill (h-12 / 48px) */}
      {!hasActiveOrders && hasCart && latestCartItem && (
        <div className="fixed bottom-20 inset-x-3 sm:inset-x-4 max-w-sm sm:max-w-md mx-auto z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div
            onClick={onOpenCart}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenCart();
              }
            }}
            className="group relative w-full h-12 flex items-center justify-between px-3 sm:px-4 cursor-pointer select-none active:scale-[0.98] transition-all"
            style={{
              filter: "drop-shadow(0 8px 20px rgba(0, 0, 0, 0.08)) drop-shadow(0 2px 5px rgba(0, 0, 0, 0.04))",
            }}
          >
            {/* Sculpted Center Bend SVG Surface: Compact 48px height */}
            <svg
              viewBox="0 0 400 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={`cartPillGrad_${cafe.slug}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={themeLighterLinear.start} />
                  <stop offset="50%" stopColor={themeLighterLinear.mid} />
                  <stop offset="100%" stopColor={themeLighterLinear.end} />
                </linearGradient>
              </defs>
              <path
                d="M 0,24 C 0,11 11,0 24,0 C 95,0 135,5 200,5 C 265,5 305,0 376,0 C 389,0 400,11 400,24 C 400,37 389,48 376,48 L 24,48 C 11,48 0,37 0,24 Z"
                fill={`url(#cartPillGrad_${cafe.slug})`}
                stroke={themeLighterLinear.border}
                strokeWidth="1"
              />
              {/* Top Specular Inset Highlight */}
              <path
                d="M 24,1.2 C 95,1.2 135,5.5 200,5.5 C 265,5.5 305,1.2 376,1.2"
                stroke="rgba(255, 255, 255, 0.6)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>

            {/* Left Content: Item Photo (rounded-full, fits 48px height) + Item Name & Price */}
            <div className="relative z-20 flex items-center gap-2.5 min-w-0 flex-1 pr-2">
              {/* Thumbnail Container: rounded-full with thin border */}
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/90 shadow-2xs shrink-0 bg-stone-100">
                <img
                  src={getMenuItemImageUrl(latestCartItem.menuItem.imageKey, latestCartItem.menuItem.name)}
                  alt={latestCartItem.menuItem.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Item Details: Name, Unit/Total Price, & Item Summary */}
              <div className="min-w-0 flex-1 text-left">
                <div className="font-extrabold text-xs sm:text-[12.5px] text-[#1C1D1A] truncate leading-tight tracking-tight">
                  {cart.length > 1
                    ? `${latestCartItem.menuItem.name} + ${cart.length - 1} more`
                    : latestCartItem.menuItem.name}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[10.5px] font-medium text-[#73716B] leading-tight mt-0.5">
                  <span className="font-mono font-bold text-[#1C1D1A]">₹{cartTotal}</span>
                  <span className="text-stone-300">•</span>
                  <span className="text-[10px] text-[#595753] font-medium">
                    {cartCount === 1 ? "1 item added" : `${cartCount} items in cart`}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Content: Premium "View Cart" CTA Pill */}
            <div
              className="relative z-20 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-white text-xs font-bold shadow-xs flex items-center gap-1 shrink-0 transition-transform active:scale-95 group-hover:opacity-95"
              style={{
                backgroundColor: visualTheme.avatarFallbackBg,
                boxShadow: `0 2px 8px ${visualTheme.buttonShadow || "rgba(0,0,0,0.18)"}`,
              }}
            >
              <span>View Cart</span>
              <IconChevronRight className="w-3.5 h-3.5 stroke-[2.8]" />
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          7. FLOATING BOTTOM NAVIGATION DOCK
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-[360px] pointer-events-auto">
        <nav
          className="relative backdrop-blur-2xl rounded-full border border-white/80 p-1.5 flex items-center justify-between"
          style={{
            backgroundColor: `${visualTheme.dockBg}d9`,
            boxShadow:
              "inset 0 1.5px 3px rgba(255,255,255,0.95), 0 6px 20px -2px rgba(0,0,0,0.08), 0 2px 6px -1px rgba(0,0,0,0.04)",
          }}
        >
          {[
            {
              id: "home" as const,
              label: "Home",
              icon: <IconSmartHome className="w-5 h-5 stroke-[2]" />,
              onClick: () => {
                setActiveBottomTab("home");
                setCurrentMainTab("home");
                setSelectedCategoryId("ALL");
                setDietFilter("ALL");
                setSearch("");
                if (typeof window !== "undefined") {
                  window.history.pushState(null, "", `/menu/${cafe.slug}${tableQuery}`);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              },
            },
            {
              id: "menu" as const,
              label: "Menu",
              icon: <IconToolsKitchen2 className="w-5 h-5 stroke-[2]" />,
              onClick: () => {
                setActiveBottomTab("menu");
                setCurrentMainTab("menu");
                setSelectedCategoryId("ALL");
                setDietFilter("ALL");
                setSearch("");
                if (typeof window !== "undefined") {
                  window.history.pushState(null, "", `/menu/${cafe.slug}/all-menu${tableQuery}`);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              },
            },
            {
              id: "cart" as const,
              label: "Cart",
              icon: <IconShoppingCart className="w-5 h-5 stroke-[2]" />,
              badge: cartCount > 0 ? cartCount : undefined,
              onClick: () => {
                setActiveBottomTab("cart");
                onOpenCart();
              },
            },
            {
              id: "orders" as const,
              label: "Orders",
              icon: <IconClipboardList className="w-5 h-5 stroke-[2]" />,
              badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
              badgeColor: "bg-emerald-400",
              onClick: () => {
                setActiveBottomTab("orders");
                if (onOpenOrders) {
                  onOpenOrders();
                } else {
                  transitionNavigate(router, `/menu/${cafe.slug}/orders${tableQuery}`);
                }
              },
              hasPulse: hasActiveOrders && activeOrdersCount === 0,
            },
            (!isAppInstalled
              ? {
                  id: "get_app" as const,
                  label: "Get App",
                  icon: <IconDownload className="w-5 h-5 stroke-[2]" />,
                  onClick: () => {
                    setActiveBottomTab("get_app");
                    if (deferredPrompt) {
                      deferredPrompt.prompt();
                    }
                    setIsGetAppOpen(true);
                  },
                }
              : {
                  id: "rewards" as const,
                  label: "Rewards",
                  icon: <IconGift className="w-5 h-5 stroke-[2]" />,
                  badge: customerProfile?.loyaltyPoints
                    ? `${customerProfile.loyaltyPoints}`
                    : undefined,
                  badgeColor: "bg-amber-500",
                  onClick: () => {
                    setActiveBottomTab("rewards");
                    setIsWalletOpen(true);
                  },
                }),
          ].map((tab) => {
            const isActive = activeBottomTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                type="button"
                onClick={tab.onClick}
                whileTap={{ scale: 0.92 }}
                title={tab.label}
                className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full cursor-pointer focus:outline-none"
              >
                {/* Active Circular Pill with Theme Active Gradient & Depth */}
                {isActive && (
                  <motion.div
                    layoutId="floatingDockActivePill"
                    className={`absolute inset-0 rounded-full bg-gradient-to-tr ${visualTheme.dockActiveGradient}`}
                    style={{
                      boxShadow:
                        "inset 0 1.5px 2px rgba(255,255,255,0.65), inset 0 -1.5px 2px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.14)",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 35,
                      mass: 0.8,
                    }}
                  />
                )}

                {/* Modern Icon with micro-spring elevation */}
                <motion.span
                  animate={{
                    scale: isActive ? 1.08 : 1,
                    y: isActive ? -0.5 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`relative z-10 flex items-center justify-center transition-colors duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-[#6B7280] hover:text-[#1C1D1A]"
                  }`}
                >
                  {tab.icon}
                </motion.span>

                {/* Badge for Cart Count or Active Orders */}
                {tab.badge && (
                  <span
                    className={`absolute top-1 right-1 z-20 min-w-4 h-4 px-1 rounded-full ${
                      (tab as any).badgeColor || "bg-[#EF4444]"
                    } text-white text-[9.5px] font-bold font-mono flex items-center justify-center shadow-xs border border-white`}
                  >
                    {tab.badge}
                  </span>
                )}

                {/* Pulse Indicator for Active Kitchen Order when no badge */}
                {tab.hasPulse && !tab.badge && (
                  <span className="absolute top-1.5 right-1.5 z-20 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* PWA Get App Modal */}
      <GetAppModal
        isOpen={isGetAppOpen}
        onClose={() => {
          setIsGetAppOpen(false);
          setActiveBottomTab(currentMainTab);
        }}
        cafe={cafe}
        visualTheme={visualTheme}
        deferredPrompt={deferredPrompt}
        onInstalled={() => {
          setIsAppInstalled(true);
          try {
            localStorage.setItem(`cafe_pwa_installed_${cafe.slug}`, "true");
          } catch {}
        }}
      />

      {/* Member Wallet Modal */}
      <MemberWalletModal
        isOpen={isWalletOpen}
        onClose={() => {
          setIsWalletOpen(false);
          setActiveBottomTab(currentMainTab);
        }}
        cafe={cafe}
        visualTheme={visualTheme}
        customerProfile={customerProfile}
        onOpenProfile={onOpenProfile}
        onOpenOffers={() => {
          if (onOpenOffers) onOpenOffers();
        }}
      />
    </div>
  );
};
