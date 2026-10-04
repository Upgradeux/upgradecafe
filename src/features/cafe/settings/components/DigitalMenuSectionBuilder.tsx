"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  HomeSectionConfig,
  HomeSectionType,
  FeaturedTemplate,
  OfferTemplate,
  FeaturedSlideConfig,
  OfferSlideConfig,
  DEFAULT_HOME_SECTIONS,
} from "@/lib/db/schema/cafe-settings";
import { MenuItem } from "@/lib/db/schema/menu-items";
import { Category } from "@/lib/db/schema/categories";
import { Offer } from "@/lib/db/schema/offers";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { FeaturedSectionRenderer } from "@/features/cafe/public-menu/components/sections/FeaturedSectionRenderer";
import { OffersSectionRenderer } from "@/features/cafe/public-menu/components/sections/OffersSectionRenderer";
import { PopularSectionRenderer } from "@/features/cafe/public-menu/components/sections/PopularSectionRenderer";
import { calculatePopularItems } from "@/features/cafe/public-menu/utils/popular-calculator";
import { getMenuItemImageUrl } from "@/features/cafe/public-menu/utils/food-images";
import { getCafeThemeStyles } from "@/lib/theme/theme-tokens";
import {
  IconArrowUp,
  IconArrowDown,
  IconEdit,
  IconPlus,
  IconTrash,
  IconCheck,
  IconX,
  IconDeviceMobile,
  IconSparkles,
  IconTag,
  IconEye,
  IconEyeOff,
  IconPhoto,
  IconUpload,
  IconLoader2,
  IconRefresh,
  IconLayoutList,
  IconInfoCircle,
} from "@tabler/icons-react";

interface DigitalMenuSectionBuilderProps {
  cafeSlug: string;
  cafeName: string;
  cafeLogoUrl?: string | null;
  themePreset?: string;
  fontFamily?: string;
  homeSections: HomeSectionConfig[];
  menuItems: MenuItem[];
  categories?: Category[];
  onSaveSections: (updated: HomeSectionConfig[]) => Promise<void>;
  isSaving: boolean;
}

export const DigitalMenuSectionBuilder: React.FC<DigitalMenuSectionBuilderProps> = ({
  cafeSlug,
  cafeName,
  cafeLogoUrl,
  themePreset = "roast",
  fontFamily = "Plus Jakarta Sans",
  homeSections,
  menuItems,
  categories = [],
  onSaveSections,
  isSaving,
}) => {
  const { toast } = useToast();

  const [sections, setSections] = useState<HomeSectionConfig[]>(homeSections);
  const [editingSection, setEditingSection] = useState<HomeSectionConfig | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Active slide tabs for multi-slide carousel management
  const [activeFeaturedSlideIndex, setActiveFeaturedSlideIndex] = useState(0);
  const [activeOfferSlideIndex, setActiveOfferSlideIndex] = useState(0);
  const [uploadingSlideTarget, setUploadingSlideTarget] = useState<{
    sectionType: "FEATURED" | "OFFERS";
    slideIndex: number;
  } | null>(null);

  // Active offers state (fetched for current cafe)
  const [offersList, setOffersList] = useState<Offer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);

  // Uploading state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync sections when prop updates
  useEffect(() => {
    if (homeSections && homeSections.length > 0) {
      setSections(homeSections);
    }
  }, [homeSections]);

  // Load cafe's offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setIsLoadingOffers(true);
        const res = await fetch(`/api/cafe/${cafeSlug}/offers?all=true`);
        const json = await res.json();
        if (res.ok && json.success) {
          setOffersList(json.data || []);
        }
      } catch {
        // Fallback silently if offline
      } finally {
        setIsLoadingOffers(false);
      }
    };

    fetchOffers();
  }, [cafeSlug]);

  // -------------------------------------------------------------
  // REORDERING & VISIBILITY HANDLERS
  // -------------------------------------------------------------
  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const clone = [...sections];
    const temp = clone[index];
    clone[index] = clone[targetIndex];
    clone[targetIndex] = temp;
    const reordered = clone.map((item, idx) => ({ ...item, sortOrder: idx + 1 }));
    setSections(reordered);
    onSaveSections(reordered);
  };

  const handleToggle = (sectionId: string) => {
    const updated = sections.map((s) =>
      s.id === sectionId ? { ...s, enabled: !s.enabled } : s
    );
    setSections(updated);
    onSaveSections(updated);
  };

  const handleDelete = (sectionId: string) => {
    const updated = sections
      .filter((s) => s.id !== sectionId)
      .map((s, idx) => ({ ...s, sortOrder: idx + 1 }));
    setSections(updated);
    onSaveSections(updated);
    toast({
      title: "Section Removed",
      description: "The section was removed from your home screen layout.",
      variant: "success",
    });
  };

  // -------------------------------------------------------------
  // ADD SECTION HANDLER
  // -------------------------------------------------------------
  const handleAddSection = (type: HomeSectionType) => {
    // Generate new section defaults
    const id = `${type.toLowerCase()}_${Date.now()}`;
    let newSec: HomeSectionConfig;

    switch (type) {
      case "FEATURED":
        newSec = {
          id,
          type: "FEATURED",
          title: "Featured item",
          subtitle: "",
          enabled: true,
          sortOrder: sections.length + 1,
          template: "EDITORIAL_IMAGE_RIGHT",
          config: {
            featuredItemId: menuItems[0]?.id || "",
            badgeText: "",
            actionText: "View item",
            imageSource: "ITEM_IMAGE",
          },
        };
        break;

      case "OFFERS":
        newSec = {
          id,
          type: "OFFERS",
          title: "Offers & Perks",
          subtitle: "Exclusive deals for you",
          enabled: true,
          sortOrder: sections.length + 1,
          template: "OFFER_CARD",
          config: {
            offerId: offersList[0]?.id || "",
            offerBadgeText: "Offers & Perks",
            offerActionText: "View Offers",
          },
        };
        break;

      case "TODAYS_PICKS":
        newSec = {
          id,
          type: "TODAYS_PICKS",
          title: "Today's Picks",
          subtitle: "Curated by our baristas",
          enabled: true,
          sortOrder: sections.length + 1,
        };
        break;

      case "POPULAR":
        newSec = {
          id,
          type: "POPULAR",
          title: "Popular Food",
          subtitle: "Top customer favorites",
          enabled: true,
          sortOrder: sections.length + 1,
        };
        break;

      case "REWARDS":
        newSec = {
          id,
          type: "REWARDS",
          title: "Your Rewards",
          subtitle: "Earn Bean Points",
          enabled: true,
          sortOrder: sections.length + 1,
        };
        break;

      case "RECENTLY_ORDERED":
        newSec = {
          id,
          type: "RECENTLY_ORDERED",
          title: "Order Again",
          subtitle: "Quickly reorder past favorites",
          enabled: true,
          sortOrder: sections.length + 1,
        };
        break;

      case "CATEGORIES":
      default:
        newSec = {
          id,
          type: "CATEGORIES",
          title: "Categories",
          enabled: true,
          sortOrder: sections.length + 1,
        };
        break;
    }

    const updated = [...sections, newSec];
    setSections(updated);
    setIsAddModalOpen(false);
    setEditingSection(newSec);
  };

  // -------------------------------------------------------------
  // SLIDE MANAGEMENT HELPERS (FEATURED & OFFERS)
  // -------------------------------------------------------------
  const getFeaturedSlidesList = (): FeaturedSlideConfig[] => {
    if (!editingSection?.config?.featuredSlides || editingSection.config.featuredSlides.length === 0) {
      return [
        {
          id: "slide_1",
          sourceType: "MENU_ITEM",
          itemId: editingSection?.config?.featuredItemId || menuItems[0]?.id || "",
          badgeText: editingSection?.config?.badgeText || "",
          customTitle: editingSection?.config?.customTitle || "",
          customSubtitle: editingSection?.config?.customSubtitle || "",
          actionText: editingSection?.config?.actionText || "View item",
          imageSource: editingSection?.config?.imageSource || "ITEM_IMAGE",
          customImageUrl: editingSection?.config?.customImageUrl || "",
        },
      ];
    }
    return editingSection.config.featuredSlides;
  };

  const handleUpdateFeaturedSlide = (index: number, updates: Partial<FeaturedSlideConfig>) => {
    if (!editingSection) return;
    const currentList = getFeaturedSlidesList();
    const updated = [...currentList];
    updated[index] = { ...updated[index], ...updates };

    const first = updated[0];
    setEditingSection({
      ...editingSection,
      config: {
        ...editingSection.config,
        featuredSlides: updated,
        featuredItemId: first?.sourceType === "MENU_ITEM" ? first.itemId : undefined,
        badgeText: first?.badgeText,
        customTitle: first?.customTitle,
        customSubtitle: first?.customSubtitle,
        actionText: first?.actionText,
        imageSource: first?.imageSource,
        customImageUrl: first?.customImageUrl,
        bannerImageUrl: first?.customImageUrl,
      },
    });
  };

  const handleAddFeaturedSlide = () => {
    if (!editingSection) return;
    const currentList = getFeaturedSlidesList();
    if (currentList.length >= 3) {
      toast({
        title: "Maximum 3 Slides",
        description: "You can configure up to 3 slides in the carousel.",
        variant: "warning",
      });
      return;
    }
    const newSlide: FeaturedSlideConfig = {
      id: `slide_${Date.now()}`,
      sourceType: "CUSTOM",
      badgeText: "",
      customTitle: "",
      customSubtitle: "",
      actionText: "View item",
      imageSource: "CUSTOM_UPLOAD",
    };
    const updated = [...currentList, newSlide];
    setEditingSection({
      ...editingSection,
      config: {
        ...editingSection.config,
        featuredSlides: updated,
      },
    });
    setActiveFeaturedSlideIndex(updated.length - 1);
  };

  const handleDeleteFeaturedSlide = (index: number) => {
    if (!editingSection) return;
    const currentList = getFeaturedSlidesList();
    if (currentList.length <= 1) {
      toast({
        title: "Minimum 1 Slide Required",
        description: "Your hero section must have at least one slide.",
        variant: "warning",
      });
      return;
    }
    const updated = currentList.filter((_, i) => i !== index);
    const newActive = Math.min(activeFeaturedSlideIndex, updated.length - 1);
    setActiveFeaturedSlideIndex(newActive);

    const first = updated[0];
    setEditingSection({
      ...editingSection,
      config: {
        ...editingSection.config,
        featuredSlides: updated,
        featuredItemId: first?.sourceType === "MENU_ITEM" ? first.itemId : undefined,
        badgeText: first?.badgeText,
        customTitle: first?.customTitle,
        customSubtitle: first?.customSubtitle,
        actionText: first?.actionText,
        imageSource: first?.imageSource,
        customImageUrl: first?.customImageUrl,
        bannerImageUrl: first?.customImageUrl,
      },
    });
  };

  const getOfferSlidesList = (): OfferSlideConfig[] => {
    if (!editingSection?.config?.offerSlides || editingSection.config.offerSlides.length === 0) {
      const existingIds =
        editingSection?.config?.offerIds ||
        (editingSection?.config?.offerId ? [editingSection.config.offerId] : []);
      if (existingIds.length > 0) {
        return existingIds.slice(0, 3).map((oid, idx) => {
          const matched = offersList.find((o) => o.id === oid);
          return {
            id: `slide_${idx + 1}`,
            sourceType: "SAVED_OFFER",
            offerId: oid,
            badgeText: (idx === 0 ? editingSection?.config?.offerBadgeText : matched?.badgeText) || undefined,
            customTitle: (idx === 0 ? editingSection?.config?.offerCustomTitle : matched?.title) || undefined,
            customSubtitle: (idx === 0 ? editingSection?.config?.offerCustomSubtitle : matched?.description) || undefined,
            actionText: idx === 0 ? (editingSection?.config?.offerActionText || "Claim") : "Claim",
            code: matched?.code || undefined,
          };
        });
      }
      return [
        {
          id: "slide_1",
          sourceType: offersList.length > 0 ? "SAVED_OFFER" : "CUSTOM",
          offerId: offersList[0]?.id || "",
          badgeText: editingSection?.config?.offerBadgeText || "",
          customTitle:
            editingSection?.config?.offerCustomTitle ||
            offersList[0]?.title ||
            "",
          customSubtitle:
            editingSection?.config?.offerCustomSubtitle ||
            offersList[0]?.description ||
            "",
          code: offersList[0]?.code || "",
          actionText: editingSection?.config?.offerActionText || "Claim",
        },
      ];
    }
    return editingSection.config.offerSlides;
  };

  const handleUpdateOfferSlide = (index: number, updates: Partial<OfferSlideConfig>) => {
    if (!editingSection) return;
    const currentList = getOfferSlidesList();
    const updated = [...currentList];
    updated[index] = { ...updated[index], ...updates };

    const first = updated[0];
    setEditingSection({
      ...editingSection,
      config: {
        ...editingSection.config,
        offerSlides: updated,
        offerId: first?.sourceType === "SAVED_OFFER" ? first.offerId : undefined,
        offerBadgeText: first?.badgeText,
        offerCustomTitle: first?.customTitle,
        offerCustomSubtitle: first?.customSubtitle,
        offerActionText: first?.actionText,
        offerImageUrl: first?.customImageUrl,
      },
    });
  };

  const handleAddOfferSlide = () => {
    if (!editingSection) return;
    const currentList = getOfferSlidesList();
    if (currentList.length >= 3) {
      toast({
        title: "Maximum 3 Slides",
        description: "You can configure up to 3 offer slides in the carousel.",
        variant: "warning",
      });
      return;
    }
    const defaultSlideColors = ["#B4E858", "#FF9E54", "#FF5C5C"];
    const newSlide: OfferSlideConfig = {
      id: `slide_${Date.now()}`,
      sourceType: "CUSTOM",
      badgeText: "",
      customTitle: "",
      customSubtitle: "",
      voucherColor: defaultSlideColors[currentList.length % defaultSlideColors.length],
      code: "",
      actionText: "Claim",
    };
    const updated = [...currentList, newSlide];
    setEditingSection({
      ...editingSection,
      config: {
        ...editingSection.config,
        offerSlides: updated,
      },
    });
    setActiveOfferSlideIndex(updated.length - 1);
  };

  const handleDeleteOfferSlide = (index: number) => {
    if (!editingSection) return;
    const currentList = getOfferSlidesList();
    if (currentList.length <= 1) {
      toast({
        title: "Minimum 1 Slide Required",
        description: "Your offers carousel must have at least one slide.",
        variant: "warning",
      });
      return;
    }
    const updated = currentList.filter((_, i) => i !== index);
    const newActive = Math.min(activeOfferSlideIndex, updated.length - 1);
    setActiveOfferSlideIndex(newActive);

    const first = updated[0];
    setEditingSection({
      ...editingSection,
      config: {
        ...editingSection.config,
        offerSlides: updated,
        offerId: first?.sourceType === "SAVED_OFFER" ? first.offerId : undefined,
        offerBadgeText: first?.badgeText,
        offerCustomTitle: first?.customTitle,
        offerCustomSubtitle: first?.customSubtitle,
        offerActionText: first?.actionText,
        offerImageUrl: first?.customImageUrl,
      },
    });
  };

  const triggerImageUploadForSlide = (
    sectionType: "FEATURED" | "OFFERS",
    slideIndex: number
  ) => {
    setUploadingSlideTarget({ sectionType, slideIndex });
    fileInputRef.current?.click();
  };

  // -------------------------------------------------------------
  // IMAGE UPLOAD HANDLER
  // -------------------------------------------------------------
  const handleUploadCustomImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingSection) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image size must be smaller than 5 MB.",
        variant: "danger",
      });
      return;
    }

    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`/api/cafe/${cafeSlug}/section-image`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to upload image.");
      }

      const imageUrl = json.data.imageUrl;
      if (uploadingSlideTarget?.sectionType === "FEATURED") {
        handleUpdateFeaturedSlide(uploadingSlideTarget.slideIndex, {
          customImageUrl: imageUrl,
          imageSource: "CUSTOM_UPLOAD",
        });
      } else if (uploadingSlideTarget?.sectionType === "OFFERS") {
        handleUpdateOfferSlide(uploadingSlideTarget.slideIndex, {
          customImageUrl: imageUrl,
        });
      } else {
        setEditingSection((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            config: {
              ...prev.config,
              imageSource: "CUSTOM_UPLOAD",
              customImageUrl: imageUrl,
              bannerImageUrl: imageUrl,
            },
          };
        });
      }

      toast({
        title: "Image Uploaded",
        description: "Custom photo applied and synced.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Could not upload image.",
        variant: "danger",
      });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Save the currently editing section
  const handleSaveEditingSection = () => {
    if (!editingSection) return;
    let finalConfig = { ...editingSection.config };
    if (editingSection.type === "FEATURED") {
      finalConfig.featuredSlides = getFeaturedSlidesList();
    } else if (editingSection.type === "OFFERS") {
      finalConfig.offerSlides = getOfferSlidesList();
    }
    const finalSection = { ...editingSection, config: finalConfig };
    const updated = sections.map((s) => (s.id === finalSection.id ? finalSection : s));
    setSections(updated);
    onSaveSections(updated);
    setEditingSection(null);
    toast({
      title: "Section Updated",
      description: `Changes to "${finalSection.title || finalSection.type}" were saved.`,
      variant: "success",
    });
  };

  const featuredSlidesList = editingSection?.type === "FEATURED" ? getFeaturedSlidesList() : [];
  const featuredCurrentSlide =
    featuredSlidesList[Math.min(activeFeaturedSlideIndex, Math.max(0, featuredSlidesList.length - 1))];

  const offerSlidesList = editingSection?.type === "OFFERS" ? getOfferSlidesList() : [];
  const offerCurrentSlide =
    offerSlidesList[Math.min(activeOfferSlideIndex, Math.max(0, offerSlidesList.length - 1))];

  return (
    <div className="space-y-6">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. SECTION LIST & MERCHANDISING OVERVIEW
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Card className="p-5 border border-[var(--color-border)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[var(--color-foreground)]">
                Home Screen Sections & Merchandising
              </h3>
              <Badge variant="primary" className="text-[10px]">
                Controlled Builder
              </Badge>
            </div>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              Drag or reorder sections, select visual templates, and customize featured dishes & offers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-surface-subtle)] transition-colors cursor-pointer shadow-2xs"
            >
              <IconPlus className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>Add Section</span>
            </button>

            <button
              type="button"
              onClick={() => onSaveSections(sections)}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <IconCheck className="w-3.5 h-3.5" />
                  <span>Save All Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section List Items */}
        <div className="space-y-2.5">
          {sections.map((sec, index) => {
            const isFeatured = sec.type === "FEATURED";
            const isOffers = sec.type === "OFFERS";
            const isEditable = isFeatured || isOffers;

            return (
              <div
                key={sec.id}
                className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
                  sec.enabled
                    ? "bg-[var(--color-surface)] border-[var(--color-border)] shadow-2xs"
                    : "bg-[var(--color-surface-subtle)]/50 border-[var(--color-border-subtle)] opacity-60"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Reorder & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Up / Down Controls */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMove(index, "up")}
                        className="p-1 rounded-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        title="Move Up"
                      >
                        <IconArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === sections.length - 1}
                        onClick={() => handleMove(index, "down")}
                        className="p-1 rounded-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        title="Move Down"
                      >
                        <IconArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Order Number Badge */}
                    <div className="w-6 h-6 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>

                    {/* Section Description */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--color-foreground)] truncate">
                          {sec.title || sec.type}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-[var(--color-border-subtle)] text-[var(--color-muted)]">
                          {sec.type}
                        </span>
                        {sec.template && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium hidden sm:inline">
                            {sec.template === "EDITORIAL_IMAGE_RIGHT"
                              ? "CENTER BEND"
                              : sec.template === "SPECIAL_CAROUSEL"
                              ? "DISCOUNT COUPON"
                              : sec.template.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--color-muted)] truncate">
                        {sec.subtitle ||
                          (sec.type === "CATEGORIES"
                            ? "Circular navigation category strip"
                            : sec.type === "FEATURED"
                            ? "Hero promoted dish with controlled editorial template"
                            : sec.type === "POPULAR"
                            ? "Primary product discovery with See All toggle"
                            : sec.type === "TODAYS_PICKS"
                            ? "Staff & barista curated selections with horizontal carousel"
                            : sec.type === "OFFERS"
                            ? "Active discounts & promotions linked to live offers"
                            : sec.type === "REWARDS"
                            ? "Customer loyalty points & profile entry"
                            : "Order again reorder list")}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    {/* Customizer / Edit Button */}
                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFeaturedSlideIndex(0);
                          setActiveOfferSlideIndex(0);
                          setEditingSection(sec);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] transition-colors cursor-pointer"
                      >
                        <IconEdit className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                        <span>Customize</span>
                      </button>
                    )}

                    {/* Visibility Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggle(sec.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                        sec.enabled
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-neutral-500/10 text-neutral-500"
                      }`}
                    >
                      {sec.enabled ? (
                        <>
                          <IconEye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Visible</span>
                        </>
                      ) : (
                        <>
                          <IconEyeOff className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Hidden</span>
                        </>
                      )}
                    </button>

                    {/* Delete button: Available for every section! */}
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDelete(sec.id)}
                        className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete Section"
                      >
                        <IconTrash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. ADD SECTION MODAL
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-foreground)]">
                  Add Home Section
                </h3>
                <p className="text-[11px] text-[var(--color-muted)]">
                  Choose a section type to enrich your customer digital menu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {[
                {
                  type: "FEATURED" as HomeSectionType,
                  title: "Featured Hero Dish",
                  desc: "Highlight a signature roast, bakery special, or chef pick",
                  icon: <IconSparkles className="w-4 h-4 text-emerald-600" />,
                },
                {
                  type: "OFFERS" as HomeSectionType,
                  title: "Offers & Perks",
                  desc: "Promote active discount codes and happy hour deals",
                  icon: <IconTag className="w-4 h-4 text-amber-600" />,
                },
                {
                  type: "TODAYS_PICKS" as HomeSectionType,
                  title: "Today's Picks",
                  desc: "Curated horizontal card carousel by your baristas",
                  icon: <IconSparkles className="w-4 h-4 text-teal-600" />,
                },
                {
                  type: "POPULAR" as HomeSectionType,
                  title: "Popular Grid",
                  desc: "Primary discovery grid with See All toggle",
                  icon: <IconLayoutList className="w-4 h-4 text-blue-600" />,
                },
                {
                  type: "REWARDS" as HomeSectionType,
                  title: "Loyalty Rewards",
                  desc: "Bean points & customer login call to action",
                  icon: <IconSparkles className="w-4 h-4 text-purple-600" />,
                },
                {
                  type: "RECENTLY_ORDERED" as HomeSectionType,
                  title: "Order Again",
                  desc: "Quick one-tap reorder strip for returning guests",
                  icon: <IconRefresh className="w-4 h-4 text-indigo-600" />,
                },
              ].map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleAddSection(opt.type)}
                  className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]/20 transition-all text-left space-y-1 group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-[var(--color-surface)] shadow-2xs">
                      {opt.icon}
                    </div>
                    <span className="font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-primary)]">
                      {opt.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--color-muted)] leading-relaxed">
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. CONTROLLED SECTION CUSTOMIZER DRAWER / MODAL WITH LIVE MOBILE PREVIEW
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-5xl h-[92vh] max-h-[850px] rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-[var(--color-border-subtle)] flex items-center justify-between bg-[var(--color-surface)] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                  {editingSection.type === "FEATURED" ? (
                    <IconSparkles className="w-4 h-4" />
                  ) : (
                    <IconTag className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-foreground)] flex items-center gap-2">
                    <span>Customize {editingSection.title || editingSection.type}</span>
                    <Badge variant="primary" className="text-[10px]">
                      Live Visual Builder
                    </Badge>
                  </h3>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Pick a visual style, link live items/offers, and preview in real-time.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveEditingSection}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer shadow-xs"
                >
                  <IconCheck className="w-3.5 h-3.5" />
                  <span>Apply & Save</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="p-1.5 rounded-md text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] transition-colors"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Left Config + Right Live Phone Preview */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              {/* LEFT CONFIGURATION PANEL (7 cols) */}
              <div className="lg:col-span-7 p-5 overflow-y-auto space-y-5 border-b lg:border-b-0 lg:border-r border-[var(--color-border-subtle)]">
                {/* =========================================================
                    FEATURED SECTION CONFIGURATION
                   ========================================================= */}
                {editingSection.type === "FEATURED" && (
                  <>
                    {/* Step 1: Choose Style / Template */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                        1. Choose Layout Style
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          {
                            id: "EDITORIAL_IMAGE_RIGHT" as FeaturedTemplate,
                            name: "Center Bend Wave",
                            badge: "Signature Curve",
                            desc: "Signature symmetrical center-bend wave curves with image on right and clean quick add",
                          },
                          {
                            id: "IMAGE_BACKGROUND" as FeaturedTemplate,
                            name: "Hero Backdrop",
                            badge: "Full Image",
                            desc: "High-contrast dark gradient scrim over culinary photography",
                          },
                          {
                            id: "MINIMAL" as FeaturedTemplate,
                            name: "Clean Minimal",
                            badge: "Text First",
                            desc: "Refined typographic layout with compact food thumbnail",
                          },
                          {
                            id: "IMAGE_LEFT" as FeaturedTemplate,
                            name: "Side by Side",
                            badge: "Balanced",
                            desc: "Food image on left with bold title and price on right",
                          },
                        ].map((tpl) => {
                          const isSelected =
                            (editingSection.template || "EDITORIAL_IMAGE_RIGHT") === tpl.id;
                          return (
                            <button
                              key={tpl.id}
                              type="button"
                              onClick={() =>
                                setEditingSection({
                                  ...editingSection,
                                  template: tpl.id,
                                })
                              }
                              className={`p-3 rounded-xl border text-left space-y-1 transition-all cursor-pointer ${
                                isSelected
                                  ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]/25 ring-1 ring-[var(--color-primary)] shadow-2xs"
                                  : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)]/50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[var(--color-foreground)]">
                                  {tpl.name}
                                </span>
                                <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] font-medium text-[var(--color-muted)]">
                                  {tpl.badge}
                                </span>
                              </div>
                              <p className="text-[10px] text-[var(--color-muted)] leading-relaxed">
                                {tpl.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Manage Carousel Slides (Up to 3 Slides) */}
                    <div className="space-y-3 pt-2 border-t border-[var(--color-border-subtle)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                            2. Manage Carousel Slides ({featuredSlidesList.length} / 3)
                          </label>
                          <p className="text-[11px] text-[var(--color-muted)]">
                            Add up to 3 slides. Guests can swipe horizontally or enable auto-rotate.
                          </p>
                        </div>
                        {featuredSlidesList.length < 3 && (
                          <button
                            type="button"
                            onClick={handleAddFeaturedSlide}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-2xs cursor-pointer"
                          >
                            <IconPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Add Slide</span>
                          </button>
                        )}
                      </div>

                      {/* Slide Tabs */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {featuredSlidesList.map((slide, idx) => {
                          const isSelected = activeFeaturedSlideIndex === idx;
                          const titleLabel =
                            slide.sourceType === "MENU_ITEM"
                              ? (menuItems.find((m) => m.id === slide.itemId)?.name || "Select Dish")
                              : (slide.customTitle || `Custom Dish ${idx + 1}`);

                          return (
                            <div
                              key={slide.id || idx}
                              onClick={() => setActiveFeaturedSlideIndex(idx)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                                isSelected
                                  ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]/25 text-[var(--color-foreground)] ring-1 ring-[var(--color-primary)] shadow-2xs"
                                  : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted)] hover:border-[var(--color-primary)]/40"
                              }`}
                            >
                              <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
                                #{idx + 1}
                              </span>
                              <span className="max-w-[110px] truncate">{titleLabel}</span>
                              {featuredSlidesList.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFeaturedSlide(idx);
                                  }}
                                  title="Delete Slide"
                                  className="p-1 rounded-md text-red-500 hover:bg-red-500/10 transition-colors ml-0.5 cursor-pointer"
                                >
                                  <IconTrash className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Active Slide Form */}
                      {featuredCurrentSlide && (
                        <div className="p-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] space-y-3.5">
                          {/* Slide Source Type Toggle */}
                          <div>
                            <label className="block text-[11px] font-semibold text-[var(--color-foreground)] mb-1.5">
                              Slide Type
                            </label>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateFeaturedSlide(activeFeaturedSlideIndex, {
                                    sourceType: "MENU_ITEM",
                                    itemId: featuredCurrentSlide.itemId || menuItems[0]?.id || "",
                                  })
                                }
                                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                  featuredCurrentSlide.sourceType === "MENU_ITEM"
                                    ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]/30 text-[var(--color-foreground)] font-bold ring-1 ring-[var(--color-primary)]"
                                    : "border-[var(--color-border)] text-[var(--color-muted)] bg-[var(--color-surface)]"
                                }`}
                              >
                                <span>Menu Dish</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateFeaturedSlide(activeFeaturedSlideIndex, {
                                    sourceType: "CUSTOM",
                                    imageSource: "CUSTOM_UPLOAD",
                                  })
                                }
                                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                  featuredCurrentSlide.sourceType === "CUSTOM"
                                    ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]/30 text-[var(--color-foreground)] font-bold ring-1 ring-[var(--color-primary)]"
                                    : "border-[var(--color-border)] text-[var(--color-muted)] bg-[var(--color-surface)]"
                                }`}
                              >
                                <span>Custom Dish / Promo</span>
                              </button>
                            </div>
                          </div>

                          {/* Menu Item Selector */}
                          {featuredCurrentSlide.sourceType === "MENU_ITEM" ? (
                            <div className="space-y-2">
                              <label className="block text-[11px] font-medium text-[var(--color-foreground)]">
                                Select Menu Dish
                              </label>
                              <select
                                value={featuredCurrentSlide.itemId || ""}
                                onChange={(e) => {
                                  const item = menuItems.find((m) => m.id === e.target.value);
                                  handleUpdateFeaturedSlide(activeFeaturedSlideIndex, {
                                    itemId: e.target.value,
                                    customTitle: item?.name,
                                    customSubtitle: item?.description || undefined,
                                    price: item?.price,
                                  });
                                }}
                                className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] cursor-pointer"
                              >
                                <option value="">Select a dish from menu...</option>
                                {menuItems.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name} — ₹{item.price}
                                  </option>
                                ))}
                              </select>

                              {/* Image Source for Menu Item */}
                              <div className="pt-1.5">
                                <label className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1">
                                  Dish Photo Source
                                </label>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <label
                                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                                      (featuredCurrentSlide.imageSource || "ITEM_IMAGE") === "ITEM_IMAGE"
                                        ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]/20 text-[var(--color-foreground)] font-semibold"
                                        : "border-[var(--color-border)] text-[var(--color-muted)]"
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`imgSrc_${activeFeaturedSlideIndex}`}
                                      checked={(featuredCurrentSlide.imageSource || "ITEM_IMAGE") === "ITEM_IMAGE"}
                                      onChange={() =>
                                        handleUpdateFeaturedSlide(activeFeaturedSlideIndex, {
                                          imageSource: "ITEM_IMAGE",
                                        })
                                      }
                                      className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                    />
                                    <span>Item Dish Photo</span>
                                  </label>
                                  <label
                                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                                      featuredCurrentSlide.imageSource === "CUSTOM_UPLOAD"
                                        ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]/20 text-[var(--color-foreground)] font-semibold"
                                        : "border-[var(--color-border)] text-[var(--color-muted)]"
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`imgSrc_${activeFeaturedSlideIndex}`}
                                      checked={featuredCurrentSlide.imageSource === "CUSTOM_UPLOAD"}
                                      onChange={() =>
                                        handleUpdateFeaturedSlide(activeFeaturedSlideIndex, {
                                          imageSource: "CUSTOM_UPLOAD",
                                        })
                                      }
                                      className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                    />
                                    <span>Custom Upload</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Custom Slide Details */
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1">
                                    Dish / Promo Title
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Enter a menu item name"
                                    value={featuredCurrentSlide.customTitle || ""}
                                    onChange={(e) =>
                                      handleUpdateFeaturedSlide(activeFeaturedSlideIndex, {
                                        customTitle: e.target.value,
                                      })
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1">
                                    Price (₹)
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="Enter the item price"
                                    value={featuredCurrentSlide.price ?? ""}
                                    onChange={(e) =>
                                      handleUpdateFeaturedSlide(activeFeaturedSlideIndex, {
                                        price: Number(e.target.value) || 0,
                                      })
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1">
                                  Subtitle / Description
                                </label>
                                <input
                                  type="text"
                                  placeholder="Optional subtitle"
                                  value={featuredCurrentSlide.customSubtitle || ""}
                                  onChange={(e) =>
                                    handleUpdateFeaturedSlide(activeFeaturedSlideIndex, {
                                      customSubtitle: e.target.value,
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                                />
                              </div>
                            </div>
                          )}

                          {/* Image Upload Block (if Custom Slide or Custom Upload) */}
                          {(featuredCurrentSlide.sourceType === "CUSTOM" ||
                            featuredCurrentSlide.imageSource === "CUSTOM_UPLOAD") && (
                            <div className="p-3 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {featuredCurrentSlide.customImageUrl ? (
                                  <img
                                    src={featuredCurrentSlide.customImageUrl}
                                    alt="Preview"
                                    className="w-10 h-10 rounded-lg object-cover border border-[var(--color-border)]"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)]">
                                    <IconPhoto className="w-5 h-5" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <span className="text-xs font-semibold text-[var(--color-foreground)] block truncate">
                                    {featuredCurrentSlide.customImageUrl
                                      ? "Custom Image Active"
                                      : "Upload Slide Photo"}
                                  </span>
                                  <span className="text-[10px] text-[var(--color-muted)]">
                                    JPG, PNG, WEBP (Max 5MB)
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  triggerImageUploadForSlide("FEATURED", activeFeaturedSlideIndex)
                                }
                                disabled={isUploadingImage}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] cursor-pointer disabled:opacity-50"
                              >
                                {isUploadingImage ? (
                                  <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <IconUpload className="w-3.5 h-3.5" />
                                )}
                                <span>
                                  {featuredCurrentSlide.customImageUrl ? "Replace" : "Upload File"}
                                </span>
                              </button>
                            </div>
                          )}

                          {/* Common Text Overrides: Badge & Button */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[var(--color-border-subtle)] text-xs">
                            <div>
                              <label className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1">
                                Badge Pill Text
                              </label>
                              <input
                                type="text"
                                placeholder="Optional badge"
                                value={featuredCurrentSlide.badgeText || ""}
                                onChange={(e) =>
                                  handleUpdateFeaturedSlide(activeFeaturedSlideIndex, {
                                    badgeText: e.target.value,
                                  })
                                }
                                className="w-full px-2.5 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1">
                                Button Action Text
                              </label>
                              <input
                                type="text"
                                placeholder="Button label"
                                value={featuredCurrentSlide.actionText || ""}
                                onChange={(e) =>
                                  handleUpdateFeaturedSlide(activeFeaturedSlideIndex, {
                                    actionText: e.target.value,
                                  })
                                }
                                className="w-full px-2.5 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Auto-Rotate Toggle for Featured */}
                      <div className="pt-2 flex items-center justify-between text-xs border-t border-[var(--color-border-subtle)]">
                        <div>
                          <span className="font-semibold text-[var(--color-foreground)]">
                            Auto-Rotate Slides
                          </span>
                          <p className="text-[10.5px] text-[var(--color-muted)]">
                            Smoothly rotates between dishes every 4 seconds
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingSection({
                              ...editingSection,
                              config: {
                                ...editingSection.config,
                                autoScroll: editingSection.config?.autoScroll === false ? true : false,
                              },
                            })
                          }
                          className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                            editingSection.config?.autoScroll !== false
                              ? "bg-[var(--color-primary)]"
                              : "bg-neutral-300 dark:bg-neutral-700"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow-xs ${
                              editingSection.config?.autoScroll !== false ? "left-5" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* =========================================================
                    OFFERS SECTION CONFIGURATION
                   ========================================================= */}
                {editingSection.type === "OFFERS" && (
                  <>
                    {/* Step 1: Choose Style / Template */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                        1. Choose Offer Style Template
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[
                          {
                            id: "SPECIAL_CAROUSEL" as OfferTemplate,
                            name: "Discount Coupon Ticket (Theme Adaptive)",
                            badge: "Voucher Ticket",
                            desc: "Authentic ticket voucher with perforation, cute cartoon snack characters & theme-adaptive voucher stub",
                          },
                          {
                            id: "SIMPLE_BANNER" as OfferTemplate,
                            name: "Simple Borderless Banner",
                            badge: "Clean Banner",
                            desc: "Full-bleed clean flat banner without borders, sleek billboard feel",
                          },
                          {
                            id: "ROUNDED_CARD" as OfferTemplate,
                            name: "Rounded Corner Card",
                            badge: "Soft 3XL",
                            desc: "Smooth pill rounded corners with soft border & inset specular highlight",
                          },
                          {
                            id: "CENTER_BEND" as OfferTemplate,
                            name: "Center Bend Wave",
                            badge: "Curved Geometry",
                            desc: "Signature symmetrical center-bend wave curves top and bottom",
                          },
                        ].map((tpl) => {
                          const isSelected =
                            (editingSection.template || "SPECIAL_CAROUSEL") === tpl.id;
                          return (
                            <button
                              key={tpl.id}
                              type="button"
                              onClick={() =>
                                setEditingSection({
                                  ...editingSection,
                                  template: tpl.id,
                                })
                              }
                              className={`p-3 rounded-xl border text-left space-y-1 transition-all cursor-pointer ${
                                isSelected
                                  ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]/25 ring-1 ring-[var(--color-primary)] shadow-2xs"
                                  : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)]/50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[var(--color-foreground)]">
                                  {tpl.name}
                                </span>
                                <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] font-medium text-[var(--color-muted)]">
                                  {tpl.badge}
                                </span>
                              </div>
                              <p className="text-[10px] text-[var(--color-muted)] leading-relaxed">
                                {tpl.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Manage Offers Carousel Slides (Up to 3 Slides) */}
                    <div className="space-y-3 pt-2 border-t border-[var(--color-border-subtle)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                            2. Highlight Offers ({offerSlidesList.length} / 3)
                          </label>
                          <p className="text-[11px] text-[var(--color-muted)]">
                            Add up to 3 offer slides. Choose saved café offers or create custom perks.
                          </p>
                        </div>
                        {offerSlidesList.length < 3 && (
                          <button
                            type="button"
                            onClick={handleAddOfferSlide}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-2xs cursor-pointer"
                          >
                            <IconPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Add Slide</span>
                          </button>
                        )}
                      </div>

                      {/* Slide Tabs */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {offerSlidesList.map((slide, idx) => {
                          const isSelected = activeOfferSlideIndex === idx;
                          const matchedOffer = offersList.find((o) => o.id === slide.offerId);
                          const titleLabel =
                            slide.sourceType === "SAVED_OFFER"
                              ? (matchedOffer?.code || matchedOffer?.title || "Saved Offer")
                              : (slide.customTitle || `Custom Perk ${idx + 1}`);

                          return (
                            <div
                              key={slide.id || idx}
                              onClick={() => setActiveOfferSlideIndex(idx)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                                isSelected
                                  ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]/25 text-[var(--color-foreground)] ring-1 ring-[var(--color-primary)] shadow-2xs"
                                  : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted)] hover:border-[var(--color-primary)]/40"
                              }`}
                            >
                              <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
                                #{idx + 1}
                              </span>
                              <span className="max-w-[110px] truncate">{titleLabel}</span>
                              {offerSlidesList.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteOfferSlide(idx);
                                  }}
                                  title="Delete Slide"
                                  className="p-1 rounded-md text-red-500 hover:bg-red-500/10 transition-colors ml-0.5 cursor-pointer"
                                >
                                  <IconTrash className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Active Offer Slide Form */}
                      {offerCurrentSlide && (
                        <div className="p-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] space-y-3.5">
                          {/* Offer Source Type Toggle */}
                          <div>
                            <label className="block text-[11px] font-semibold text-[var(--color-foreground)] mb-1.5">
                              Offer Source
                            </label>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateOfferSlide(activeOfferSlideIndex, {
                                    sourceType: "SAVED_OFFER",
                                    offerId: offerCurrentSlide.offerId || offersList[0]?.id || "",
                                  })
                                }
                                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                  offerCurrentSlide.sourceType === "SAVED_OFFER"
                                    ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]/30 text-[var(--color-foreground)] font-bold ring-1 ring-[var(--color-primary)]"
                                    : "border-[var(--color-border)] text-[var(--color-muted)] bg-[var(--color-surface)]"
                                }`}
                              >
                                <span>Saved Café Offer</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateOfferSlide(activeOfferSlideIndex, {
                                    sourceType: "CUSTOM",
                                  })
                                }
                                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                  offerCurrentSlide.sourceType === "CUSTOM"
                                    ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]/30 text-[var(--color-foreground)] font-bold ring-1 ring-[var(--color-primary)]"
                                    : "border-[var(--color-border)] text-[var(--color-muted)] bg-[var(--color-surface)]"
                                }`}
                              >
                                <span>Custom Perk Slide</span>
                              </button>
                            </div>
                          </div>

                          {/* Saved Offer Selector */}
                          {offerCurrentSlide.sourceType === "SAVED_OFFER" ? (
                            <div className="space-y-2">
                              <label className="block text-[11px] font-medium text-[var(--color-foreground)]">
                                Select Active Café Offer
                              </label>
                              {offersList.length === 0 ? (
                                <p className="text-xs text-[var(--color-muted)] p-2.5 rounded-lg border border-dashed border-[var(--color-border)]">
                                  No offers created in Offers tab yet. Switch to "Custom Perk Slide" to add a custom reward.
                                </p>
                              ) : (
                                <select
                                  value={offerCurrentSlide.offerId || ""}
                                  onChange={(e) => {
                                    const targetOffer = offersList.find((o) => o.id === e.target.value);
                                    handleUpdateOfferSlide(activeOfferSlideIndex, {
                                      offerId: e.target.value,
                                      code: targetOffer?.code || undefined,
                                      badgeText: targetOffer?.badgeText || "Special Offer",
                                      customTitle: targetOffer?.title,
                                      customSubtitle: targetOffer?.description || undefined,
                                    });
                                  }}
                                  className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] cursor-pointer"
                                >
                                  <option value="">Select an offer...</option>
                                  {offersList.map((off) => (
                                    <option key={off.id} value={off.id}>
                                      {off.code} — {off.title} ({off.discountType === "PERCENTAGE" ? `${off.discountValue}% OFF` : `₹${off.discountValue} OFF`})
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          ) : (
                            /* Custom Offer Fields */
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1">
                                    Headline / Title
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Describe this offer"
                                    value={offerCurrentSlide.customTitle || ""}
                                    onChange={(e) =>
                                      handleUpdateOfferSlide(activeOfferSlideIndex, {
                                        customTitle: e.target.value,
                                      })
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1">
                                    Promo Code (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Offer code"
                                    value={offerCurrentSlide.code || ""}
                                    onChange={(e) =>
                                      handleUpdateOfferSlide(activeOfferSlideIndex, {
                                        code: e.target.value,
                                      })
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] font-mono"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1">
                                  Description / Terms
                                </label>
                                <input
                                  type="text"
                                  placeholder="Optional offer details"
                                  value={offerCurrentSlide.customSubtitle || ""}
                                  onChange={(e) =>
                                    handleUpdateOfferSlide(activeOfferSlideIndex, {
                                      customSubtitle: e.target.value,
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1">
                                  Discount Callout (Voucher Stub)
                                </label>
                                <input
                                  type="text"
                                  placeholder="Discount or benefit"
                                  value={offerCurrentSlide.discountValue || ""}
                                  onChange={(e) =>
                                    handleUpdateOfferSlide(activeOfferSlideIndex, {
                                      discountValue: e.target.value,
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] font-bold"
                                />
                              </div>
                            </div>
                          )}

                          {/* Custom Image Upload for Offer Card */}
                          <div className="p-3 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {offerCurrentSlide.customImageUrl ? (
                                <img
                                  src={offerCurrentSlide.customImageUrl}
                                  alt="Preview"
                                  className="w-10 h-10 rounded-lg object-cover border border-[var(--color-border)]"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)]">
                                  <IconPhoto className="w-5 h-5" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-[var(--color-foreground)] block truncate">
                                  {offerCurrentSlide.customImageUrl
                                    ? "Custom Photo Active"
                                    : "Custom Photo (Optional)"}
                                </span>
                                <span className="text-[10px] text-[var(--color-muted)]">
                                  Optional photo for classic card layouts
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => triggerImageUploadForSlide("OFFERS", activeOfferSlideIndex)}
                              disabled={isUploadingImage}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] cursor-pointer disabled:opacity-50"
                            >
                              {isUploadingImage ? (
                                <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <IconUpload className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {offerCurrentSlide.customImageUrl ? "Replace" : "Upload Photo"}
                              </span>
                            </button>
                          </div>

                          {/* Common Text Overrides: Badge & Button */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[var(--color-border-subtle)] text-xs">
                            <div>
                              <label className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1">
                                Badge Pill Text
                              </label>
                              <input
                                type="text"
                                placeholder="Optional badge"
                                value={offerCurrentSlide.badgeText || ""}
                                onChange={(e) =>
                                  handleUpdateOfferSlide(activeOfferSlideIndex, {
                                    badgeText: e.target.value,
                                  })
                                }
                                className="w-full px-2.5 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1">
                                Button Action Text
                              </label>
                              <input
                                type="text"
                                placeholder="Button label"
                                value={offerCurrentSlide.actionText || ""}
                                onChange={(e) =>
                                  handleUpdateOfferSlide(activeOfferSlideIndex, {
                                    actionText: e.target.value,
                                  })
                                }
                                className="w-full px-2.5 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                              />
                            </div>
                          </div>

                          {/* Voucher Card Color Selector (Every voucher has different color, not theme locked) */}
                          <div className="pt-2.5 border-t border-[var(--color-border-subtle)] space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-[11px] font-semibold text-[var(--color-foreground)]">
                                Voucher Stub Color (Slide #{activeOfferSlideIndex + 1})
                              </label>
                              <span className="text-[10px] text-[var(--color-muted)] font-medium">
                                Customized per voucher • Not theme locked
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {[
                                { name: "Celery Lime", value: "#B4E858" },
                                { name: "Tangerine", value: "#FF9E54" },
                                { name: "Coral Red", value: "#FF5C5C" },
                                { name: "Golden Amber", value: "#FFB703" },
                                { name: "Sky Cyan", value: "#38BDF8" },
                                { name: "Royal Violet", value: "#B28DFF" },
                                { name: "Blush Pink", value: "#FF7597" },
                                { name: "Mint Emerald", value: "#10B981" },
                                { name: "Charcoal Slate", value: "#334155" },
                              ].map((swatch) => {
                                const currentVoucherColor =
                                  offerCurrentSlide.voucherColor ||
                                  (activeOfferSlideIndex === 0
                                    ? "#B4E858"
                                    : activeOfferSlideIndex === 1
                                    ? "#FF9E54"
                                    : "#FF5C5C");
                                const isSelected = currentVoucherColor === swatch.value;

                                return (
                                  <button
                                    key={swatch.value}
                                    type="button"
                                    onClick={() =>
                                      handleUpdateOfferSlide(activeOfferSlideIndex, {
                                        voucherColor: swatch.value,
                                      })
                                    }
                                    className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                                      isSelected
                                        ? "border-black scale-110 shadow-sm ring-2 ring-black/20"
                                        : "border-white hover:scale-105"
                                    }`}
                                    style={{ backgroundColor: swatch.value }}
                                    title={swatch.name}
                                  >
                                    {isSelected && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#1C1D1A]" />
                                    )}
                                  </button>
                                );
                              })}

                              {/* Custom Hex Color Picker */}
                              <div className="flex items-center gap-1.5 pl-2 border-l border-[var(--color-border)]">
                                <input
                                  type="color"
                                  value={
                                    offerCurrentSlide.voucherColor ||
                                    (activeOfferSlideIndex === 0
                                      ? "#B4E858"
                                      : activeOfferSlideIndex === 1
                                      ? "#FF9E54"
                                      : "#FF5C5C")
                                  }
                                  onChange={(e) =>
                                    handleUpdateOfferSlide(activeOfferSlideIndex, {
                                      voucherColor: e.target.value,
                                    })
                                  }
                                  className="w-7 h-7 rounded-md cursor-pointer border border-[var(--color-border)] p-0.5 bg-[var(--color-surface)]"
                                  title="Pick Custom Hex Color"
                                />
                                <span className="text-[10px] font-mono text-[var(--color-muted)]">
                                  {offerCurrentSlide.voucherColor || "Default"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Auto-Rotate Toggle for Offers */}
                      <div className="pt-2 flex items-center justify-between text-xs border-t border-[var(--color-border-subtle)]">
                        <div>
                          <span className="font-semibold text-[var(--color-foreground)]">
                            Auto-Rotate Offers
                          </span>
                          <p className="text-[10.5px] text-[var(--color-muted)]">
                            Smoothly rotates between offers every 4 seconds
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingSection({
                              ...editingSection,
                              config: {
                                ...editingSection.config,
                                autoScroll: editingSection.config?.autoScroll === false ? true : false,
                              },
                            })
                          }
                          className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                            editingSection.config?.autoScroll !== false
                              ? "bg-[var(--color-primary)]"
                              : "bg-neutral-300 dark:bg-neutral-700"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow-xs ${
                              editingSection.config?.autoScroll !== false ? "left-5" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* RIGHT LIVE MOBILE PREVIEW (5 cols) */}
              <div className="lg:col-span-5 bg-[var(--color-surface-subtle)] p-5 flex flex-col items-center justify-center overflow-y-auto">
                <div className="w-full max-w-[340px] space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
                      <IconDeviceMobile className="w-4 h-4 text-[var(--color-primary)]" />
                      <span>Live Customer View</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Real-Time Synced
                    </span>
                  </div>

                  {/* Mobile Frame Container */}
                  <div className="w-full rounded-[36px] bg-[#1A1D1A] p-2.5 shadow-2xl border-4 border-[#2D332D]">
                    {/* Speaker & Camera Notch */}
                    <div className="w-24 h-4 bg-[#2D332D] mx-auto rounded-b-xl mb-1 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-black/60 mr-2" />
                      <div className="w-8 h-1 rounded-full bg-black/40" />
                    </div>

                    {/* Mobile Screen Surface */}
                    <div
                      className="w-full bg-[#FAFBF9] dark:bg-[#121412] rounded-[28px] overflow-hidden p-3.5 space-y-3 min-h-[440px] text-[#1C1D1A] dark:text-white"
                      style={getCafeThemeStyles(themePreset, fontFamily) as React.CSSProperties}
                    >
                      {/* Mini Cafe Bar */}
                      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          {cafeLogoUrl ? (
                            <img
                              src={cafeLogoUrl}
                              alt={cafeName}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-[#4E7A5A] text-white flex items-center justify-center text-[10px] font-bold">
                              {cafeName[0]}
                            </div>
                          )}
                          <span className="text-xs font-bold truncate max-w-[150px]">
                            {cafeName}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#73716B]">Table #4</span>
                      </div>

                      {/* Render the edited section live! */}
                      <div className="py-2">
                        {editingSection.type === "FEATURED" && (
                          <FeaturedSectionRenderer
                            section={editingSection}
                            menuItems={menuItems}
                            bestsellers={menuItems.filter((m) => m.isBestseller)}
                            cart={[]}
                            digitalMenuTheme={themePreset}
                            onSelectItem={() => {}}
                            onQuickAdd={() => {}}
                          />
                        )}

                        {editingSection.type === "OFFERS" && (
                          <OffersSectionRenderer
                            section={editingSection}
                            offers={offersList}
                            digitalMenuTheme={themePreset}
                            onOpenOffers={() => {}}
                            cafeName={cafeName}
                            cafeSlug={cafeSlug}
                          />
                        )}

                        {editingSection.type === "POPULAR" && (
                          <PopularSectionRenderer
                            section={editingSection}
                            popularItems={calculatePopularItems(menuItems)}
                            totalMenuItemsCount={menuItems.length}
                            digitalMenuTheme={themePreset}
                            cart={[]}
                            favorites={[]}
                            showAllPopular={false}
                            onToggleShowAllPopular={() => {}}
                            onViewAllMenu={() => {}}
                            onSelectItem={() => {}}
                            onQuickAdd={() => {}}
                            onQuickMinus={() => {}}
                            onToggleFavorite={() => {}}
                          />
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
