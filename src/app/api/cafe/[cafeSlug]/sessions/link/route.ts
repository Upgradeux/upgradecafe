import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { eq, and, gt } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";
import {
  GuestSessionService,
  getSessionCookieName,
  hashSessionToken,
} from "@/features/cafe/orders/services/guest-session.service";
import { guestSessions } from "@/lib/db/schema/guest-sessions";
import { z } from "zod";

const linkSessionSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
});

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
        message: "Café not found",
        statusCode: 404,
      });
    }

    const body = await request.json();
    const { customerId } = linkSessionSchema.parse(body);

    const cookieName = getSessionCookieName(cafeSlug);
    const rawToken =
      request.cookies.get(cookieName)?.value ||
      request.headers.get("x-guest-session-token");

    if (!rawToken || !rawToken.trim()) {
      return NextResponse.json({
        success: true,
        message: "No guest session active to link.",
      });
    }

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
      await GuestSessionService.linkCustomerToSession(session.id, customerId, cafe.id);
    }

    return NextResponse.json({
      success: true,
      message: "Guest session linked to customer profile successfully.",
    });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
