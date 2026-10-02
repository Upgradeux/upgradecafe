import React from "react";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { TablesService } from "@/features/cafe/tables/services/tables.service";
import { TableManager } from "@/features/cafe/tables/components/TableManager";

interface CafeTablesPageProps {
  params: Promise<{ cafeSlug: string }>;
}

export default async function CafeTablesPage({ params }: CafeTablesPageProps) {
  const { cafeSlug } = await params;
  const { cafe } = await resolveCafeTenant(cafeSlug);
  const [tables, floors] = await Promise.all([
    TablesService.listTables(cafe.id),
    TablesService.listFloors(cafe.id),
  ]);

  return (
    <TableManager
      cafeSlug={cafeSlug}
      initialTables={tables}
      floors={floors}
    />
  );
}
