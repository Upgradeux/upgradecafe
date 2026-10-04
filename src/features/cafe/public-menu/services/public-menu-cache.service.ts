import { cache } from "react";
import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { cafeSettings } from "@/lib/db/schema/cafe-settings";
import { categories } from "@/lib/db/schema/categories";
import { menuItems } from "@/lib/db/schema/menu-items";
import { offers } from "@/lib/db/schema/offers";
import { orders, orderItems } from "@/lib/db/schema/orders";
import { eq, and, asc, gte, ne, sql } from "drizzle-orm";

/**
 * Request-scoped deduplicated cafe resolver (React cache).
 * Prevents duplicate queries between generateMetadata and Page components.
 */
export const getCachedCafeBySlug = cache(async (cafeSlug: string) => {
  const [cafe] = await db
    .select()
    .from(cafes)
    .where(eq(cafes.slug, cafeSlug))
    .limit(1);
  return cafe || null;
});

/**
 * Cache key tag generator for cafe-scoped public menu data.
 */
export function getCafePublicMenuTag(cafeSlug: string): string {
  return `cafe-public-menu-${cafeSlug}`;
}

/**
 * On-demand cache invalidator when cafe owner modifies categories, items, offers, or settings.
 */
export function invalidateCafePublicMenu(cafeSlug: string): void {
  try {
    revalidateTag(getCafePublicMenuTag(cafeSlug), "max");
  } catch {
    try {
      (revalidateTag as any)(getCafePublicMenuTag(cafeSlug));
    } catch {}
  }
}

/**
 * Fetches and caches safe public menu data per cafe tenant.
 * Stored in memory with a 60-second TTL and instant on-demand invalidation.
 * Strictly cafe-scoped: Café A never sees Café B's cached catalog.
 */
export async function getPublicMenuCatalog(cafeSlug: string) {
  const cacheKey = `public-menu-v2-${cafeSlug}`;
  const cacheTag = getCafePublicMenuTag(cafeSlug);

  return unstable_cache(
    async () => {
      const cafe = await getCachedCafeBySlug(cafeSlug);
      if (!cafe) return null;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Concurrently load cafe settings, active categories, active menu items, active offers, and 30-day sales stats
      const [
        [settings],
        categoriesList,
        menuItemsList,
        offersList,
        rawSalesStats,
      ] = await Promise.all([
        db
          .select()
          .from(cafeSettings)
          .where(eq(cafeSettings.cafeId, cafe.id))
          .limit(1),
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

      return {
        cafe,
        settings: settings || null,
        categoriesList,
        menuItemsList,
        offersList,
        salesStats30d,
      };
    },
    [cacheKey],
    {
      revalidate: 60,
      tags: [cacheTag],
    }
  )();
}
