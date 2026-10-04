import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { orders } from "@/lib/db/schema/orders";
import { eq, and } from "drizzle-orm";
import {
  GuestSessionService,
  getSessionCookieName,
  hashSessionToken,
} from "@/features/cafe/orders/services/guest-session.service";
import { guestSessions } from "@/lib/db/schema/guest-sessions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, name, cafeSlug, firebaseUid } = body;

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { success: false, message: "Valid phone number is required." },
        { status: 400 }
      );
    }

    // Clean and normalize Indian mobile number
    const digits = phone.replace(/\D/g, "");
    const last10 = digits.length > 10 ? digits.slice(-10) : digits;
    const cleanPhone = `+91${last10}`;
    const customerId = firebaseUid ? `cust_fb_${firebaseUid}` : `cust_${Date.now()}`;

    const customerName =
      typeof name === "string" && name.trim()
        ? name.trim().slice(0, 100)
        : `Member ${last10.slice(-4)}`;

    // If cafeSlug is provided, automatically link any active guest session & orders
    if (cafeSlug && typeof cafeSlug === "string") {
      try {
        const [cafe] = await db
          .select({ id: cafes.id })
          .from(cafes)
          .where(eq(cafes.slug, cafeSlug))
          .limit(1);

        if (cafe) {
          const cookieName = getSessionCookieName(cafeSlug);
          const rawToken =
            req.cookies.get(cookieName)?.value ||
            req.headers.get("x-guest-session-token");

          if (rawToken && rawToken.trim()) {
            const tokenHash = hashSessionToken(rawToken.trim());
            const [session] = await db
              .select()
              .from(guestSessions)
              .where(
                and(
                  eq(guestSessions.cafeId, cafe.id),
                  eq(guestSessions.sessionTokenHash, tokenHash)
                )
              )
              .limit(1);

            if (session) {
              await GuestSessionService.linkCustomerToSession(
                session.id,
                customerId,
                cafe.id
              );
            }
          }

          // Link any active orders that match this phone number
          const phoneOrders = await GuestSessionService.getActiveOrdersByPhone(
            cleanPhone,
            cafe.id
          );
          for (const ord of phoneOrders) {
            if (!ord.customerId) {
              await db
                .update(orders)
                .set({ customerId })
                .where(eq(orders.id, ord.id));
            }
          }
        }
      } catch (linkError) {
        console.warn("[Firebase Customer Verify] Session link warning:", linkError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Phone number verified successfully.",
      customer: {
        id: customerId,
        name: customerName,
        phone: cleanPhone,
        email: undefined,
        isGuest: false,
      },
    });
  } catch (err: any) {
    console.error("[Firebase Verify Error]:", err);
    return NextResponse.json(
      { success: false, message: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
