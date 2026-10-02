import React from "react";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { CafeAnalyticsManager } from "@/features/cafe/analytics/components/CafeAnalyticsManager";

interface CafeAnalyticsPageProps {
  params: Promise<{ cafeSlug: string }>;
}

export default async function CafeAnalyticsPage({ params }: CafeAnalyticsPageProps) {
  const { cafeSlug } = await params;
  const { cafe } = await resolveCafeTenant(cafeSlug);

  return <CafeAnalyticsManager cafeSlug={cafeSlug} cafeName={cafe.name} />;
}
