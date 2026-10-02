import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { BillingService } from "@/features/cafe/billing/services/billing.service";
import { AppError } from "@/lib/errors/app-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug, [
      "OWNER",
      "STAFF",
      "MANAGER",
      "CASHIER",
    ]);

    const summary = await BillingService.getShiftSummary(cafe.id);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
