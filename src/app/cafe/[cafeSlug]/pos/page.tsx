import React from "react";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { OrdersService } from "@/features/cafe/orders/services/orders.service";
import { TablesService } from "@/features/cafe/tables/services/tables.service";
import { MenuService } from "@/features/cafe/menu/services/menu.service";
import { PosTerminal } from "@/features/cafe/pos/components/PosTerminal";

interface CafePosPageProps {
  params: Promise<{ cafeSlug: string }>;
}

export default async function CafePosPage({ params }: CafePosPageProps) {
  const { cafeSlug } = await params;
  const { cafe, user } = await resolveCafeTenant(cafeSlug, [
    "OWNER",
    "STAFF",
    "MANAGER",
    "CASHIER",
    "WAITER",
  ]);

  const [liveOrders, tablesList, menuItemsList, categoriesList] =
    await Promise.all([
      OrdersService.listLiveOrders(cafe.id),
      TablesService.listTables(cafe.id),
      MenuService.listMenuItems(cafe.id),
      MenuService.listCategories(cafe.id),
    ]);

  return (
    <PosTerminal
      cafe={cafe}
      categories={categoriesList}
      initialMenuItems={menuItemsList}
      initialTables={tablesList}
      initialActiveOrders={liveOrders}
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
      }}
    />
  );
}
