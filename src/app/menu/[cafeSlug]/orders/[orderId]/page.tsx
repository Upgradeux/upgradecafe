import React from "react";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { cafeSettings } from "@/lib/db/schema/cafe-settings";
import { tables } from "@/lib/db/schema/tables";
import { eq, and } from "drizzle-orm";
import { OrdersService } from "@/features/cafe/orders/services/orders.service";
import { getCafeThemeStyles } from "@/lib/theme/theme-tokens";
import { CustomerOrderDetailsPageView } from "@/features/cafe/public-menu/components/CustomerOrderDetailsPageView";
import { ToastProvider } from "@/components/ui/Toast";

export const dynamic = "force-dynamic";

interface OrderDetailsPageProps {
  params: Promise<{ cafeSlug: string; orderId: string }>;
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
    console.warn("DB query transient error in order details page, retrying once...", err?.message || err);
    try {
      return await queryFn();
    } catch (retryErr) {
      console.error("DB query failed after retry in order details page:", retryErr);
      return fallback;
    }
  }
}

export async function generateMetadata({ params }: OrderDetailsPageProps) {
  const { cafeSlug, orderId } = await params;
  const cafe = await safeDbQuery(async () => {
    const [c] = await db
      .select()
      .from(cafes)
      .where(eq(cafes.slug, cafeSlug))
      .limit(1);
    return c || null;
  }, null);

  let orderNumber = orderId.substring(0, 6);
  if (cafe) {
    const order = await safeDbQuery(async () => {
      return await OrdersService.getOrderById(orderId, cafe.id);
    }, null);
    if (order?.orderNumber) {
      orderNumber = String(order.orderNumber).replace(/^#+/, "");
    }
  }

  const cleanNum = String(orderNumber).replace(/^#+/, "");

  return {
    title: cafe ? `Order #${cleanNum} • ${cafe.name}` : "Order Details",
    description: `Track and view full item details for order #${cleanNum}.`,
  };
}

export default async function CustomerOrderDetailsPage({
  params,
  searchParams,
}: OrderDetailsPageProps) {
  const { cafeSlug, orderId } = await params;
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

  // Resolve order with items
  const order = await safeDbQuery(async () => {
    return await OrdersService.getOrderById(orderId, cafe.id);
  }, null);

  if (!order) {
    redirect(`/menu/${cafeSlug}/orders${tableParam ? `?table=${encodeURIComponent(tableParam)}` : ""}`);
  }

  // Resolve dining table
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
    resolvedTable = await safeDbQuery(async () => {
      const [t] = await db
        .select()
        .from(tables)
        .where(and(eq(tables.cafeId, cafe.id), eq(tables.tableNumber, tableParam)))
        .limit(1);
      return t || null;
    }, null);
  }

  return (
    <div
      data-theme="cafe"
      data-menu-theme={menuThemeId}
      style={themeStyles as React.CSSProperties}
      className="min-h-screen bg-[var(--cafe-background)] text-[var(--color-foreground)] antialiased selection:bg-[var(--color-primary-light)] light"
    >
      <ToastProvider variant="compact_pill">
        <CustomerOrderDetailsPageView
          order={order}
          cafe={cafe}
          table={resolvedTable}
          tableParamName={tableParam || null}
          settings={settings}
          digitalMenuTheme={menuThemeId}
        />
      </ToastProvider>
    </div>
  );
}
