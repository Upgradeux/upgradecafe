import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { cafeSettings } from "@/lib/db/schema/cafe-settings";
import { menuItems } from "@/lib/db/schema/menu-items";
import { tables } from "@/lib/db/schema/tables";
import { offers } from "@/lib/db/schema/offers";
import { eq, and, asc } from "drizzle-orm";
import { getCafeThemeStyles } from "@/lib/theme/theme-tokens";
import { CustomerProfilePageView } from "@/features/cafe/public-menu/components/CustomerProfilePageView";
import { ToastProvider } from "@/components/ui/Toast";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
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
    console.warn("DB query transient error in profile page, retrying once...", err?.message || err);
    try {
      return await queryFn();
    } catch (retryErr) {
      console.error("DB query failed after retry in profile page:", retryErr);
      return fallback;
    }
  }
}

export async function generateMetadata({ params }: ProfilePageProps) {
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
    title: cafe ? `Customer Profile • ${cafe.name}` : "Customer Profile",
    description: `Access your loyalty rewards, orders, and perks at ${cafe?.name || "the café"}.`,
  };
}

export default async function CustomerProfilePage({
  params,
  searchParams,
}: ProfilePageProps) {
  const { cafeSlug } = await params;
  const { table: tableParam, qr: qrParam, theme: themeQueryParam } = await searchParams;

  // Resolve cafe with safe retry
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

  // Resolve cafe settings & theme with safe retry
  const settings = await safeDbQuery(async () => {
    const [s] = await db
      .select()
      .from(cafeSettings)
      .where(eq(cafeSettings.cafeId, cafe.id))
      .limit(1);
    return s || null;
  }, null);

  const menuThemeId = themeQueryParam || settings?.digitalMenuTheme || settings?.themePreset || "roast";
  const themeStyles = {
    ...getCafeThemeStyles(
      menuThemeId,
      settings?.fontFamily || "Plus Jakarta Sans"
    ),
    colorScheme: "light",
  };

  // Resolve available menu items (to populate favorites in saved items) with safe retry
  const menuItemsList = await safeDbQuery(async () => {
    return await db
      .select()
      .from(menuItems)
      .where(and(eq(menuItems.cafeId, cafe.id), eq(menuItems.isAvailable, true)))
      .orderBy(asc(menuItems.sortOrder), asc(menuItems.name));
  }, []);

  // Resolve dining table if table or qr param passed
  let resolvedTable = null;
  if (qrParam) {
    resolvedTable = await safeDbQuery(async () => {
      const [t] = await db
        .select()
        .from(tables)
        .where(and(eq(tables.cafeId, cafe.id), eq(tables.qrIdentifier, qrParam)))
        .limit(1);
      return t || null;
    }, null);
  }

  if (!resolvedTable && tableParam) {
    const cleanParam = tableParam.trim().toLowerCase();
    const cleanNum = cleanParam.replace(/^table\s*/i, "");
    const cafeTables = await safeDbQuery(async () => {
      return await db
        .select()
        .from(tables)
        .where(and(eq(tables.cafeId, cafe.id), eq(tables.isActive, true)));
    }, []);

    resolvedTable =
      cafeTables.find(
        (t) =>
          t.tableNumber.toLowerCase() === cleanParam ||
          t.tableNumber.toLowerCase().replace(/^table\s*/i, "") === cleanNum
      ) || null;
  }

  // Resolve active cafe offers with safe retry
  const offersList = await safeDbQuery(async () => {
    return await db
      .select()
      .from(offers)
      .where(and(eq(offers.cafeId, cafe.id), eq(offers.isActive, true)))
      .orderBy(asc(offers.createdAt));
  }, []);

  return (
    <div
      data-theme="cafe"
      data-menu-theme={menuThemeId}
      style={themeStyles as React.CSSProperties}
      className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] antialiased selection:bg-[var(--color-primary-light)] light"
    >
      <ToastProvider variant="compact_pill">
        <CustomerProfilePageView
          cafe={cafe}
          table={resolvedTable}
          tableParamName={tableParam || null}
          settings={settings}
          menuItems={menuItemsList}
          digitalMenuTheme={menuThemeId}
          offers={offersList}
        />
      </ToastProvider>
    </div>
  );
}
