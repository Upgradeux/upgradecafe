/**
 * Calculates estimated preparation/wait time for an order based on its items.
 *
 * User requirements:
 * 1. "estimated wait show only when owner add a time for that item"
 *    - If NO items have an owner-configured preparation time (> 0), returns null.
 * 2. "if have multiple item calculate and then show"
 *    - For multiple items: calculates realistic kitchen wait time where the longest item
 *      is the critical path, and additional items add incremental pipeline preparation time.
 * 3. "if not add time on item don't show hardcoded time"
 *    - Returns null when no items have prep time so no placeholder/hardcoded time is displayed.
 */

export interface CalculatedWaitTime {
  minMinutes: number;
  maxMinutes: number;
  text: string;
}

export function calculateOrderWaitTime(
  items?: Array<{
    preparationTimeMinutes?: number | null;
    quantity?: number | null;
  }> | null
): CalculatedWaitTime | null {
  if (!items || items.length === 0) return null;

  // Filter items where the owner explicitly configured a preparation time > 0
  const itemsWithTime = items.filter(
    (it) =>
      typeof it.preparationTimeMinutes === "number" &&
      it.preparationTimeMinutes > 0
  );

  if (itemsWithTime.length === 0) {
    return null; // Owner did not add time for any item; don't show hardcoded time!
  }

  const maxItemTime = Math.max(...itemsWithTime.map((it) => it.preparationTimeMinutes!));
  const totalItemsCount = itemsWithTime.reduce((sum, it) => sum + (it.quantity || 1), 0);

  if (totalItemsCount <= 1) {
    const minM = Math.max(1, maxItemTime - 2);
    const maxM = maxItemTime + 2;
    return {
      minMinutes: minM,
      maxMinutes: maxM,
      text: minM === maxM ? `${maxItemTime} mins` : `${minM} – ${maxM} minutes`,
    };
  }

  // Multiple items: Longest item is the critical path; additional items add incremental pipeline time
  const extraItems = totalItemsCount - 1;
  const bufferMin = Math.floor(extraItems * 1);
  const bufferMax = Math.min(25, Math.ceil(extraItems * 2));

  const minM = maxItemTime + bufferMin;
  const maxM = maxItemTime + bufferMax;

  return {
    minMinutes: minM,
    maxMinutes: maxM,
    text: minM === maxM ? `${minM} mins` : `${minM} – ${maxM} minutes`,
  };
}
