import { db } from "@/lib/db";
import { guestSessions, GuestSession } from "@/lib/db/schema/guest-sessions";
import { orders, orderItems, Order, OrderItem } from "@/lib/db/schema/orders";
import { menuItems } from "@/lib/db/schema/menu-items";
import { tables } from "@/lib/db/schema/tables";
import { users } from "@/lib/db/schema/users";
import { eq, and, or, gt, inArray, asc } from "drizzle-orm";
import crypto from "crypto";
import { OrderWithItems, OrderItemWithDetails } from "../types";

export const GUEST_SESSION_COOKIE_PREFIX = "cf_guest_session_";

export function getSessionCookieName(cafeSlug: string): string {
  return `${GUEST_SESSION_COOKIE_PREFIX}${cafeSlug}`;
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateRawSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export interface ResolveSessionParams {
  cafeId: string;
  cafeSlug: string;
  rawToken?: string | null;
  tableId?: string | null;
  orderType?: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  customerId?: string | null;
}

export interface ResolvedSessionResult {
  session: GuestSession;
  rawToken: string;
  isNew: boolean;
}

export class GuestSessionService {
  /**
   * Resolves an existing active session or creates a new one.
   * Session token is kept in an HTTP-only cookie, and only its SHA-256 hash is stored in DB.
   */
  static async resolveOrCreateSession(
    params: ResolveSessionParams
  ): Promise<ResolvedSessionResult> {
    const { cafeId, rawToken, tableId, orderType = "DINE_IN", customerId } = params;
    const now = new Date();

    // Verify tableId belongs to this cafe tenant
    let verifiedTableId: string | null = null;
    if (tableId) {
      const [tableExists] = await db
        .select({ id: tables.id })
        .from(tables)
        .where(and(eq(tables.id, tableId), eq(tables.cafeId, cafeId)))
        .limit(1);
      if (tableExists) {
        verifiedTableId = tableExists.id;
      }
    }

    // Verify customerId exists in users table before referencing foreign key
    let verifiedCustomerId: string | null = null;
    if (customerId) {
      const [userExists] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, customerId))
        .limit(1);
      if (userExists) {
        verifiedCustomerId = userExists.id;
      }
    }

    if (rawToken && rawToken.trim().length > 0) {
      const tokenHash = hashSessionToken(rawToken.trim());

      const [existing] = await db
        .select()
        .from(guestSessions)
        .where(
          and(
            eq(guestSessions.cafeId, cafeId),
            eq(guestSessions.sessionTokenHash, tokenHash),
            eq(guestSessions.status, "ACTIVE"),
            gt(guestSessions.expiresAt, now)
          )
        )
        .limit(1);

      if (existing) {
        // Prepare updates if table changed or customer logged in
        const updates: Partial<typeof guestSessions.$inferInsert> = {
          lastActivityAt: now,
          updatedAt: now,
        };

        if (verifiedTableId && verifiedTableId !== existing.tableId) {
          updates.tableId = verifiedTableId;
        }

        if (verifiedCustomerId && verifiedCustomerId !== existing.customerId) {
          updates.customerId = verifiedCustomerId;
        }

        const [updated] = await db
          .update(guestSessions)
          .set(updates)
          .where(eq(guestSessions.id, existing.id))
          .returning();

        // If customer was newly linked, also backfill orders
        if (verifiedCustomerId && verifiedCustomerId !== existing.customerId) {
          await db
            .update(orders)
            .set({ customerId: verifiedCustomerId })
            .where(eq(orders.guestSessionId, existing.id));
        }

        return {
          session: updated || existing,
          rawToken,
          isNew: false,
        };
      }
    }

    // Create a fresh session
    const newRawToken = generateRawSessionToken();
    const tokenHash = hashSessionToken(newRawToken);

    // Inactivity timeout: Dine-in: 4h, Takeaway: 2h
    const expiryHours = orderType === "TAKEAWAY" ? 2 : 4;
    const expiresAt = new Date(now.getTime() + expiryHours * 60 * 60 * 1000);

    const [created] = await db
      .insert(guestSessions)
      .values({
        cafeId,
        tableId: verifiedTableId || null,
        customerId: verifiedCustomerId || null,
        sessionTokenHash: tokenHash,
        status: "ACTIVE",
        expiresAt,
        lastActivityAt: now,
      })
      .returning();

    return {
      session: created,
      rawToken: newRawToken,
      isNew: true,
    };
  }

  /**
   * Helper to fetch line items for active orders and return OrderWithItems.
   */
  static async populateOrderItems(activeOrders: Order[]): Promise<OrderWithItems[]> {
    if (activeOrders.length === 0) return [];

    const orderIds = activeOrders.map((o) => o.id);
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
        preparationTimeMinutes: menuItems.preparationTimeMinutes,
      })
      .from(orderItems)
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(inArray(orderItems.orderId, orderIds))
      .orderBy(asc(orderItems.createdAt));

    const itemsByOrderId = new Map<string, OrderItemWithDetails[]>();
    for (const item of items) {
      if (!itemsByOrderId.has(item.orderId)) {
        itemsByOrderId.set(item.orderId, []);
      }
      itemsByOrderId.get(item.orderId)!.push(item);
    }

    return activeOrders.map((order) => ({
      ...order,
      items: itemsByOrderId.get(order.id) || [],
    }));
  }

  /**
   * Get all active orders for a session.
   * Active statuses = NEW, PREPARING, READY, SERVED
   */
  static async getActiveOrdersForSession(
    sessionId: string,
    cafeId: string
  ): Promise<OrderWithItems[]> {
    const activeOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.cafeId, cafeId),
          eq(orders.guestSessionId, sessionId),
          inArray(orders.status, ["NEW", "PREPARING", "READY", "SERVED"])
        )
      )
      .orderBy(asc(orders.createdAt));

    return this.populateOrderItems(activeOrders);
  }

  /**
   * Get all active orders for an authenticated customer (and optionally customer phone).
   * Customer ID is the source of truth after authentication.
   */
  static async getActiveOrdersForCustomer(
    customerId: string,
    cafeId: string,
    customerPhone?: string | null
  ): Promise<OrderWithItems[]> {
    const conditions = [
      eq(orders.cafeId, cafeId),
      inArray(orders.status, ["NEW", "PREPARING", "READY", "SERVED"]),
    ];

    if (customerPhone && customerPhone.trim()) {
      conditions.push(
        or(
          eq(orders.customerId, customerId),
          eq(orders.customerPhone, customerPhone.trim())
        )!
      );
    } else {
      conditions.push(eq(orders.customerId, customerId));
    }

    const activeOrders = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(asc(orders.createdAt));

    return this.populateOrderItems(activeOrders);
  }

  /**
   * Get all active orders for a customer phone number.
   */
  static async getActiveOrdersByPhone(
    phone: string,
    cafeId: string
  ): Promise<OrderWithItems[]> {
    const activeOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.cafeId, cafeId),
          eq(orders.customerPhone, phone.trim()),
          inArray(orders.status, ["NEW", "PREPARING", "READY", "SERVED"])
        )
      )
      .orderBy(asc(orders.createdAt));

    return this.populateOrderItems(activeOrders);
  }

  /**
   * Link a guest session to an authenticated customer account.
   * Updates guestSession.customerId and all orders belonging to this session.
   */
  static async linkCustomerToSession(
    sessionId: string,
    customerId: string,
    cafeId: string
  ): Promise<void> {
    try {
      // Check if customer exists in users table (since customerId has FK to users.id)
      const [userExists] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, customerId))
        .limit(1);

      if (!userExists) {
        // Not a registered user in users table (e.g. temporary phone session), skip FK update
        return;
      }

      await db
        .update(guestSessions)
        .set({
          customerId,
          updatedAt: new Date(),
        })
        .where(and(eq(guestSessions.id, sessionId), eq(guestSessions.cafeId, cafeId)));

      await db
        .update(orders)
        .set({
          customerId,
          updatedAt: new Date(),
        })
        .where(and(eq(orders.guestSessionId, sessionId), eq(orders.cafeId, cafeId)));
    } catch (e) {
      console.warn("Failed to link customer to session:", e);
    }
  }

  /**
   * Check if all orders in a session are in terminal state (COMPLETED or CANCELLED).
   * If all terminal, marks session as COMPLETED.
   */
  static async syncSessionStatusAfterOrderUpdate(
    sessionId: string
  ): Promise<void> {
    const sessionOrders = await db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.guestSessionId, sessionId));

    if (sessionOrders.length === 0) return;

    const allTerminal = sessionOrders.every(
      (o) => o.status === "COMPLETED" || o.status === "CANCELLED"
    );

    if (allTerminal) {
      await db
        .update(guestSessions)
        .set({
          status: "COMPLETED",
          updatedAt: new Date(),
        })
        .where(eq(guestSessions.id, sessionId));
    }
  }
}
