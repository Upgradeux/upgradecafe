import React from "react";
import { Card } from "@/components/ui/Card";
import {
  IconToolsKitchen2,
  IconArmchair,
  IconCategory,
  IconReceipt,
} from "@tabler/icons-react";

import Link from "next/link";

interface CafeStatsProps {
  cafeSlug?: string;
  totalMenuItems: number;
  totalCategories: number;
  totalTables: number;
  occupiedTables: number;
  todayEstimatedSales?: number;
  todayOrderCount?: number;
}

export const CafeStats: React.FC<CafeStatsProps> = ({
  cafeSlug,
  totalMenuItems,
  totalCategories,
  totalTables,
  occupiedTables,
  todayEstimatedSales = 0,
  todayOrderCount = 0,
}) => {
  const availableTables = Math.max(0, totalTables - occupiedTables);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Menu Catalog Size */}
      <Card className="p-3.5 border border-[var(--color-border)] shadow-xs rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Active Menu Items
          </span>
          <div className="p-1.5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)]">
            <IconToolsKitchen2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
            {totalMenuItems}
          </div>
          <div className="text-[11px] text-[var(--color-muted)] mt-0.5 font-normal">
            Across {totalCategories} categories
          </div>
        </div>
      </Card>

      {/* Menu Categories */}
      <Card className="p-3.5 border border-[var(--color-border)] shadow-xs rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Menu Categories
          </span>
          <div className="p-1.5 rounded-md bg-[var(--color-border-subtle)] text-[var(--color-foreground)]">
            <IconCategory className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
            {totalCategories}
          </div>
          <div className="text-[11px] text-[var(--color-muted)] mt-0.5 font-normal">
            Organized sections for QR menu
          </div>
        </div>
      </Card>

      {/* Floor Capacity */}
      <Card className="p-3.5 border border-[var(--color-border)] shadow-xs rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Tables & Seating
          </span>
          <div className="p-1.5 rounded-md bg-[var(--color-success-light)] text-[var(--color-success)]">
            <IconArmchair className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
            {totalTables} <span className="text-xs font-normal text-[var(--color-muted)]">tables</span>
          </div>
          <div className="text-[11px] text-[var(--color-muted)] mt-0.5 flex items-center gap-1.5 font-normal">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
            <span>{availableTables} currently available</span>
          </div>
        </div>
      </Card>

      {/* Today's Sales & Orders */}
      <Link
        href={cafeSlug ? `/cafe/${cafeSlug}/orders` : "#"}
        className="block group"
        title="Open Live Orders Board"
      >
        <Card className="p-3.5 border border-[var(--color-border)] shadow-xs rounded-lg group-hover:border-[var(--color-primary)]/70 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)] group-hover:text-[var(--color-primary)] transition-colors">
              Today's Orders
            </span>
            <div className="p-1.5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <IconReceipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
              ₹{todayEstimatedSales.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-[var(--color-muted)] mt-0.5 font-normal">
              {todayOrderCount} orders completed today →
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
};
