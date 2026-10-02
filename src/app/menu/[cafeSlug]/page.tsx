import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { cafeSettings } from "@/lib/db/schema/cafe-settings";
import { categories } from "@/lib/db/schema/categories";
import { menuItems } from "@/lib/db/schema/menu-items";
import { tables } from "@/lib/db/schema/tables";
import { offers } from "@/lib/db/schema/offers";
import { orders, orderItems } from "@/lib/db/schema/orders";
import { eq, and, asc, gte, ne, sql } from "drizzle-orm";
import { getCafeThemeStyles } from "@/lib/theme/theme-tokens";
import { PublicMenuCustomerView } from "@/features/cafe/public-menu/components/PublicMenuCustomerView";
import { ToastProvider } from "@/components/ui/Toast";

export const dynamic = "force-dynamic";

interface PublicMenuPageProps {
  params: Promise<{ cafeSlug: string }>;
  searchParams: Promise<{ table?: string; qr?: string; layout?: string }>;
}

export async function generateMetadata({ params }: PublicMenuPageProps) {
  const { cafeSlug } = await params;
  const [cafe] = await db
    .select()
    .from(cafes)
    .where(eq(cafes.slug, cafeSlug))
    .limit(1);

  return {
    title: cafe ? `${cafe.name} • Digital Menu` : "Digital Café Menu",
    description: `Browse menu, customize drinks & bakery, and order directly from your table at ${cafe?.name || "the café"}.`,
  };
}

export default async function PublicMenuPage({
  params,
  searchParams,
}: PublicMenuPageProps) {
  const { cafeSlug } = await params;
  const { table: tableParam, qr: qrParam, layout: layoutParam } = await searchParams;

  // Resolve cafe
  const [cafe] = await db
    .select()
    .from(cafes)
    .where(eq(cafes.slug, cafeSlug))
    .limit(1);

  if (!cafe) {
    notFound();
  }

  // Resolve cafe theme
  const [settings] = await db
    .select()
    .from(cafeSettings)
    .where(eq(cafeSettings.cafeId, cafe.id))
    .limit(1);

  const menuThemeId = settings?.digitalMenuTheme || settings?.themePreset || "roast";
  const themeStyles = {
    ...getCafeThemeStyles(
      menuThemeId,
      settings?.fontFamily || "Plus Jakarta Sans"
    ),
    colorScheme: "light",
  };

  // 30-day sales time boundary for popular ranking
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Load active categories, active menu items, active offers, and 30-day sales stats
  const [categoriesList, menuItemsList, offersList, rawSalesStats] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(and(eq(categories.cafeId, cafe.id), eq(categories.isActive, true)))
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
    db
      .select()
      .from(menuItems)
      .where(and(eq(menuItems.cafeId, cafe.id), eq(menuItems.isAvailable, true)))
      .orderBy(asc(menuItems.sortOrder), asc(menuItems.name)),
    db
      .select()
      .from(offers)
      .where(and(eq(offers.cafeId, cafe.id), eq(offers.isActive, true)))
      .orderBy(asc(offers.createdAt)),
    db
      .select({
        menuItemId: orderItems.menuItemId,
        totalSold: sql<number>`cast(coalesce(sum(${orderItems.quantity}), 0) as integer)`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.cafeId, cafe.id),
          gte(orders.createdAt, thirtyDaysAgo),
          ne(orders.status, "CANCELLED")
        )
      )
      .groupBy(orderItems.menuItemId),
  ]);

  const salesStats30d: Record<string, number> = {};
  for (const stat of rawSalesStats) {
    if (stat.menuItemId) {
      salesStats30d[stat.menuItemId] = Number(stat.totalSold) || 0;
    }
  }

  // Resolve dining table if table or qr param passed
  let resolvedTable = null;
  if (qrParam) {
    const [t] = await db
      .select()
      .from(tables)
      .where(and(eq(tables.cafeId, cafe.id), eq(tables.qrIdentifier, qrParam)))
      .limit(1);
    if (t) resolvedTable = t;
  }

  if (!resolvedTable && tableParam) {
    const cleanParam = tableParam.trim().toLowerCase();
    const cleanNum = cleanParam.replace(/^table\s*/i, "");
    const cafeTables = await db
      .select()
      .from(tables)
      .where(and(eq(tables.cafeId, cafe.id), eq(tables.isActive, true)));

    resolvedTable =
      cafeTables.find(
        (t) =>
          t.tableNumber.toLowerCase() === cleanParam ||
          t.tableNumber.toLowerCase().replace(/^table\s*/i, "") === cleanNum
      ) || null;
  }

  return (
    <div
      data-theme="cafe"
      data-menu-theme={menuThemeId}
      style={themeStyles as React.CSSProperties}
      className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] antialiased selection:bg-[var(--color-primary-light)] light"
    >
      <ToastProvider variant="compact_pill">
        <PublicMenuCustomerView
          cafe={cafe}
          categories={categoriesList}
          menuItems={menuItemsList}
          initialOffers={offersList}
          salesStats30d={salesStats30d}
          table={resolvedTable}
          tableParamName={tableParam || null}
          initialLayout={
            layoutParam === "classic_list"
              ? "classic_list"
              : (settings?.layoutPreset as any) || "modern_app"
          }
          settings={settings}
        />
      </ToastProvider>
    </div>
  );
}
