import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { tables } from "@/lib/db/schema/tables";
import { eq, and } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";
import {
  GuestSessionService,
  getSessionCookieName,
  hashSessionToken,
} from "@/features/cafe/orders/services/guest-session.service";
import { guestSessions } from "@/lib/db/schema/guest-sessions";
import { auth } from "@/lib/auth/auth";
import { z } from "zod";

const sessionRequestSchema = z.object({
  qrIdentifier: z.string().optional().nullable(),
  tableNumber: z.string().optional().nullable(),
  orderType: z.enum(["DINE_IN", "TAKEAWAY"]).optional().default("DINE_IN"),
  action: z.enum(["create", "activity", "touch"]).optional().default("create"),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;
    const [cafe] = await db
      .select({ id: cafes.id, name: cafes.name, slug: cafes.slug })
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

    const cookieName = getSessionCookieName(cafeSlug);
    const rawToken = request.cookies.get(cookieName)?.value || null;

    let customerId: string | null = null;
    try {
      const authSession = await auth.api.getSession({ headers: request.headers });
      if (authSession?.user?.id) {
        customerId = authSession.user.id;
      }
    } catch {}

    const touch = request.nextUrl.searchParams.get("touch") === "true";

    const activeSession = await GuestSessionService.getActiveDiningSession({
      cafeId: cafe.id,
      rawToken,
      customerId,
      touch,
    });

    if (!activeSession) {
      const response = NextResponse.json({
        success: true,
        active: false,
        reason: "EXPIRED",
        table: null,
        session: null,
        activeOrders: [],
      });

      if (rawToken) {
        response.cookies.set(cookieName, "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        });
      }

      return response;
    }

    return NextResponse.json({
      success: true,
      active: true,
      table: activeSession.table
        ? {
            id: activeSession.table.id,
            tableNumber: activeSession.table.tableNumber,
            qrIdentifier: activeSession.table.qrIdentifier,
            status: activeSession.table.status,
          }
        : null,
      session: {
        id: activeSession.session.id,
        status: activeSession.session.status,
      },
      activeOrders: activeSession.activeOrders,
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
      .select({ id: cafes.id, name: cafes.name, slug: cafes.slug })
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

    const cookieName = getSessionCookieName(cafeSlug);
    const rawToken = request.cookies.get(cookieName)?.value || null;

    const body = await request.json().catch(() => ({}));
    const { qrIdentifier, tableNumber, orderType, action } = sessionRequestSchema.parse(body);

    // Handle customer activity touch
    if (action === "activity" || action === "touch") {
      const touched = await GuestSessionService.touchActivity({
        cafeId: cafe.id,
        rawToken,
      });

      if (!touched) {
        const response = NextResponse.json({
          success: true,
          active: false,
          reason: "EXPIRED",
        });
        if (rawToken) {
          response.cookies.set(cookieName, "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 0,
          });
        }
        return response;
      }

      return NextResponse.json({
        success: true,
        active: true,
      });
    }

    let resolvedTable = null;

    if (qrIdentifier && qrIdentifier.trim().length > 0) {
      const [t] = await db
        .select()
        .from(tables)
        .where(
          and(
            eq(tables.cafeId, cafe.id),
            eq(tables.qrIdentifier, qrIdentifier.trim()),
            eq(tables.isActive, true)
          )
        )
        .limit(1);
      if (t) resolvedTable = t;
    }

    if (!resolvedTable && tableNumber && tableNumber.trim().length > 0) {
      const cleanParam = tableNumber.trim().toLowerCase();
      const cleanNum = cleanParam.replace(/^table\s*/i, "");
      const cafeTables = await db
        .select()
        .from(tables)
        .where(and(eq(tables.cafeId, cafe.id), eq(tables.isActive, true)));

      resolvedTable =
        cafeTables.find(
          (t) =>
            t.tableNumber.toLowerCase() === cleanParam ||
            t.tableNumber.toLowerCase().replace(/^table\s*/i, "") === cleanNum
        ) || null;
    }

    if (!resolvedTable) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Specified table does not exist in this café.",
        statusCode: 404,
      });
    }

    let customerId: string | null = null;
    try {
      const authSession = await auth.api.getSession({ headers: request.headers });
      if (authSession?.user?.id) {
        customerId = authSession.user.id;
      }
    } catch {}

    const sessionResult = await GuestSessionService.resolveOrCreateSession({
      cafeId: cafe.id,
      cafeSlug,
      rawToken,
      tableId: resolvedTable.id,
      orderType: orderType || "DINE_IN",
      customerId,
    });

    const response = NextResponse.json({
      success: true,
      active: true,
      table: {
        id: resolvedTable.id,
        tableNumber: resolvedTable.tableNumber,
        qrIdentifier: resolvedTable.qrIdentifier,
        status: resolvedTable.status,
      },
      sessionId: sessionResult.session.id,
    });

    // Set secure HTTP-only cookie
    response.cookies.set(cookieName, sessionResult.rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 3600,
    });

    return response;
  } catch (err) {
    return AppError.toResponse(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;
    const cookieName = getSessionCookieName(cafeSlug);
    const rawToken = request.cookies.get(cookieName)?.value || null;

    if (rawToken && rawToken.trim()) {
      const tokenHash = hashSessionToken(rawToken.trim());
      await db
        .update(guestSessions)
        .set({ status: "COMPLETED", updatedAt: new Date() })
        .where(eq(guestSessions.sessionTokenHash, tokenHash));
    }

    const response = NextResponse.json({
      success: true,
      message: "Dining session ended.",
    });

    response.cookies.set(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (err) {
    return AppError.toResponse(err);
  }
}
