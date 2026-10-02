import { MenuItem } from "@/lib/db/schema/menu-items";

/**
 * Calculates popular menu items based on:
 * 1. 30-day quantity sold (from completed/active orders).
 * 2. Minimum threshold of >= 2 items sold (so an item isn't called popular just because it sold once).
 * 3. Percentage/availability rule: Top 50% of actively selling items, capped at 12 items.
 *    - 6 items total  -> 3 popular items
 *    - 8 items total  -> 4 popular items
 *    - 12 items total -> 6 popular items
 *    - 20 items total -> 10 popular items
 *    - 50 items total -> 12 popular items
 * 4. Graceful backfill using isBestseller and sortOrder if cafe is new or has insufficient order history.
 */
export function calculatePopularItems(
  menuItems: MenuItem[],
  salesStats30d: Record<string, number> = {}
): MenuItem[] {
  // Actively selling items (available items)
  const activeItems = menuItems.filter((it) => it.isAvailable);
  if (activeItems.length === 0) return [];

  // Percentage rule: Top 50% of actively selling items, capped at 12
  const targetCount = Math.min(12, Math.max(1, Math.round(activeItems.length * 0.5)));

  // Minimum threshold: an item isn't called popular just because it sold once -> quantity >= 2
  const minThreshold = 2;

  // Filter items meeting sales threshold, sorted by quantity sold descending
  const qualifiedBySales = activeItems
    .filter((it) => (salesStats30d[it.id] || 0) >= minThreshold)
    .sort((a, b) => {
      const salesA = salesStats30d[a.id] || 0;
      const salesB = salesStats30d[b.id] || 0;
      if (salesB !== salesA) return salesB - salesA;
      return a.sortOrder - b.sortOrder;
    });

  if (qualifiedBySales.length >= targetCount) {
    return qualifiedBySales.slice(0, targetCount);
  }

  // Graceful backfill to reach the top 50% targetCount:
  const result: MenuItem[] = [...qualifiedBySales];
  const seenIds = new Set(result.map((it) => it.id));

  // 1. Fill with items marked isBestseller
  const bestsellers = activeItems
    .filter((it) => it.isBestseller && !seenIds.has(it.id))
    .sort((a, b) => {
      const salesA = salesStats30d[a.id] || 0;
      const salesB = salesStats30d[b.id] || 0;
      if (salesB !== salesA) return salesB - salesA;
      return a.sortOrder - b.sortOrder;
    });

  for (const item of bestsellers) {
    if (result.length >= targetCount) break;
    result.push(item);
    seenIds.add(item.id);
  }

  // 2. Fill with remaining active items by sortOrder
  if (result.length < targetCount) {
    const remaining = activeItems
      .filter((it) => !seenIds.has(it.id))
      .sort((a, b) => {
        const salesA = salesStats30d[a.id] || 0;
        const salesB = salesStats30d[b.id] || 0;
        if (salesB !== salesA) return salesB - salesA;
        return a.sortOrder - b.sortOrder;
      });

    for (const item of remaining) {
      if (result.length >= targetCount) break;
      result.push(item);
      seenIds.add(item.id);
    }
  }

  return result.slice(0, targetCount);
}
