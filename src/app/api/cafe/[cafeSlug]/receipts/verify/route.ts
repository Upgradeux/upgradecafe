import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { orders } from "@/lib/db/schema/orders";
import { eq, and, sql } from "drizzle-orm";
import { OrdersService } from "@/features/cafe/orders/services/orders.service";
import { parseReceiptToken, generateReceiptToken } from "@/features/cafe/orders/utils/receipt-token";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await context.params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") || "";

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing barcode receipt token" },
        { status: 400 }
      );
    }

    const [cafe] = await db
      .select()
      .from(cafes)
      .where(eq(cafes.slug, cafeSlug))
      .limit(1);

    if (!cafe) {
      return NextResponse.json(
        { success: false, error: "Café not found" },
        { status: 404 }
      );
    }

    const parsed = parseReceiptToken(token);
    if (!parsed) {
      return NextResponse.json(
        { success: false, error: "Invalid receipt token format" },
        { status: 400 }
      );
    }

    // Lookup order by clean order number within this cafe
    const cleanNum = parsed.orderNumber.replace(/[^0-9A-Za-z]/g, "");
    const candidateOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.cafeId, cafe.id),
          sql`REPLACE(LOWER(${orders.orderNumber}), '#', '') = ${cleanNum.toLowerCase()} OR ${orders.id}::text = ${parsed.orderNumber}`
        )
      )
      .limit(10);

    // Verify token against candidates
    let matchedOrder = null;
    for (const ord of candidateOrders) {
      const expectedToken = generateReceiptToken({
        orderId: ord.id,
        orderNumber: ord.orderNumber,
        cafeName: cafe.name,
        createdAt: ord.createdAt,
      });

      if (expectedToken.toUpperCase() === token.toUpperCase()) {
        matchedOrder = ord;
        break;
      }
    }

    // Fallback match by order number if single candidate
    if (!matchedOrder && candidateOrders.length === 1) {
      matchedOrder = candidateOrders[0];
    }

    if (!matchedOrder) {
      return NextResponse.json(
        { success: false, error: "No matching verified order found for this receipt" },
        { status: 404 }
      );
    }

    // Fetch full order with items
    const fullOrder = await OrdersService.getOrderById(matchedOrder.id, cafe.id);

    return NextResponse.json({
      success: true,
      verified: true,
      data: fullOrder,
      receiptToken: token,
      redirectUrl: `/menu/${cafeSlug}/orders/${matchedOrder.id}`,
    });
  } catch (err: any) {
    console.error("Receipt verification error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to verify receipt" },
      { status: 500 }
    );
  }
}
