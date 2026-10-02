import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { OrdersService } from "@/features/cafe/orders/services/orders.service";
import { updateOrderStatusSchema } from "@/features/cafe/orders/schemas/order.schema";
import { AppError } from "@/lib/errors/app-error";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string; orderId: string }> }
) {
  try {
    const { cafeSlug, orderId } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug, [
      "OWNER",
      "STAFF",
      "MANAGER",
      "CASHIER",
      "KITCHEN",
      "WAITER",
    ]);

    const body = await request.json();
    const { status, cancellationReason } = updateOrderStatusSchema.parse(body);

    const updated = await OrdersService.updateOrderStatus(
      orderId,
      cafe.id,
      status,
      cancellationReason || undefined
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
