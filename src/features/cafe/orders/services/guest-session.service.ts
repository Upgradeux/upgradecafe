import { db } from "@/lib/db";
import { guestSessions, GuestSession } from "@/lib/db/schema/guest-sessions";
import { orders, orderItems, Order, OrderItem } from "@/lib/db/schema/orders";
import { menuItems } from "@/lib/db/schema/menu-items";
import { tables } from "@/lib/db/schema/tables";
import { users } from "@/lib/db/schema/users";
import { eq, and, or, gt, inArray, asc, desc } from "drizzle-orm";
import * as crypto from "crypto";
import { OrderWithItems, OrderItemWithDetails } from "../types";

export const GUEST_SESSION_COOKIE_PREFIX = "cf_guest_session_";
export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes of inactivity

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
   * Inactivity lifecycle:
   * - If no orders placed yet: expires after 15 minutes of inactivity.
   * - If active orders exist: does NOT expire from inactivity; remains active until terminal state.
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
            eq(guestSessions.status, "ACTIVE")
          )
        )
        .limit(1);

      if (existing) {
        // Check associated orders
        const sessionOrders = await db
          .select({ id: orders.id, status: orders.status })
          .from(orders)
          .where(eq(orders.guestSessionId, existing.id));

        const hasActiveOrders = sessionOrders.some((o) =>
          ["NEW", "PREPARING", "READY", "SERVED"].includes(o.status)
        );
        const allTerminal =
          sessionOrders.length > 0 &&
          sessionOrders.every(
            (o) => o.status === "COMPLETED" || o.status === "CANCELLED"
          );

        // If prior visit orders are all terminal, mark COMPLETED and create a fresh session
        if (allTerminal) {
          await db
            .update(guestSessions)
            .set({ status: "COMPLETED", updatedAt: now })
            .where(eq(guestSessions.id, existing.id));
        } else if (!hasActiveOrders && sessionOrders.length === 0) {
          // No orders placed: check 15-minute inactivity window
          const elapsed = now.getTime() - new Date(existing.lastActivityAt).getTime();
          if (elapsed > INACTIVITY_TIMEOUT_MS) {
            await db
              .update(guestSessions)
              .set({ status: "EXPIRED", updatedAt: now })
              .where(eq(guestSessions.id, existing.id));
          } else {
            // Still within inactivity window: refresh session
            const updates: Partial<typeof guestSessions.$inferInsert> = {
              lastActivityAt: now,
              expiresAt: new Date(now.getTime() + INACTIVITY_TIMEOUT_MS),
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

            return {
              session: updated || existing,
              rawToken,
              isNew: false,
            };
          }
        } else if (hasActiveOrders) {
          // Active orders in progress: session remains active, refresh activity
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
    }

    // Create a fresh session for uncommitted visit (15-min inactivity window)
    const newRawToken = generateRawSessionToken();
    const tokenHash = hashSessionToken(newRawToken);
    const expiresAt = new Date(now.getTime() + INACTIVITY_TIMEOUT_MS);

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

  /**
   * Retrieves the currently active dining session and its table for a given token or customer,
   * verifying that the session has not concluded.
   * - If no orders placed: expires after 15 minutes of inactivity.
   * - If active orders exist: exempt from inactivity expiration.
   * - If all orders are terminal: session is marked COMPLETED and ends.
   */
  static async getActiveDiningSession(params: {
    cafeId: string;
    rawToken?: string | null;
    customerId?: string | null;
    touch?: boolean;
  }): Promise<{
    session: GuestSession;
    table: typeof tables.$inferSelect | null;
    activeOrders: OrderWithItems[];
  } | null> {
    const { cafeId, rawToken, customerId, touch = false } = params;
    const now = new Date();

    let session: GuestSession | null = null;

    if (rawToken && rawToken.trim().length > 0) {
      const tokenHash = hashSessionToken(rawToken.trim());
      const [found] = await db
        .select()
        .from(guestSessions)
        .where(
          and(
            eq(guestSessions.cafeId, cafeId),
            eq(guestSessions.sessionTokenHash, tokenHash),
            eq(guestSessions.status, "ACTIVE")
          )
        )
        .limit(1);
      if (found) session = found;
    }

    if (!session && customerId) {
      // Look up most recent active session for this customer in this cafe
      const [foundCustomerSession] = await db
        .select()
        .from(guestSessions)
        .where(
          and(
            eq(guestSessions.cafeId, cafeId),
            eq(guestSessions.customerId, customerId),
            eq(guestSessions.status, "ACTIVE")
          )
        )
        .orderBy(desc(guestSessions.createdAt))
        .limit(1);
      if (foundCustomerSession) session = foundCustomerSession;
    }

    if (!session) return null;

    // Check orders for this session
    const sessionOrders = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(eq(orders.guestSessionId, session.id));

    const activeOrdersList = sessionOrders.filter((o) =>
      ["NEW", "PREPARING", "READY", "SERVED"].includes(o.status)
    );
    const hasActiveOrders = activeOrdersList.length > 0;

    if (sessionOrders.length > 0) {
      // If orders were placed, and all are COMPLETED or CANCELLED, session has ended
      if (!hasActiveOrders) {
        await db
          .update(guestSessions)
          .set({ status: "COMPLETED", updatedAt: now })
          .where(eq(guestSessions.id, session.id));
        return null;
      }
      // If active orders exist: session remains active, never expires due to inactivity
      if (touch) {
        await db
          .update(guestSessions)
          .set({ lastActivityAt: now, updatedAt: now })
          .where(eq(guestSessions.id, session.id));
      }
    } else {
      // No orders placed: verify 15-minute inactivity timeout
      const elapsed = now.getTime() - new Date(session.lastActivityAt).getTime();
      if (elapsed > INACTIVITY_TIMEOUT_MS) {
        await db
          .update(guestSessions)
          .set({ status: "EXPIRED", updatedAt: now })
          .where(eq(guestSessions.id, session.id));
        return null;
      }
      if (touch) {
        await db
          .update(guestSessions)
          .set({
            lastActivityAt: now,
            expiresAt: new Date(now.getTime() + INACTIVITY_TIMEOUT_MS),
            updatedAt: now,
          })
          .where(eq(guestSessions.id, session.id));
      }
    }

    // Load table if session is bound to a table
    let table: typeof tables.$inferSelect | null = null;
    if (session.tableId) {
      const [foundTable] = await db
        .select()
        .from(tables)
        .where(
          and(
            eq(tables.id, session.tableId),
            eq(tables.cafeId, cafeId),
            eq(tables.isActive, true)
          )
        )
        .limit(1);
      if (foundTable) table = foundTable;
    }

    const activeOrders = await this.getActiveOrdersForSession(session.id, cafeId);

    return {
      session,
      table,
      activeOrders,
    };
  }

  /**
   * Refreshes the lastActivityAt timestamp for an active session upon meaningful user action.
   */
  static async touchActivity(params: {
    cafeId: string;
    rawToken?: string | null;
    sessionId?: string | null;
  }): Promise<boolean> {
    const { cafeId, rawToken, sessionId } = params;
    const now = new Date();

    let targetSessionId: string | null = null;

    if (sessionId) {
      targetSessionId = sessionId;
    } else if (rawToken && rawToken.trim().length > 0) {
      const tokenHash = hashSessionToken(rawToken.trim());
      const [found] = await db
        .select({ id: guestSessions.id, lastActivityAt: guestSessions.lastActivityAt, status: guestSessions.status })
        .from(guestSessions)
        .where(
          and(
            eq(guestSessions.cafeId, cafeId),
            eq(guestSessions.sessionTokenHash, tokenHash),
            eq(guestSessions.status, "ACTIVE")
          )
        )
        .limit(1);

      if (found) {
        const sessionOrders = await db
          .select({ status: orders.status })
          .from(orders)
          .where(eq(orders.guestSessionId, found.id));

        const hasActiveOrders = sessionOrders.some((o) =>
          ["NEW", "PREPARING", "READY", "SERVED"].includes(o.status)
        );

        if (!hasActiveOrders && sessionOrders.length === 0) {
          const elapsed = now.getTime() - new Date(found.lastActivityAt).getTime();
          if (elapsed > INACTIVITY_TIMEOUT_MS) {
            await db
              .update(guestSessions)
              .set({ status: "EXPIRED", updatedAt: now })
              .where(eq(guestSessions.id, found.id));
            return false;
          }
        }
        targetSessionId = found.id;
      }
    }

    if (!targetSessionId) return false;

    await db
      .update(guestSessions)
      .set({
        lastActivityAt: now,
        expiresAt: new Date(now.getTime() + INACTIVITY_TIMEOUT_MS),
        updatedAt: now,
      })
      .where(eq(guestSessions.id, targetSessionId));

    return true;
  }
}

