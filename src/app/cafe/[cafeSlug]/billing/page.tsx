import React from "react";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { BillingService } from "@/features/cafe/billing/services/billing.service";
import { BillingDashboard } from "@/features/cafe/billing/components/BillingDashboard";

interface CafeBillingPageProps {
  params: Promise<{ cafeSlug: string }>;
}

export default async function CafeBillingPage({ params }: CafeBillingPageProps) {
  const { cafeSlug } = await params;
  const { cafe } = await resolveCafeTenant(cafeSlug, [
    "OWNER",
    "STAFF",
    "MANAGER",
    "CASHIER",
  ]);

  const transactions = await BillingService.listBillingTransactions(cafe.id);

  return <BillingDashboard cafe={cafe} initialOrders={transactions} />;
}
