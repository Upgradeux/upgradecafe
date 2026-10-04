import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { eq } from "drizzle-orm";
import { OrdersService } from "@/features/cafe/orders/services/orders.service";
import { AppError } from "@/lib/errors/app-error";
import { requireOrderAccess } from "@/lib/permissions/guards";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string; orderId: string }> }
) {
  try {
    const { cafeSlug, orderId } = await params;

    // Resolve cafe by slug
    const [cafe] = await db
      .select({ id: cafes.id, slug: cafes.slug })
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

    // Enforce authorization: only staff or the verified guest/customer who owns this order
    await requireOrderAccess(request, cafeSlug, cafe.id, orderId);

    let paymentMethod: "UPI" | "CASH" = "UPI";
    try {
      const body = await request.json();
      if (body?.paymentMethod === "CASH") {
        paymentMethod = "CASH";
      }
    } catch {
      // Body is optional; default to UPI
    }

    const updated = await OrdersService.setCustomerPaymentMethod(
      orderId,
      cafe.id,
      paymentMethod
    );

    return NextResponse.json({
      success: true,
      message:
        paymentMethod === "CASH"
          ? "Payment preference set to Cash at Counter."
          : "Payment marked as pending verification for café staff.",
      data: updated,
    });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
