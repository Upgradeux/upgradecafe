import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { tables } from "@/lib/db/schema/tables";
import { guestSessions } from "@/lib/db/schema/guest-sessions";
import { eq, and, asc } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;

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

    const tablesList = await db
      .select({
        id: tables.id,
        tableNumber: tables.tableNumber,
        capacity: tables.capacity,
        status: tables.status,
        qrIdentifier: tables.qrIdentifier,
        currentGuests: tables.currentGuests,
        floorId: tables.floorId,
        isActive: tables.isActive,
      })
      .from(tables)
      .where(and(eq(tables.cafeId, cafe.id), eq(tables.isActive, true)))
      .orderBy(asc(tables.tableNumber));

    return NextResponse.json({ success: true, data: tablesList });
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
    const body = await request.json();
    const { action, tableId, guests } = body;

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

    if (!tableId) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "tableId is required",
        statusCode: 400,
      });
    }

    if (action === "claim") {
      // Mark table as OCCUPIED for the seated guest
      const [updated] = await db
        .update(tables)
        .set({
          status: "OCCUPIED",
          currentGuests: guests || 2,
          occupiedSinceMinutes: 1,
          updatedAt: new Date(),
        })
        .where(and(eq(tables.id, tableId), eq(tables.cafeId, cafe.id)))
        .returning();

      return NextResponse.json({
        success: true,
        message: "Table claimed successfully",
        data: updated,
      });
    } else if (action === "release") {
      // Release held or freed table back to AVAILABLE
      const [table] = await db
        .select({ status: tables.status, currentBillAmount: tables.currentBillAmount })
        .from(tables)
        .where(and(eq(tables.id, tableId), eq(tables.cafeId, cafe.id)))
        .limit(1);

      if (!table) {
        throw new AppError({
          code: "TABLE_NOT_FOUND",
          message: "Table not found",
          statusCode: 404,
        });
      }

      // If table has an active dining bill, only staff/owner can release it
      if (Number(table.currentBillAmount || 0) > 0) {
        const { requireCafeMember } = await import("@/lib/permissions/guards");
        await requireCafeMember(cafe.id);
      }

      const [updated] = await db
        .update(tables)
        .set({
          status: "AVAILABLE",
          currentGuests: null,
          occupiedSinceMinutes: null,
          currentBillAmount: 0,
          updatedAt: new Date(),
        })
        .where(and(eq(tables.id, tableId), eq(tables.cafeId, cafe.id)))
        .returning();

      return NextResponse.json({
        success: true,
        message: "Table released successfully",
        data: updated,
      });
    }

    throw new AppError({
      code: "VALIDATION_ERROR",
      message: `Unsupported action '${action}'`,
      statusCode: 400,
    });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
