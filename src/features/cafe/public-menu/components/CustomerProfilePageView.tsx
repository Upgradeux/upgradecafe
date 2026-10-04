"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Cafe } from "@/lib/db/schema/cafes";
import { Table } from "@/lib/db/schema/tables";
import { CafeSetting } from "@/lib/db/schema/cafe-settings";
import { MenuItem } from "@/lib/db/schema/menu-items";
import { CustomerProfile } from "../types";
import { CustomerPastOrder } from "../layouts/types";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import { useToast } from "@/components/ui/Toast";
import {
  IconArrowLeft,
  IconReceipt,
  IconHeart,
  IconRepeat,
  IconBell,
  IconUser,
  IconChevronRight,
  IconEdit,
  IconX,
  IconStar,
  IconGift,
  IconLogout,
  IconCrown,
  IconCoffee,
  IconUpload,
  IconCheck,
  IconWallet,
  IconCookie,
  IconCake,
  IconLeaf,
  IconAward,
} from "@tabler/icons-react";
import { Offer } from "@/lib/db/schema/offers";
import { CustomerAuthView } from "./CustomerAuthView";
import { CustomerOffersModal } from "./CustomerOffersModal";
import { WaxSealStampCard } from "./WaxSealStampCard";
import { setActiveCustomerProfile } from "../utils/customer-auth";
import { authClient } from "@/lib/auth/auth-client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICEBEAR AVATAR COLLECTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const DICEBEAR_AVATAR_COLLECTIONS = [
  {
    id: "fun-emoji",
    name: "Fun Emoji",
    seeds: ["Happy", "Cool", "Wink", "Love", "Cheeky", "Star", "Party", "Spark"],
  },
  {
    id: "dylan",
    name: "Dylan",
    seeds: ["Alex", "Jordan", "Sam", "Taylor", "Casey", "Morgan", "Riley", "Chris"],
  },
  {
    id: "constellation",
    name: "Constellation",
    seeds: ["Orion", "Cassiopeia", "Pegasus", "Lyra", "Cygnus", "Ursa", "Draco", "Phoenix"],
  },
  {
    id: "big-ears",
    name: "Big Ears",
    seeds: ["Bunny", "Leo", "Coco", "Finn", "Milo", "Bella", "Otis", "Ruby"],
  },
  {
    id: "adventurer",
    name: "Adventurer",
    seeds: ["Avery", "Blake", "Robin", "Charlie", "Dakota", "Hayden", "Eden", "Reese"],
  },
  {
    id: "critters",
    name: "Critters",
    seeds: ["Sprout", "Pebble", "Pip", "Bubbles", "Gizmo", "Nori", "Echo", "Mochi"],
  },
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STAMP CARD ICONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const STAMP_ICONS = [
  { step: 1, icon: (p: any) => <IconCoffee {...p} />, label: "Espresso" },
  { step: 2, icon: (p: any) => <IconLeaf {...p} />, label: "Botanical" },
  { step: 3, icon: (p: any) => <IconCookie {...p} />, label: "Pastry" },
  { step: 4, icon: (p: any) => <IconCake {...p} />, label: "Cake" },
  { step: 5, icon: (p: any) => <IconCoffee {...p} />, label: "Cold Brew" },
  { step: 6, icon: (p: any) => <IconCoffee {...p} />, label: "Barista Mug" },
  { step: 7, icon: (p: any) => <IconGift {...p} />, label: "Free Brew" },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REWARDS (POINTS PROGRAM ONLY)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface LoyaltyReward {
  id: string;
  name: string;
  pts: number;
  icon: (props: { className?: string }) => React.ReactNode;
  desc: string;
}

export const POINTS_REWARDS: LoyaltyReward[] = [
  { id: "rw1", name: "Free Coffee", pts: 200, icon: (p) => <IconCoffee {...p} />, desc: "Any hot artisanal brew or espresso" },
  { id: "rw2", name: "Butter Croissant", pts: 350, icon: (p) => <IconCookie {...p} />, desc: "Golden Parisian fresh baked pastry" },
  { id: "rw3", name: "Nitro Cold Brew", pts: 500, icon: (p) => <IconCoffee {...p} />, desc: "Velvety smooth 16-hr slow steeped drip" },
  { id: "rw4", name: "Signature Dish", pts: 700, icon: (p) => <IconAward {...p} />, desc: "Artisanal specialty café favorite" },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REUSABLE CENTER BEND MODAL (MATCHING CustomerOffersModal EXACT SURFACE)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ProfileBendModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradientId: string;
  themeRgb: { r: number; g: number; b: number };
  themeOpaqueColors: { topTint: string; midTint: string; bottomTint: string };
  visualTheme: ReturnType<typeof getDigitalMenuVisualTheme>;
  children: React.ReactNode;
}

const ProfileBendModal: React.FC<ProfileBendModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  gradientId,
  themeRgb,
  themeOpaqueColors,
  visualTheme,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 pointer-events-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm sm:max-w-md relative flex flex-col pointer-events-auto max-h-[82vh] drop-shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
      >
        {/* SINGLE UNIFIED CONTINUOUS SURFACE (Signature Center Bend Curve from CustomerOffersModal) */}
        <svg
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id={gradientId}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor={themeOpaqueColors.topTint} />
              <stop offset="24%" stopColor={themeOpaqueColors.midTint} />
              <stop offset="65%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>
          </defs>
          <path
            d="M 0,22 C 0,10 18,0 48,0 C 90,0 120,14 200,14 C 280,14 310,0 352,0 C 382,0 400,10 400,22 L 400,372 C 400,388 388,400 372,400 L 28,400 C 12,400 0,388 0,372 Z"
            fill={`url(#${gradientId})`}
            stroke="rgba(0, 0, 0, 0.10)"
            strokeWidth="1.2"
          />
        </svg>

        {/* Grab Pill Nestled Inside Center Bend Dip */}
        <div
          className="w-10 h-1 mx-auto rounded-full shadow-2xs select-none mt-4 relative z-20"
          style={{
            backgroundColor: `rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.55)`,
          }}
          title="Tap backdrop or X to close"
        />

        {/* Header */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between relative z-20">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-2xs"
              style={{ backgroundColor: visualTheme.avatarFallbackBg }}
            >
              {icon}
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-[#1C1D1A] leading-none">
                {title}
              </h3>
              <p className="text-[10px] text-[#73716B] font-medium leading-tight mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#73716B] transition-colors cursor-pointer"
          >
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-20 px-3.5 pb-4 space-y-2.5 overflow-y-auto no-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface CustomerProfilePageViewProps {
  cafe: Cafe;
  table: Table | null;
  tableParamName?: string | null;
  settings?: CafeSetting | null;
  menuItems?: MenuItem[];
  digitalMenuTheme?: string;
  offers?: Offer[];
}

export const CustomerProfilePageView: React.FC<CustomerProfilePageViewProps> = ({
  cafe,
  table,
  tableParamName,
  settings,
  menuItems = [],
  digitalMenuTheme,
  offers = [],
}) => {
  const router = useRouter();
  const { toast } = useToast();

  const themeId = digitalMenuTheme || settings?.digitalMenuTheme || settings?.themePreset || "roast";
  const visualTheme = getDigitalMenuVisualTheme(themeId);

  // Compute theme colors matching CustomerOffersModal center bend surface
  const themeRgb = useMemo(() => {
    const hex = (visualTheme.avatarFallbackBg || "#E57B24").replace("#", "");
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
    return { r: 229, g: 123, b: 36 };
  }, [visualTheme.avatarFallbackBg]);

  const themeOpaqueColors = useMemo(() => {
    const { r, g, b } = themeRgb;
    const blend = (weight: number) => {
      const red = Math.round(r * weight + 255 * (1 - weight));
      const green = Math.round(g * weight + 255 * (1 - weight));
      const blue = Math.round(b * weight + 255 * (1 - weight));
      return `rgb(${red}, ${green}, ${blue})`;
    };

    return {
      topTint: blend(0.24),
      midTint: blend(0.08),
      bottomTint: "#FFFFFF",
      innerShadowColor: `rgba(${r}, ${g}, ${b}, 0.18)`,
      borderStroke: `rgba(${r}, ${g}, ${b}, 0.35)`,
    };
  }, [themeRgb]);

  const activeTableName = table?.tableNumber || tableParamName || null;
  const tableQuery = activeTableName ? `?table=${encodeURIComponent(activeTableName)}` : "";

  // Profile and State loaded from localStorage
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [pastOrders, setPastOrders] = useState<CustomerPastOrder[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [, setIsLoaded] = useState(false);

  // Modals
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showStampModal, setShowStampModal] = useState(false);
  const [showOrdersSheet, setShowOrdersSheet] = useState(false);
  const [showSavedSheet, setShowSavedSheet] = useState(false);
  const [showOffersModal, setShowOffersModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [activeDicebearStyle, setActiveDicebearStyle] = useState<
    "fun-emoji" | "dylan" | "constellation" | "big-ears" | "adventurer" | "critters"
  >("fun-emoji");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        toast({ title: "Image too large", description: "Please upload an image smaller than 3MB.", variant: "warning" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setEditAvatar(result);
          toast({ title: "Photo Ready", description: "Click Save to apply your new avatar.", variant: "success" });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDob, setEditDob] = useState("");

  const [smsNotifications, setSmsNotifications] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(`cafe_customer_profile_${cafe.slug}`);
      if (savedProfile) {
        const parsed: CustomerProfile = JSON.parse(savedProfile);
        setProfile(parsed);
      }

      const savedPast = localStorage.getItem(`cafe_past_orders_${cafe.slug}`);
      if (savedPast) setPastOrders(JSON.parse(savedPast));

      const savedFavs = localStorage.getItem(`cafe_favorites_${cafe.slug}`);
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
    } catch (e) {
      // safe guard
    } finally {
      setIsLoaded(true);
    }
  }, [cafe.slug]);

  // Handle Save Profile with permanent account preservation
  const handleSaveProfile = (newProfile: CustomerProfile) => {
    setProfile(newProfile);
    setActiveCustomerProfile(cafe.slug, newProfile);
  };

  // Applied & Claimed Coupons on Profile
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedApplied = localStorage.getItem(`cafe_applied_coupon_${cafe.slug}`);
      if (savedApplied) setAppliedCoupon(savedApplied);
    } catch {}
  }, [cafe.slug]);

  const handleApplyCoupon = (offer: { code: string }) => {
    try {
      localStorage.setItem(`cafe_applied_coupon_${cafe.slug}`, offer.code);
      setAppliedCoupon(offer.code);
      toast({
        title: `Offer ${offer.code} Applied!`,
        description: `Promo coupon applied to your order.`,
        variant: "success",
      });
    } catch {}
  };

  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } catch (e) {
      console.error("Sign out error", e);
    }
    localStorage.removeItem(`cafe_customer_profile_${cafe.slug}`);
    setActiveCustomerProfile(cafe.slug, null);
    setProfile(null);
    toast({
      title: "Logged Out",
      description: "Browsing as guest. You can sign in anytime to restore your perks.",
      variant: "info",
    });
  };

  const favoritedMenuItems = menuItems.filter((m) => favorites.includes(m.id));

  // Current calculations
  const currentPoints = profile?.loyaltyPoints ?? 0;
  const stampsCollected = profile?.stampsCollected ?? 0;
  const stampsRequired = profile?.stampsRequired ?? 0;


  const handleReorder = (orderNum: string) => {
    setShowOrdersSheet(false);
    router.push(`/menu/${cafe.slug}${tableQuery}`);
    toast({
      title: `Reordering ##${orderNum}`,
      description: "Select items from the menu to confirm your order.",
      variant: "info",
    });
  };

  {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      CASE A: LOGGED OUT — WELCOMING ENTRY (THEMED LOGIN & OTP SCREEN)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
  if (!profile || profile.isGuest) {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col justify-start">
        <CustomerAuthView
          cafe={cafe}
          visualTheme={visualTheme}
          onSuccess={(newProf) => {
            handleSaveProfile(newProf);
          }}
          onCancel={() => {
            router.push(`/menu/${cafe.slug}${tableQuery}`);
          }}
          onContinueAsGuest={() => {
            router.push(`/menu/${cafe.slug}${tableQuery}`);
          }}
        />
      </div>
    );
  }

  {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      CASE B: LOGGED IN PROFILE (MATCHING REFERENCE IMAGE 2)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 pb-20 relative overflow-x-hidden selection:bg-[var(--color-primary-light)]">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO BANNER: REAL CAFE PHOTO WITH CURVED WAVE (CLEAN, NO LOGO/SETTINGS)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="relative w-full h-64 sm:h-72 overflow-hidden select-none">
        {/* Background Image generated to match Reference Image 2 */}
        <img
          src="/images/profile-hero.jpg"
          alt="Cafe Hero"
          className="w-full h-full object-cover"
        />

        {/* Ambient subtle vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/10 pointer-events-none" />

        {/* Top Controls: Only Circular Back Button on Left */}
        <div className="absolute top-4 left-4 z-20">
          <button
            type="button"
            onClick={() => router.push(`/menu/${cafe.slug}${tableQuery}`)}
            aria-label="Back to Menu"
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/60 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <IconArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Signature Center Bend Organic Wave Curve Divider */}
        <div className="absolute bottom-0 left-0 right-0 h-12 overflow-hidden leading-none select-none pointer-events-none z-10 -mb-[1px]">
          <svg
            viewBox="0 0 400 45"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full block text-[#FAF9F6] fill-current"
            preserveAspectRatio="none"
          >
            <path
              d="M 0,28 C 45,12 80,8 115,10 C 155,12 175,34 215,34 C 265,34 295,8 335,8 C 365,8 385,20 400,24 L 400,45 L 0,45 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          USER PROFILE SECTION (OVERLAPPING AVATAR ON LEFT, LEFT-ALIGNED INFO)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="max-w-md mx-auto px-4 relative z-20">
        {/* Overlapping Avatar on Left */}
        <div
          onClick={() => {
            setEditName(profile.name);
            setEditAvatar(profile.avatarUrl || "");
            setEditPhone(profile.phone || "");
            setEditEmail(profile.email || "");
            setEditDob(profile.dateOfBirth || "");
            setShowEditModal(true);
          }}
          className="relative -mt-11 sm:-mt-12 w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden shadow-md ring-4 ring-[#FAF9F6] cursor-pointer active:scale-95 transition-transform bg-[#F5EBE1] flex items-center justify-center flex-shrink-0"
          title="Click to edit profile"
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl sm:text-2xl font-black text-[#5C4033] tracking-wide">
              {profile.name.substring(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        {/* Left-Aligned User Name, Phone & Edit Profile Pill Button */}
        <div className="mt-2 text-left">
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight font-heading leading-tight">
            {profile.name}
          </h1>
          <p className="text-xs sm:text-[13px] font-medium text-stone-500 mt-0.5">
            {profile.phone || profile.email}
          </p>

          <button
            type="button"
            onClick={() => {
              setEditName(profile.name);
              setEditAvatar(profile.avatarUrl || "");
              setEditPhone(profile.phone || "");
              setEditEmail(profile.email || "");
              setEditDob(profile.dateOfBirth || "");
              setShowEditModal(true);
            }}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200/80 hover:bg-stone-300/80 text-stone-800 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <IconEdit className="w-3.5 h-3.5 stroke-[2]" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MAIN CARDS CONTAINER (CLEAN, COMPACT, MATCHING REFERENCE IMAGE 2)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="max-w-md mx-auto px-4 pt-4 pb-10 space-y-3.5 relative z-10">
        {/* CARD 1: Exact Wax Seal Stamp Card (Matching User's Reference Image) */}
        <WaxSealStampCard
          cafeName={cafe.name}
          stampsCollected={stampsCollected}
          stampsRequired={stampsRequired}
          onCardClick={() => setShowStampModal(true)}
        />

        {/* CARD 2: 4 Quick Actions (My Orders, Favorites, Offers, Rewards) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setShowOrdersSheet(true)}
            className="bg-white rounded-2xl py-3 px-1 border border-stone-200/80 shadow-xs flex flex-col items-center justify-center gap-1.5 hover:bg-stone-50 active:scale-95 transition-all cursor-pointer text-center"
          >
            <IconReceipt className="w-5 h-5 text-stone-700 stroke-[1.8]" />
            <span className="text-[11px] font-semibold text-stone-800 leading-tight">My Orders</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSavedSheet(true)}
            className="bg-white rounded-2xl py-3 px-1 border border-stone-200/80 shadow-xs flex flex-col items-center justify-center gap-1.5 hover:bg-stone-50 active:scale-95 transition-all cursor-pointer text-center"
          >
            <IconHeart className="w-5 h-5 text-stone-700 stroke-[1.8]" />
            <span className="text-[11px] font-semibold text-stone-800 leading-tight">Favorites</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOffersModal(true)}
            className="bg-white rounded-2xl py-3 px-1 border border-stone-200/80 shadow-xs flex flex-col items-center justify-center gap-1.5 hover:bg-stone-50 active:scale-95 transition-all cursor-pointer text-center"
          >
            <IconGift className="w-5 h-5 text-stone-700 stroke-[1.8]" />
            <span className="text-[11px] font-semibold text-stone-800 leading-tight">Offers</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRewardsModal(true)}
            className="bg-white rounded-2xl py-3 px-1 border border-stone-200/80 shadow-xs flex flex-col items-center justify-center gap-1.5 hover:bg-stone-50 active:scale-95 transition-all cursor-pointer text-center"
          >
            <IconStar className="w-5 h-5 text-stone-700 stroke-[1.8]" />
            <span className="text-[11px] font-semibold text-stone-800 leading-tight">Rewards</span>
          </button>
        </div>

        {/* CARD 3: Settings List Card (Personal Info, Wallet, Saved Items, Notifications with Toggle) */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs divide-y divide-stone-100 overflow-hidden">
          {/* 1. Personal Information */}
          <button
            type="button"
            onClick={() => {
              setEditName(profile.name);
              setEditAvatar(profile.avatarUrl || "");
              setEditPhone(profile.phone || "");
              setEditEmail(profile.email || "");
              setEditDob(profile.dateOfBirth || "");
              setShowEditModal(true);
            }}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-stone-50 active:bg-stone-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <IconUser className="w-5 h-5 text-stone-700 stroke-[1.8]" />
              <span className="text-xs sm:text-sm font-semibold text-stone-900">Personal Information</span>
            </div>
            <IconChevronRight className="w-4 h-4 text-stone-400" />
          </button>

          {/* 2. Saved Items */}
          <button
            type="button"
            onClick={() => setShowSavedSheet(true)}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-stone-50 active:bg-stone-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <IconHeart className="w-5 h-5 text-stone-700 stroke-[1.8]" />
              <span className="text-xs sm:text-sm font-semibold text-stone-900">Saved Items</span>
            </div>
            <div className="flex items-center gap-2">
              {favoritedMenuItems.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold">
                  {favoritedMenuItems.length}
                </span>
              )}
              <IconChevronRight className="w-4 h-4 text-stone-400" />
            </div>
          </button>

          {/* 4. Notifications with interactive iOS-style TOGGLE SWITCH */}
          <div className="w-full px-4 py-3.5 flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <IconBell className="w-5 h-5 text-stone-700 stroke-[1.8]" />
              <span className="text-xs sm:text-sm font-semibold text-stone-900">Notifications</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={smsNotifications}
              onClick={() => {
                const next = !smsNotifications;
                setSmsNotifications(next);
                toast({
                  title: next ? "Notifications Enabled" : "Notifications Disabled",
                  description: next ? "Order updates & exclusive offers active." : "Alerts muted.",
                  variant: "info",
                });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                smsNotifications ? "bg-emerald-500" : "bg-stone-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  smsNotifications ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* CARD 4: Recent Orders (Matching Reference Image 2) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm sm:text-base font-bold text-stone-900">Recent Orders</h3>
            <button
              type="button"
              onClick={() => setShowOrdersSheet(true)}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>View All</span>
              <IconChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {/* Order 1: Iced Spanish Latte */}
            <div
              onClick={() => setShowOrdersSheet(true)}
              className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:border-stone-300 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=160&auto=format&fit=crop&q=80"
                  alt="Iced Spanish Latte"
                  className="w-12 h-12 rounded-xl object-cover shadow-2xs flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">Iced Spanish Latte</h4>
                  <p className="text-[11px] text-stone-500">1 item &bull; ₹220</p>
                  <span className="text-[10px] text-stone-400 block mt-0.5">12 Sep 2026 &bull; 10:42 AM</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold">
                  Completed
                </span>
                <IconChevronRight className="w-4 h-4 text-stone-400" />
              </div>
            </div>

            {/* Order 2: Croissant */}
            <div
              onClick={() => setShowOrdersSheet(true)}
              className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:border-stone-300 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=160&auto=format&fit=crop&q=80"
                  alt="Croissant"
                  className="w-12 h-12 rounded-xl object-cover shadow-2xs flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">Croissant</h4>
                  <p className="text-[11px] text-stone-500">1 item &bull; ₹120</p>
                  <span className="text-[10px] text-stone-400 block mt-0.5">10 Sep 2026 &bull; 09:18 AM</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold">
                  Completed
                </span>
                <IconChevronRight className="w-4 h-4 text-stone-400" />
              </div>
            </div>

            {/* Order 3: Cappuccino */}
            <div
              onClick={() => setShowOrdersSheet(true)}
              className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:border-stone-300 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=160&auto=format&fit=crop&q=80"
                  alt="Cappuccino"
                  className="w-12 h-12 rounded-xl object-cover shadow-2xs flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">Cappuccino</h4>
                  <p className="text-[11px] text-stone-500">2 items &bull; ₹360</p>
                  <span className="text-[10px] text-stone-400 block mt-0.5">06 Sep 2026 &bull; 04:20 PM</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 text-[11px] font-semibold">
                  Served
                </span>
                <IconChevronRight className="w-4 h-4 text-stone-400" />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 5: Log Out Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3.5 px-4 rounded-full bg-[#FAF0ED] hover:bg-[#F7E6E1] text-[#991B1B] text-sm font-bold shadow-xs border border-rose-200/60 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
          >
            <IconLogout className="w-4.5 h-4.5 stroke-[2.2]" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODAL 1: ORDER HISTORY (MATCHING Reference Image 3 + CustomerOffersModal Surface)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <ProfileBendModal
        isOpen={showOrdersSheet}
        onClose={() => setShowOrdersSheet(false)}
        title="Order History"
        subtitle="Past dining receipts and reorders"
        icon={<IconReceipt className="w-3.5 h-3.5 stroke-[2.2]" />}
        gradientId="profileOrdersModalGrad"
        themeRgb={themeRgb}
        themeOpaqueColors={themeOpaqueColors}
        visualTheme={visualTheme}
      >
        {pastOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-500">
            No past orders to show yet.
          </div>
        ) : pastOrders.map((ord) => (
          <div
            key={ord.id}
            className="p-3.5 rounded-2xl bg-white border border-stone-200/70 shadow-xs flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-stone-900 font-mono tracking-tight">
                ##{ord.orderNumber}
              </h4>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {ord.itemsCount} {ord.itemsCount === 1 ? "item" : "items"}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm font-bold text-stone-900 font-mono">
                ₹{ord.total}
              </span>
              <button
                type="button"
                onClick={() => handleReorder(ord.orderNumber)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-stone-300 hover:border-stone-400 text-xs font-semibold text-stone-800 shadow-2xs hover:bg-stone-50 active:scale-95 transition-all cursor-pointer"
              >
                <IconRepeat className="w-3.5 h-3.5 text-stone-700" />
                <span>Reorder</span>
              </button>
            </div>
          </div>
        ))}
      </ProfileBendModal>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODAL 2: EXCLUSIVE OFFERS MODAL (REUSING CustomerOffersModal)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <CustomerOffersModal
        isOpen={showOffersModal}
        cafeName={cafe.name}
        cafeSlug={cafe.slug}
        offers={offers}
        customerProfile={profile}
        hasPastOrders={pastOrders.length > 0}
        appliedCode={appliedCoupon}
        onClose={() => setShowOffersModal(false)}
        onApplyCode={(code) => {
          if (code) {
            handleApplyCoupon({ code });
          }
          setShowOffersModal(false);
        }}
        digitalMenuTheme={themeId}
      />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODAL 3: CAFÉ REWARDS (CustomerOffersModal Surface)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <ProfileBendModal
        isOpen={showRewardsModal}
        onClose={() => setShowRewardsModal(false)}
        title="Café Rewards"
        subtitle={`${currentPoints} pts • ${cafe.name} Club`}
        icon={<IconGift className="w-3.5 h-3.5 stroke-[2.2]" />}
        gradientId="profileRewardsModalGrad"
        themeRgb={themeRgb}
        themeOpaqueColors={themeOpaqueColors}
        visualTheme={visualTheme}
      >
        {/* Digital Pass Card */}
        <div
          className="w-full rounded-2xl p-4 text-white relative overflow-hidden shadow-md"
          style={{
            background: `linear-gradient(135deg, ${visualTheme.avatarFallbackBg} 0%, #1A1513 100%)`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-bold tracking-wide uppercase">
              <IconCrown className="w-3 h-3 text-amber-300" />
              <span>{profile.memberTier || "MEMBER"} PASS</span>
            </div>
            <span className="text-[10px] font-mono tracking-widest text-white/70">
              {cafe.slug.toUpperCase()}
            </span>
          </div>

          <div className="pt-3 pb-1">
            <span className="text-[11px] text-white/75 font-medium block">
              Loyalty Balance
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black tracking-tight">{currentPoints}</span>
              <span className="text-xs text-amber-300 font-bold uppercase tracking-wider">Points</span>
            </div>
            <p className="text-[10.5px] text-white/70 mt-0.5">
              Worth ≈ ₹{(currentPoints / 10).toFixed(0)} discount on your next table checkout
            </p>
          </div>
        </div>

        {/* Redeemable Treats */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold text-stone-900 block px-1">
            Available Rewards
          </span>
          <div className="space-y-2">
            {POINTS_REWARDS.map((rew) => {
              const canRedeem = currentPoints >= rew.pts;
              return (
                <div
                  key={rew.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    canRedeem ? "bg-white border-stone-200/80 shadow-2xs" : "bg-stone-50 border-stone-200/40 opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-lg flex items-center justify-center flex-shrink-0 text-amber-800">
                      {rew.icon({ className: "w-5 h-5" })}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-stone-900 truncate">{rew.name}</h4>
                      <p className="text-[11px] text-stone-500 leading-tight line-clamp-1">{rew.desc}</p>
                      <span className="text-[11px] font-mono font-bold text-amber-700">
                        {rew.pts} pts
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!canRedeem}
                    onClick={() => {
                      toast({
                        title: `Redeemed ${rew.name}!`,
                        description: "Show voucher code to barista at checkout.",
                        variant: "success",
                      });
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 transition-transform ${
                      canRedeem
                        ? "bg-stone-900 text-white shadow-xs cursor-pointer active:scale-95 hover:bg-stone-800"
                        : "bg-black/10 text-stone-400 cursor-not-allowed"
                    }`}
                  >
                    {canRedeem ? "Redeem" : "Locked"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </ProfileBendModal>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODAL 4: SAVED ITEMS DRAWER (CustomerOffersModal Surface)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <ProfileBendModal
        isOpen={showSavedSheet}
        onClose={() => setShowSavedSheet(false)}
        title="Saved Items"
        subtitle={`${favoritedMenuItems.length} favourite dishes & brews`}
        icon={<IconHeart className="w-3.5 h-3.5 stroke-[2.2] fill-current" />}
        gradientId="profileSavedModalGrad"
        themeRgb={themeRgb}
        themeOpaqueColors={themeOpaqueColors}
        visualTheme={visualTheme}
      >
        {favoritedMenuItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 space-y-2">
            <IconHeart className="w-8 h-8 mx-auto text-stone-300" />
            <p className="font-bold text-stone-800">No favourite items yet.</p>
            <p>Tap the heart icon on any menu item to save it here for fast ordering.</p>
          </div>
        ) : (
          favoritedMenuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setShowSavedSheet(false);
                router.push(`/menu/${cafe.slug}/${item.slug}${tableQuery}`);
              }}
              className="p-3 rounded-2xl bg-white border border-stone-200/80 flex items-center justify-between gap-3 cursor-pointer hover:border-stone-300 shadow-2xs transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 flex items-center justify-center">
                  {item.imageKey ? (
                    <img src={item.imageKey} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <IconCoffee className="w-5 h-5 text-stone-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-stone-900 truncate">{item.name}</h4>
                  <span className="text-xs font-mono font-bold text-stone-900">
                    ₹{item.price}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSavedSheet(false);
                  router.push(`/menu/${cafe.slug}/${item.slug}${tableQuery}`);
                }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-xs font-semibold cursor-pointer shadow-xs"
                style={{ backgroundColor: visualTheme.avatarFallbackBg }}
              >
                <span>View</span>
                <IconChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </ProfileBendModal>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODAL 5: STAMP COLLECTION SHEET (Wax Seal Stamp Card)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <ProfileBendModal
        isOpen={showStampModal}
        onClose={() => setShowStampModal(false)}
        title={`${cafe.name} Pass`}
        subtitle={`${stampsCollected} of ${stampsRequired} stamps collected`}
        icon={<IconCrown className="w-3.5 h-3.5 stroke-[2.2] fill-current" />}
        gradientId="profileStampModalGrad"
        themeRgb={themeRgb}
        themeOpaqueColors={themeOpaqueColors}
        visualTheme={visualTheme}
      >
        <WaxSealStampCard
          cafeName={cafe.name}
          stampsCollected={stampsCollected}
          stampsRequired={stampsRequired}
        />
      </ProfileBendModal>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODAL 6: PERSONAL INFORMATION / EDIT PROFILE (CustomerOffersModal Surface)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <ProfileBendModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Personal Information"
        subtitle="Personalize your name and avatar"
        icon={<IconUser className="w-3.5 h-3.5 stroke-[2.2]" />}
        gradientId="profileEditModalGrad"
        themeRgb={themeRgb}
        themeOpaqueColors={themeOpaqueColors}
        visualTheme={visualTheme}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const finalName = editName.trim() || profile.name;
            const finalAvatar = editAvatar || profile.avatarUrl;
            handleSaveProfile({
              ...profile,
              name: finalName,
              avatarUrl: finalAvatar,
              phone: editPhone.trim() || profile.phone,
              email: editEmail.trim() || profile.email,
              dateOfBirth: editDob.trim() || profile.dateOfBirth,
            });
            setShowEditModal(false);
            toast({ title: "Profile Updated", description: "Your details have been saved.", variant: "success" });
          }}
          className="space-y-3"
        >
          {/* 1. Live Avatar Preview & Upload Action */}
          <div className="flex flex-col items-center justify-center text-center space-y-2 pt-0.5">
            <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-white flex items-center justify-center ring-2 ring-stone-200 shadow-2xs">
              {editAvatar ? (
                <img
                  src={editAvatar}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: visualTheme.avatarFallbackBg }}
                >
                  {(editName || profile.name).substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold border border-stone-200 shadow-2xs cursor-pointer active:scale-95 transition-all"
              >
                <IconUpload className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Upload Image</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              {editAvatar && (
                <button
                  type="button"
                  onClick={() => setEditAvatar("")}
                  className="text-[11px] font-semibold text-stone-500 hover:text-rose-600 transition-colors cursor-pointer px-2 py-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* 2. Full Name Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-900 block">Full Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:outline-none focus:border-stone-900 transition-all bg-white"
              placeholder="Your Name"
            />
          </div>

          {/* 3. DiceBear Avatar Library */}
          <div className="space-y-2 pt-1 border-t border-stone-200">
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold text-stone-900">DiceBear Avatar Library</span>
              <span className="text-[10px] text-stone-500">Choose a style</span>
            </div>

            {/* Style Collection Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {DICEBEAR_AVATAR_COLLECTIONS.map((col) => {
                const isActive = activeDicebearStyle === col.id;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setActiveDicebearStyle(col.id as any)}
                    className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-stone-900 text-white shadow-2xs"
                        : "bg-stone-200/80 text-stone-600 hover:bg-stone-300 hover:text-stone-900"
                    }`}
                  >
                    {col.name}
                  </button>
                );
              })}
            </div>

            {/* Avatar Grid for active collection */}
            {(() => {
              const currentCollection =
                DICEBEAR_AVATAR_COLLECTIONS.find((c) => c.id === activeDicebearStyle) ||
                DICEBEAR_AVATAR_COLLECTIONS[0];
              return (
                <div className="grid grid-cols-4 gap-2 pt-0.5">
                  {currentCollection.seeds.map((seed) => {
                    const avatarUrl = `https://api.dicebear.com/10.x/${currentCollection.id}/svg?seed=${seed}`;
                    const isSelected = editAvatar === avatarUrl;
                    return (
                      <button
                        key={seed}
                        type="button"
                        onClick={() => setEditAvatar(avatarUrl)}
                        className={`relative aspect-square rounded-2xl p-1 bg-white border transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 ${
                          isSelected
                            ? "border-stone-900 ring-2 ring-stone-900/40 shadow-xs"
                            : "border-stone-200 hover:border-stone-400"
                        }`}
                      >
                        <img
                          src={avatarUrl}
                          alt={seed}
                          className="w-full h-full object-contain rounded-xl"
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center">
                            <IconCheck className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* 4. Phone & Email */}
          <div className="space-y-2 pt-1 border-t border-stone-200">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10.5px] font-bold text-stone-600 block mb-0.5">Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-medium focus:outline-none focus:border-stone-900 bg-white"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-stone-600 block mb-0.5">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-medium focus:outline-none focus:border-stone-900 bg-white"
                  placeholder="name@example.com"
                />
              </div>
            </div>
          </div>

          {/* Footer Save Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-98 transition-transform"
            >
              Save Profile
            </button>
          </div>
        </form>
      </ProfileBendModal>
    </div>
  );
};
