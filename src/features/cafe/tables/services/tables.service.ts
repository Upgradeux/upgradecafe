import { db } from "@/lib/db";
import { tables, Table, NewTable } from "@/lib/db/schema/tables";
import { floors, Floor } from "@/lib/db/schema/floors";
import { orders } from "@/lib/db/schema/orders";
import { cafes } from "@/lib/db/schema/cafes";
import { eq, and, asc, inArray, isNotNull } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";
import crypto from "crypto";

export class TablesService {
  /**
   * List all dining zones / floors for a cafe
   */
  static async listFloors(cafeId: string): Promise<Floor[]> {
    return await db
      .select()
      .from(floors)
      .where(eq(floors.cafeId, cafeId))
      .orderBy(asc(floors.sortOrder), asc(floors.name));
  }

  /**
   * Create a new floor / dining zone
   */
  static async createFloor(
    cafeId: string,
    data: { name: string; sortOrder?: number }
  ): Promise<Floor> {
    const slug = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    const [created] = await db
      .insert(floors)
      .values({
        cafeId,
        name: data.name.trim(),
        slug,
        sortOrder: data.sortOrder ?? 0,
      })
      .returning();

    return created;
  }

  /**
   * Update a floor / dining zone
   */
  static async updateFloor(
    floorId: string,
    cafeId: string,
    data: { name?: string; sortOrder?: number }
  ): Promise<Floor> {
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (data.name) {
      updateData.name = data.name.trim();
      updateData.slug = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    }
    if (data.sortOrder !== undefined) {
      updateData.sortOrder = data.sortOrder;
    }

    const [updated] = await db
      .update(floors)
      .set(updateData)
      .where(and(eq(floors.id, floorId), eq(floors.cafeId, cafeId)))
      .returning();

    if (!updated) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Floor / dining zone not found in this café.",
        statusCode: 404,
      });
    }

    return updated;
  }

  /**
   * Delete a floor / dining zone
   * Safely detaches all associated tables by setting floorId = null
   */
  static async deleteFloor(floorId: string, cafeId: string): Promise<void> {
    // 1. Reassign tables in this floor to null (unassigned)
    await db
      .update(tables)
      .set({ floorId: null, updatedAt: new Date() })
      .where(and(eq(tables.floorId, floorId), eq(tables.cafeId, cafeId)));

    // 2. Delete the floor record
    const result = await db
      .delete(floors)
      .where(and(eq(floors.id, floorId), eq(floors.cafeId, cafeId)))
      .returning();

    if (result.length === 0) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Floor / dining zone not found in this café.",
        statusCode: 404,
      });
    }
  }

  /**
   * List all tables for a cafe tenant with floor/zone name join
   */
  static async listTables(cafeId: string): Promise<Array<Table & { floorName?: string | null }>> {
    const [tableRows, activeOrders] = await Promise.all([
      db
        .select({
          id: tables.id,
          cafeId: tables.cafeId,
          floorId: tables.floorId,
          tableNumber: tables.tableNumber,
          capacity: tables.capacity,
          status: tables.status,
          currentGuests: tables.currentGuests,
          occupiedSinceMinutes: tables.occupiedSinceMinutes,
          currentBillAmount: tables.currentBillAmount,
          reservedForTime: tables.reservedForTime,
          notes: tables.notes,
          qrIdentifier: tables.qrIdentifier,
          isActive: tables.isActive,
          createdAt: tables.createdAt,
          updatedAt: tables.updatedAt,
          floorName: floors.name,
        })
        .from(tables)
        .leftJoin(floors, eq(tables.floorId, floors.id))
        .where(eq(tables.cafeId, cafeId))
        .orderBy(asc(tables.tableNumber)),
      db
        .select({
          tableId: orders.tableId,
          total: orders.total,
          status: orders.status,
        })
        .from(orders)
        .where(
          and(
            eq(orders.cafeId, cafeId),
            isNotNull(orders.tableId),
            inArray(orders.status, ["NEW", "PREPARING", "READY", "SERVED"])
          )
        ),
    ]);

    // Build map of active table orders
    const activeTableMap = new Map<string, { total: number; count: number }>();
    for (const o of activeOrders) {
      if (!o.tableId) continue;
      const prev = activeTableMap.get(o.tableId) || { total: 0, count: 0 };
      activeTableMap.set(o.tableId, {
        total: prev.total + (o.total || 0),
        count: prev.count + 1,
      });
    }

    return tableRows.map((tbl) => {
      const activeSession = activeTableMap.get(tbl.id);
      if (activeSession) {
        // Self-heal DB status if it was out of sync
        if (tbl.status !== "OCCUPIED") {
          db.update(tables)
            .set({
              status: "OCCUPIED",
              currentBillAmount: activeSession.total,
              updatedAt: new Date(),
            })
            .where(eq(tables.id, tbl.id))
            .catch(() => {});
        }
        return {
          ...tbl,
          status: "OCCUPIED" as const,
          currentBillAmount: activeSession.total,
        };
      }
      return tbl;
    });
  }

  /**
   * Create a new table with unique QR identifier
   */
  static async createTable(
    cafeId: string,
    data: {
      tableNumber: string;
      capacity: number;
      status?: string;
      floorId?: string | null;
      currentGuests?: number | null;
      occupiedSinceMinutes?: number | null;
      currentBillAmount?: number | null;
      reservedForTime?: string | null;
      notes?: string | null;
      isActive?: boolean;
    }
  ): Promise<Table> {
    // Generate secure QR identifier token
    const randomSuffix = crypto.randomBytes(4).toString("hex");
    const cleanNum = data.tableNumber.toLowerCase().replace(/[^a-z0-9]/g, "");
    const qrIdentifier = `tbl_${cleanNum}_${randomSuffix}`;

    const [created] = await db
      .insert(tables)
      .values({
        cafeId,
        floorId: data.floorId || null,
        tableNumber: data.tableNumber,
        capacity: data.capacity,
        status: data.status || "AVAILABLE",
        currentGuests: data.currentGuests ?? null,
        occupiedSinceMinutes: data.occupiedSinceMinutes ?? null,
        currentBillAmount: data.currentBillAmount ?? null,
        reservedForTime: data.reservedForTime ?? null,
        notes: data.notes ?? null,
        qrIdentifier,
        isActive: data.isActive ?? true,
      })
      .returning();

    return created;
  }

  /**
   * Update table with tenant boundary check
   */
  static async updateTable(
    id: string,
    cafeId: string,
    data: Partial<Omit<NewTable, "id" | "cafeId" | "qrIdentifier" | "createdAt" | "updatedAt">>
  ): Promise<Table> {
    const [updated] = await db
      .update(tables)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(tables.id, id), eq(tables.cafeId, cafeId)))
      .returning();

    if (!updated) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Table not found in this café.",
        statusCode: 404,
      });
    }

    return updated;
  }

  /**
   * Quick status toggle (AVAILABLE <-> OCCUPIED <-> RESERVED)
   */
  static async updateTableStatus(id: string, cafeId: string, status: "AVAILABLE" | "OCCUPIED" | "RESERVED"): Promise<Table> {
    const [updated] = await db
      .update(tables)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(tables.id, id), eq(tables.cafeId, cafeId)))
      .returning();

    if (!updated) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Table not found in this café.",
        statusCode: 404,
      });
    }

    return updated;
  }

  /**
   * Delete a table
   */
  static async deleteTable(id: string, cafeId: string): Promise<void> {
    const result = await db
      .delete(tables)
      .where(and(eq(tables.id, id), eq(tables.cafeId, cafeId)))
      .returning();

    if (result.length === 0) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Table not found in this café.",
        statusCode: 404,
      });
    }
  }

  /**
   * Lookup table by QR code identifier for future customer ordering
   */
  static async getTableByQrIdentifier(qrIdentifier: string): Promise<{ table: Table; cafe: { id: string; name: string; slug: string } } | null> {
    const [record] = await db
      .select({
        table: tables,
        cafe: {
          id: cafes.id,
          name: cafes.name,
          slug: cafes.slug,
        },
      })
      .from(tables)
      .innerJoin(cafes, eq(tables.cafeId, cafes.id))
      .where(and(eq(tables.qrIdentifier, qrIdentifier), eq(tables.isActive, true)))
      .limit(1);

    return record || null;
  }
}
