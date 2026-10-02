import React from "react";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { MenuService } from "@/features/cafe/menu/services/menu.service";
import { MenuManager } from "@/features/cafe/menu/components/MenuManager";

interface CafeMenuPageProps {
  params: Promise<{ cafeSlug: string }>;
  searchParams?: Promise<{ category?: string }>;
}

export default async function CafeMenuPage({ params, searchParams }: CafeMenuPageProps) {
  const { cafeSlug } = await params;
  const { cafe } = await resolveCafeTenant(cafeSlug);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const [categories, items] = await Promise.all([
    MenuService.listCategories(cafe.id),
    MenuService.listMenuItems(cafe.id),
  ]);

  return (
    <MenuManager
      cafeSlug={cafeSlug}
      initialCategories={categories}
      initialItems={items}
      defaultCategoryId={resolvedSearchParams?.category}
    />
  );
}
