"use client";

import React, { useState } from "react";
import { CustomerProfile } from "../types";
import {
  IconX,
  IconUser,
  IconAward,
  IconCalendarTime,
  IconStar,
  IconHistory,
  IconCheck,
  IconLogout,
  IconArrowRight,
  IconCoffee,
} from "@tabler/icons-react";
import { Cafe } from "@/lib/db/schema/cafes";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import { CustomerAuthView } from "./CustomerAuthView";

export interface CustomerProfileModalProps {
  isOpen: boolean;
  profile: CustomerProfile | null;
  onClose: () => void;
  onSaveProfile: (profile: CustomerProfile) => void;
  onLogout: () => void;
  onOpenReservation: () => void;
  onOpenFeedback: () => void;
  pastOrders?: Array<{
    id: string;
    orderNumber: string;
    date: string;
    total: number;
    itemsCount: number;
  }>;
  cafe?: Cafe;
  visualTheme?: ReturnType<typeof getDigitalMenuVisualTheme>;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSaveProfile,
  onLogout,
  onOpenReservation,
  onOpenFeedback,
  pastOrders = [],
  cafe,
  visualTheme,
}) => {
  if (!isOpen) return null;

  const isLoggedIn = profile && !profile.isGuest;

  if (!isLoggedIn && cafe && visualTheme) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
          <CustomerAuthView
            cafe={cafe}
            visualTheme={visualTheme}
            isModal={true}
            onCancel={onClose}
            onSuccess={(newProf) => {
              onSaveProfile(newProf);
              onClose();
            }}
            onContinueAsGuest={onClose}
          />
        </div>
      </div>
    );
  }

  const AVATAR_OPTIONS = [
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
  ];

  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || AVATAR_OPTIONS[0]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newProfile: CustomerProfile = {
      id: profile?.id || `cust_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      avatarUrl: avatarUrl,
      loyaltyPoints: profile?.loyaltyPoints || 50, // Welcome 50 points
      isGuest: false,
      memberTier: profile?.memberTier || "SILVER",
    };

    onSaveProfile(newProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-t-lg sm:rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl overflow-hidden flex flex-col max-h-[88vh] animate-in slide-in-from-bottom sm:zoom-in-95">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center shadow-xs">
              <IconAward className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[var(--color-foreground)]">
                {isLoggedIn ? "Member Pass & Rewards" : "Customer Sign-In (Optional)"}
              </h3>
              <p className="text-[10px] text-[var(--color-muted)]">
                {isLoggedIn ? "Enjoy exclusive perks & loyalty benefits" : "Login is completely optional"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-background)] transition-colors"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Member Card if logged in */}
          {isLoggedIn ? (
            <div className="space-y-3">
              {/* Luxury Digital Membership Card */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-background)] border border-[var(--color-border)] shadow-xs relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9.5px] uppercase tracking-wider text-[var(--color-muted)] font-medium">
                      Artisanal Member Pass
                    </span>
                    <h4 className="text-sm font-semibold text-[var(--color-foreground)] mt-0.5">
                      {profile.name}
                    </h4>
                    <p className="text-[10.5px] text-[var(--color-muted)] font-mono">
                      {profile.phone}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                    {profile.memberTier} TIER
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[var(--color-muted)] block">
                      Bean Loyalty Points
                    </span>
                    <span className="text-base font-bold font-mono text-[var(--color-primary)]">
                      {profile.loyaltyPoints} Pts
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    10 Pts per ₹100 Spent
                  </span>
                </div>
              </div>

              {/* Quick Actions Matrix */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenReservation();
                  }}
                  className="p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-surface)] text-left flex flex-col gap-1 transition-colors shadow-xs"
                >
                  <IconCalendarTime className="w-4 h-4 text-[var(--color-primary)]" />
                  <span className="font-medium text-xs text-[var(--color-foreground)]">
                    Reserve Table
                  </span>
                  <span className="text-[10px] text-[var(--color-muted)]">
                    Book for upcoming visit
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFeedback();
                  }}
                  className="p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-surface)] text-left flex flex-col gap-1 transition-colors shadow-xs"
                >
                  <IconStar className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-xs text-[var(--color-foreground)]">
                    Leave Review
                  </span>
                  <span className="text-[10px] text-[var(--color-muted)]">
                    Share your experience
                  </span>
                </button>
              </div>

              {/* Past Orders History List */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[var(--color-foreground)] flex items-center gap-1">
                    <IconHistory className="w-3.5 h-3.5 text-[var(--color-muted)]" />
                    <span>Your Recent Orders</span>
                  </span>
                  <span className="text-[10px] text-[var(--color-muted)] font-mono">
                    {pastOrders.length} orders
                  </span>
                </div>

                {pastOrders.length === 0 ? (
                  <div className="p-3 text-center rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-background)] text-[11px] text-[var(--color-muted)]">
                    No past orders yet. Place an order to start earning points!
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {pastOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] flex items-center justify-between shadow-xs"
                      >
                        <div>
                          <span className="font-mono font-medium text-[11px] text-[var(--color-foreground)]">
                            {ord.orderNumber}
                          </span>
                          <span className="text-[10px] text-[var(--color-muted)] ml-2">
                            {ord.date}
                          </span>
                        </div>
                        <span className="font-mono font-semibold text-xs text-[var(--color-primary)]">
                          ₹{ord.total}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Logout button */}
              <div className="pt-2 border-t border-[var(--color-border)] flex justify-end">
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs text-[var(--color-muted)] hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                  <IconLogout className="w-3.5 h-3.5" />
                  <span>Sign out of profile</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login / Guest Form */
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div className="p-2.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] text-[11px] text-[var(--color-muted)] space-y-1 shadow-xs">
                <p className="font-medium text-[var(--color-foreground)]">
                  Why connect your details?
                </p>
                <p>
                  Earn loyalty rewards, save favorite coffee preferences, and track your receipts seamlessly. You can still order as a guest without signing in!
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--color-foreground)] block">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--color-foreground)] block">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--color-foreground)] block">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="For digital bill receipts"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--color-foreground)] block">
                  Choose Profile Avatar
                </label>
                <div className="flex items-center gap-2.5">
                  {AVATAR_OPTIONS.map((imgUrl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatarUrl(imgUrl)}
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                        avatarUrl === imgUrl
                          ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30 scale-105"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt="Avatar choice"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-md text-xs font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <IconCheck className="w-4 h-4" />
                  <span>Save Profile & Earn 50 Pts</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 px-3 rounded-md text-xs font-medium text-[var(--color-muted)] hover:bg-[var(--color-background)] transition-colors"
                >
                  Continue as Anonymous Guest
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
