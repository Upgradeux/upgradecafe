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

import {
  getCachedCafeBySlug,
  getPublicMenuCatalog,
} from "@/features/cafe/public-menu/services/public-menu-cache.service";
import { cookies, headers } from "next/headers";
import {
  GuestSessionService,
  getSessionCookieName,
} from "@/features/cafe/orders/services/guest-session.service";
import { auth } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";

interface PublicMenuPageProps {
  params: Promise<{ cafeSlug: string }>;
  searchParams: Promise<{ table?: string; qr?: string; layout?: string }>;
}

export async function generateMetadata({ params }: PublicMenuPageProps) {
  const { cafeSlug } = await params;
  const cafe = await getCachedCafeBySlug(cafeSlug);

  return {
    title: cafe ? `${cafe.name} • Digital Menu` : "Digital Café Menu",
    description: `Browse menu, customize drinks & bakery, and order directly from your table at ${cafe?.name || "the café"}.`,
    manifest: `/api/cafe/${cafeSlug}/manifest`,
  };
}

export default async function PublicMenuPage({
  params,
  searchParams,
}: PublicMenuPageProps) {
  const { cafeSlug } = await params;
  const { table: tableParam, qr: qrParam, layout: layoutParam } = await searchParams;

  // Resolve cached public menu catalog (deduplicated & cached per cafe tenant)
  const catalog = await getPublicMenuCatalog(cafeSlug);
  if (!catalog) {
    notFound();
  }

  const {
    cafe,
    settings,
    categoriesList,
    menuItemsList,
    offersList,
    salesStats30d,
  } = catalog;

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

  // Check active dining session from secure HTTP-only cookie if no table in URL (e.g. installed PWA launch)
  if (!resolvedTable) {
    try {
      const cookieStore = await cookies();
      const cookieName = getSessionCookieName(cafeSlug);
      const rawToken = cookieStore.get(cookieName)?.value;

      let customerId: string | null = null;
      try {
        const authSession = await auth.api.getSession({ headers: await headers() });
        if (authSession?.user?.id) {
          customerId = authSession.user.id;
        }
      } catch {}

      if (rawToken || customerId) {
        const activeDining = await GuestSessionService.getActiveDiningSession({
          cafeId: cafe.id,
          rawToken,
          customerId,
        });
        if (activeDining?.table) {
          resolvedTable = activeDining.table;
        }
      }
    } catch (sessionErr) {
      console.warn("Failed to resolve active dining session on menu SSR:", sessionErr);
    }
  }

  const menuThemeId = settings?.digitalMenuTheme || settings?.themePreset || "roast";
  const themeStyles = {
    ...getCafeThemeStyles(
      menuThemeId,
      settings?.fontFamily || "Plus Jakarta Sans"
    ),
    colorScheme: "light",
  };

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
          tableParamName={resolvedTable ? resolvedTable.tableNumber : tableParam || null}
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
