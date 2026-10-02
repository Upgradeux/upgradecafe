import React from "react";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { OrdersService } from "@/features/cafe/orders/services/orders.service";
import { TablesService } from "@/features/cafe/tables/services/tables.service";
import { MenuService } from "@/features/cafe/menu/services/menu.service";
import { LiveOrdersBoard } from "@/features/cafe/orders/components/LiveOrdersBoard";

interface CafeOrdersPageProps {
  params: Promise<{ cafeSlug: string }>;
}

export default async function CafeOrdersPage({ params }: CafeOrdersPageProps) {
  const { cafeSlug } = await params;
  const { cafe } = await resolveCafeTenant(cafeSlug, [
    "OWNER",
    "STAFF",
    "MANAGER",
    "CASHIER",
    "KITCHEN",
    "WAITER",
  ]);

  const [liveOrders, stats, pendingRequests, tablesList, menuItemsList, categoriesList] =
    await Promise.all([
      OrdersService.listLiveOrders(cafe.id),
      OrdersService.getOrderStats(cafe.id),
      OrdersService.listPendingServiceRequests(cafe.id),
      TablesService.listTables(cafe.id),
      MenuService.listMenuItems(cafe.id),
      MenuService.listCategories(cafe.id),
    ]);

  return (
    <LiveOrdersBoard
      cafeSlug={cafeSlug}
      cafeName={cafe.name}
      initialOrders={liveOrders}
      initialStats={stats}
      initialRequests={pendingRequests}
      tables={tablesList}
      menuItems={menuItemsList}
      categories={categoriesList}
    />
  );
}
