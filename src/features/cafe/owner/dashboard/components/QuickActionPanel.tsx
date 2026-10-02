import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import {
  IconToolsKitchen2,
  IconArmchair,
  IconQrcode,
  IconPalette,
  IconChevronRight,
} from "@tabler/icons-react";

interface QuickActionPanelProps {
  cafeSlug: string;
}

export const QuickActionPanel: React.FC<QuickActionPanelProps> = ({ cafeSlug }) => {
  const actions = [
    {
      title: "Add New Menu Item",
      description: "Create items with prices, descriptions, and dietary tags",
      href: `/cafe/${cafeSlug}/menu`,
      icon: IconToolsKitchen2,
      color: "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
    },
    {
      title: "Manage Floor & Tables",
      description: "Setup seating capacity and track real-time occupancy",
      href: `/cafe/${cafeSlug}/tables`,
      icon: IconArmchair,
      color: "bg-[var(--color-success-light)] text-[var(--color-success)]",
    },
    {
      title: "Generate Table QR Codes",
      description: "Download printable QR cards linking directly to digital menus",
      href: `/cafe/${cafeSlug}/qr`,
      icon: IconQrcode,
      color: "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
    },
    {
      title: "Customize Theme & Preset",
      description: "Pick brand palettes like Roast, Bakery, Garden, or Noir",
      href: `/cafe/${cafeSlug}/settings`,
      icon: IconPalette,
      color: "bg-[var(--color-border-subtle)] text-[var(--color-foreground)]",
    },
  ];

  return (
    <Card className="p-4 rounded-lg border border-[var(--color-border)] shadow-xs">
      <h2 className="text-sm font-medium tracking-tight text-[var(--color-foreground)] mb-3">
        Quick Operations
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((act) => (
          <Link
            key={act.title}
            href={act.href}
            className="p-3 rounded-md border border-[var(--color-border)] shadow-xs hover:border-[var(--color-primary)]/70 hover:bg-[var(--color-primary-light)]/20 transition-all flex items-center justify-between gap-3 group bg-[var(--color-surface)]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-2 rounded-md ${act.color} flex-shrink-0`}>
                <act.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                  {act.title}
                </div>
                <div className="text-[11px] text-[var(--color-muted)] truncate font-normal">
                  {act.description}
                </div>
              </div>
            </div>
            <IconChevronRight className="w-3.5 h-3.5 text-[var(--color-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </Link>
        ))}
      </div>
    </Card>
  );
};
