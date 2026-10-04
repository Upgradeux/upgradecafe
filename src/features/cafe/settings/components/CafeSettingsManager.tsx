"use client";

import React, { useState, useEffect } from "react";
import { CAFE_THEME_PRESETS, ThemePreset, getCafeThemeStyles } from "@/lib/theme/theme-tokens";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import {
  IconCheck,
  IconPalette,
  IconReceipt,
  IconBuildingStore,
  IconCalendar,
  IconShieldCheck,
  IconHelpCircle,
  IconUpload,
  IconTrash,
  IconDeviceMobile,
  IconExternalLink,
  IconStar,
  IconListCheck,
  IconSparkles,
  IconArrowUp,
  IconArrowDown,
  IconLetterCase,
  IconQrcode,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { AccessState } from "@/server/services/access-state.service";
import {
  CafeSetting,
  DEFAULT_HOME_SECTIONS,
  HomeSectionConfig,
} from "@/lib/db/schema/cafe-settings";
import { MenuItem } from "@/lib/db/schema/menu-items";
import { DigitalMenuSectionBuilder } from "./DigitalMenuSectionBuilder";
import { CAFE_FONT_PRESETS } from "@/lib/theme/font-presets";

interface SubscriptionDetails {
  id: string;
  status: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  planName?: string | null;
  planPrice?: number | null;
  planInterval?: string | null;
}

interface CafeSettingsManagerProps {
  cafeSlug: string;
  cafeName: string;
  initialPreset: string;
  initialSettings?: CafeSetting | null;
  accessState?: AccessState;
  subscription?: SubscriptionDetails | null;
  cafeLogoKey?: string | null;
  menuItems?: MenuItem[] | Array<{ id: string; name: string; price: number; [key: string]: any }>;
}

export const CafeSettingsManager: React.FC<CafeSettingsManagerProps> = ({
  cafeSlug,
  cafeName,
  initialPreset,
  initialSettings,
  accessState,
  subscription,
  cafeLogoKey,
  menuItems,
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"theme" | "digital-menu" | "payment" | "subscription" | "profile">("theme");
  const [selectedDashboardTheme, setSelectedDashboardTheme] = useState<string>(
    initialSettings?.themePreset || initialPreset || "roast"
  );
  const [selectedMenuTheme, setSelectedMenuTheme] = useState<string>(
    initialSettings?.digitalMenuTheme || "roast"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [logoKey, setLogoKey] = useState<string | null>(cafeLogoKey || null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Digital Menu Engine Settings State
  const [layoutPreset, setLayoutPreset] = useState<"modern_app" | "classic_list">(
    (initialSettings?.layoutPreset as any) || "modern_app"
  );
  const [fontFamily, setFontFamily] = useState<string>(
    initialSettings?.fontFamily || "Plus Jakarta Sans"
  );
  const [homeSections, setHomeSections] = useState<HomeSectionConfig[]>(
    initialSettings?.homeSections && initialSettings.homeSections.length > 0
      ? initialSettings.homeSections
      : DEFAULT_HOME_SECTIONS
  );
  const [enableQrOrdering, setEnableQrOrdering] = useState<boolean>(
    initialSettings?.enableQrOrdering ?? true
  );
  const [enableDineIn, setEnableDineIn] = useState<boolean>(
    initialSettings?.enableDineIn ?? true
  );
  const [enableTakeaway, setEnableTakeaway] = useState<boolean>(
    initialSettings?.enableTakeaway ?? true
  );
  const [allowOrderNotes, setAllowOrderNotes] = useState<boolean>(
    initialSettings?.allowOrderNotes ?? true
  );
  const [enableReviews, setEnableReviews] = useState<boolean>(
    initialSettings?.enableReviews ?? true
  );
  const [enableOffers, setEnableOffers] = useState<boolean>(
    initialSettings?.enableOffers ?? true
  );
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string>(
    initialSettings?.googleReviewUrl || ""
  );
  const [isSavingDigitalMenu, setIsSavingDigitalMenu] = useState(false);

  // Direct UPI Payment Settings State
  const [upiId, setUpiId] = useState<string>(initialSettings?.upiId || "");
  const [upiMerchantName, setUpiMerchantName] = useState<string>(
    initialSettings?.upiMerchantName || cafeName || ""
  );
  const [upiQrUrl, setUpiQrUrl] = useState<string | null>(initialSettings?.upiQrUrl || null);
  const [isUploadingUpiQr, setIsUploadingUpiQr] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  useEffect(() => {
    if (initialSettings?.themePreset) {
      setSelectedDashboardTheme(initialSettings.themePreset);
    } else if (initialPreset) {
      setSelectedDashboardTheme(initialPreset);
    }
    if (initialSettings?.digitalMenuTheme) {
      setSelectedMenuTheme(initialSettings.digitalMenuTheme);
    }
    if (initialSettings?.fontFamily) {
      setFontFamily(initialSettings.fontFamily);
    }
  }, [
    initialSettings?.themePreset,
    initialSettings?.digitalMenuTheme,
    initialSettings?.fontFamily,
    initialPreset,
  ]);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Logo file must be smaller than 5 MB.",
        variant: "danger",
      });
      return;
    }

    try {
      setIsUploadingLogo(true);
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch(`/api/cafe/${cafeSlug}/logo`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Logo upload failed");
      }

      setLogoKey(json.data.logoKey);
      toast({
        title: "Logo Updated",
        description: "Your official brand logo has been updated and synced platform-wide.",
        variant: "success",
      });
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Could not update logo.",
        variant: "danger",
      });
    } finally {
      setIsUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm("Are you sure you want to remove your brand logo?")) return;
    try {
      setIsUploadingLogo(true);
      const res = await fetch(`/api/cafe/${cafeSlug}/logo`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to remove logo");
      }

      setLogoKey(null);
      toast({
        title: "Logo Removed",
        description: "Brand logo has been cleared and reset to text monogram.",
        variant: "success",
      });
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Could not remove logo.",
        variant: "danger",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveTheme = async (presetId: string) => {
    setSelectedDashboardTheme(presetId);
    setSelectedMenuTheme(presetId);
    setIsSaving(true);

    // Instantly apply theme variables to DOM for seamless 0ms transition
    try {
      const themeVars = getCafeThemeStyles(presetId);
      const cafeEl = document.querySelector('[data-theme="cafe"]') as HTMLElement;
      if (cafeEl) {
        Object.entries(themeVars).forEach(([k, v]) => {
          cafeEl.style.setProperty(k, v);
        });
      }
      Object.entries(themeVars).forEach(([k, v]) => {
        document.documentElement.style.setProperty(k, v);
      });
    } catch {
      // Fallback to server refresh if DOM manipulation fails
    }

    try {
      const res = await fetch(`/api/cafe/${cafeSlug}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themePreset: presetId,
          digitalMenuTheme: presetId,
        }),
      });

      if (!res.ok) throw new Error("Failed to save theme setting.");

      toast({
        title: "Theme Updated",
        description: `Theme preset changed to "${CAFE_THEME_PRESETS[presetId]?.name}" across dashboard and digital menu.`,
        variant: "success",
      });

      router.refresh();
    } catch {
      toast({
        title: "Save Failed",
        description: "Could not save theme preset.",
        variant: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDigitalMenuSettings = async (overrides: Partial<{
    layoutPreset: "modern_app" | "classic_list";
    fontFamily: string;
    digitalMenuTheme: string;
    enableQrOrdering: boolean;
    enableDineIn: boolean;
    enableTakeaway: boolean;
    allowOrderNotes: boolean;
    enableReviews: boolean;
    enableOffers: boolean;
    googleReviewUrl: string;
    homeSections: HomeSectionConfig[];
  }> = {}) => {
    setIsSavingDigitalMenu(true);
    try {
      const payload = {
        themePreset: selectedDashboardTheme,
        layoutPreset: overrides.layoutPreset ?? layoutPreset,
        fontFamily: overrides.fontFamily ?? fontFamily,
        digitalMenuTheme: overrides.digitalMenuTheme ?? selectedMenuTheme,
        enableQrOrdering: overrides.enableQrOrdering ?? enableQrOrdering,
        enableDineIn: overrides.enableDineIn ?? enableDineIn,
        enableTakeaway: overrides.enableTakeaway ?? enableTakeaway,
        allowOrderNotes: overrides.allowOrderNotes ?? allowOrderNotes,
        enableReviews: overrides.enableReviews ?? enableReviews,
        enableOffers: overrides.enableOffers ?? enableOffers,
        googleReviewUrl: overrides.googleReviewUrl ?? googleReviewUrl,
        homeSections: overrides.homeSections ?? homeSections,
      };

      const res = await fetch(`/api/cafe/${cafeSlug}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save digital menu preferences.");

      toast({
        title: "Digital Menu Updated",
        description: "Your digital menu typography, theme and platform settings have been synced.",
        variant: "success",
      });

      router.refresh();
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Could not save digital menu preferences.",
        variant: "danger",
      });
    } finally {
      setIsSavingDigitalMenu(false);
    }
  };

  const handleUpiQrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("upiQr", file);

    setIsUploadingUpiQr(true);
    try {
      const res = await fetch(`/api/cafe/${cafeSlug}/upi-qr`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to upload QR code image.");
      }

      setUpiQrUrl(json.data.upiQrUrl);
      toast({
        title: "UPI QR Code Uploaded",
        description: "Your custom counter QR code is now saved and active on your menu.",
        variant: "success",
      });
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Could not upload UPI QR.",
        variant: "danger",
      });
    } finally {
      setIsUploadingUpiQr(false);
    }
  };

  const handleSavePaymentSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingPayment(true);
    try {
      const res = await fetch(`/api/cafe/${cafeSlug}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upiId: upiId.trim() || null,
          upiMerchantName: upiMerchantName.trim() || null,
          upiQrUrl: upiQrUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to save UPI details.");
      }

      toast({
        title: "Payment Details Saved",
        description: "UPI ID and merchant details updated successfully.",
        variant: "success",
      });
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Could not save payment details.",
        variant: "danger",
      });
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleSelectFontFamily = async (fontName: string) => {
    setFontFamily(fontName);
    await handleSaveDigitalMenuSettings({ fontFamily: fontName });
  };

  const handleSelectDigitalMenuTheme = async (presetId: string) => {
    setSelectedMenuTheme(presetId);
    await handleSaveDigitalMenuSettings({ digitalMenuTheme: presetId });
  };

  const handleToggleSection = (sectionId: string) => {
    const updated = homeSections.map((s) =>
      s.id === sectionId ? { ...s, enabled: !s.enabled } : s
    );
    setHomeSections(updated);
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= homeSections.length) return;
    const clone = [...homeSections];
    const temp = clone[index];
    clone[index] = clone[targetIndex];
    clone[targetIndex] = temp;
    const reordered = clone.map((item, idx) => ({ ...item, sortOrder: idx + 1 }));
    setHomeSections(reordered);
  };

  const handleUpdateFeaturedConfig = (updates: Partial<NonNullable<HomeSectionConfig["config"]>>) => {
    const updated = homeSections.map((s) =>
      s.type === "FEATURED"
        ? {
            ...s,
            config: {
              ...s.config,
              ...updates,
            },
          }
        : s
    );
    setHomeSections(updated);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[var(--color-foreground)]">
          Café Settings & Preferences
        </h2>
        <p className="text-xs text-[var(--color-muted)]">
          Manage brand aesthetics, subscription details, and operational configurations for {cafeName}.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("theme")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "theme"
              ? "bg-[var(--color-primary)] text-white shadow-xs"
              : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)]"
          }`}
        >
          <IconPalette className="w-3.5 h-3.5" />
          <span>Branding & Theme</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("digital-menu")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "digital-menu"
              ? "bg-[var(--color-primary)] text-white shadow-xs"
              : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)]"
          }`}
        >
          <IconDeviceMobile className="w-3.5 h-3.5" />
          <span>Digital Menu Platform</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payment")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "payment"
              ? "bg-[var(--color-primary)] text-white shadow-xs"
              : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)]"
          }`}
        >
          <IconQrcode className="w-3.5 h-3.5" />
          <span>Payment Details (UPI)</span>
          {upiId && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("subscription")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "subscription"
              ? "bg-[var(--color-primary)] text-white shadow-xs"
              : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)]"
          }`}
        >
          <IconReceipt className="w-3.5 h-3.5" />
          <span>Plan & Subscription</span>
          {accessState?.status === "ACTIVE" && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "profile"
              ? "bg-[var(--color-primary)] text-white shadow-xs"
              : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)]"
          }`}
        >
          <IconBuildingStore className="w-3.5 h-3.5" />
          <span>Café Profile</span>
        </button>
      </div>

      {/* Tab 1: Theme & Branding */}
      {activeTab === "theme" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Café & Digital Menu Theme Palette
              </span>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Controls the color palette across your café dashboard and customer digital QR menu.
              </p>
            </div>
            {isSaving && (
              <span className="text-xs font-semibold text-[var(--color-primary)] animate-pulse">
                Applying theme preset...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {Object.values(CAFE_THEME_PRESETS).map((preset: ThemePreset) => {
              const isSelected = selectedDashboardTheme === preset.id;

              return (
                <Card
                  key={preset.id}
                  className={`p-5 border transition-all cursor-pointer relative ${
                    isSelected
                      ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 shadow-sm"
                      : "border-[var(--color-border)] hover:border-[var(--color-border-subtle)]"
                  }`}
                  onClick={() => handleSaveTheme(preset.id)}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-[var(--color-foreground)]">
                          {preset.name}
                        </h3>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--color-primary)] text-white shadow-xs">
                            <IconCheck className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-muted)] mt-0.5">
                        {preset.description}
                      </p>
                    </div>
                  </div>

                  {/* Color Swatch Preview */}
                  <div className="pt-2 border-t border-[var(--color-border-subtle)]">
                    <span className="text-[10px] uppercase font-medium tracking-wider text-[var(--color-muted)] mb-2 block">
                      Palette Swatches
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full border border-black/10 shadow-xs flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ backgroundColor: preset.colors.primary }}
                        title={`Primary: ${preset.colors.primary}`}
                      >
                        P
                      </div>
                      <div
                        className="w-7 h-7 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: preset.colors.background }}
                        title={`Background: ${preset.colors.background}`}
                      />
                      <div
                        className="w-7 h-7 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: preset.colors.foreground }}
                        title={`Text: ${preset.colors.foreground}`}
                      />
                      <div
                        className="w-7 h-7 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: preset.colors.success }}
                        title={`Success: ${preset.colors.success}`}
                      />
                      <div
                        className="w-7 h-7 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: preset.colors.warning }}
                        title={`Warning: ${preset.colors.warning}`}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Digital Menu Platform Engine */}
      {activeTab === "digital-menu" && (
        <div className="space-y-6">
          {/* Quick Info & Customer URL preview */}
          <Card className="p-4 sm:p-5 border border-[var(--color-border)] bg-gradient-to-r from-[var(--color-primary-light)]/20 to-[var(--color-surface)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                    Live Public Menu Engine
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--color-foreground)] mt-0.5">
                  Direct Guest Menu Experience
                </h3>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Customers scan QR codes or visit your URL to browse, customize variants & modifiers, order, and track orders.
                </p>
              </div>
              <a
                href={`/menu/${cafeSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs flex-shrink-0"
              >
                <span>View Customer Menu</span>
                <IconExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </Card>

          {/* Section 1: Layout Engine */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-foreground)]">
                  Menu Layout Engine
                </h3>
                <p className="text-xs text-[var(--color-muted)]">
                  Choose the presentation layout for your café&apos;s digital menu.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Modern App */}
              <Card
                className={`p-4 border transition-all cursor-pointer relative ${
                  layoutPreset === "modern_app"
                    ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 shadow-sm"
                    : "border-[var(--color-border)] hover:border-[var(--color-border-subtle)]"
                }`}
                onClick={() => {
                  setLayoutPreset("modern_app");
                  handleSaveDigitalMenuSettings({ layoutPreset: "modern_app" });
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-[var(--color-foreground)]">
                        Modern App Experience
                      </h4>
                      {layoutPreset === "modern_app" && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-medium px-1.5 py-0.5 rounded-md bg-[var(--color-primary)] text-white">
                          <IconCheck className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-muted)] mt-1">
                      Curved bento hero cards, circular category chips, floating translucent bottom dock with Framer Motion spring indicator, and item details slug pages.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Option B: Classic List */}
              <Card
                className={`p-4 border transition-all cursor-pointer relative ${
                  layoutPreset === "classic_list"
                    ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 shadow-sm"
                    : "border-[var(--color-border)] hover:border-[var(--color-border-subtle)]"
                }`}
                onClick={() => {
                  setLayoutPreset("classic_list");
                  handleSaveDigitalMenuSettings({ layoutPreset: "classic_list" });
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-[var(--color-foreground)]">
                        Classic List View
                      </h4>
                      {layoutPreset === "classic_list" && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-medium px-1.5 py-0.5 rounded-md bg-[var(--color-primary)] text-white">
                          <IconCheck className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-muted)] mt-1">
                      Streamlined minimalist list layout for quick scanning, high item density, and traditional café browsing.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Section 2: Digital Menu Typography Combos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--color-foreground)] flex items-center gap-1.5">
                    <IconLetterCase className="w-4 h-4 text-[var(--color-primary)]" />
                    <span>Digital Menu Typography Combos</span>
                  </h3>
                  <Badge variant="primary" className="text-[10px]">
                    Curated Presets
                  </Badge>
                </div>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Select a font aesthetic specifically tuned for café menus. Fonts render with high clarity on all customer smartphones.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {Object.values(CAFE_FONT_PRESETS).map((preset) => {
                const isSelected =
                  fontFamily.toLowerCase().includes(preset.headingFont.toLowerCase()) ||
                  fontFamily.toLowerCase() === preset.id;

                return (
                  <Card
                    key={preset.id}
                    onClick={() => handleSelectFontFamily(preset.id)}
                    className={`p-4 border transition-all cursor-pointer relative flex flex-col justify-between space-y-3 group ${
                      isSelected
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]/20 ring-2 ring-[var(--color-primary)]/20 shadow-sm"
                        : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50 bg-[var(--color-surface)]"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)]">
                          {preset.category}
                        </span>
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md bg-[var(--color-primary)] text-white">
                            <IconCheck className="w-3 h-3 stroke-[2.5]" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--color-muted)] group-hover:text-[var(--color-primary)] font-medium transition-colors">
                            {preset.badge}
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-[var(--color-foreground)]">
                          {preset.name}
                        </h4>
                        <span className="text-[10.5px] text-[var(--color-muted)]">
                          {preset.tagline}
                        </span>
                      </div>

                      {/* Dual Font Pairing Info */}
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-muted)] font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-[var(--color-primary-light)] text-[var(--color-foreground)] font-medium">
                          {preset.headingFont}
                        </span>
                        <span className="text-[var(--color-border)]">+</span>
                        <span className="px-1.5 py-0.5 rounded bg-[var(--color-border-subtle)] text-[var(--color-foreground)] font-medium">
                          {preset.bodyFont}
                        </span>
                      </div>

                      {/* Live Font Sample Preview: Heading + Body */}
                      <div
                        className="p-3 rounded-lg bg-[var(--color-background)] border border-[var(--color-border-subtle)] text-[#1C1D1A]"
                      >
                        <div
                          className="text-sm font-bold leading-snug"
                          style={{ fontFamily: preset.headingFontVar }}
                        >
                          {preset.sampleHeadline}
                        </div>
                        <div
                          className="text-[11px] opacity-70 mt-1 leading-relaxed"
                          style={{ fontFamily: preset.bodyFontVar }}
                        >
                          {preset.sampleBody}
                        </div>
                      </div>

                      <p className="text-[10.5px] text-[var(--color-muted)] leading-relaxed line-clamp-2">
                        {preset.description}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Section 3: Digital Menu Theme Color Palette */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--color-foreground)] flex items-center gap-1.5">
                    <IconPalette className="w-4 h-4 text-[var(--color-primary)]" />
                    <span>Digital Menu Theme & Visual Effects</span>
                  </h3>
                  <Badge variant="primary" className="text-[10px]">
                    Live Customer Theme
                  </Badge>
                </div>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Select your customer-facing QR menu theme palette. Controls vibrant glowing backdrops, luminous buttons, waves, and card accents.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.values(CAFE_THEME_PRESETS).map((preset: ThemePreset) => {
                const isSelected = selectedMenuTheme === preset.id;
                return (
                  <Card
                    key={preset.id}
                    onClick={() => handleSelectDigitalMenuTheme(preset.id)}
                    className={`p-3.5 border transition-all cursor-pointer relative space-y-2 group ${
                      isSelected
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]/25 ring-2 ring-[var(--color-primary)]/20 shadow-sm"
                        : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50 bg-[var(--color-surface)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-foreground)]">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center">
                          <IconCheck className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    {/* Color Swatch Dots */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <div
                        className="w-5 h-5 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: preset.colors.primary }}
                        title="Primary Color"
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: preset.colors.background }}
                        title="Background Color"
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: preset.colors.surface }}
                        title="Surface Color"
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: preset.colors.secondary || preset.colors.warning }}
                        title="Accent Color"
                      />
                    </div>

                    <p className="text-[10px] text-[var(--color-muted)] line-clamp-2">
                      {preset.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Section 4: Home Screen Sections & Merchandising (Controlled Section Builder) */}
          <DigitalMenuSectionBuilder
            cafeSlug={cafeSlug}
            cafeName={cafeName}
            cafeLogoUrl={logoKey}
            themePreset={selectedMenuTheme}
            fontFamily={fontFamily}
            homeSections={homeSections}
            menuItems={(menuItems as MenuItem[]) || []}
            onSaveSections={async (updated) => {
              setHomeSections(updated);
              await handleSaveDigitalMenuSettings({ homeSections: updated });
            }}
            isSaving={isSavingDigitalMenu}
          />

          {/* Section 3: Ordering Rules & Experience */}
          <Card className="p-5 border border-[var(--color-border)] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--color-foreground)]">
                Ordering Flow & Service Modes
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                Configure which ordering channels and options are available on your digital menu.
              </p>
            </div>

            <div className="divide-y divide-[var(--color-border-subtle)]">
              {/* Enable QR Ordering */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-[var(--color-foreground)]">
                    Enable QR Ordering
                  </div>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Allow customers to place orders directly into kitchen and live tracker via digital menu.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableQrOrdering}
                  onChange={(e) => {
                    setEnableQrOrdering(e.target.checked);
                    handleSaveDigitalMenuSettings({ enableQrOrdering: e.target.checked });
                  }}
                  className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                />
              </div>

              {/* Enable Dine-In */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-[var(--color-foreground)]">
                    Dine-In Table Orders
                  </div>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Allow orders linked to a table number with live status tracking.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableDineIn}
                  onChange={(e) => {
                    setEnableDineIn(e.target.checked);
                    handleSaveDigitalMenuSettings({ enableDineIn: e.target.checked });
                  }}
                  className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                />
              </div>

              {/* Enable Takeaway */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-[var(--color-foreground)]">
                    Takeaway / Pick-Up Orders
                  </div>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Allow customers to place orders for counter pick-up without table assignment.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableTakeaway}
                  onChange={(e) => {
                    setEnableTakeaway(e.target.checked);
                    handleSaveDigitalMenuSettings({ enableTakeaway: e.target.checked });
                  }}
                  className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                />
              </div>

              {/* Allow Order Notes */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-[var(--color-foreground)]">
                    Allow Kitchen & Barista Notes
                  </div>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Display an instruction box in the cart (e.g. &quot;Less sugar&quot;, &quot;Extra hot&quot;).
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowOrderNotes}
                  onChange={(e) => {
                    setAllowOrderNotes(e.target.checked);
                    handleSaveDigitalMenuSettings({ allowOrderNotes: e.target.checked });
                  }}
                  className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                />
              </div>
            </div>
          </Card>

          {/* Section 3: Customer Marketing, Reviews & Google Review CTA */}
          <Card className="p-5 border border-[var(--color-border)] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--color-foreground)]">
                Customer Engagement & Google Reviews
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                Collect internal 1-5 star feedback and funnel happy customers to review your café on Google.
              </p>
            </div>

            <div className="divide-y divide-[var(--color-border-subtle)]">
              {/* Enable Reviews */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-[var(--color-foreground)]">
                    Enable Customer Review & Star Ratings
                  </div>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Display the feedback sheet after orders and in customer profile.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableReviews}
                  onChange={(e) => {
                    setEnableReviews(e.target.checked);
                    handleSaveDigitalMenuSettings({ enableReviews: e.target.checked });
                  }}
                  className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                />
              </div>

              {/* Enable Offers */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-[var(--color-foreground)]">
                    Enable Offers & Promo Codes
                  </div>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Enable active promotional codes in the checkout cart and bottom navigation offers drawer.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableOffers}
                  onChange={(e) => {
                    setEnableOffers(e.target.checked);
                    handleSaveDigitalMenuSettings({ enableOffers: e.target.checked });
                  }}
                  className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                />
              </div>

              {/* Google Business Review URL */}
              <div className="pt-3 space-y-2">
                <div>
                  <div className="text-xs font-semibold text-[var(--color-foreground)]">
                    Google Business Review Link
                  </div>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    When guests give 4 or 5 stars on your digital menu, they receive a prompt with a direct button to review on Google.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://g.page/r/your-cafe/review"
                    className="flex-1 px-3 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)]"
                  />
                  <button
                    type="button"
                    disabled={isSavingDigitalMenu}
                    onClick={() => handleSaveDigitalMenuSettings({ googleReviewUrl })}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer shadow-xs"
                  >
                    Save URL
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          TAB: UPI PAYMENT SETTINGS (Direct P2P, No Gateways)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === "payment" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Payment Info Card */}
          <Card className="p-6 border border-[var(--color-border)] space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-foreground)] flex items-center gap-2">
                  <IconQrcode className="w-4 h-4 text-emerald-600" />
                  <span>Direct UPI Payment Configuration</span>
                </h3>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  CAFEFLOW operates on direct peer-to-peer payments. Customer payments go directly to your café bank account with 0% commission. No payment gateway or aggregator required.
                </p>
              </div>
              <Badge variant="success">Zero Gateway Fees</Badge>
            </div>

            <form onSubmit={handleSavePaymentSettings} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* UPI ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-foreground)] block">
                    Café UPI ID / VPA <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. roastedbean@okaxis or 9876543210@paytm"
                    className="w-full px-3 py-2 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-xs text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] font-mono"
                  />
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Used to generate UPI Intent links (GPay, PhonePe, Paytm) and for customers to copy.
                  </p>
                </div>

                {/* Merchant Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-foreground)] block">
                    Merchant / Business Display Name
                  </label>
                  <input
                    type="text"
                    value={upiMerchantName}
                    onChange={(e) => setUpiMerchantName(e.target.value)}
                    placeholder="Enter your café name"
                    className="w-full px-3 py-2 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-xs text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Name displayed inside the customer&apos;s UPI app when paying.
                  </p>
                </div>
              </div>

              {/* Upload QR Code Section */}
              <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-foreground)]">
                    Existing Standee / Counter UPI QR Code
                  </h4>
                  <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                    Upload a photo or graphic of your counter QR code. If uploaded, customers will see this exact QR code to scan. If left blank, CAFEFLOW dynamically generates a QR code with the order total using your UPI ID above.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* QR Preview Frame */}
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-[var(--color-border)] bg-white p-2 flex items-center justify-center shrink-0 shadow-xs relative">
                    {upiQrUrl ? (
                      <img
                        src={upiQrUrl}
                        alt="Uploaded Café UPI QR"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <IconQrcode className="w-8 h-8 text-neutral-300 mx-auto" />
                        <span className="text-[9.5px] text-neutral-400 block mt-1 font-medium">
                          No Custom QR
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity cursor-pointer shadow-xs">
                        <IconUpload className="w-3.5 h-3.5" />
                        <span>
                          {isUploadingUpiQr
                            ? "Uploading..."
                            : upiQrUrl
                            ? "Replace QR Code Image"
                            : "Upload Existing QR Code"}
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          disabled={isUploadingUpiQr}
                          onChange={handleUpiQrFileChange}
                        />
                      </label>

                      {upiQrUrl && (
                        <button
                          type="button"
                          disabled={isUploadingUpiQr}
                          onClick={() => setUpiQrUrl(null)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--color-surface)] border border-[var(--color-border)] text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-xs cursor-pointer"
                        >
                          <IconTrash className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      Supports PNG, JPG, WEBP, or SVG up to 5 MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-3 border-t border-[var(--color-border-subtle)] flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingPayment}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <IconCheck className="w-3.5 h-3.5" />
                  <span>{isSavingPayment ? "Saving Details..." : "Save Payment Details"}</span>
                </button>
              </div>
            </form>
          </Card>

          {/* How Payment Flow Operates Card */}
          <Card className="p-6 border border-[var(--color-border)] bg-[var(--color-background)] space-y-3">
            <h4 className="text-xs font-bold text-[var(--color-foreground)] uppercase tracking-wider">
              How CAFEFLOW Simplified Payments Work
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-1">
                <span className="font-bold text-[var(--color-foreground)] block">1. Customer Pays Externally</span>
                <p className="text-[11px] text-[var(--color-muted)]">
                  Customer scans your QR or taps Open in UPI App. Funds transfer straight into your bank.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-1">
                <span className="font-bold text-amber-700 dark:text-amber-400 block">2. Status: Pending Verification</span>
                <p className="text-[11px] text-[var(--color-muted)]">
                  Customer clicks &quot;I&apos;ve Paid&quot;. CAFEFLOW never auto-verifies; orders wait for staff confirmation.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-1">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 block">3. Staff Verifies Manually</span>
                <p className="text-[11px] text-[var(--color-muted)]">
                  Staff checks actual merchant UPI app or bank SMS, then clicks &quot;Confirm Payment&quot; or &quot;Reject&quot;.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Plan & Subscription */}
      {activeTab === "subscription" && (
        <div className="space-y-4">
          <Card className="p-6 border border-[var(--color-border)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--color-border-subtle)]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[var(--color-foreground)]">
                    {subscription?.planName || "Growth Plan"}
                  </h3>
                  <Badge variant={accessState?.status === "ACTIVE" ? "success" : "warning"}>
                    {accessState?.status || "ACTIVE"}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  Offline-billed SaaS subscription tier for {cafeName}.
                </p>
              </div>

              <div className="text-right sm:text-right">
                <div className="text-xl font-bold text-[var(--color-foreground)]">
                  ₹{subscription?.planPrice?.toLocaleString("en-IN") || "2,499"}
                  <span className="text-xs font-normal text-[var(--color-muted)]">
                    {" "}/ {subscription?.planInterval?.toLowerCase() || "month"}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--color-muted)]">
                  {accessState?.daysRemaining !== undefined && accessState.daysRemaining !== null
                    ? `${accessState.daysRemaining} days remaining in billing cycle`
                    : "Active ongoing period"}
                </div>
              </div>
            </div>

            {/* Subscription Validity Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
              <div className="p-3.5 rounded-[var(--radius-card)] bg-[var(--color-background)] border border-[var(--color-border)]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-foreground)]">
                  <IconCalendar className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>Cycle Expiry</span>
                </div>
                <div className="text-sm font-bold text-[var(--color-foreground)] mt-1.5">
                  {subscription?.currentPeriodEnd
                    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Auto-renewing"}
                </div>
                <div className="text-[10px] text-[var(--color-muted)] mt-0.5">
                  Grace period applies upon expiry
                </div>
              </div>

              <div className="p-3.5 rounded-[var(--radius-card)] bg-[var(--color-background)] border border-[var(--color-border)]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-foreground)]">
                  <IconShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Platform Access</span>
                </div>
                <div className="text-sm font-bold text-emerald-700 mt-1.5">
                  Full Operational Access
                </div>
                <div className="text-[10px] text-[var(--color-muted)] mt-0.5">
                  Menu, Floor, QR & Analytics enabled
                </div>
              </div>

              <div className="p-3.5 rounded-[var(--radius-card)] bg-[var(--color-background)] border border-[var(--color-border)]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-foreground)]">
                  <IconHelpCircle className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>Offline Renewal</span>
                </div>
                <div className="text-xs font-medium text-[var(--color-foreground)] mt-1.5">
                  Bank / UPI / Cash
                </div>
                <div className="text-[10px] text-[var(--color-muted)] mt-0.5">
                  Recorded directly by Super Admin
                </div>
              </div>
            </div>

            {/* Notice regarding upgrade/renewal */}
            <div className="mt-5 p-4 rounded-[var(--radius-card)] bg-[var(--color-primary-light)]/40 border border-[var(--color-primary)]/20 text-xs text-[var(--color-foreground)]">
              <span className="font-bold">Need to upgrade or renew your plan?</span>{" "}
              Contact the UpgradeCafe platform administrative team or your account manager to record your payment via UPI/Bank transfer.
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Café Profile & Brand Identity */}
      {activeTab === "profile" && (
        <div className="space-y-4">
          {/* Official Brand Logo */}
          <Card className="p-6 border border-[var(--color-border)] space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[var(--color-foreground)]">
                  Brand Logo
                </h3>
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 shadow-xs">
                  Synced Platform-Wide
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Authoritative brand emblem displayed across Super Admin, table QR stands, navigation header, and digital customer menu.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
              <div className="w-20 h-20 rounded-lg bg-white border border-[var(--color-border)] flex items-center justify-center overflow-hidden p-2 shadow-xs flex-shrink-0">
                {logoKey ? (
                  <img
                    src={logoKey}
                    alt={cafeName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-xl font-semibold text-[var(--color-primary)]">
                    {cafeName.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] cursor-pointer transition-colors shadow-xs">
                    <IconUpload className="w-3.5 h-3.5" />
                    <span>{isUploadingLogo ? "Uploading..." : logoKey ? "Replace Logo" : "Upload Logo"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      disabled={isUploadingLogo}
                      onChange={handleLogoFileChange}
                    />
                  </label>

                  {logoKey && (
                    <button
                      type="button"
                      onClick={handleDeleteLogo}
                      disabled={isUploadingLogo}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--color-surface)] border border-[var(--color-border)] text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-xs"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[var(--color-muted)]">
                  Supports PNG, SVG, WEBP, or JPG. Recommended: square transparent PNG/SVG, at least 300×300px.
                </p>
              </div>
            </div>
          </Card>

          {/* Operational Profile Details */}
          <Card className="p-6 border border-[var(--color-border)] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--color-foreground)]">
                Operational Details
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                Unique identifier and registration info on UpgradeCafe.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-3 rounded-[var(--radius-button)] bg-[var(--color-background)] border border-[var(--color-border)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-muted)]">
                  Café Brand Name
                </span>
                <div className="text-sm font-semibold text-[var(--color-foreground)] mt-0.5">
                  {cafeName}
                </div>
              </div>

              <div className="p-3 rounded-[var(--radius-button)] bg-[var(--color-background)] border border-[var(--color-border)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-muted)]">
                  Direct URL Identifier
                </span>
                <div className="text-sm font-semibold font-mono text-[var(--color-primary)] mt-0.5">
                  /cafe/{cafeSlug}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
