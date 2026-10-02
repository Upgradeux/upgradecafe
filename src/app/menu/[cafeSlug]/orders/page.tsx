import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { cafeSettings } from "@/lib/db/schema/cafe-settings";
import { tables } from "@/lib/db/schema/tables";
import { eq, and, asc } from "drizzle-orm";
import { getCafeThemeStyles } from "@/lib/theme/theme-tokens";
import { CustomerOrdersPageView } from "@/features/cafe/public-menu/components/CustomerOrdersPageView";
import { ToastProvider } from "@/components/ui/Toast";

import { cookies } from "next/headers";
import {
  GuestSessionService,
  getSessionCookieName,
  hashSessionToken,
} from "@/features/cafe/orders/services/guest-session.service";
import { guestSessions } from "@/lib/db/schema/guest-sessions";
import { OrderWithItems } from "@/features/cafe/orders/types";
import { gt } from "drizzle-orm";

interface OrdersPageProps {
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
    console.warn("DB query transient error in orders page, retrying once...", err?.message || err);
    try {
      return await queryFn();
    } catch (retryErr) {
      console.error("DB query failed after retry in orders page:", retryErr);
      return fallback;
    }
  }
}

export async function generateMetadata({ params }: OrdersPageProps) {
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
    title: cafe ? `Your Orders • ${cafe.name}` : "Your Orders • Live Tracking",
    description: `View and live-track your active table orders at ${cafe?.name || "the café"}.`,
  };
}

export default async function CustomerOrdersPage({
  params,
  searchParams,
}: OrdersPageProps) {
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

  // Resolve active orders from device guest session cookie for immediate SSR rendering
  let initialActiveOrders: OrderWithItems[] = [];
  try {
    const cookieStore = await cookies();
    const cookieName = getSessionCookieName(cafeSlug);
    const rawToken = cookieStore.get(cookieName)?.value;

    if (rawToken && rawToken.trim()) {
      const tokenHash = hashSessionToken(rawToken.trim());
      const sessionList = await safeDbQuery(async () => {
        return db
          .select()
          .from(guestSessions)
          .where(
            and(
              eq(guestSessions.cafeId, cafe.id),
              eq(guestSessions.sessionTokenHash, tokenHash),
              eq(guestSessions.status, "ACTIVE"),
              gt(guestSessions.expiresAt, new Date())
            )
          )
          .limit(1);
      }, []);

      if (sessionList && sessionList.length > 0) {
        initialActiveOrders = await safeDbQuery(async () => {
          return GuestSessionService.getActiveOrdersForSession(sessionList[0].id, cafe.id);
        }, []);
      }
    }
  } catch {
    // Non-critical SSR fallback
  }

  return (
    <div
      data-theme="cafe"
      data-menu-theme={menuThemeId}
      style={themeStyles as React.CSSProperties}
      className="min-h-screen bg-[var(--cafe-background)] text-[var(--color-foreground)] antialiased selection:bg-[var(--color-primary-light)] light"
    >
      <ToastProvider variant="compact_pill">
        <CustomerOrdersPageView
          cafe={cafe}
          table={resolvedTable}
          tableParamName={tableParam || null}
          settings={settings}
          digitalMenuTheme={menuThemeId}
          initialActiveOrders={initialActiveOrders}
        />
      </ToastProvider>
    </div>
  );
}
