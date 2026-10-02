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

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navSections: NavSection[] = [
    {
      items: [
        {
          name: "Overview",
          href: "/admin",
          icon: IconLayoutDashboard,
          exact: true,
        },
      ],
    },
    {
      title: "CAFÉS",
      items: [
        {
          name: "All Cafés",
          href: "/admin/cafes",
          icon: IconCoffee,
          exact: true,
        },
        {
          name: "Add Café",
          href: "/admin/cafes/new",
          icon: IconPlus,
        },
      ],
    },
    {
      title: "BILLING & PLANS",
      items: [
        {
          name: "Subscription Plans",
          href: "/admin/plans",
          icon: IconPackages,
        },
        {
          name: "Payments & Billing",
          href: "/admin/payments",
          icon: IconReceipt,
        },
        {
          name: "Subscriptions",
          href: "/admin/subscriptions",
          icon: IconCreditCard,
        },
      ],
    },
    {
      title: "PLATFORM & SYSTEM",
      items: [
        {
          name: "Security Audit Logs",
          href: "/admin/activity",
          icon: IconHistory,
        },
        {
          name: "Global Platform Settings",
          href: "/admin/settings",
          icon: IconSettings,
        },
      ],
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/admin/login");
    } catch {
      router.push("/admin/login");
    }
  };

  return (
    <aside
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } flex-shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col justify-between select-none min-h-screen transition-all duration-200`}
    >
      {/* Brand Header */}
      <div>
        <div
          className={`h-16 border-b border-[var(--color-border-subtle)] flex items-center ${
            isCollapsed
              ? "justify-center px-2"
              : "justify-between pl-4 pr-3 gap-2"
          }`}
        >
          {!isCollapsed ? (
            <>
              {/* Big Logo on the Left */}
              <Link
                href="/admin"
                className="flex items-center justify-start flex-1 min-w-0 transition-opacity hover:opacity-90"
              >
                <img
                  src="/logo/logo2.png"
                  alt="UpgradeCafé"
                  className="h-12 w-auto max-w-[170px] object-contain object-left"
                />
              </Link>

              {/* Sidebar Close Icon on the Right */}
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-[var(--radius-button)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] transition-colors cursor-pointer flex-shrink-0 flex items-center justify-center"
                title="Close sidebar"
                aria-label="Close sidebar"
              >
                <IconLayoutSidebarLeftCollapse className="w-5 h-5" />
              </button>
            </>
          ) : (
            /* Expand Icon button when collapsed */
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="p-2 rounded-[var(--radius-button)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] transition-colors cursor-pointer flex items-center justify-center"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <IconLayoutSidebarLeftExpand className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation items */}
        <nav className={`space-y-6 ${isCollapsed ? "p-2" : "p-4"}`}>
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && section.title && (
                <div className="px-3 py-1 text-[11px] font-semibold text-[var(--color-muted)] tracking-wider">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const IconComponent = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center rounded-[var(--radius-button)] text-xs font-medium transition-colors ${
                      isCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"
                    } ${
                      isActive
                        ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold"
                        : "text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] hover:text-[var(--color-foreground)]"
                    }`}
                  >
                    <IconComponent
                      className={`w-4.5 h-4.5 flex-shrink-0 ${
                        isActive
                          ? "text-[var(--color-primary)]"
                          : "text-[var(--color-muted)]"
                      }`}
                    />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Admin User Footer Profile */}
      <div
        className={`border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] ${
          isCollapsed ? "p-2 flex justify-center" : "p-4"
        }`}
      >
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white p-0.5 border border-[var(--color-border)] flex-shrink-0 flex items-center justify-center shadow-2xs">
                <img
                  src="/logo/logo.png"
                  alt="Super Admin"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--color-foreground)] truncate">
                  Super Admin
                </div>
                <div className="text-[11px] text-[var(--color-muted)] truncate">
                  Platform Operator
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] rounded-[var(--radius-button)] transition-colors cursor-pointer"
            >
              <IconLogout className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full overflow-hidden bg-white p-0.5 border border-[var(--color-border)] flex items-center justify-center shadow-2xs"
              title="Super Admin • Platform Operator"
            >
              <img
                src="/logo/logo.png"
                alt="Super Admin"
                className="w-full h-full object-contain"
              />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] rounded-[var(--radius-button)] transition-colors cursor-pointer"
            >
              <IconLogout className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
