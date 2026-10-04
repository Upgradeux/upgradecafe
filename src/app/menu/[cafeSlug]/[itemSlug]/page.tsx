import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { cafeSettings } from "@/lib/db/schema/cafe-settings";
import { categories } from "@/lib/db/schema/categories";
import { menuItems, menuItemVariants } from "@/lib/db/schema/menu-items";
import { tables } from "@/lib/db/schema/tables";
import { eq, and, asc } from "drizzle-orm";
import { getCafeThemeStyles } from "@/lib/theme/theme-tokens";
import { ItemDetailPageView } from "@/features/cafe/public-menu/components/ItemDetailPageView";
import { ModifiersService } from "@/features/cafe/menu/services/modifiers.service";
import { ToastProvider } from "@/components/ui/Toast";

import { getCachedCafeBySlug } from "@/features/cafe/public-menu/services/public-menu-cache.service";

export const dynamic = "force-dynamic";

interface ItemDetailPageProps {
  params: Promise<{ cafeSlug: string; itemSlug: string }>;
  searchParams: Promise<{ table?: string; qr?: string }>;
}

export async function generateMetadata({ params }: ItemDetailPageProps) {
  const { cafeSlug, itemSlug } = await params;
  const cafe = await getCachedCafeBySlug(cafeSlug);

  if (!cafe) {
    return {
      title: "Menu Item • Digital Menu",
      manifest: `/api/cafe/${cafeSlug}/manifest`,
    };
  }

  const [item] = await db
    .select({
      name: menuItems.name,
      description: menuItems.description,
    })
    .from(menuItems)
    .where(and(eq(menuItems.cafeId, cafe.id), eq(menuItems.slug, itemSlug)))
    .limit(1);

  return {
    title: item ? `${item.name} • ${cafe.name}` : `${cafe.name} • Digital Menu`,
    description:
      item?.description ||
      `Order ${item?.name || "freshly prepared dishes"} directly from ${cafe.name}.`,
    manifest: `/api/cafe/${cafeSlug}/manifest`,
  };
}

export default async function ItemDetailPage({
  params,
  searchParams,
}: ItemDetailPageProps) {
  const { cafeSlug, itemSlug } = await params;
  const { table: tableParam, qr: qrParam } = await searchParams;

  // 1. Resolve Cafe (request deduplicated)
  const cafe = await getCachedCafeBySlug(cafeSlug);

  if (!cafe) {
    notFound();
  }

  // 2. Concurrently resolve Menu Item and Cafe Settings
  const [[item], [settings]] = await Promise.all([
    db
      .select({
        id: menuItems.id,
        cafeId: menuItems.cafeId,
        categoryId: menuItems.categoryId,
        name: menuItems.name,
        slug: menuItems.slug,
        description: menuItems.description,
        price: menuItems.price,
        isAvailable: menuItems.isAvailable,
        isVegetarian: menuItems.isVegetarian,
        foodType: menuItems.foodType,
        isBestseller: menuItems.isBestseller,
        isSpicy: menuItems.isSpicy,
        temperature: menuItems.temperature,
        allergens: menuItems.allergens,
        calories: menuItems.calories,
        proteinGrams: menuItems.proteinGrams,
        fatGrams: menuItems.fatGrams,
        carbsGrams: menuItems.carbsGrams,
        imageKey: menuItems.imageKey,
        preparationTimeMinutes: menuItems.preparationTimeMinutes,
        sortOrder: menuItems.sortOrder,
        createdAt: menuItems.createdAt,
        updatedAt: menuItems.updatedAt,
        categoryName: categories.name,
      })
      .from(menuItems)
      .leftJoin(categories, eq(menuItems.categoryId, categories.id))
      .where(and(eq(menuItems.cafeId, cafe.id), eq(menuItems.slug, itemSlug)))
      .limit(1),
    db
      .select()
      .from(cafeSettings)
      .where(eq(cafeSettings.cafeId, cafe.id))
      .limit(1),
  ]);

  if (!item) {
    notFound();
  }

  // 3. Concurrently resolve Variants, Modifier Groups, and Table lookups
  const [variants, modifierGroups, tableFromQr, allCafeTables] = await Promise.all([
    db
      .select()
      .from(menuItemVariants)
      .where(
        and(
          eq(menuItemVariants.menuItemId, item.id),
          eq(menuItemVariants.isAvailable, true)
        )
      )
      .orderBy(asc(menuItemVariants.price)),
    ModifiersService.getItemModifierGroups(item.id),
    qrParam
      ? db
          .select()
          .from(tables)
          .where(and(eq(tables.cafeId, cafe.id), eq(tables.qrIdentifier, qrParam)))
          .limit(1)
      : Promise.resolve([]),
    !qrParam && tableParam
      ? db
          .select()
          .from(tables)
          .where(and(eq(tables.cafeId, cafe.id), eq(tables.isActive, true)))
      : Promise.resolve([]),
  ]);

  const menuThemeId = settings?.digitalMenuTheme || settings?.themePreset || "roast";
  const themeStyles = {
    ...getCafeThemeStyles(menuThemeId, settings?.fontFamily || "Plus Jakarta Sans"),
    colorScheme: "light",
  };

  // Resolve dining table
  let resolvedTable = null;
  if (tableFromQr && tableFromQr.length > 0) {
    resolvedTable = tableFromQr[0];
  } else if (tableParam && allCafeTables && allCafeTables.length > 0) {
    const cleanParam = tableParam.trim().toLowerCase();
    const cleanNum = cleanParam.replace(/^table\s*/i, "");
    resolvedTable =
      allCafeTables.find(
        (t) =>
          t.tableNumber.toLowerCase() === cleanParam ||
          t.tableNumber.toLowerCase().replace(/^table\s*/i, "") === cleanNum
      ) || null;
  }

  return (
    <div
      data-theme="cafe"
      data-menu-theme={menuThemeId}
      style={themeStyles as React.CSSProperties}
      className="min-h-screen bg-white text-[var(--color-foreground)] antialiased selection:bg-[var(--color-primary-light)] light"
    >
      <ToastProvider variant="compact_pill">
        <ItemDetailPageView
          cafe={cafe}
          item={item}
          variants={variants}
          modifierGroups={modifierGroups}
          tableParamName={resolvedTable?.tableNumber || tableParam || null}
          digitalMenuTheme={menuThemeId}
        />
      </ToastProvider>
    </div>
  );
}
