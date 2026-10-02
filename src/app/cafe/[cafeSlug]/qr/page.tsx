import React from "react";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { TablesService } from "@/features/cafe/tables/services/tables.service";
import { QrManager } from "@/features/cafe/qr/components/QrManager";

interface CafeQrPageProps {
  params: Promise<{ cafeSlug: string }>;
}

export default async function CafeQrPage({ params }: CafeQrPageProps) {
  const { cafeSlug } = await params;
  const { cafe, settings } = await resolveCafeTenant(cafeSlug);
  const tables = await TablesService.listTables(cafe.id);

  return (
    <QrManager
      cafeSlug={cafeSlug}
      cafeName={cafe.name}
      tables={tables}
      defaultPreset={settings?.themePreset}
      cafeLogoKey={cafe.logoKey}
    />
  );
}
