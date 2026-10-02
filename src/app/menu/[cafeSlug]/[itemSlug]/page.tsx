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

export const dynamic = "force-dynamic";

interface ItemDetailPageProps {
  params: Promise<{ cafeSlug: string; itemSlug: string }>;
  searchParams: Promise<{ table?: string; qr?: string }>;
}

export async function generateMetadata({ params }: ItemDetailPageProps) {
  const { cafeSlug, itemSlug } = await params;
  const [cafe] = await db
    .select()
    .from(cafes)
    .where(eq(cafes.slug, cafeSlug))
    .limit(1);

  if (!cafe) {
    return {
      title: "Menu Item • Digital Menu",
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
  };
}

export default async function ItemDetailPage({
  params,
  searchParams,
}: ItemDetailPageProps) {
  const { cafeSlug, itemSlug } = await params;
  const { table: tableParam, qr: qrParam } = await searchParams;

  // 1. Resolve Cafe
  const [cafe] = await db
    .select()
    .from(cafes)
    .where(eq(cafes.slug, cafeSlug))
    .limit(1);

  if (!cafe) {
    notFound();
  }

  // 2. Resolve Menu Item
  const [item] = await db
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
    .limit(1);

  if (!item) {
    notFound();
  }

  // 3. Resolve Variants if available
  const variants = await db
    .select()
    .from(menuItemVariants)
    .where(
      and(
        eq(menuItemVariants.menuItemId, item.id),
        eq(menuItemVariants.isAvailable, true)
      )
    )
    .orderBy(asc(menuItemVariants.price));

  // 3b. Resolve Assigned Modifier Groups
  const modifierGroups = await ModifiersService.getItemModifierGroups(item.id);

  // 4. Resolve Cafe Theme Settings
  const [settings] = await db
    .select()
    .from(cafeSettings)
    .where(eq(cafeSettings.cafeId, cafe.id))
    .limit(1);

  const menuThemeId = settings?.digitalMenuTheme || settings?.themePreset || "roast";
  const themeStyles = {
    ...getCafeThemeStyles(menuThemeId, settings?.fontFamily || "Plus Jakarta Sans"),
    colorScheme: "light",
  };

  // 5. Resolve dining table if table or qr param passed
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
