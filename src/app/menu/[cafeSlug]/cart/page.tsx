import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { cafeSettings } from "@/lib/db/schema/cafe-settings";
import { tables } from "@/lib/db/schema/tables";
import { offers } from "@/lib/db/schema/offers";
import { menuItems } from "@/lib/db/schema/menu-items";
import { categories } from "@/lib/db/schema/categories";
import { eq, and, asc } from "drizzle-orm";
import { getCafeThemeStyles } from "@/lib/theme/theme-tokens";
import { CustomerCartPageView } from "@/features/cafe/public-menu/components/CustomerCartPageView";
import { ToastProvider } from "@/components/ui/Toast";

export const dynamic = "force-dynamic";

interface CartPageProps {
  params: Promise<{ cafeSlug: string }>;
  searchParams: Promise<{
    table?: string;
    qr?: string;
    theme?: string;
  }>;
}

async function safeDbQuery<T>(queryFn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await queryFn();
  } catch (err: any) {
    console.warn("DB query transient error in cart page, retrying once...", err?.message || err);
    try {
      return await queryFn();
    } catch (retryErr) {
      console.error("DB query failed after retry in cart page:", retryErr);
      return fallback;
    }
  }
}

export async function generateMetadata({ params }: CartPageProps) {
  const { cafeSlug } = await params;
  const cafe = await safeDbQuery(async () => {
    const [c] = await db
      .select()
      .from(cafes)
      .where(eq(cafes.slug, cafeSlug))
      .limit(1);
    return c || null;
  }, null);

  return {
    title: cafe ? `Your Cart • ${cafe.name}` : "Your Cart • Digital Menu",
    description: `Review your order, apply promos, and place your table order directly at ${cafe?.name || "the café"}.`,
  };
}

export default async function CustomerCartPage({
  params,
  searchParams,
}: CartPageProps) {
  const { cafeSlug } = await params;
  const { table: tableParam, qr: qrParam, theme: themeQueryParam } = await searchParams;

  // Resolve cafe
  const cafe = await safeDbQuery(async () => {
    const [c] = await db
      .select()
      .from(cafes)
      .where(eq(cafes.slug, cafeSlug))
      .limit(1);
    return c || null;
  }, null);

  if (!cafe) {
    notFound();
  }

  // Resolve cafe settings & theme
  const settings = await safeDbQuery(async () => {
    const [s] = await db
      .select()
      .from(cafeSettings)
      .where(eq(cafeSettings.cafeId, cafe.id))
      .limit(1);
    return s || null;
  }, null);

  const menuThemeId =
    themeQueryParam ||
    settings?.digitalMenuTheme ||
    settings?.themePreset ||
    "roast";
  const themeStyles = {
    ...getCafeThemeStyles(
      menuThemeId,
      settings?.fontFamily || "Plus Jakarta Sans"
    ),
    colorScheme: "light",
  };

  // Resolve active cafe offers
  const offersList = await safeDbQuery(async () => {
    return await db
      .select()
      .from(offers)
      .where(and(eq(offers.cafeId, cafe.id), eq(offers.isActive, true)))
      .orderBy(asc(offers.createdAt));
  }, []);

  // Resolve quick add-on items (low-cost sides, cookies, dips, beverages)
  const quickAddItems = await safeDbQuery(async () => {
    return await db
      .select()
      .from(menuItems)
      .where(and(eq(menuItems.cafeId, cafe.id), eq(menuItems.isAvailable, true)))
      .orderBy(asc(menuItems.price))
      .limit(8);
  }, []);

  // Resolve all cafe configured tables for table dropdown
  const allCafeTables = await safeDbQuery(async () => {
    return await db
      .select()
      .from(tables)
      .where(and(eq(tables.cafeId, cafe.id), eq(tables.isActive, true)))
      .orderBy(asc(tables.tableNumber));
  }, []);

  // Resolve all active categories for offer scope matching
  const allCategories = await safeDbQuery(async () => {
    return await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(and(eq(categories.cafeId, cafe.id), eq(categories.isActive, true)));
  }, []);

  // Resolve all active menu items for offer scope matching
  const allMenuItems = await safeDbQuery(async () => {
    return await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        categoryId: menuItems.categoryId,
      })
      .from(menuItems)
      .where(and(eq(menuItems.cafeId, cafe.id), eq(menuItems.isAvailable, true)));
  }, []);

  // Resolve dining table if table or qr param passed
  let resolvedTable = null;
  let isFromQrScan = false;
  if (qrParam) {
    resolvedTable = await safeDbQuery(async () => {
      const [t] = await db
        .select()
        .from(tables)
        .where(and(eq(tables.cafeId, cafe.id), eq(tables.qrIdentifier, qrParam)))
        .limit(1);
      return t || null;
    }, null);
    if (resolvedTable) {
      isFromQrScan = true;
    }
  }

  // Match table from QR scan or table query parameter
  if (!resolvedTable && tableParam) {
    const cleanParam = tableParam.trim().toLowerCase();
    const matched = allCafeTables.find(
      (t) =>
        t.tableNumber.toLowerCase() === cleanParam ||
        t.tableNumber.toLowerCase().replace(/^table\s*/i, "") === cleanParam
    );
    if (matched) {
      resolvedTable = matched;
      isFromQrScan = true;
    }
  }

  return (
    <div
      data-theme="cafe"
      data-menu-theme={menuThemeId}
      style={themeStyles as React.CSSProperties}
      className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] antialiased selection:bg-[var(--color-primary-light)] light"
    >
      <ToastProvider variant="compact_pill">
        <CustomerCartPageView
          cafe={cafe}
          table={resolvedTable}
          tableParamName={resolvedTable ? resolvedTable.tableNumber : tableParam || null}
          isQrScanned={isFromQrScan || Boolean(qrParam) || Boolean(tableParam)}
          settings={settings}
          initialOffers={offersList}
          quickAddItems={quickAddItems}
          tablesList={allCafeTables}
          categoriesList={allCategories}
          menuItemsList={allMenuItems}
          digitalMenuTheme={menuThemeId}
        />
      </ToastProvider>
    </div>
  );
}
