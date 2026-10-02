import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { BillingService } from "@/features/cafe/billing/services/billing.service";
import { AppError } from "@/lib/errors/app-error";

export async function POST(
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

    const body = await request.json();

    if (body.splitRecords && Array.isArray(body.splitRecords) && body.splitRecords.length > 0) {
      const result = await BillingService.splitBillSettle(cafe.id, body);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    const result = await BillingService.settleOrder(cafe.id, body);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
