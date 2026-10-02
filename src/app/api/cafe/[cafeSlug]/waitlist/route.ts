import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { tables } from "@/lib/db/schema/tables";
import { waitlist } from "@/lib/db/schema/waitlist";
import { eq, and, asc, desc, sql, inArray, lt } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;
    const { searchParams } = new URL(request.url);
    const customerPhone = searchParams.get("phone");
    const waitlistId = searchParams.get("waitlistId");

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

    const now = new Date();

    // 1. Auto-expire holds where 5 minutes passed (300 seconds)
    const expiredHolds = await db
      .select()
      .from(waitlist)
      .where(
        and(
          eq(waitlist.cafeId, cafe.id),
          eq(waitlist.status, "CALLED"),
          sql`${waitlist.holdExpiresAt} < NOW()`
        )
      );

    if (expiredHolds.length > 0) {
      for (const exp of expiredHolds) {
        await db
          .update(waitlist)
          .set({
            status: "EXPIRED",
            heldTableId: null,
            updatedAt: now,
          })
          .where(eq(waitlist.id, exp.id));
      }
    }

    // 2. Fetch all active cafe tables and active waitlist entries
    const [cafeTables, activeWaitlist] = await Promise.all([
      db
        .select()
        .from(tables)
        .where(and(eq(tables.cafeId, cafe.id), eq(tables.isActive, true)))
        .orderBy(asc(tables.tableNumber)),
      db
        .select()
        .from(waitlist)
        .where(
          and(
            eq(waitlist.cafeId, cafe.id),
            inArray(waitlist.status, ["WAITING", "CALLED"])
          )
        )
        .orderBy(asc(waitlist.createdAt)),
    ]);

    // 3. Process table matching cascade for any truly AVAILABLE table:
    // A table is truly available if status is AVAILABLE and not currently held by another CALLED user
    const currentlyHeldTableIds = new Set(
      activeWaitlist
        .filter((w) => w.status === "CALLED" && w.heldTableId)
        .map((w) => w.heldTableId!)
    );

    const availableTables = cafeTables.filter(
      (t) =>
        (t.status || "AVAILABLE").toUpperCase() === "AVAILABLE" &&
        !currentlyHeldTableIds.has(t.id)
    );

    // Run priority cascade:
    // Step 1: Check Specific Table Waitlist first
    for (const table of [...availableTables]) {
      const specificGuestIndex = activeWaitlist.findIndex(
        (w) =>
          w.status === "WAITING" &&
          w.preferenceType === "SPECIFIC" &&
          w.preferredTableId === table.id &&
          w.guests <= (table.capacity || 2)
      );

      if (specificGuestIndex !== -1) {
        const matched = activeWaitlist[specificGuestIndex];
        const holdExpiresAt = new Date(Date.now() + 300 * 1000); // 5 minutes

        await db
          .update(waitlist)
          .set({
            status: "CALLED",
            heldTableId: table.id,
            holdExpiresAt,
            updatedAt: now,
          })
          .where(eq(waitlist.id, matched.id));

        matched.status = "CALLED";
        matched.heldTableId = table.id;
        matched.holdExpiresAt = holdExpiresAt;
        currentlyHeldTableIds.add(table.id);
        const idx = availableTables.indexOf(table);
        if (idx !== -1) availableTables.splice(idx, 1);
      }
    }

    // Step 2: For any remaining available tables, offer to next "Any Table" customer in FIFO order
    for (const table of [...availableTables]) {
      const anyGuestIndex = activeWaitlist.findIndex(
        (w) =>
          w.status === "WAITING" &&
          w.preferenceType === "ANY" &&
          w.guests <= (table.capacity || 2)
      );

      if (anyGuestIndex !== -1) {
        const matched = activeWaitlist[anyGuestIndex];
        const holdExpiresAt = new Date(Date.now() + 300 * 1000); // 5 minutes

        await db
          .update(waitlist)
          .set({
            status: "CALLED",
            heldTableId: table.id,
            holdExpiresAt,
            updatedAt: now,
          })
          .where(eq(waitlist.id, matched.id));

        matched.status = "CALLED";
        matched.heldTableId = table.id;
        matched.holdExpiresAt = holdExpiresAt;
        currentlyHeldTableIds.add(table.id);
        const idx = availableTables.indexOf(table);
        if (idx !== -1) availableTables.splice(idx, 1);
      }
    }

    // 4. Calculate position for the current customer if requested
    let customerEntry: (typeof activeWaitlist)[0] | null = null;
    let customerPosition: number | null = null;
    let heldTableData: { id: string; number: string; capacity: number; qrIdentifier: string | null } | null = null;
    let remainingHoldSeconds: number | null = null;

    if (waitlistId || customerPhone) {
      // First check active waitlist
      customerEntry =
        activeWaitlist.find(
          (w) =>
            (waitlistId && w.id === waitlistId) ||
            (customerPhone && w.phone === customerPhone)
        ) || null;

      // If not in active waitlist, look up latest historical record (to report EXPIRED, CANCELLED, etc.)
      if (!customerEntry) {
        const [historical] = await db
          .select()
          .from(waitlist)
          .where(
            and(
              eq(waitlist.cafeId, cafe.id),
              waitlistId
                ? eq(waitlist.id, waitlistId)
                : eq(waitlist.phone, customerPhone!)
            )
          )
          .orderBy(desc(waitlist.createdAt))
          .limit(1);

        if (historical) {
          customerEntry = historical;
        }
      }

      if (customerEntry) {
        if (customerEntry.status === "CALLED" && customerEntry.heldTableId) {
          // If hold already expired by timestamp, mark EXPIRED immediately
          if (customerEntry.holdExpiresAt && new Date(customerEntry.holdExpiresAt).getTime() <= Date.now()) {
            await db
              .update(waitlist)
              .set({
                status: "EXPIRED",
                heldTableId: null,
                updatedAt: new Date(),
              })
              .where(eq(waitlist.id, customerEntry.id));
            customerEntry.status = "EXPIRED";
            customerEntry.heldTableId = null;
            remainingHoldSeconds = 0;
          } else {
            customerPosition = 1;
            const targetTbl = cafeTables.find((t) => t.id === customerEntry?.heldTableId);
            if (targetTbl) {
              heldTableData = {
                id: targetTbl.id,
                number: targetTbl.tableNumber,
                capacity: targetTbl.capacity || 2,
                qrIdentifier: targetTbl.qrIdentifier || null,
              };
            }
            if (customerEntry.holdExpiresAt) {
              const diffMs = new Date(customerEntry.holdExpiresAt).getTime() - Date.now();
              remainingHoldSeconds = Math.max(0, Math.floor(diffMs / 1000));
            }
          }
        } else if (customerEntry.status === "WAITING") {
          // Count active entries ahead of this customer in FIFO queue
          const aheadCount = activeWaitlist.filter(
            (w) =>
              (w.status === "WAITING" || w.status === "CALLED") &&
              new Date(w.createdAt).getTime() < new Date(customerEntry!.createdAt).getTime()
          ).length;
          customerPosition = aheadCount + 1;
        }
      }
    }

    const totalWaiting = activeWaitlist.filter((w) => w.status === "WAITING").length;

    return NextResponse.json({
      success: true,
      data: {
        customerEntry,
        customerPosition,
        heldTableData,
        remainingHoldSeconds,
        totalWaiting,
        activeCount: activeWaitlist.length,
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
    const body = await request.json();
    const { action } = body;

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

    if (action === "join") {
      const {
        name,
        phone,
        guests,
        preferenceType = "ANY",
        preferredTableId = null,
        preferredTableName = null,
      } = body;

      if (!name || !phone) {
        throw new AppError({
          code: "VALIDATION_ERROR",
          message: "Name and phone are required",
          statusCode: 400,
        });
      }

      // Check if user already has an active waitlist entry with this phone
      const existing = await db
        .select()
        .from(waitlist)
        .where(
          and(
            eq(waitlist.cafeId, cafe.id),
            eq(waitlist.phone, phone.trim()),
            inArray(waitlist.status, ["WAITING", "CALLED"])
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing entry with new party size or preference
        const [updatedEntry] = await db
          .update(waitlist)
          .set({
            name: name.trim(),
            guests: Number(guests) || existing[0].guests,
            preferenceType: preferenceType === "SPECIFIC" ? "SPECIFIC" : "ANY",
            preferredTableId: preferredTableId || existing[0].preferredTableId,
            preferredTableName: preferredTableName || existing[0].preferredTableName,
            updatedAt: new Date(),
          })
          .where(eq(waitlist.id, existing[0].id))
          .returning();

        // Calculate queue position of existing entry
        const ahead = await db
          .select({ count: sql<number>`count(*)` })
          .from(waitlist)
          .where(
            and(
              eq(waitlist.cafeId, cafe.id),
              inArray(waitlist.status, ["WAITING", "CALLED"]),
              lt(waitlist.createdAt, existing[0].createdAt)
            )
          );

        return NextResponse.json({
          success: true,
          data: {
            entry: updatedEntry || existing[0],
            queueNumber: Number(ahead[0]?.count || 0) + 1,
            isExisting: true,
          },
        });
      }

      // Insert new waitlist entry
      const [newEntry] = await db
        .insert(waitlist)
        .values({
          cafeId: cafe.id,
          name: name.trim(),
          phone: phone.trim(),
          guests: Number(guests) || 2,
          preferenceType: preferenceType === "SPECIFIC" ? "SPECIFIC" : "ANY",
          preferredTableId: preferredTableId || null,
          preferredTableName: preferredTableName || null,
          status: "WAITING",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Calculate real queue position: count active entries created before
      const ahead = await db
        .select({ count: sql<number>`count(*)` })
        .from(waitlist)
        .where(
          and(
            eq(waitlist.cafeId, cafe.id),
            inArray(waitlist.status, ["WAITING", "CALLED"]),
            lt(waitlist.createdAt, newEntry.createdAt)
          )
        );

      const queueNumber = Number(ahead[0]?.count || 0) + 1;

      return NextResponse.json({
        success: true,
        data: {
          entry: newEntry,
          queueNumber,
        },
      });
    }

    if (action === "leave" || action === "cancel" || action === "expire") {
      const { waitlistId, phone } = body;

      if (!waitlistId && !phone) {
        throw new AppError({
          code: "VALIDATION_ERROR",
          message: "waitlistId or phone is required",
          statusCode: 400,
        });
      }

      const condition = waitlistId
        ? and(eq(waitlist.id, waitlistId), eq(waitlist.cafeId, cafe.id))
        : and(eq(waitlist.phone, phone), eq(waitlist.cafeId, cafe.id));

      const nextStatus = action === "expire" ? "EXPIRED" : "CANCELLED";

      const [updated] = await db
        .update(waitlist)
        .set({
          status: nextStatus,
          heldTableId: null,
          updatedAt: new Date(),
        })
        .where(condition)
        .returning();

      return NextResponse.json({
        success: true,
        message: action === "expire" ? "Waitlist hold expired" : "Removed from waitlist",
        data: updated,
      });
    }

    if (action === "claim") {
      const { waitlistId, tableId, guests } = body;

      if (!tableId) {
        throw new AppError({
          code: "VALIDATION_ERROR",
          message: "tableId is required",
          statusCode: 400,
        });
      }

      // Mark waitlist as SEATED
      if (waitlistId) {
        await db
          .update(waitlist)
          .set({
            status: "SEATED",
            heldTableId: null,
            updatedAt: new Date(),
          })
          .where(and(eq(waitlist.id, waitlistId), eq(waitlist.cafeId, cafe.id)));
      }

      // Mark table as OCCUPIED
      const [updatedTable] = await db
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
        message: "Table claimed and occupied",
        data: updatedTable,
      });
    }

    throw new AppError({
      code: "VALIDATION_ERROR",
      message: `Invalid action '${action}'`,
      statusCode: 400,
    });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
