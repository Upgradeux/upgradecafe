"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CafeSidebar } from "./CafeSidebar";
import {
  IconDeviceDesktop,
  IconBellRinging,
  IconReceipt,
  IconArmchair,
  IconDots,
  IconX,
  IconToolsKitchen2,
  IconQrcode,
  IconUsers,
  IconChartBar,
  IconPalette,
  IconShieldLock,
  IconLogout,
  IconAlertTriangle,
  IconLayoutDashboard,
  IconGift,
} from "@tabler/icons-react";
import { signOut } from "@/lib/auth/auth-client";

interface CafeAppShellProps {
  cafe: {
    id: string;
    slug: string;
    name: string;
    logoKey?: string | null;
  };
  user: {
    name: string;
    email: string;
    role?: string;
  };
  membershipRole: string;
  isSuperAdmin?: boolean;
  accessState?: any;
  children: React.ReactNode;
}

export const CafeAppShell: React.FC<CafeAppShellProps> = ({
  cafe,
  user,
  membershipRole,
  isSuperAdmin = false,
  accessState,
  children,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  // Route awareness
  const isPosPage = pathname?.endsWith("/pos") || pathname?.includes("/pos");
  const isBillingPage = pathname?.endsWith("/billing") || pathname?.includes("/billing");

  // Desktop collapsible state (68-76px collapsed, 240px expanded)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Mobile / Tablet bottom drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/admin/login");
    } catch {
      router.push("/admin/login");
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[var(--color-background)] text-[var(--color-foreground)] antialiased select-none">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. DESKTOP COLLAPSIBLE SIDEBAR (Hidden on mobile/tablet)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="hidden lg:block flex-shrink-0">
        <CafeSidebar
          cafeSlug={cafe.slug}
          cafeName={cafe.name}
          user={user}
          membershipRole={membershipRole}
          isSuperAdmin={isSuperAdmin}
          cafeLogoKey={cafe.logoKey}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. MAIN CONTENT AREA (Clean & Full-Height, No redundant CafeHeader)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Grace Period Alert Banner if applicable */}
        {accessState?.status === "GRACE" && (
          <div className="bg-[var(--color-warning-light)] text-[var(--color-warning)] px-4 py-2 text-xs font-medium flex items-center justify-between border-b border-[var(--color-warning)]/20 z-20">
            <div className="flex items-center gap-2">
              <IconAlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                Subscription in Grace Period: {accessState.graceDaysRemaining} day(s) remaining before automatic suspension.
              </span>
            </div>
            <span className="text-[11px] font-normal underline">
              Contact Platform Admin to renew
            </span>
          </div>
        )}

        {/* Content Body */}
        {isPosPage ? (
          <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden p-0 m-0 pb-14 lg:pb-0">
            {children}
          </main>
        ) : isBillingPage ? (
          <main className="flex-1 p-3 sm:p-4 overflow-y-auto overflow-x-hidden pb-16 lg:pb-4">
            <div className="w-full max-w-[1700px] mx-auto space-y-3">
              {children}
            </div>
          </main>
        ) : (
          <main className="flex-1 p-4 sm:p-5 overflow-y-auto overflow-x-hidden pb-20 lg:pb-6">
            <div className="w-full max-w-[1700px] mx-auto space-y-5">
              {children}
            </div>
          </main>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. MOBILE & TABLET BOTTOM NAVIGATION BAR (Appears from bottom)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-around px-2 z-40">
        {/* POS */}
        <Link
          href={`/cafe/${cafe.slug}/pos`}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] transition-colors ${
            pathname?.includes("/pos")
              ? "text-[var(--color-primary)] font-medium"
              : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] font-normal"
          }`}
        >
          <IconDeviceDesktop className="w-4 h-4 mb-0.5" />
          <span>POS</span>
        </Link>

        {/* Live Orders */}
        <Link
          href={`/cafe/${cafe.slug}/orders`}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] transition-colors ${
            pathname?.includes("/orders")
              ? "text-[var(--color-primary)] font-medium"
              : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] font-normal"
          }`}
        >
          <IconBellRinging className="w-4 h-4 mb-0.5" />
          <span>Orders</span>
        </Link>

        {/* Billing */}
        <Link
          href={`/cafe/${cafe.slug}/billing`}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] transition-colors ${
            pathname?.includes("/billing")
              ? "text-[var(--color-primary)] font-medium"
              : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] font-normal"
          }`}
        >
          <IconReceipt className="w-4 h-4 mb-0.5" />
          <span>Billing</span>
        </Link>

        {/* Tables */}
        <Link
          href={`/cafe/${cafe.slug}/tables`}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] transition-colors ${
            pathname?.includes("/tables")
              ? "text-[var(--color-primary)] font-medium"
              : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] font-normal"
          }`}
        >
          <IconArmchair className="w-4 h-4 mb-0.5" />
          <span>Tables</span>
        </Link>

        {/* More Drawer Trigger */}
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-normal text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
        >
          <IconDots className="w-4 h-4 mb-0.5" />
          <span>More</span>
        </button>
      </nav>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. MOBILE & TABLET BOTTOM SHEET DRAWER (Sliding up from bottom)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />

          {/* Bottom Sheet Card */}
          <div className="relative bg-[var(--color-surface)] rounded-t-lg border-t border-[var(--color-border)] max-h-[85vh] overflow-y-auto p-4 space-y-4 shadow-xl z-10">
            {/* Sheet Handle & Close */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[var(--color-primary)] text-white flex items-center justify-center font-medium text-xs">
                  {cafe.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xs font-medium text-[var(--color-foreground)]">{cafe.name}</h3>
                  <span className="text-[10px] text-[var(--color-muted)]">UpgradeCafé Hub</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-7 h-7 rounded-md bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] flex items-center justify-center"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href={`/cafe/${cafe.slug}`}
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-surface)] flex items-center gap-2.5 transition-colors shadow-xs"
              >
                <IconLayoutDashboard className="w-4 h-4 text-[var(--color-primary)]" />
                <span className="font-medium text-[var(--color-foreground)]">Overview</span>
              </Link>

              <Link
                href={`/cafe/${cafe.slug}/menu`}
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-surface)] flex items-center gap-2.5 transition-colors shadow-xs"
              >
                <IconToolsKitchen2 className="w-4 h-4 text-[var(--color-primary)]" />
                <span className="font-medium text-[var(--color-foreground)]">Menu Catalog</span>
              </Link>

              <Link
                href={`/cafe/${cafe.slug}/qr`}
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-surface)] flex items-center gap-2.5 transition-colors shadow-xs"
              >
                <IconQrcode className="w-4 h-4 text-[var(--color-primary)]" />
                <span className="font-medium text-[var(--color-foreground)]">Table QR Codes</span>
              </Link>

              <Link
                href={`/cafe/${cafe.slug}/loyalty`}
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-surface)] flex items-center gap-2.5 transition-colors shadow-xs"
              >
                <IconGift className="w-4 h-4 text-[var(--color-primary)]" />
                <span className="font-medium text-[var(--color-foreground)]">Offers & Loyalty</span>
              </Link>

              <Link
                href={`/cafe/${cafe.slug}/analytics`}
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-surface)] flex items-center gap-2.5 transition-colors shadow-xs"
              >
                <IconChartBar className="w-4 h-4 text-[var(--color-primary)]" />
                <span className="font-medium text-[var(--color-foreground)]">Analytics</span>
              </Link>

              <Link
                href={`/cafe/${cafe.slug}/customers`}
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-surface)] flex items-center justify-between gap-2 transition-colors shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <IconUsers className="w-4 h-4 text-[var(--color-muted)]" />
                  <span className="font-normal text-[var(--color-muted)]">Customers</span>
                </div>
                <span className="text-[9px] bg-[var(--color-border)] text-[var(--color-muted)] px-1.5 py-0.5 rounded-md font-medium uppercase">
                  Soon
                </span>
              </Link>

              <Link
                href={`/cafe/${cafe.slug}/settings`}
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-surface)] flex items-center gap-2.5 transition-colors shadow-xs"
              >
                <IconPalette className="w-4 h-4 text-[var(--color-primary)]" />
                <span className="font-medium text-[var(--color-foreground)]">Settings</span>
              </Link>

              <Link
                href={`/cafe/${cafe.slug}/staff`}
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-surface)] flex items-center justify-between gap-2 transition-colors shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <IconShieldLock className="w-4 h-4 text-[var(--color-muted)]" />
                  <span className="font-normal text-[var(--color-muted)]">Staff</span>
                </div>
                <span className="text-[9px] bg-[var(--color-border)] text-[var(--color-muted)] px-1.5 py-0.5 rounded-md font-medium uppercase">
                  Soon
                </span>
              </Link>
            </div>

            {/* User Info & Logout */}
            <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
              <div className="text-xs">
                <div className="font-medium text-[var(--color-foreground)]">{user.name}</div>
                <div className="text-[10px] text-[var(--color-muted)]">{user.email}</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-md border border-[var(--color-border)] text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <IconLogout className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
