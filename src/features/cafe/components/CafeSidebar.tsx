"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconArmchair,
  IconToolsKitchen2,
  IconQrcode,
  IconBellRinging,
  IconDeviceDesktop,
  IconReceipt,
  IconUsers,
  IconStar,
  IconGift,
  IconChartBar,
  IconShieldLock,
  IconPalette,
  IconLogout,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLayoutDashboard,
} from "@tabler/icons-react";
import { Avatar } from "@/components/ui/Avatar";
import { signOut } from "@/lib/auth/auth-client";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string;
  disabled?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface CafeSidebarProps {
  cafeSlug: string;
  cafeName: string;
  user: {
    name: string;
    email: string;
    role?: string;
  };
  membershipRole: string;
  isSuperAdmin?: boolean;
  cafeLogoKey?: string | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const CafeSidebar: React.FC<CafeSidebarProps> = ({
  cafeSlug,
  cafeName,
  user,
  membershipRole,
  isSuperAdmin = false,
  cafeLogoKey,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  // Navigation sections strictly aligned with requested specification
  const navSections: NavSection[] = [
    {
      items: [
        {
          name: "Overview",
          href: `/cafe/${cafeSlug}`,
          icon: IconLayoutDashboard,
          exact: true,
        },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        {
          name: "Floor & Tables",
          href: `/cafe/${cafeSlug}/tables`,
          icon: IconArmchair,
          exact: true,
        },
        {
          name: "Menu Catalog",
          href: `/cafe/${cafeSlug}/menu`,
          icon: IconToolsKitchen2,
          exact: true,
        },
        {
          name: "Table QR Codes",
          href: `/cafe/${cafeSlug}/qr`,
          icon: IconQrcode,
          exact: true,
        },
        {
          name: "Live Orders",
          href: `/cafe/${cafeSlug}/orders`,
          icon: IconBellRinging,
          exact: true,
        },
        {
          name: "POS Terminal",
          href: `/cafe/${cafeSlug}/pos`,
          icon: IconDeviceDesktop,
          exact: true,
        },
      ],
    },
    {
      title: "SALES & CUSTOMERS",
      items: [
        {
          name: "Billing",
          href: `/cafe/${cafeSlug}/billing`,
          icon: IconReceipt,
          exact: true,
        },
        {
          name: "Customers",
          href: `/cafe/${cafeSlug}/customers`,
          icon: IconUsers,
          badge: "Soon",
          disabled: true,
        },
      ],
    },
    {
      title: "GROWTH",
      items: [
        {
          name: "Reviews & Ratings",
          href: `/cafe/${cafeSlug}/reviews`,
          icon: IconStar,
          badge: "Soon",
          disabled: true,
        },
        {
          name: "Offers & Loyalty",
          href: `/cafe/${cafeSlug}/loyalty`,
          icon: IconGift,
          exact: true,
        },
        {
          name: "Analytics",
          href: `/cafe/${cafeSlug}/analytics`,
          icon: IconChartBar,
          exact: true,
        },
      ],
    },
    {
      title: "MANAGE",
      items: [
        {
          name: "Staff",
          href: `/cafe/${cafeSlug}/staff`,
          icon: IconShieldLock,
          badge: "Soon",
          disabled: true,
        },
        {
          name: "Settings",
          href: `/cafe/${cafeSlug}/settings`,
          icon: IconPalette,
          exact: true,
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
      className={`h-screen flex-shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col justify-between select-none sticky top-0 overflow-hidden z-30 transition-[width] duration-200 ease-in-out ${
        isCollapsed ? "w-[72px]" : "w-60"
      }`}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Brand Header */}
        <div className="p-2.5 border-b border-[var(--color-border)] flex-shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-1.5 min-w-0">
              {/* Café Logo, Name & Role */}
              <Link
                href={`/cafe/${cafeSlug}`}
                className="flex items-center gap-2 min-w-0 flex-1 p-1 rounded-md hover:bg-[var(--color-background)] transition-colors"
                title={cafeName}
              >
                <div className="w-8 h-8 rounded-md overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] flex-shrink-0 flex items-center justify-center p-0.5 shadow-xs">
                  {cafeLogoKey ? (
                    <img
                      src={cafeLogoKey}
                      alt={cafeName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-[11px] font-medium text-[var(--color-primary)]">
                      {cafeName.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="font-medium text-xs tracking-tight text-[var(--color-foreground)] truncate leading-tight"
                    title={cafeName}
                  >
                    {cafeName}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-md text-[9px] font-medium uppercase tracking-wide bg-[var(--color-primary-light)] text-[var(--color-primary)] whitespace-nowrap">
                      {isSuperAdmin ? "Super Admin" : membershipRole}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Collapse Button */}
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  title="Collapse Sidebar"
                  className="w-7 h-7 rounded-md hover:bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <IconLayoutSidebarLeftCollapse className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-0.5">
              {/* Expand Button */}
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  title="Expand Sidebar"
                  className="w-7 h-7 rounded-md hover:bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] flex items-center justify-center transition-colors"
                >
                  <IconLayoutSidebarLeftExpand className="w-4 h-4" />
                </button>
              )}

              {/* Collapsed Café Logo */}
              <Link
                href={`/cafe/${cafeSlug}`}
                className="w-8 h-8 rounded-md overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center p-0.5 shadow-xs hover:bg-[var(--color-background)] transition-colors"
                title={`${cafeName} (${isSuperAdmin ? "Super Admin" : membershipRole})`}
              >
                {cafeLogoKey ? (
                  <img
                    src={cafeLogoKey}
                    alt={cafeName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-[11px] font-medium text-[var(--color-primary)]">
                    {cafeName.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </Link>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 p-2 space-y-3 overflow-y-auto min-h-0 no-scrollbar">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-0.5">
              {!isCollapsed ? (
                section.title && (
                  <div className="px-2.5 pt-1.5 pb-0.5 text-[9.5px] font-medium uppercase tracking-wider text-[var(--color-muted)]">
                    {section.title}
                  </div>
                )
              ) : (
                <div className="border-t border-[var(--color-border-subtle)] my-1.5" />
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href || pathname === `${item.href}/`
                    : pathname.startsWith(item.href);

                  if (item.disabled) {
                    return (
                      <div
                        key={item.name}
                        title={`${item.name} (Coming Soon)`}
                        className={`flex items-center ${
                          isCollapsed ? "justify-center py-2 px-0" : "justify-between px-2.5 py-1.5"
                        } rounded-md text-xs font-normal text-[var(--color-muted)]/50 cursor-not-allowed select-none`}
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="w-4 h-4 opacity-50 flex-shrink-0" />
                          {!isCollapsed && <span className="truncate">{item.name}</span>}
                        </div>
                        {!isCollapsed && item.badge && (
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-md bg-[var(--color-border)] text-[var(--color-muted)] font-medium">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={`flex items-center ${
                        isCollapsed ? "justify-center py-2 px-0" : "justify-between px-2.5 py-1.5"
                      } rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium border border-[var(--color-primary)]/20 shadow-xs"
                          : "text-[var(--color-foreground)] hover:bg-[var(--color-background)] hover:text-[var(--color-primary)]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <item.icon
                          className={`w-4 h-4 flex-shrink-0 ${
                            isActive ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"
                          }`}
                        />
                        {!isCollapsed && <span className="truncate">{item.name}</span>}
                      </div>
                      {!isCollapsed && item.badge && (
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User Info & Footer */}
      <div className="p-2.5 border-t border-[var(--color-border)] flex-shrink-0">
        {!isCollapsed ? (
          <div className="p-1.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar name={user.name || "User"} size="sm" />
              <div className="min-w-0">
                <div className="text-xs font-medium text-[var(--color-foreground)] truncate leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-[var(--color-muted)] truncate">
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1 rounded-md text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface)] transition-colors flex-shrink-0"
            >
              <IconLogout className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div title={`${user.name} (${user.email})`}>
              <Avatar name={user.name || "User"} size="sm" />
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 rounded-md text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-background)] transition-colors"
            >
              <IconLogout className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
