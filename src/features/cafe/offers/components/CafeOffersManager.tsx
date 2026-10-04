"use client";

import React, { useState } from "react";
import { Offer, DiscountType } from "@/lib/db/schema/offers";
import { CafeSetting, DEFAULT_HOME_SECTIONS } from "@/lib/db/schema/cafe-settings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { OfferFormModal } from "./OfferFormModal";
import {
  IconPlus,
  IconSearch,
  IconTag,
  IconGift,
  IconSparkles,
  IconCopy,
  IconCheck,
  IconEdit,
  IconTrash,
  IconInfoCircle,
  IconPercentage,
  IconCurrencyRupee,
  IconCoffee,
  IconCoins,
  IconCircleCheck,
  IconTicket,
  IconArmchair,
  IconShoppingBag,
} from "@tabler/icons-react";

interface CafeOffersManagerProps {
  cafe: {
    id: string;
    slug: string;
    name: string;
  };
  initialOffers: Offer[];
  initialSettings: CafeSetting | null;
  menuItems?: Array<{
    id: string;
    name: string;
    price: number;
    imageUrl?: string | null;
  }>;
  categories?: Array<{
    id: string;
    name: string;
  }>;
}

export const CafeOffersManager: React.FC<CafeOffersManagerProps> = ({
  cafe,
  initialOffers,
  initialSettings,
  menuItems = [],
  categories = [],
}) => {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"OFFERS" | "LOYALTY">("OFFERS");

  // Offers State
  const [offersList, setOffersList] = useState<Offer[]>(initialOffers);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Loyalty Program State
  // Rule: Only one loyalty system (STAMPS or POINTS)
  const currentConfiguredType: "STAMPS" | "POINTS" =
    (initialSettings as any)?.loyaltyType ||
    (initialSettings as any)?.loyaltyProgram ||
    (initialSettings?.homeSections?.find((s) => s.type === "REWARDS")?.config as any)?.loyaltyType ||
    "STAMPS";

  const [loyaltyType, setLoyaltyType] = useState<"STAMPS" | "POINTS">(currentConfiguredType);
  const [isLoyaltyEnabled, setIsLoyaltyEnabled] = useState<boolean>(
    initialSettings?.enableOffers ?? true
  );
  const [isSavingLoyalty, setIsSavingLoyalty] = useState(false);

  // Home Carousel Offers State:
  // Decides which offers appear on the customer home "Offers & Perks" carousel
  const [homeOfferIds, setHomeOfferIds] = useState<string[]>(() => {
    const offersSec = initialSettings?.homeSections?.find((s) => s.type === "OFFERS");
    if (offersSec?.config?.offerIds && Array.isArray(offersSec.config.offerIds)) {
      return offersSec.config.offerIds;
    }
    // If not explicitly configured yet, all active offers default to featured on home
    return initialOffers.filter((o) => o.isActive).map((o) => o.id);
  });

  const saveHomeOfferIds = async (newOfferIds: string[]) => {
    const existingSections =
      initialSettings?.homeSections && initialSettings.homeSections.length > 0
        ? initialSettings.homeSections
        : DEFAULT_HOME_SECTIONS;

    const updatedSections = existingSections.map((sec) => {
      if (sec.type === "OFFERS") {
        return {
          ...sec,
          enabled: true,
          config: {
            ...(sec.config || {}),
            offerIds: newOfferIds,
          },
        };
      }
      return sec;
    });

    const res = await fetch(`/api/cafe/${cafe.slug}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeSections: updatedSections }),
    });
    if (!res.ok) throw new Error("Failed to update home offers settings");
  };

  const handleToggleHomeFeatured = async (offerId: string) => {
    const isCurrentlyFeatured = homeOfferIds.includes(offerId);
    const newFeatured = isCurrentlyFeatured
      ? homeOfferIds.filter((id) => id !== offerId)
      : [...homeOfferIds, offerId];

    setHomeOfferIds(newFeatured);

    try {
      await saveHomeOfferIds(newFeatured);
      const targetOffer = offersList.find((o) => o.id === offerId);
      toast({
        title: isCurrentlyFeatured ? "Removed from Home Carousel" : "Featured on Home Carousel ✨",
        description: isCurrentlyFeatured
          ? `${targetOffer?.code || "Offer"} hidden from customer home screen`
          : `${targetOffer?.code || "Offer"} is now live on the customer home screen ticket banner`,
        variant: "success",
      });
    } catch (err: any) {
      setHomeOfferIds(homeOfferIds);
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update home settings",
        variant: "danger",
      });
    }
  };

  // Statistics
  const totalOffersCount = offersList.length;
  const activeOffersCount = offersList.filter((o) => o.isActive).length;
  const inactiveOffersCount = totalOffersCount - activeOffersCount;

  // Filtered Offers
  const filteredOffers = offersList.filter((offer) => {
    const matchesSearch =
      offer.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (offer.description && offer.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === "ACTIVE") return offer.isActive;
    if (statusFilter === "INACTIVE") return !offer.isActive;
    return true;
  });

  // Copy Code to Clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: "Code Copied!",
      description: `${code} copied to clipboard`,
      variant: "success",
    });
    setTimeout(() => {
      setCopiedCode((prev) => (prev === code ? null : prev));
    }, 2000);
  };

  // Quick Toggle Active Status
  const handleToggleOfferActive = async (offer: Offer) => {
    const newStatus = !offer.isActive;
    // Optimistic update
    setOffersList((prev) =>
      prev.map((o) => (o.id === offer.id ? { ...o, isActive: newStatus } : o))
    );

    try {
      const res = await fetch(`/api/cafe/${cafe.slug}/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update offer status");

      toast({
        title: newStatus ? "Offer Activated" : "Offer Deactivated",
        description: `${offer.code} is now ${newStatus ? "visible to customers" : "hidden"}`,
        variant: "info",
      });
    } catch (err: any) {
      // Revert optimistic update
      setOffersList((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, isActive: offer.isActive } : o))
      );
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update offer status",
        variant: "danger",
      });
    }
  };

  // Duplicate Offer Handler
  const handleDuplicateOffer = (offer: Offer) => {
    setEditingOffer({
      ...offer,
      id: "", // Blank ID means it will create a new offer on save
      code: `${offer.code}_COPY`,
      title: `${offer.title} (Copy)`,
    });
    setIsFormModalOpen(true);
  };

  // Create / Edit Submit Handler
  const handleSaveOffer = async (formData: {
    code: string;
    title: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
    maxDiscountAmount?: number | null;
    minOrderAmount: number;
    rewardItemId?: string | null;
    rewardItemName?: string | null;
    applicationMethod: "AUTOMATIC" | "COUPON_CODE";
    appliesTo: "ALL" | "CATEGORIES" | "ITEMS";
    targetCategoryIds?: string | null;
    targetItemIds?: string | null;
    customerEligibility: "ALL" | "NEW" | "RETURNING" | "LOYALTY";
    usageLimitTotal?: number | null;
    usageLimitPerCustomer?: number | null;
    timeStart?: string | null;
    timeEnd?: string | null;
    daysOfWeek?: string | null;
    availableChannels?: string;
    applicableOrderType?: "BOTH" | "DINE_IN" | "TAKEAWAY";
    cannotCombine?: boolean;
    freeItemUnlockType?: "SPEND" | "CATEGORY" | "ITEM";
    freeItemQualifyingCategoryId?: string | null;
    freeItemQualifyingItemId?: string | null;
    badgeText?: string;
    isActive: boolean;
    showOnHome?: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      if (editingOffer && editingOffer.id) {
        // Edit existing
        const res = await fetch(`/api/cafe/${cafe.slug}/offers/${editingOffer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error?.message || "Failed to update offer");

        setOffersList((prev) =>
          prev.map((o) => (o.id === editingOffer.id ? result.data : o))
        );

        // Sync Home Carousel selection
        const savedId = editingOffer.id;
        let nextHomeIds = homeOfferIds;
        if (formData.showOnHome !== false) {
          if (!nextHomeIds.includes(savedId)) nextHomeIds = [...nextHomeIds, savedId];
        } else {
          nextHomeIds = nextHomeIds.filter((id) => id !== savedId);
        }
        if (nextHomeIds !== homeOfferIds) {
          setHomeOfferIds(nextHomeIds);
          saveHomeOfferIds(nextHomeIds).catch(() => {});
        }

        toast({
          title: "Offer Updated",
          description: `Offer ${formData.code} has been successfully updated`,
          variant: "success",
        });
      } else {
        // Create new or duplicate
        const res = await fetch(`/api/cafe/${cafe.slug}/offers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error?.message || "Failed to create offer");

        setOffersList((prev) => [result.data, ...prev]);

        // Sync Home Carousel selection for newly created offer
        if (result.data?.id) {
          const newId = result.data.id;
          let nextHomeIds = homeOfferIds;
          if (formData.showOnHome !== false) {
            if (!nextHomeIds.includes(newId)) nextHomeIds = [...nextHomeIds, newId];
          } else {
            nextHomeIds = nextHomeIds.filter((id) => id !== newId);
          }
          if (nextHomeIds !== homeOfferIds) {
            setHomeOfferIds(nextHomeIds);
            saveHomeOfferIds(nextHomeIds).catch(() => {});
          }
        }

        toast({
          title: "Offer Created 🎉",
          description: `New offer ${formData.code} is ready for customers`,
          variant: "success",
        });
      }
      setIsFormModalOpen(false);
      setEditingOffer(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Operation failed",
        variant: "danger",
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Offer Handler
  const handleDeleteOffer = async () => {
    if (!offerToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/cafe/${cafe.slug}/offers/${offerToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete offer");

      setOffersList((prev) => prev.filter((o) => o.id !== offerToDelete.id));

      const nextHomeIds = homeOfferIds.filter((id) => id !== offerToDelete.id);
      if (nextHomeIds.length !== homeOfferIds.length) {
        setHomeOfferIds(nextHomeIds);
        saveHomeOfferIds(nextHomeIds).catch(() => {});
      }

      toast({
        title: "Offer Deleted",
        description: `${offerToDelete.code} has been removed`,
        variant: "info",
      });
      setOfferToDelete(null);
    } catch (err: any) {
      toast({
        title: "Deletion Failed",
        description: err.message || "Failed to delete offer",
        variant: "danger",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Save Loyalty Program Settings
  const handleSaveLoyaltySettings = async () => {
    setIsSavingLoyalty(true);
    try {
      // Sync client localStorage immediately
      try {
        localStorage.setItem(`cafe_loyalty_mode_${cafe.slug}`, loyaltyType);
      } catch (e) {}

      // Update homeSections REWARDS configuration and enableOffers
      const existingSections = initialSettings?.homeSections || [];
      const updatedSections = existingSections.map((sec) => {
        if (sec.type === "REWARDS") {
          return {
            ...sec,
            enabled: isLoyaltyEnabled,
            config: {
              ...(sec.config || {}),
              loyaltyType,
            },
          };
        }
        return sec;
      });

      const res = await fetch(`/api/cafe/${cafe.slug}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enableOffers: isLoyaltyEnabled,
          homeSections: updatedSections,
        }),
      });

      if (!res.ok) throw new Error("Failed to save loyalty settings");

      toast({
        title: "Loyalty Settings Saved! ✨",
        description: `Active program: ${
          loyaltyType === "STAMPS" ? "Digital Stamp Card" : "Bean Points Program"
        }`,
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Failed to update loyalty settings",
        variant: "danger",
      });
    } finally {
      setIsSavingLoyalty(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. HEADER & ACTIONS
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
              Offers & Loyalty
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              Growth Hub
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-muted)] mt-1">
            Create promotional codes, manage checkout unlock banners, and configure customer loyalty rewards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "OFFERS" && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingOffer(null);
                setIsFormModalOpen(true);
              }}
              className="flex items-center gap-1.5"
            >
              <IconPlus className="w-4 h-4" />
              <span>Create Offer</span>
            </Button>
          )}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. METRICS & KPI STRIP
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-muted)]">
              Total Offers
            </span>
            <div className="p-1.5 rounded-lg bg-[var(--color-primary-light)]/40 text-[var(--color-primary)]">
              <IconTag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--color-foreground)]">
              {totalOffersCount}
            </span>
            <span className="text-[11px] text-[var(--color-muted)]">
              promotions configured
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-muted)]">
              Active Offers
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <IconCircleCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeOffersCount}
            </span>
            <span className="text-[11px] text-[var(--color-muted)]">
              visible in cart & menu
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-muted)]">
              Inactive Offers
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <IconInfoCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--color-foreground)]">
              {inactiveOffersCount}
            </span>
            <span className="text-[11px] text-[var(--color-muted)]">
              drafts or paused
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-muted)]">
              Loyalty System
            </span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <IconGift className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-[var(--color-foreground)]">
              {loyaltyType === "STAMPS" ? "Digital Stamp Card" : "Bean Points"}
            </span>
          </div>
          <p className="text-[10px] text-[var(--color-muted)] mt-0.5">
            {isLoyaltyEnabled ? "Active for customer profiles" : "Currently disabled"}
          </p>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. NAVIGATION TABS
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => setActiveTab("OFFERS")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "OFFERS"
              ? "border-[var(--color-primary)] text-[var(--color-primary)]"
              : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          }`}
        >
          <IconTag className="w-4 h-4" />
          <span>Offers & Coupons ({totalOffersCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("LOYALTY")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "LOYALTY"
              ? "border-[var(--color-primary)] text-[var(--color-primary)]"
              : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          }`}
        >
          <IconGift className="w-4 h-4" />
          <span>Loyalty Program Settings</span>
        </button>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. TAB 1: OFFERS & COUPONS VIEW
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === "OFFERS" && (
        <div className="space-y-4">
          {/* Home Section "Offers & Perks" Carousel Status Strip */}
          <div className="p-3.5 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-400">
                <IconTicket className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-[var(--color-foreground)]">
                    Home &quot;Offers &amp; Perks&quot; Section Carousel
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/20">
                    {homeOfferIds.filter((id) => offersList.some((o) => o.id === id && o.isActive)).length} Live in Carousel
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-muted)] leading-relaxed mt-0.5">
                  Offers created here automatically appear on your digital menu home page. Click the &quot;On Home Carousel&quot; button on any offer below to choose exactly which deals appear to guests.
                </p>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <IconSearch className="w-4 h-4 text-[var(--color-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search offers by code, title, or terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  statusFilter === "ALL"
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-background)]"
                }`}
              >
                All ({totalOffersCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  statusFilter === "ACTIVE"
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-background)]"
                }`}
              >
                Active ({activeOffersCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("INACTIVE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  statusFilter === "INACTIVE"
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-background)]"
                }`}
              >
                Inactive ({inactiveOffersCount})
              </button>
            </div>
          </div>

          {/* Offer Cards Grid */}
          {filteredOffers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredOffers.map((offer) => {
                const isPercentage = offer.discountType === "PERCENTAGE";
                const isCopied = copiedCode === offer.code;

                return (
                  <div
                    key={offer.id}
                    className={`rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between gap-3 relative shadow-2xs ${
                      offer.isActive
                        ? "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50"
                        : "border-dashed border-[var(--color-border)] bg-[var(--color-background)] opacity-75"
                    }`}
                  >
                    {/* Top Row: Code Badge, Copy, & Active Toggle */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-1 text-xs font-extrabold rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] font-mono tracking-wider flex items-center gap-1 border border-[var(--color-primary)]/20">
                            {offer.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(offer.code)}
                            title="Copy promo code"
                            className="p-1 rounded-md text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-background)] transition-colors cursor-pointer"
                          >
                            {isCopied ? (
                              <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <IconCopy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              offer.applicationMethod === "AUTOMATIC"
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900/40"
                                : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700"
                            }`}
                          >
                            {offer.applicationMethod === "AUTOMATIC" ? "Auto in Cart" : "Coupon"}
                          </span>
                        </div>

                        {/* Status Switch */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-[var(--color-muted)]">
                            {offer.isActive ? "Active" : "Inactive"}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={offer.isActive}
                              onChange={() => handleToggleOfferActive(offer)}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4.5 bg-neutral-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                          </label>
                        </div>
                      </div>

                      {/* Title & Badge */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                            {offer.badgeText || "Special Offer"}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[var(--color-foreground)] leading-snug">
                          {offer.title}
                        </h3>
                        {offer.description && (
                          <p className="text-xs text-[var(--color-muted)] line-clamp-2 mt-0.5">
                            {offer.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Discount Value & Requirements */}
                    <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--color-muted)]">Benefit:</span>
                        <span className="font-extrabold text-[var(--color-primary)] flex items-center gap-0.5">
                          {offer.discountType === "FREE_ITEM" ? (
                            <>🎁 Free {offer.rewardItemName || "Menu Item"}</>
                          ) : isPercentage ? (
                            <>
                              <IconPercentage className="w-3.5 h-3.5" />
                              {offer.discountValue}% OFF
                              {offer.maxDiscountAmount ? (
                                <span className="text-[10px] font-normal text-[var(--color-muted)] ml-1">
                                  (Max ₹{offer.maxDiscountAmount})
                                </span>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <IconCurrencyRupee className="w-3.5 h-3.5" />
                              Flat ₹{offer.discountValue} OFF
                            </>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--color-muted)]">Min Spend:</span>
                        <span className="font-medium text-[var(--color-foreground)]">
                          {(offer.minOrderAmount || 0) > 0 ? (
                            `₹${offer.minOrderAmount}`
                          ) : (
                            <span className="text-[var(--color-muted)]">None (All Orders)</span>
                          )}
                        </span>
                      </div>

                      {/* Scope & Schedule Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-muted)]">
                          {offer.appliesTo === "CATEGORIES"
                            ? "Categories"
                            : offer.appliesTo === "ITEMS"
                            ? "Specific Items"
                            : "Entire Order"}
                        </span>

                        {offer.customerEligibility && offer.customerEligibility !== "ALL" && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40">
                            {offer.customerEligibility === "NEW"
                              ? "New Guests"
                              : offer.customerEligibility === "LOYALTY"
                              ? "Loyalty"
                              : "Returning"}
                          </span>
                        )}

                        {offer.timeStart && offer.timeEnd && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                            {offer.timeStart}-{offer.timeEnd}
                          </span>
                        )}

                        {offer.applicableOrderType && offer.applicableOrderType !== "BOTH" && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40 font-medium inline-flex items-center gap-1">
                            {offer.applicableOrderType === "DINE_IN" ? (
                              <>
                                <IconArmchair className="w-3 h-3" />
                                <span>Dine-in Only</span>
                              </>
                            ) : (
                              <>
                                <IconShoppingBag className="w-3 h-3" />
                                <span>Takeaway Only</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Actions (Home Carousel Toggle, Duplicate, Edit, Delete) */}
                    <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-[var(--color-border-subtle)] flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleToggleHomeFeatured(offer.id)}
                        title={
                          homeOfferIds.includes(offer.id)
                            ? "Featured on Home screen carousel (Click to remove)"
                            : "Not on Home screen carousel (Click to feature on home)"
                        }
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all flex items-center gap-1.5 cursor-pointer ${
                          homeOfferIds.includes(offer.id)
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 shadow-2xs hover:bg-amber-500/20"
                            : "bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-border)] hover:text-[var(--color-foreground)] hover:border-amber-500/40"
                        }`}
                      >
                        <IconTicket className={`w-3.5 h-3.5 ${homeOfferIds.includes(offer.id) ? "text-amber-600 fill-amber-500/20" : ""}`} />
                        <span>{homeOfferIds.includes(offer.id) ? "On Home Carousel" : "+ Add to Home"}</span>
                      </button>

                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleDuplicateOffer(offer)}
                          title="Duplicate this offer"
                          className="px-2.5 py-1 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-background)] rounded-md border border-[var(--color-border)] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <IconCopy className="w-3 h-3 text-[var(--color-muted)]" />
                          <span>Duplicate</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingOffer(offer);
                            setIsFormModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-background)] rounded-md border border-[var(--color-border)] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <IconEdit className="w-3 h-3 text-[var(--color-muted)]" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setOfferToDelete(offer)}
                          className="px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md border border-red-200 dark:border-red-900/50 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <IconTrash className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State & Presets */
            <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] space-y-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-primary-light)]/50 text-[var(--color-primary)] flex items-center justify-center shadow-xs">
                <IconTag className="w-7 h-7" />
              </div>

              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-[var(--color-foreground)]">
                  {searchQuery ? "No offers match your search" : "No Offers Created Yet"}
                </h3>
                <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                  {searchQuery
                    ? "Try adjusting your search keywords or clear filters."
                    : "Create promotional coupon codes or cart unlock discounts to increase customer order values."}
                </p>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5. TAB 2: LOYALTY PROGRAM SETTINGS
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === "LOYALTY" && (
        <div className="space-y-6 max-w-4xl">
          {/* Main Loyalty Toggle Banner */}
          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between gap-4 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-[var(--color-foreground)]">
                Enable Customer Loyalty Rewards
              </h3>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Displays the loyalty reward card and collectible points on customer profiles and checkout.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isLoyaltyEnabled}
                onChange={(e) => setIsLoyaltyEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
            </label>
          </div>

          {/* Program Architecture Notice */}
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20 flex items-start gap-3">
            <IconInfoCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <span className="font-semibold block">
                Single Loyalty Model Rule:
              </span>
              <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
                To keep customer reward mechanics simple and easy to understand, CAFEFLOW strictly enables
                <strong> either Digital Stamps OR Bean Points</strong>. Customers will see one unified loyalty card tailored to your café.
              </p>
            </div>
          </div>

          {/* Program Selector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option A: Digital Stamp Card */}
            <div
              onClick={() => setLoyaltyType("STAMPS")}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative space-y-4 ${
                loyaltyType === "STAMPS"
                  ? "border-[var(--color-primary)] bg-[var(--color-surface)] shadow-md"
                  : "border-[var(--color-border)] bg-[var(--color-surface)]/60 hover:border-[var(--color-muted)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <IconCoffee className="w-6 h-6" />
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    loyaltyType === "STAMPS"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                      : "border-[var(--color-border)]"
                  }`}
                >
                  {loyaltyType === "STAMPS" && <IconCheck className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-base font-bold text-[var(--color-foreground)]">
                    Digital Stamp Card
                  </h4>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
                  Choose a stamp-based reward style for your cafe. Customer balances should reflect recorded loyalty activity.
                </p>
              </div>
            </div>

            {/* Option B: Bean Points Program */}
            <div
              onClick={() => setLoyaltyType("POINTS")}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative space-y-4 ${
                loyaltyType === "POINTS"
                  ? "border-[var(--color-primary)] bg-[var(--color-surface)] shadow-md"
                  : "border-[var(--color-border)] bg-[var(--color-surface)]/60 hover:border-[var(--color-muted)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <IconCoins className="w-6 h-6" />
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    loyaltyType === "POINTS"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                      : "border-[var(--color-border)]"
                  }`}
                >
                  {loyaltyType === "POINTS" && <IconCheck className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-[var(--color-foreground)]">
                  Bean Points Program
                </h4>
                <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
                  Choose a points-based reward style for your cafe. Customer balances should reflect recorded loyalty activity.
                </p>
              </div>
            </div>
          </div>

          {/* Save Loyalty Button */}
          <div className="flex items-center justify-end pt-4 border-t border-[var(--color-border)]">
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveLoyaltySettings}
              isLoading={isSavingLoyalty}
              className="flex items-center gap-2"
            >
              <IconSparkles className="w-4 h-4" />
              <span>Save Loyalty Program</span>
            </Button>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          6. MODALS
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Create / Edit Offer Modal */}
      <OfferFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingOffer(null);
        }}
        onSubmit={handleSaveOffer}
        initialData={editingOffer}
        isFeaturedOnHome={editingOffer ? homeOfferIds.includes(editingOffer.id) : true}
        menuItems={menuItems}
        categories={categories}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(offerToDelete)}
        onClose={() => setOfferToDelete(null)}
        onConfirm={handleDeleteOffer}
        title="Delete Offer"
        description={`Are you sure you want to delete offer "${offerToDelete?.code}"? Customers will no longer be able to use this promo code.`}
        confirmText="Delete Offer"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
