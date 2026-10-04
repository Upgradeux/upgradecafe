import React from "react";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { MenuService } from "@/features/cafe/menu/services/menu.service";
import { TablesService } from "@/features/cafe/tables/services/tables.service";
import { CafeStats } from "@/features/cafe/owner/dashboard/components/CafeStats";
import { LiveFloorSummary } from "@/features/cafe/owner/dashboard/components/LiveFloorSummary";
import { QuickActionPanel } from "@/features/cafe/owner/dashboard/components/QuickActionPanel";
import { CafeOverviewChart } from "@/features/cafe/analytics/components/CafeOverviewChart";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema/orders";
import {
  IconArrowRight,
  IconToolsKitchen2,
  IconLeaf,
  IconCategory,
  IconChevronRight,
} from "@tabler/icons-react";

interface CafeDashboardPageProps {
  params: Promise<{ cafeSlug: string }>;
}

export default async function CafeDashboardPage({ params }: CafeDashboardPageProps) {
  const { cafeSlug } = await params;
  const { cafe } = await resolveCafeTenant(cafeSlug);

  // Load tenant data
  const timezone = cafe.timezone || "Asia/Kolkata";
  const localToday = sql`date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE ${timezone})`;
  const dayStart = sql`(${localToday} AT TIME ZONE ${timezone})`;
  const dayEnd = sql`((${localToday} + interval '1 day') AT TIME ZONE ${timezone})`;
  const createdInstant = sql`${orders.createdAt} AT TIME ZONE 'UTC'`;
  const localHour = sql<number>`extract(hour from (${createdInstant} AT TIME ZONE ${timezone}))::int`;

  const [categories, menuItems, tablesList, hourlyRows] = await Promise.all([
    MenuService.listCategories(cafe.id),
    MenuService.listMenuItems(cafe.id),
    TablesService.listTables(cafe.id),
    db
      .select({
        hour: localHour,
        revenue: sql<number>`coalesce(sum(case when ${orders.paymentStatus} = 'PAID' and ${orders.status} <> 'CANCELLED' then ${orders.total} else 0 end), 0)::int`,
        orders: sql<number>`count(*) filter (where ${orders.status} <> 'CANCELLED')::int`,
        paidOrders: sql<number>`count(*) filter (where ${orders.paymentStatus} = 'PAID' and ${orders.status} <> 'CANCELLED')::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.cafeId, cafe.id),
          sql`${createdInstant} >= ${dayStart} and ${createdInstant} < ${dayEnd}`
        )
      )
      .groupBy(sql.raw("1"))
      .orderBy(sql.raw("1")),
  ]);

  const occupiedCount = tablesList.filter((t) => t.status === "OCCUPIED").length;
  const reservedCount = tablesList.filter((t) => t.status === "RESERVED").length;
  const availableCount = tablesList.filter((t) => t.status === "AVAILABLE").length;
  const metricByHour = new Map(
    hourlyRows.map((row) => [
      Number(row.hour),
      {
        revenue: Number(row.revenue),
        orders: Number(row.orders),
        paidOrders: Number(row.paidOrders),
      },
    ])
  );
  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${String(hour).padStart(2, "0")}:00`,
    ...(metricByHour.get(hour) || { revenue: 0, orders: 0, paidOrders: 0 }),
  }));
  const todayRevenue = hourlyData.reduce((sum, point) => sum + point.revenue, 0);
  const todayOrders = hourlyData.reduce((sum, point) => sum + point.orders, 0);

  return (
    <div className="space-y-4">
      {/* Top Banner & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-[var(--color-foreground)]">
            Café Operations Hub
          </h1>
          <p className="text-xs text-[var(--color-muted)] mt-0.5 font-normal">
            Real-time floor control, menu catalog management, and QR table ordering.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/cafe/${cafeSlug}/menu`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs"
          >
            <IconToolsKitchen2 className="w-3.5 h-3.5" />
            <span>Manage Menu</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Stats (No subscription status - purely operational) */}
      <CafeStats
        cafeSlug={cafeSlug}
        totalMenuItems={menuItems.length}
        totalCategories={categories.length}
        totalTables={tablesList.length}
        occupiedTables={occupiedCount}
        todayEstimatedSales={todayRevenue}
        todayOrderCount={todayOrders}
      />

      {/* Live Recharts rush & sales activity */}
      <CafeOverviewChart hourlyData={hourlyData} currency={cafe.currency || "INR"} />

      {/* Horizontal Full-Width Live Floor Summary */}
      <LiveFloorSummary
        cafeSlug={cafeSlug}
        totalTables={tablesList.length}
        availableCount={availableCount}
        occupiedCount={occupiedCount}
        reservedCount={reservedCount}
        tables={tablesList}
      />

      {/* Horizontal Full-Width Quick Operations */}
      <QuickActionPanel cafeSlug={cafeSlug} />

      {/* Menu Categories Overview */}
      <Card className="p-4 rounded-lg border border-[var(--color-border)] shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <IconCategory className="w-4 h-4 text-[var(--color-primary)]" />
            <div>
              <h2 className="text-sm font-medium tracking-tight text-[var(--color-foreground)]">
                Menu Categories
              </h2>
              <p className="text-[11px] text-[var(--color-muted)] font-normal">
                Organized by menu catalog sections ({categories.length} categories · {menuItems.length} items total)
              </p>
            </div>
          </div>
          <Link
            href={`/cafe/${cafeSlug}/menu`}
            className="text-xs font-medium text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
          >
            <span>Manage Menu Catalog</span>
            <IconArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {categories.length === 0 ? (
          <div className="p-8 text-center rounded-lg bg-[var(--color-background)] border border-dashed border-[var(--color-border)]">
            <div className="text-xs text-[var(--color-muted)] mb-3">
              No menu categories created yet. Start by organizing your menu into categories.
            </div>
            <Link
              href={`/cafe/${cafeSlug}/menu`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs"
            >
              <IconToolsKitchen2 className="w-3.5 h-3.5" />
              <span>Add First Category</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((cat) => {
              const catItems = menuItems.filter((item) => item.categoryId === cat.id);
              const availableCount = catItems.filter((item) => item.isAvailable).length;
              const prices = catItems.map((item) => item.price).filter((p): p is number => typeof p === "number");
              const minPrice = prices.length > 0 ? Math.min(...prices) : null;
              const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

              const vegCount = catItems.filter(
                (i) => i.foodType === "VEG" || (i.foodType == null && i.isVegetarian !== false)
              ).length;
              const nonVegCount = catItems.filter(
                (i) => i.foodType === "NON_VEG" || (i.foodType == null && i.isVegetarian === false)
              ).length;
              const eggCount = catItems.filter((i) => i.foodType === "EGG").length;
              const veganCount = catItems.filter((i) => i.foodType === "VEGAN").length;

              return (
                <Link
                  key={cat.id}
                  href={`/cafe/${cafeSlug}/menu?category=${cat.id}`}
                  className="group p-3.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col justify-between hover:border-[var(--color-primary)]/70 hover:shadow-xs transition-all duration-200"
                >
                  <div className="space-y-2">
                    {/* Header: Name + Items Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="text-xs font-medium text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                          {cat.name}
                        </h3>
                        {cat.description && (
                          <p className="text-[11px] text-[var(--color-muted)] line-clamp-2 leading-relaxed font-normal">
                            {cat.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="neutral" size="sm" className="flex-shrink-0 font-medium text-[10px]">
                        {catItems.length} {catItems.length === 1 ? "item" : "items"}
                      </Badge>
                    </div>

                    {/* Item Previews (First 3 item names) */}
                    {catItems.length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {catItems.slice(0, 3).map((item) => (
                          <span
                            key={item.id}
                            className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border-subtle)] text-[var(--color-muted)] group-hover:text-[var(--color-foreground)] transition-colors truncate max-w-[130px] font-normal"
                          >
                            {item.name}
                          </span>
                        ))}
                        {catItems.length > 3 && (
                          <span className="text-[10px] font-medium text-[var(--color-muted)]">
                            +{catItems.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] italic text-[var(--color-muted)] pt-1 font-normal">
                        No items added yet
                      </p>
                    )}
                  </div>

                  {/* Footer: Price Range & Dietary Summary */}
                  <div className="mt-3.5 pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs">
                    <div className="text-[11px] font-medium text-[var(--color-foreground)]">
                      {prices.length > 0 ? (
                        minPrice === maxPrice ? (
                          <span>₹{minPrice}</span>
                        ) : (
                          <span>₹{minPrice} – ₹{maxPrice}</span>
                        )
                      ) : (
                        <span className="text-[var(--color-muted)] font-normal italic">Empty</span>
                      )}
                    </div>

                    {/* Dietary indicators */}
                    <div className="flex items-center gap-1.5">
                      {vegCount > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-emerald-700 font-medium" title={`${vegCount} Vegetarian`}>
                          <span className="w-2.5 h-2.5 rounded border border-emerald-600 flex items-center justify-center bg-white">
                            <span className="w-1 h-1 rounded-full bg-emerald-600" />
                          </span>
                          <span>{vegCount}</span>
                        </span>
                      )}
                      {nonVegCount > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-red-700 font-medium" title={`${nonVegCount} Non-Veg`}>
                          <span className="w-2.5 h-2.5 rounded border border-red-700 flex items-center justify-center bg-white">
                            <span className="w-0 h-0 border-l-[2px] border-l-transparent border-r-[2px] border-r-transparent border-b-[3.5px] border-b-red-700" />
                          </span>
                          <span>{nonVegCount}</span>
                        </span>
                      )}
                      {eggCount > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-amber-700 font-medium" title={`${eggCount} Egg`}>
                          <span className="w-2.5 h-2.5 rounded border border-amber-600 flex items-center justify-center bg-white">
                            <span className="w-1 h-1 rounded-full bg-amber-600" />
                          </span>
                          <span>{eggCount}</span>
                        </span>
                      )}
                      {veganCount > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-teal-700 font-medium" title={`${veganCount} Vegan`}>
                          <IconLeaf className="w-2.5 h-2.5 text-teal-600" />
                          <span>{veganCount}</span>
                        </span>
                      )}
                      <IconChevronRight className="w-3.5 h-3.5 text-[var(--color-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all ml-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
