import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { orders } from "@/lib/db/schema/orders";
import { eq, and, gt } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";
import {
  GuestSessionService,
  getSessionCookieName,
  hashSessionToken,
} from "@/features/cafe/orders/services/guest-session.service";
import { guestSessions } from "@/lib/db/schema/guest-sessions";
import { OrdersService } from "@/features/cafe/orders/services/orders.service";

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

    const orderIdParam =
      request.headers.get("x-order-id") ||
      request.nextUrl.searchParams.get("orderId");

    const customerPhone =
      request.headers.get("x-customer-phone") ||
      request.nextUrl.searchParams.get("phone");

    const cookieName = getSessionCookieName(cafeSlug);
    const rawToken = request.cookies.get(cookieName)?.value || null;

    const collectedOrdersMap = new Map<string, any>();
    let terminalFound = false;

    // 1. Resolve and verify active guest session token strictly via HTTP-only cookie
    let validatedSession: typeof guestSessions.$inferSelect | null = null;
    if (rawToken && rawToken.trim()) {
      const tokenHash = hashSessionToken(rawToken.trim());
      const [session] = await db
        .select()
        .from(guestSessions)
        .where(
          and(
            eq(guestSessions.cafeId, cafe.id),
            eq(guestSessions.sessionTokenHash, tokenHash),
            eq(guestSessions.status, "ACTIVE"),
            gt(guestSessions.expiresAt, new Date())
          )
        )
        .limit(1);

      if (session) {
        validatedSession = session;
        const sessionOrders = await GuestSessionService.getActiveOrdersForSession(
          session.id,
          cafe.id
        );
        for (const ord of sessionOrders) {
          collectedOrdersMap.set(ord.id, ord);
        }
      }
    }

    // 2. Authenticated customer flow (only if verified via session or linked to this active guest session)
    if (customerId && customerId.trim()) {
      const trimmedCustomerId = customerId.trim();

      // Ensure customerId is either linked to the validated guest session on this device or session exists
      if (validatedSession) {
        if (validatedSession.customerId !== trimmedCustomerId) {
          try {
            await GuestSessionService.linkCustomerToSession(
              validatedSession.id,
              trimmedCustomerId,
              cafe.id
            );
          } catch (linkErr) {
            console.warn("Failed linking session to customer:", linkErr);
          }
        }

        const activeOrders = await GuestSessionService.getActiveOrdersForCustomer(
          trimmedCustomerId,
          cafe.id,
          customerPhone
        );
        for (const ord of activeOrders) {
          collectedOrdersMap.set(ord.id, ord);
        }
      }
    }

    // 3. Specific Order ID Verification: only allow if it belongs to the validated session or customer
    if (orderIdParam && orderIdParam.trim() && validatedSession) {
      const [orderRecord] = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.id, orderIdParam.trim()),
            eq(orders.cafeId, cafe.id),
            eq(orders.guestSessionId, validatedSession.id)
          )
        )
        .limit(1);

      if (orderRecord) {
        if (["NEW", "PREPARING", "READY", "SERVED"].includes(orderRecord.status)) {
          if (!collectedOrdersMap.has(orderRecord.id)) {
            const fullOrder = await OrdersService.getOrderById(orderRecord.id, cafe.id);
            if (fullOrder) {
              collectedOrdersMap.set(fullOrder.id, fullOrder);
            }
          }
        } else if (["COMPLETED", "CANCELLED"].includes(orderRecord.status)) {
          terminalFound = true;
        }
      }
    }

    // If customer is authenticated, automatically associate any unlinked active orders found
    if (customerId && customerId.trim() && collectedOrdersMap.size > 0) {
      const trimmedCustomerId = customerId.trim();
      for (const ord of collectedOrdersMap.values()) {
        if (!ord.customerId) {
          try {
            await db
              .update(orders)
              .set({ customerId: trimmedCustomerId })
              .where(eq(orders.id, ord.id));
          } catch {}
        }
      }
    }

    const sortedActiveOrders = Array.from(collectedOrdersMap.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      data: sortedActiveOrders,
      isTerminal: sortedActiveOrders.length === 0 && terminalFound,
    });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
