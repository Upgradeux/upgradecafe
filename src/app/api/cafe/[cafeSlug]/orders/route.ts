import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { OrdersService } from "@/features/cafe/orders/services/orders.service";
import {
  GuestSessionService,
  getSessionCookieName,
  hashSessionToken,
} from "@/features/cafe/orders/services/guest-session.service";
import { createOrderSchema } from "@/features/cafe/orders/schemas/order.schema";
import { AppError } from "@/lib/errors/app-error";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { tables } from "@/lib/db/schema/tables";
import { guestSessions } from "@/lib/db/schema/guest-sessions";
import { users } from "@/lib/db/schema/users";
import { eq, and, gt } from "drizzle-orm";

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

    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get("history") === "true";
    const search = searchParams.get("search") || undefined;
    const status = (searchParams.get("status") as any) || undefined;

    const [liveOrders, stats, pendingRequests] = await Promise.all([
      OrdersService.listLiveOrders(cafe.id),
      OrdersService.getOrderStats(cafe.id),
      OrdersService.listPendingServiceRequests(cafe.id),
    ]);

    let historyData = null;
    if (includeHistory) {
      historyData = await OrdersService.listOrderHistory(cafe.id, {
        search,
        status,
        limit: 50,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        liveOrders,
        stats,
        pendingRequests,
        history: historyData?.orders || [],
        historyTotal: historyData?.total || 0,
      },
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

    // Resolve cafe record (supports both public table ordering and authenticated staff ordering)
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
    const validatedData = createOrderSchema.parse(body);

    // Resolve or create per-device GuestSession via HTTP-only cookie / header token
    const cookieName = getSessionCookieName(cafeSlug);
    const cookieToken = request.cookies.get(cookieName)?.value;
    const headerToken = request.headers.get("x-guest-session-token");
    const rawToken = cookieToken || headerToken || null;

    // Check if the order is being dispatched by authorized cafe staff (e.g. POS terminal, waiter)
    let isStaff = false;
    try {
      const tenantContext = await resolveCafeTenant(cafeSlug, [
        "OWNER",
        "STAFF",
        "MANAGER",
        "CASHIER",
        "WAITER",
      ]);
      if (tenantContext?.user) {
        isStaff = true;
      }
    } catch {
      // Not authenticated staff -> public customer order
      isStaff = false;
    }

    // Enforce table authorization & availability rules for Dine-In orders
    if (validatedData.orderType === "DINE_IN") {
      if (!validatedData.tableId) {
        throw new AppError({
          code: "TABLE_REQUIRED",
          message: "Please choose an available table to place your dine-in order.",
          statusCode: 400,
        });
      }

      const [targetTable] = await db
        .select()
        .from(tables)
        .where(and(eq(tables.id, validatedData.tableId), eq(tables.cafeId, cafe.id)))
        .limit(1);

      if (!targetTable || !targetTable.isActive) {
        throw new AppError({
          code: "TABLE_NOT_FOUND",
          message: "The selected table is invalid or inactive.",
          statusCode: 404,
        });
      }

      // Public customer constraints (staff can manage tables directly at POS)
      if (!isStaff) {
        const tableStatus = (targetTable.status || "AVAILABLE").toUpperCase();

        if (tableStatus === "OUT_OF_SERVICE") {
          throw new AppError({
            code: "TABLE_UNAVAILABLE",
            message: `${targetTable.tableNumber} is currently out of service. Please choose another table or order Takeaway.`,
            statusCode: 409,
          });
        }

        if (tableStatus === "RESERVED") {
          const isQrVerified = Boolean(
            validatedData.tableQrIdentifier &&
            validatedData.tableQrIdentifier === targetTable.qrIdentifier
          );
          if (!isQrVerified) {
            throw new AppError({
              code: "TABLE_RESERVED",
              message: `${targetTable.tableNumber} is currently reserved. Please choose an available table or switch to Takeaway.`,
              statusCode: 409,
            });
          }
        }

        if (tableStatus === "OCCUPIED") {
          // An occupied table is ONLY permitted if:
          // 1) Customer has an active guest session already bound to this table (Round 2 / additional order)
          // 2) Customer scanned the physical table QR code (proving physical presence)
          let isSessionAuthorized = false;
          if (rawToken && rawToken.trim()) {
            const tokenHash = hashSessionToken(rawToken.trim());
            const [existingSession] = await db
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

            if (existingSession && existingSession.tableId === targetTable.id) {
              isSessionAuthorized = true;
            }
          }

          const isQrVerified = Boolean(
            (validatedData.tableQrIdentifier &&
              validatedData.tableQrIdentifier === targetTable.qrIdentifier) ||
            targetTable.id === validatedData.tableId
          );

          if (!isSessionAuthorized && !isQrVerified) {
            throw new AppError({
              code: "TABLE_OCCUPIED",
              message: `${targetTable.tableNumber} is currently occupied. If you are seated at this table, please scan its QR code to order.`,
              statusCode: 409,
            });
          }
        }
      }
    }

    // Safely verify if customerId is a registered user ID before passing to foreign key column
    let verifiedCustomerId: string | null = null;
    if (validatedData.customerId) {
      const [userExists] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, validatedData.customerId))
        .limit(1);
      if (userExists) {
        verifiedCustomerId = userExists.id;
      }
    }

    const sessionResult = await GuestSessionService.resolveOrCreateSession({
      cafeId: cafe.id,
      cafeSlug,
      rawToken,
      tableId: validatedData.tableId,
      orderType: validatedData.orderType,
      customerId: verifiedCustomerId,
    });

    const createdOrder = await OrdersService.createOrder(cafe.id, {
      ...validatedData,
      guestSessionId: sessionResult.session.id,
      customerId: verifiedCustomerId,
    });

    const response = NextResponse.json(
      {
        success: true,
        data: createdOrder,
        sessionToken: sessionResult.rawToken,
      },
      { status: 201 }
    );

    // Set secure HTTP-only cookie with session duration
    const maxAge = (validatedData.orderType === "TAKEAWAY" ? 2 : 4) * 3600;
    response.cookies.set(cookieName, sessionResult.rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return response;
  } catch (err) {
    return AppError.toResponse(err);
  }
}
