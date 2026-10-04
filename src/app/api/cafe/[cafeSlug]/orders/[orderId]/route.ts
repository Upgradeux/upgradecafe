import { NextRequest, NextResponse } from "next/server";
import { OrdersService } from "@/features/cafe/orders/services/orders.service";
import { AppError } from "@/lib/errors/app-error";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { eq } from "drizzle-orm";
import { requireOrderAccess } from "@/lib/permissions/guards";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string; orderId: string }> }
) {
  try {
    const { cafeSlug, orderId } = await params;

    // Resolve cafe by slug
    const [cafe] = await db
      .select({ id: cafes.id })
      .from(cafes)
      .where(eq(cafes.slug, cafeSlug))
      .limit(1);

    if (!cafe) {
      throw new AppError({
        code: "CAFE_NOT_FOUND",
        message: `Café '${cafeSlug}' not found.`,
        statusCode: 404,
      });
    }

    // Enforce authorization: only staff/admin or the verified guest/customer who owns this order
    await requireOrderAccess(request, cafeSlug, cafe.id, orderId);

    const order = await OrdersService.getOrderById(orderId, cafe.id);

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
