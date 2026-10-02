import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { OrdersService } from "@/features/cafe/orders/services/orders.service";
import { createServiceRequestSchema } from "@/features/cafe/orders/schemas/order.schema";
import { AppError } from "@/lib/errors/app-error";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { eq } from "drizzle-orm";

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
      "KITCHEN",
      "WAITER",
    ]);

    const pending = await OrdersService.listPendingServiceRequests(cafe.id);

    return NextResponse.json({
      success: true,
      data: pending,
    });
  } catch (err) {
    return AppError.toResponse(err);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;

    const [cafe] = await db
      .select()
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

    const body = await request.json();
    const validated = createServiceRequestSchema.parse(body);

    const created = await OrdersService.createServiceRequest(cafe.id, validated);

    return NextResponse.json(
      {
        success: true,
        data: created,
      },
      { status: 201 }
    );
  } catch (err) {
    return AppError.toResponse(err);
  }
}
