import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { orders, orderItems } from "@/lib/db/schema/orders";
import { menuItems } from "@/lib/db/schema/menu-items";
import { eq, and, or, inArray, desc, asc } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";

export async function GET(
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
        message: "Café not found",
        statusCode: 404,
      });
    }

    const customerId =
      request.headers.get("x-customer-id") ||
      request.nextUrl.searchParams.get("customerId");
    const customerPhone =
      request.headers.get("x-customer-phone") ||
      request.nextUrl.searchParams.get("phone");

    // Past orders are strictly for authenticated/logged-in customers (not anonymous guests)
    if (!customerId && !customerPhone) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const customerFilters = [];
    if (customerId && customerId.trim()) {
      customerFilters.push(eq(orders.customerId, customerId.trim()));
    }
    if (customerPhone && customerPhone.trim()) {
      customerFilters.push(eq(orders.customerPhone, customerPhone.trim()));
    }

    if (customerFilters.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Only completed or settled orders (never active orders like NEW, PREPARING, READY, SERVED)
    const pastOrdersList = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.cafeId, cafe.id),
          customerFilters.length === 1 ? customerFilters[0] : or(...customerFilters)!,
          inArray(orders.status, ["COMPLETED", "CANCELLED"])
        )
      )
      .orderBy(desc(orders.createdAt))
      .limit(30);

    if (pastOrdersList.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const orderIds = pastOrdersList.map((o) => o.id);
    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        menuItemId: orderItems.menuItemId,
        itemName: orderItems.itemName,
        unitPrice: orderItems.unitPrice,
        quantity: orderItems.quantity,
        itemTotal: orderItems.itemTotal,
        variantName: orderItems.variantName,
        specialInstructions: orderItems.specialInstructions,
        createdAt: orderItems.createdAt,
        imageKey: menuItems.imageKey,
        slug: menuItems.slug,
      })
      .from(orderItems)
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(inArray(orderItems.orderId, orderIds))
      .orderBy(asc(orderItems.createdAt));

    const itemsByOrderId = new Map<string, any[]>();
    for (const item of items) {
      if (!itemsByOrderId.has(item.orderId)) {
        itemsByOrderId.set(item.orderId, []);
      }
      itemsByOrderId.get(item.orderId)!.push(item);
    }

    const result = pastOrdersList.map((ord) => ({
      ...ord,
      items: itemsByOrderId.get(ord.id) || [],
      itemsCount: (itemsByOrderId.get(ord.id) || []).reduce(
        (sum, it) => sum + (it.quantity || 1),
        0
      ),
    }));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
