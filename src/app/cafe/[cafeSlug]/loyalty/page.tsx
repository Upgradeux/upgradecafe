import React from "react";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { OffersService } from "@/features/cafe/offers/services/offers.service";
import { CafeOffersManager } from "@/features/cafe/offers/components/CafeOffersManager";
import { Metadata } from "next";

import { db } from "@/lib/db";
import { menuItems } from "@/lib/db/schema/menu-items";
import { categories } from "@/lib/db/schema/categories";
import { eq, and, asc } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Offers & Loyalty | CAFEFLOW",
  description: "Manage promotional coupons, cart unlock rules, and customer loyalty rewards.",
};

interface CafeLoyaltyPageProps {
  params: Promise<{ cafeSlug: string }>;
}

export default async function CafeLoyaltyPage({ params }: CafeLoyaltyPageProps) {
  const { cafeSlug } = await params;
  const { cafe, settings } = await resolveCafeTenant(cafeSlug, [
    "OWNER",
    "MANAGER",
    "STAFF",
  ]);

  const offersList = await OffersService.listAllOffers(cafe.id);

  // Query menu items for Free Item offer reward picker & item targeting
  const cafeMenuItems = await db
    .select({
      id: menuItems.id,
      name: menuItems.name,
      price: menuItems.price,
      imageUrl: menuItems.imageKey,
    })
    .from(menuItems)
    .where(and(eq(menuItems.cafeId, cafe.id), eq(menuItems.isAvailable, true)))
    .orderBy(asc(menuItems.name));

  // Query categories for category-based discount targeting
  const cafeCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
    })
    .from(categories)
    .where(and(eq(categories.cafeId, cafe.id), eq(categories.isActive, true)))
    .orderBy(asc(categories.name));

  return (
    <CafeOffersManager
      cafe={{
        id: cafe.id,
        slug: cafe.slug,
        name: cafe.name,
      }}
      initialOffers={offersList}
      initialSettings={settings || null}
      menuItems={cafeMenuItems}
      categories={cafeCategories}
    />
  );
}
