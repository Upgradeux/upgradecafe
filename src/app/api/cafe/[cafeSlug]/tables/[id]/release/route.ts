import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { OrdersService } from "@/features/cafe/orders/services/orders.service";
import { AppError } from "@/lib/errors/app-error";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string; id: string }> }
) {
  try {
    const { cafeSlug, id } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug, [
      "OWNER",
      "STAFF",
      "MANAGER",
      "CASHIER",
      "WAITER",
    ]);

    const updatedTable = await OrdersService.releaseTable(id, cafe.id);

    return NextResponse.json({
      success: true,
      data: updatedTable,
    });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
