"use client";

import React, { useState, useEffect, useRef } from "react";
import { MenuItem } from "@/lib/db/schema/menu-items";
import {
  HomeSectionConfig,
  FeaturedTemplate,
  FeaturedSlideConfig,
} from "@/lib/db/schema/cafe-settings";
import { DigitalMenuCartItem } from "../../types";
import { getMenuItemImageUrl } from "../../utils/food-images";
import { IconSparkles, IconChevronRight, IconPlus, IconMinus } from "@tabler/icons-react";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";

interface FeaturedSectionRendererProps {
  section: HomeSectionConfig;
  menuItems: MenuItem[];
  bestsellers: MenuItem[];
  cart: DigitalMenuCartItem[];
  onSelectItem: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
  onQuickMinus?: (item: MenuItem) => void;
  digitalMenuTheme?: string;
}

interface ResolvedFeaturedSlide {
  id: string;
  sourceType: "MENU_ITEM" | "CUSTOM";
  item: MenuItem | null;
  badge: string;
  title: string;
  subtitle: string;
  price: number;
  actionText: string;
  imageUrl: string;
}

export const FeaturedSectionRenderer: React.FC<FeaturedSectionRendererProps> = ({
  section,
  menuItems,
  bestsellers,
  cart,
  onSelectItem,
  onQuickAdd,
  onQuickMinus,
  digitalMenuTheme,
}) => {
  const visualTheme = getDigitalMenuVisualTheme(digitalMenuTheme || "roast");
  const template: FeaturedTemplate =
    (section.template as FeaturedTemplate) || "EDITORIAL_IMAGE_RIGHT";

  // Build resolved slides list (supporting up to 3 slides with custom additions)
  const configuredSlides = section.config?.featuredSlides || [];
  let displaySlides: ResolvedFeaturedSlide[] = [];

  if (configuredSlides.length > 0) {
    displaySlides = configuredSlides.map((slide, idx) => {
      if (slide.sourceType === "CUSTOM") {
        return {
          id: slide.id || `custom_${idx}`,
          sourceType: "CUSTOM",
          item: null,
          badge: slide.badgeText || "",
          title: slide.customTitle || "Featured item",
          subtitle: slide.customSubtitle || "Handcrafted café favorite",
          price: slide.price ?? 0,
          actionText: slide.actionText || "Explore",
          imageUrl:
            slide.customImageUrl ||
            (bestsellers[0]
              ? getMenuItemImageUrl(bestsellers[0].imageKey, bestsellers[0].slug, bestsellers[0].name)
              : ""),
        };
      }

      // MENU_ITEM slide
      const resolvedItem =
        (slide.itemId && menuItems.find((m) => m.id === slide.itemId)) ||
        bestsellers[idx] ||
        menuItems[idx] ||
        menuItems[0];

      return {
        id: slide.id || `item_${idx}`,
        sourceType: "MENU_ITEM",
        item: resolvedItem || null,
        badge: slide.badgeText || section.config?.badgeText || section.title || "",
        title: slide.customTitle || resolvedItem?.name || "Featured item",
        subtitle:
          slide.customSubtitle ||
          section.config?.customSubtitle ||
          section.subtitle ||
          resolvedItem?.description ||
          "",
        price: slide.price ?? resolvedItem?.price ?? 0,
        actionText: slide.actionText || section.config?.actionText || "Try it today",
        imageUrl:
          slide.imageSource === "CUSTOM_UPLOAD" && slide.customImageUrl
            ? slide.customImageUrl
            : resolvedItem
            ? getMenuItemImageUrl(resolvedItem.imageKey, resolvedItem.slug, resolvedItem.name)
            : "/images/menu-item-placeholder.svg",
      };
    });
  } else {
    // Backwards compatibility: fallback to single item from section.config
    const singleItem =
      (section.config?.featuredItemId &&
        menuItems.find((m) => m.id === section.config?.featuredItemId)) ||
      bestsellers[0] ||
      menuItems[0];

    if (singleItem) {
      const itemImg =
        section.config?.imageSource === "CUSTOM_UPLOAD" && section.config?.customImageUrl
          ? section.config.customImageUrl
          : section.config?.bannerImageUrl ||
            getMenuItemImageUrl(singleItem.imageKey, singleItem.slug, singleItem.name);

      displaySlides = [
        {
          id: "default_single",
          sourceType: "MENU_ITEM",
          item: singleItem,
          badge: section.config?.badgeText || section.title || "",
          title: section.config?.customTitle || singleItem.name,
          subtitle: section.config?.customSubtitle || section.subtitle || singleItem.description || "",
          price: singleItem.price,
          actionText: section.config?.actionText || "View item",
          imageUrl: itemImg,
        },
      ];
    }
  }

  // Carousel & Auto-scroll State
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const isAutoScrollEnabled = section.config?.autoScroll !== false && displaySlides.length > 1;
  const intervalMs = section.config?.autoScrollInterval || 4000;

  useEffect(() => {
    if (!isAutoScrollEnabled || isPaused || displaySlides.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % displaySlides.length;
        if (carouselRef.current) {
          const cardWidth = carouselRef.current.clientWidth;
          carouselRef.current.scrollTo({
            left: next * (cardWidth + 14),
            behavior: "smooth",
          });
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isAutoScrollEnabled, isPaused, displaySlides.length, intervalMs]);

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const cardWidth = carouselRef.current.clientWidth;
    const newIdx = Math.round(scrollLeft / (cardWidth + 14));
    if (newIdx !== activeIndex && newIdx >= 0 && newIdx < displaySlides.length) {
      setActiveIndex(newIdx);
    }
  };

  const scrollToSlide = (idx: number) => {
    setActiveIndex(idx);
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.clientWidth;
      carouselRef.current.scrollTo({
        left: idx * (cardWidth + 14),
        behavior: "smooth",
      });
    }
  };

  if (displaySlides.length === 0) return null;

  // Render Action Button / Stepper for a slide
  const renderSlideActionButton = (slide: ResolvedFeaturedSlide, size: "sm" | "md" = "md") => {
    const targetItem = slide.item;
    const inCart = targetItem ? cart.find((c) => c.menuItem.id === targetItem.id) : null;

    if (inCart && targetItem) {
      return (
        <div
          data-interactive="true"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="h-7 sm:h-8 px-1.5 rounded-full text-white flex items-center gap-1.5 shadow-sm"
          style={{ backgroundColor: visualTheme.avatarFallbackBg }}
        >
          <button
            type="button"
            data-interactive="true"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onQuickMinus) onQuickMinus(targetItem);
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
              onQuickAdd(targetItem);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Increase quantity"
            className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-90 transition-transform cursor-pointer"
          >
            <IconPlus className="w-3.5 h-3.5 stroke-[2.5] pointer-events-none" />
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        data-interactive="true"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (targetItem) {
            onQuickAdd(targetItem);
          }
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white ${
          size === "sm" ? "text-[11px]" : "text-xs"
        } font-semibold transition-all duration-200 active:scale-95 cursor-pointer shadow-xs hover:opacity-95`}
        style={{
          backgroundColor: visualTheme.avatarFallbackBg,
          boxShadow: `0 2px 8px ${visualTheme.buttonShadow}`,
        }}
      >
        <span>{slide.actionText}</span>
        <IconChevronRight className="w-3.5 h-3.5 stroke-[2.5] pointer-events-none" />
      </button>
    );
  };

  const handleSlideClick = (slide: ResolvedFeaturedSlide, e?: React.MouseEvent) => {
    if (e) {
      const target = e.target as HTMLElement | null;
      if (target && target.closest("button, [data-interactive='true']")) {
        return;
      }
    }
    if (slide.item) {
      onSelectItem(slide.item);
    }
  };

  // Carousel Pagination Dots component
  const renderPaginationDots = () => {
    if (displaySlides.length <= 1) return null;
    return (
      <div className="flex items-center gap-1.5">
        {displaySlides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => scrollToSlide(i)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              activeIndex === i ? "w-4" : "w-1.5 bg-black/20"
            }`}
            style={
              activeIndex === i
                ? { backgroundColor: visualTheme.avatarFallbackBg }
                : undefined
            }
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    );
  };

  // -------------------------------------------------------------
  // TEMPLATE 1: CENTER_BEND / EDITORIAL_IMAGE_RIGHT (Signature Symmetrical Center Bend Wave Curves)
  // -------------------------------------------------------------
  if (template === "EDITORIAL_IMAGE_RIGHT" || (template as string) === "CENTER_BEND") {
    return (
      <section key={section.id} className="w-full relative space-y-2">
        {displaySlides.length > 1 && (
          <div className="flex items-center justify-end px-1 pb-0.5">
            {renderPaginationDots()}
          </div>
        )}

        <div
          ref={carouselRef}
          onScroll={handleScroll}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="-mx-4 px-4 flex items-center gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-1"
        >
          {displaySlides.map((slide) => (
            <div
              key={slide.id}
              onClick={(e) => handleSlideClick(slide, e)}
              className="flex-shrink-0 w-[86vw] sm:w-[380px] snap-center relative min-h-[142px] sm:min-h-[152px] px-5 sm:px-6 py-4 flex flex-col justify-center cursor-pointer group transition-all duration-200 active:scale-[0.99]"
            >
              {/* Symmetrical Center Bend Wave Surface */}
              <svg
                viewBox="0 0 360 140"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full text-white pointer-events-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
              >
                <path
                  d="M 0,22 C 0,10 14,0 32,0 C 75,0 115,10 180,10 C 245,10 285,0 328,0 C 346,0 360,10 360,22 L 360,118 C 360,130 346,140 328,140 C 285,140 245,130 180,130 C 115,130 75,140 32,140 C 14,140 0,130 0,118 Z"
                  fill="currentColor"
                />
              </svg>

              <div className="relative z-10 flex items-center justify-between gap-3.5 w-full">
                {/* Left Text & Action */}
                <div className="flex-1 min-w-0 pr-1 space-y-1.5">
                  <div
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wide uppercase"
                    style={{
                      backgroundColor: visualTheme.badgeBg,
                      color: visualTheme.badgeText,
                    }}
                  >
                    <IconSparkles className="w-3 h-3" />
                    <span>{slide.badge}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-extrabold text-[#1C1D1A] tracking-tight leading-snug line-clamp-1 font-heading">
                    {slide.title}
                  </h3>

                  {slide.subtitle && (
                    <p className="text-[11px] sm:text-xs text-[#73716B] line-clamp-1 leading-relaxed">
                      {slide.subtitle}
                    </p>
                  )}

                  <div className="pt-1 flex items-center gap-3">
                    {slide.price > 0 && (
                      <span className="text-base sm:text-lg font-bold font-mono text-[#1C1D1A]">
                        ₹{slide.price}
                      </span>
                    )}
                    {renderSlideActionButton(slide)}
                  </div>
                </div>

                {/* Right Appetizing Food Image */}
                {slide.imageUrl && (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden relative flex-shrink-0 shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-black/5 group-hover:scale-105 transition-transform duration-300 bg-[#F5F5F3]">
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.7)] pointer-events-none" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 2: IMAGE_BACKGROUND (Rich editorial backdrop with readable scrim - No dark border)
  // -------------------------------------------------------------
  if (template === "IMAGE_BACKGROUND") {
    return (
      <section key={section.id} className="w-full relative space-y-2.5">
        {displaySlides.length > 1 && (
          <div className="flex items-center justify-end px-1 pb-0.5">
            {renderPaginationDots()}
          </div>
        )}

        <div
          ref={carouselRef}
          onScroll={handleScroll}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="-mx-4 px-4 flex items-center gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-1"
        >
          {displaySlides.map((slide) => (
            <div
              key={slide.id}
              onClick={(e) => handleSlideClick(slide, e)}
              className="flex-shrink-0 w-[86vw] sm:w-[380px] snap-center relative min-h-[210px] sm:min-h-[230px] rounded-[28px] sm:rounded-3xl overflow-hidden p-5 sm:p-6 flex flex-col justify-end cursor-pointer group shadow-[0_8px_24px_rgba(0,0,0,0.14)] border-0 transition-transform active:scale-[0.99]"
              style={{
                backgroundColor: visualTheme.offerHeroBg || "#1A1513",
              }}
            >
              {/* Background photography or rich fallback gradient */}
              {slide.imageUrl ? (
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${visualTheme.offerHeroBg || "#1F1B18"} 0%, ${visualTheme.avatarFallbackBg} 100%)`,
                  }}
                />
              )}

              {/* Multi-stop cinematic scrim for perfect contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none" />

              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold tracking-wide uppercase border border-white/25 shadow-xs">
                  <IconSparkles className="w-3.5 h-3.5" style={{ color: visualTheme.radialWarmth }} />
                  <span>{slide.badge}</span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug line-clamp-1 drop-shadow-md font-heading">
                  {slide.title}
                </h3>

                {slide.subtitle && (
                  <p className="text-xs text-white/85 line-clamp-1 leading-relaxed max-w-sm drop-shadow-xs">
                    {slide.subtitle}
                  </p>
                )}

                <div className="pt-2 flex items-center justify-between gap-3">
                  {slide.price > 0 && (
                    <span className="text-lg sm:text-xl font-bold font-mono text-white drop-shadow-sm">
                      ₹{slide.price}
                    </span>
                  )}
                  {renderSlideActionButton(slide)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 3: MINIMAL (Text-forward, clean subtle accent)
  // -------------------------------------------------------------
  if (template === "MINIMAL") {
    return (
      <section key={section.id} className="w-full relative space-y-2">
        {displaySlides.length > 1 && (
          <div className="flex items-center justify-end px-1 pb-0.5">
            {renderPaginationDots()}
          </div>
        )}

        <div
          ref={carouselRef}
          onScroll={handleScroll}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="flex items-center gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth w-full"
        >
          {displaySlides.map((slide) => (
            <div
              key={slide.id}
              onClick={(e) => handleSlideClick(slide, e)}
              className="flex-shrink-0 w-full snap-center relative rounded-2xl p-4 sm:p-5 bg-white border shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.03)] cursor-pointer group flex items-center justify-between gap-4 transition-all duration-200"
              style={{ borderColor: visualTheme.badgeBorder }}
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: visualTheme.avatarFallbackBg }}
                  />
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: visualTheme.badgeText }}
                  >
                    {slide.badge}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-[#1C1D1A] truncate font-heading">
                  {slide.title}
                </h3>

                {slide.subtitle && (
                  <p className="text-[11px] text-[#73716B] truncate">
                    {slide.subtitle}
                  </p>
                )}

                <div className="pt-1 flex items-center gap-3">
                  {slide.price > 0 && (
                    <span className="text-xs sm:text-sm font-bold font-mono text-[#1C1D1A]">
                      ₹{slide.price}
                    </span>
                  )}
                  {renderSlideActionButton(slide, "sm")}
                </div>
              </div>

              {slide.imageUrl && (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden relative flex-shrink-0 bg-[#F5F5F3]">
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 4: IMAGE_LEFT (Image left, text on right)
  // -------------------------------------------------------------
  return (
    <section key={section.id} className="w-full relative space-y-2">
      {displaySlides.length > 1 && (
        <div className="flex items-center justify-end px-1 pb-0.5">
          {renderPaginationDots()}
        </div>
      )}

      <div
        ref={carouselRef}
        onScroll={handleScroll}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex items-center gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth w-full"
      >
        {displaySlides.map((slide) => (
          <div
            key={slide.id}
            onClick={(e) => handleSlideClick(slide, e)}
            className="flex-shrink-0 w-full snap-center relative rounded-3xl p-4 sm:p-5 border shadow-sm cursor-pointer group flex items-center gap-4 transition-all duration-200 hover:shadow-md"
            style={{
              background: `linear-gradient(to right, ${visualTheme.accentSurface}, #FFFFFF)`,
              borderColor: visualTheme.badgeBorder,
            }}
          >
            {slide.imageUrl && (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden relative flex-shrink-0 shadow-sm border-2 border-white group-hover:scale-105 transition-transform duration-300 bg-[#F5F5F3]">
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 rounded-2xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)] pointer-events-none" />
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-1.5">
              <div
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wide uppercase"
                style={{
                  backgroundColor: visualTheme.badgeBg,
                  color: visualTheme.badgeText,
                }}
              >
                <IconSparkles className="w-3 h-3" />
                <span>{slide.badge}</span>
              </div>

              <h3 className="text-base sm:text-lg font-extrabold text-[#1C1D1A] tracking-tight leading-snug line-clamp-1 font-heading">
                {slide.title}
              </h3>

              {slide.subtitle && (
                <p className="text-[11px] sm:text-xs text-[#73716B] line-clamp-1 leading-relaxed">
                  {slide.subtitle}
                </p>
              )}

              <div className="pt-1 flex items-center gap-3">
                {slide.price > 0 && (
                  <span className="text-base sm:text-lg font-bold font-mono text-[#1C1D1A]">
                    ₹{slide.price}
                  </span>
                )}
                {renderSlideActionButton(slide)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
