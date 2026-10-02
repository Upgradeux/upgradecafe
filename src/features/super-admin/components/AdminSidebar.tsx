"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconLayoutDashboard,
  IconCoffee,
  IconPlus,
  IconPackages,
  IconReceipt,
  IconCreditCard,
  IconHistory,
  IconSettings,
  IconLogout,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from "@tabler/icons-react";
import { signOut } from "@/lib/auth/auth-client";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [{ name: "Overview", href: "/admin", icon: IconLayoutDashboard, exact: true }],
  },
  {
    title: "Cafes",
    items: [
      { name: "All cafes", href: "/admin/cafes", icon: IconCoffee, exact: true },
      { name: "Add cafe", href: "/admin/cafes/new", icon: IconPlus },
    ],
  },
  {
    title: "Billing",
    items: [
      { name: "Plans", href: "/admin/plans", icon: IconPackages },
      { name: "Payments", href: "/admin/payments", icon: IconReceipt },
      { name: "Subscriptions", href: "/admin/subscriptions", icon: IconCreditCard },
    ],
  },
  {
    title: "Platform",
    items: [
      { name: "Activity", href: "/admin/activity", icon: IconHistory },
      { name: "Settings", href: "/admin/settings", icon: IconSettings },
    ],
  },
];

const allNavItems = navSections.flatMap((section) => section.items);

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // Clear local navigation state even when the remote session call fails.
    }
    router.push("/admin/login");
    router.refresh();
  };

  const linkClass = (active: boolean, compact = false) =>
    `group flex shrink-0 items-center rounded-md text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-muted)] ${
      compact ? "gap-2 px-3 py-2" : isCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"
    } ${
      active
        ? "bg-[var(--color-primary-light)] text-[var(--color-foreground)]"
        : "text-[var(--color-muted)] hover:bg-[var(--color-border-subtle)] hover:text-[var(--color-foreground)]"
    }`;

  return (
    <aside
      className={`${
        isCollapsed ? "md:w-16" : "md:w-56"
      } w-full shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] md:sticky md:top-0 md:flex md:h-screen md:flex-col md:border-b-0 md:border-r`}
    >
      <div className="flex h-14 items-center justify-between border-b border-[var(--color-border-subtle)] px-4 md:px-3">
        <Link href="/admin" className="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-muted)]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-white">
            <IconCoffee className="h-4 w-4" aria-hidden="true" />
          </span>
          {!isCollapsed && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold tracking-tight text-[var(--color-foreground)]">UpgradeCafe</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">Platform admin</span>
            </span>
          )}
        </Link>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md p-2 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border-subtle)] hover:text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-muted)] md:hidden"
            aria-label="Log out"
            title="Log out"
          >
            <IconLogout className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed((collapsed) => !collapsed)}
            className="hidden rounded-md p-2 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border-subtle)] hover:text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-muted)] md:flex"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <IconLayoutSidebarLeftExpand className="h-4 w-4" /> : <IconLayoutSidebarLeftCollapse className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <nav aria-label="Super Admin" className="no-scrollbar flex gap-1 overflow-x-auto px-3 py-2 md:hidden">
        {allNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={linkClass(active, true)}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <nav aria-label="Super Admin" className={`hidden space-y-5 overflow-y-auto py-4 md:block ${isCollapsed ? "px-2" : "px-3"}`}>
        {navSections.map((section) => (
          <div key={section.title ?? "overview"} className="space-y-1">
            {!isCollapsed && section.title && (
              <h2 className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                {section.title}
              </h2>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  title={isCollapsed ? item.name : undefined}
                  className={linkClass(active)}
                >
                  <Icon className="h-4 w-4 shrink-0 text-current" aria-hidden="true" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto hidden border-t border-[var(--color-border-subtle)] p-3 md:block">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between gap-2"}`}>
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-border-subtle)] text-[11px] font-semibold text-[var(--color-foreground)]">SA</span>
            {!isCollapsed && (
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-xs font-semibold text-[var(--color-foreground)]">Super Admin</span>
                <span className="block truncate text-[11px] text-[var(--color-muted)]">Platform operator</span>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md p-2 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border-subtle)] hover:text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-muted)]"
            aria-label="Log out"
            title="Log out"
          >
            <IconLogout className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
