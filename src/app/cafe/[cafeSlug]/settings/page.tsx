import React from "react";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { CafeSettingsManager } from "@/features/cafe/settings/components/CafeSettingsManager";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema/subscriptions";
import { plans } from "@/lib/db/schema/plans";
import { menuItems } from "@/lib/db/schema/menu-items";
import { eq, asc } from "drizzle-orm";

interface CafeSettingsPageProps {
  params: Promise<{ cafeSlug: string }>;
}

export default async function CafeSettingsPage({ params }: CafeSettingsPageProps) {
  const { cafeSlug } = await params;
  const { cafe, settings, accessState } = await resolveCafeTenant(cafeSlug);

  // Fetch subscription & plan info with correct schema fields
  const [subData] = await db
    .select({
      id: subscriptions.id,
      status: subscriptions.status,
      currentPeriodStart: subscriptions.startsAt,
      currentPeriodEnd: subscriptions.expiresAt,
      planName: plans.name,
      planPrice: plans.monthlyPrice,
      planInterval: subscriptions.billingCycle,
    })
    .from(subscriptions)
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(subscriptions.cafeId, cafe.id))
    .limit(1);

  // Fetch cafe menu items for merchandising and featured item picker
  const cafeMenuItems = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.cafeId, cafe.id))
    .orderBy(asc(menuItems.name));

  return (
    <CafeSettingsManager
      cafeSlug={cafeSlug}
      cafeName={cafe.name}
      initialPreset={settings?.themePreset || "roast"}
      initialSettings={settings}
      accessState={accessState}
      subscription={subData || null}
      cafeLogoKey={cafe.logoKey}
      menuItems={cafeMenuItems}
    />
  );
}
