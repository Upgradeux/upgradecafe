import { db } from "@/lib/db";
import { orders, orderItems, serviceRequests, Order, OrderItem, ServiceRequest } from "@/lib/db/schema/orders";
import { tables, Table } from "@/lib/db/schema/tables";
import { guestSessions } from "@/lib/db/schema/guest-sessions";
import { menuItems } from "@/lib/db/schema/menu-items";
import { eq, and, ne, inArray, desc, asc, sql, ilike, or, gte } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";
import { GuestSessionService } from "./guest-session.service";
import {
  CreateOrderInput,
  OrderStatus,
  OrderWithItems,
  OrderItemWithDetails,
  OrderStatsSummary,
  PaymentStatus,
  PaymentMethod,
  ServiceRequestType,
} from "../types";

export class OrdersService {
  /**
   * List active live orders (NEW, PREPARING, READY) for a cafe.
   * Oldest orders appear first to preserve FIFO kitchen priority.
   */
  static async listLiveOrders(cafeId: string): Promise<OrderWithItems[]> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const activeOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.cafeId, cafeId),
          or(
            inArray(orders.status, ["NEW", "PREPARING", "READY", "SERVED"]),
            and(
              eq(orders.status, "COMPLETED"),
              gte(orders.completedAt, todayStart)
            )
          )
        )
      )
      .orderBy(asc(orders.createdAt));

    if (activeOrders.length === 0) return [];

    const orderIds = activeOrders.map((o) => o.id);

    // Fetch items for all active orders
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

    // Map items to their orders
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
   * List completed and cancelled orders (Today's History / Archival).
   */
  static async listOrderHistory(
    cafeId: string,
    options: {
      limit?: number;
      offset?: number;
      search?: string;
      status?: "ALL" | OrderStatus;
    } = {}
  ): Promise<{ orders: OrderWithItems[]; total: number }> {
    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const offset = Math.max(0, options.offset || 0);

    const conditions = [eq(orders.cafeId, cafeId)];

    if (options.status && options.status !== "ALL") {
      conditions.push(eq(orders.status, options.status));
    } else {
      conditions.push(inArray(orders.status, ["COMPLETED", "CANCELLED"]));
    }

    if (options.search) {
      const pattern = `%${options.search}%`;
      conditions.push(
        or(
          ilike(orders.orderNumber, pattern),
          ilike(orders.tableNameSnapshot, pattern),
          ilike(orders.customerName, pattern)
        )!
      );
    }

    const whereClause = and(...conditions);

    const historyOrders = await db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.updatedAt))
      .limit(limit)
      .offset(offset);

    if (historyOrders.length === 0) {
      return { orders: [], total: 0 };
    }

    const orderIds = historyOrders.map((o) => o.id);
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

    return {
      orders: historyOrders.map((order) => ({
        ...order,
        items: itemsByOrderId.get(order.id) || [],
      })),
      total: historyOrders.length,
    };
  }

  /**
   * Get single order by ID with line items.
   */
  static async getOrderById(
    orderId: string,
    cafeId: string
  ): Promise<OrderWithItems> {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.cafeId, cafeId)))
      .limit(1);

    if (!order) {
      throw new AppError({
        code: "ORDER_NOT_FOUND",
        message: "Order not found",
        statusCode: 404,
      });
    }

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
      .where(eq(orderItems.orderId, orderId))
      .orderBy(asc(orderItems.createdAt));

    let tableData: Table | null = null;
    if (order.tableId) {
      const [t] = await db
        .select()
        .from(tables)
        .where(eq(tables.id, order.tableId))
        .limit(1);
      tableData = t || null;
    }

    return {
      ...order,
      items,
      table: tableData,
    };
  }

  /**
   * Create a new order with atomic line items & table occupancy updates.
   */
  static async createOrder(
    cafeId: string,
    input: CreateOrderInput
  ): Promise<OrderWithItems> {
    if (!input.items || input.items.length === 0) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Order must contain at least one item.",
        statusCode: 400,
      });
    }

    // Handle appending items to an existing active table order (Round 2 / Repeat Order)
    if (input.existingOrderIdToAppend) {
      const [existing] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, input.existingOrderIdToAppend), eq(orders.cafeId, cafeId)))
        .limit(1);

      if (existing) {
        const addedSubtotal = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const addedTax = Math.round(addedSubtotal * 0.05);
        const addedTotal = addedSubtotal + addedTax;

        const lineItemValues = input.items.map((item) => ({
          orderId: existing.id,
          menuItemId: item.menuItemId || null,
          itemName: item.itemName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          itemTotal: item.unitPrice * item.quantity,
          variantName: item.variantName || null,
          specialInstructions: item.specialInstructions || null,
          createdAt: new Date(),
        }));

        await db.insert(orderItems).values(lineItemValues);

        const newSubtotal = existing.subtotal + addedSubtotal;
        const newTax = existing.tax + addedTax;
        const newTotal = existing.total + addedTotal;
        const combinedNotes = input.notes
          ? existing.notes
            ? `${existing.notes} | Round 2: ${input.notes}`
            : input.notes
          : existing.notes;

        // Reset to PREPARING if it was READY or COMPLETED so kitchen knows new items are queued
        const nextStatus =
          existing.status === "READY" || existing.status === "COMPLETED"
            ? "PREPARING"
            : existing.status;

        const [updatedOrder] = await db
          .update(orders)
          .set({
            subtotal: newSubtotal,
            tax: newTax,
            total: newTotal,
            notes: combinedNotes,
            status: nextStatus,
            updatedAt: new Date(),
          })
          .where(and(eq(orders.id, existing.id), eq(orders.cafeId, cafeId)))
          .returning();

        // Update table's cumulative running bill and guests
        if (existing.tableId) {
          await db
            .update(tables)
            .set({
              currentBillAmount: sql`COALESCE(${tables.currentBillAmount}, 0) + ${addedTotal}`,
              currentGuests: input.guestCount || tables.currentGuests,
              updatedAt: new Date(),
            })
            .where(and(eq(tables.id, existing.tableId), eq(tables.cafeId, cafeId)));
        }

        const allItems = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, existing.id));

        return {
          ...updatedOrder,
          items: allItems,
        };
      }
    }

    // Generate readable order number: e.g. #1000 + count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.cafeId, cafeId));

    const totalOrdersCount = Number(countResult?.count || 0);
    const orderNumber = `#${1001 + totalOrdersCount}`;

    // Calculate subtotal
    const subtotal = input.items.reduce((sum, item) => {
      return sum + item.unitPrice * item.quantity;
    }, 0);

    const discount = input.discount || 0;
    const tax = Math.round((subtotal - discount) * 0.05); // 5% GST standard estimate
    const total = Math.max(0, subtotal - discount + tax);

    // Resolve table snapshot name if tableId provided
    let tableSnapshot = input.tableNameSnapshot || null;
    if (input.tableId && !tableSnapshot) {
      const [table] = await db
        .select()
        .from(tables)
        .where(and(eq(tables.id, input.tableId), eq(tables.cafeId, cafeId)))
        .limit(1);
      if (table) {
        tableSnapshot = table.tableNumber;
      }
    }

    // Insert order header
    const [createdOrder] = await db
      .insert(orders)
      .values({
        cafeId,
        guestSessionId: input.guestSessionId || null,
        customerId: input.customerId || null,
        orderNumber,
        orderType: input.orderType,
        tableId: input.tableId || null,
        tableNameSnapshot: tableSnapshot,
        customerName: input.customerName || null,
        customerPhone: input.customerPhone || null,
        status: "NEW",
        paymentStatus: input.paymentStatus || "UNPAID",
        paymentMethod: input.paymentMethod || null,
        subtotal,
        tax,
        discount,
        total,
        notes: input.notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Insert snapshot line items
    const lineItemValues = input.items.map((item) => ({
      orderId: createdOrder.id,
      menuItemId: item.menuItemId || null,
      itemName: item.itemName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      itemTotal: item.unitPrice * item.quantity,
      variantName: item.variantName || null,
      specialInstructions: item.specialInstructions || null,
      createdAt: new Date(),
    }));

    const createdItems = await db
      .insert(orderItems)
      .values(lineItemValues)
      .returning();

    // Update guest session activity timestamp if order is linked to a session
    if (input.guestSessionId) {
      await db
        .update(guestSessions)
        .set({
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(guestSessions.id, input.guestSessionId));
    }

    // If Dine-in, mark table as OCCUPIED and update running bill & guest count
    if (input.tableId) {
      await db
        .update(tables)
        .set({
          status: "OCCUPIED",
          currentGuests: input.guestCount || sql`COALESCE(${tables.currentGuests}, 2)`,
          currentBillAmount: sql`COALESCE(${tables.currentBillAmount}, 0) + ${total}`,
          occupiedSinceMinutes: sql`COALESCE(${tables.occupiedSinceMinutes}, 1)`,
          updatedAt: new Date(),
        })
        .where(and(eq(tables.id, input.tableId), eq(tables.cafeId, cafeId)));
    }

    return {
      ...createdOrder,
      items: createdItems,
    };
  }

  /**
   * Update order status with lifecycle timestamps & auto-release table on completion.
   */
  static async updateOrderStatus(
    orderId: string,
    cafeId: string,
    nextStatus: OrderStatus,
    cancellationReason?: string
  ): Promise<Order> {
    const [existing] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.cafeId, cafeId)))
      .limit(1);

    if (!existing) {
      throw new AppError({
        code: "ORDER_NOT_FOUND",
        message: "Order not found",
        statusCode: 404,
      });
    }

    const updates: Record<string, any> = {
      status: nextStatus,
      updatedAt: new Date(),
    };

    if (nextStatus === "PREPARING" && !existing.preparingAt) {
      updates.preparingAt = new Date();
    } else if (nextStatus === "READY" && !existing.readyAt) {
      updates.readyAt = new Date();
    } else if (nextStatus === "SERVED" && !existing.servedAt) {
      updates.servedAt = new Date();
    } else if (nextStatus === "COMPLETED" && !existing.completedAt) {
      updates.completedAt = new Date();
    } else if (nextStatus === "CANCELLED") {
      updates.cancelledAt = new Date();
      if (cancellationReason) {
        updates.cancellationReason = cancellationReason;
      }
    }

    const [updated] = await db
      .update(orders)
      .set(updates)
      .where(and(eq(orders.id, orderId), eq(orders.cafeId, cafeId)))
      .returning();

    // If order is active and was dine-in, ensure table is marked OCCUPIED with running bill
    if (["NEW", "PREPARING", "READY", "SERVED"].includes(nextStatus) && existing.tableId) {
      await db
        .update(tables)
        .set({
          status: "OCCUPIED",
          currentBillAmount: existing.total,
          updatedAt: new Date(),
        })
        .where(and(eq(tables.id, existing.tableId), eq(tables.cafeId, cafeId)));
    }

    // If order is completed or cancelled and was dine-in, check if any other active orders remain on table
    if ((nextStatus === "COMPLETED" || nextStatus === "CANCELLED") && existing.tableId) {
      const remainingActive = await db
        .select({ id: orders.id })
        .from(orders)
        .where(
          and(
            eq(orders.cafeId, cafeId),
            eq(orders.tableId, existing.tableId),
            ne(orders.id, orderId),
            inArray(orders.status, ["NEW", "PREPARING", "READY", "SERVED"])
          )
        );

      if (remainingActive.length === 0) {
        // Automatically release table back to AVAILABLE!
        await db
          .update(tables)
          .set({
            status: "AVAILABLE",
            currentGuests: 0,
            currentBillAmount: 0,
            occupiedSinceMinutes: null,
            updatedAt: new Date(),
          })
          .where(and(eq(tables.id, existing.tableId), eq(tables.cafeId, cafeId)));
      }
    }

    // Sync guest session status if order belonged to a guest session
    if (existing.guestSessionId && (nextStatus === "COMPLETED" || nextStatus === "CANCELLED")) {
      await GuestSessionService.syncSessionStatusAfterOrderUpdate(existing.guestSessionId);
    }

    return updated;
  }

  /**
   * Manually release / vacate a dining table
   */
  static async releaseTable(tableId: string, cafeId: string): Promise<Table> {
    const [updated] = await db
      .update(tables)
      .set({
        status: "AVAILABLE",
        currentGuests: 0,
        currentBillAmount: 0,
        occupiedSinceMinutes: null,
        updatedAt: new Date(),
      })
      .where(and(eq(tables.id, tableId), eq(tables.cafeId, cafeId)))
      .returning();

    if (!updated) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Table not found",
        statusCode: 404,
      });
    }

    return updated;
  }

  /**
   * Update payment status and method (Staff / Admin verification or rejection).
   */
  static async updatePaymentStatus(
    orderId: string,
    cafeId: string,
    paymentStatus: PaymentStatus,
    paymentMethod?: PaymentMethod | null
  ): Promise<Order> {
    const updatePayload: Record<string, any> = {
      paymentStatus,
      paymentMethod: paymentMethod || null,
      updatedAt: new Date(),
    };

    if (paymentStatus === "PAID") {
      updatePayload.paymentVerifiedAt = new Date();
    } else if (paymentStatus === "PAYMENT_REJECTED") {
      updatePayload.paymentRejectedAt = new Date();
    }

    const [updated] = await db
      .update(orders)
      .set(updatePayload)
      .where(and(eq(orders.id, orderId), eq(orders.cafeId, cafeId)))
      .returning();

    if (!updated) {
      throw new AppError({
        code: "ORDER_NOT_FOUND",
        message: "Order not found",
        statusCode: 404,
      });
    }

    return updated;
  }

  /**
   * Customer marks payment preference:
   * - UPI -> PENDING_VERIFICATION (staff verifies UPI app credit)
   * - CASH -> UNPAID with paymentMethod="CASH" (staff collects cash at counter)
   */
  static async setCustomerPaymentMethod(
    orderId: string,
    cafeId: string,
    paymentMethod: PaymentMethod = "UPI"
  ): Promise<Order> {
    const [existing] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.cafeId, cafeId)))
      .limit(1);

    if (!existing) {
      throw new AppError({
        code: "ORDER_NOT_FOUND",
        message: "Order not found",
        statusCode: 404,
      });
    }

    // If order was already verified as PAID, don't revert to pending/unpaid
    if (existing.paymentStatus === "PAID") {
      return existing;
    }

    const nextPaymentStatus: PaymentStatus =
      paymentMethod === "CASH" ? "UNPAID" : "PENDING_VERIFICATION";

    const [updated] = await db
      .update(orders)
      .set({
        paymentStatus: nextPaymentStatus,
        paymentMethod: paymentMethod,
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, orderId), eq(orders.cafeId, cafeId)))
      .returning();

    return updated;
  }

  /**
   * Customer marks UPI payment as done ("I've Sent Money") -> PENDING_VERIFICATION.
   * CAFEFLOW never auto-confirms payment; staff must verify manually.
   */
  static async markPaymentPendingVerification(
    orderId: string,
    cafeId: string,
    paymentMethod: PaymentMethod = "UPI"
  ): Promise<Order> {
    return this.setCustomerPaymentMethod(orderId, cafeId, paymentMethod);
  }

  /**
   * Cancel order with optional reason.
   */
  static async cancelOrder(
    orderId: string,
    cafeId: string,
    reason?: string
  ): Promise<Order> {
    return this.updateOrderStatus(orderId, cafeId, "CANCELLED", reason);
  }

  /**
   * List pending table service requests (e.g. Call Waiter, Water, Bill).
   */
  static async listPendingServiceRequests(
    cafeId: string
  ): Promise<ServiceRequest[]> {
    return await db
      .select()
      .from(serviceRequests)
      .where(
        and(
          eq(serviceRequests.cafeId, cafeId),
          eq(serviceRequests.status, "PENDING")
        )
      )
      .orderBy(asc(serviceRequests.createdAt));
  }

  /**
   * Create a customer service request from digital menu.
   */
  static async createServiceRequest(
    cafeId: string,
    input: {
      tableId?: string | null;
      tableNameSnapshot: string;
      requestType: ServiceRequestType;
      notes?: string | null;
    }
  ): Promise<ServiceRequest> {
    const [created] = await db
      .insert(serviceRequests)
      .values({
        cafeId,
        tableId: input.tableId || null,
        tableNameSnapshot: input.tableNameSnapshot,
        requestType: input.requestType,
        notes: input.notes || null,
        status: "PENDING",
        createdAt: new Date(),
      })
      .returning();

    return created;
  }

  /**
   * Acknowledge/Resolve a table service request.
   */
  static async acknowledgeServiceRequest(
    requestId: string,
    cafeId: string
  ): Promise<ServiceRequest> {
    const [acknowledged] = await db
      .update(serviceRequests)
      .set({
        status: "ACKNOWLEDGED",
        acknowledgedAt: new Date(),
      })
      .where(
        and(
          eq(serviceRequests.id, requestId),
          eq(serviceRequests.cafeId, cafeId)
        )
      )
      .returning();

    if (!acknowledged) {
      throw new AppError({
        code: "SERVICE_REQUEST_NOT_FOUND",
        message: "Service request not found",
        statusCode: 404,
      });
    }

    return acknowledged;
  }

  /**
   * Get operational statistics summary for the live board.
   */
  static async getOrderStats(cafeId: string): Promise<OrderStatsSummary> {
    // Active orders by status
    const active = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.cafeId, cafeId),
          inArray(orders.status, ["NEW", "PREPARING", "READY", "SERVED"])
        )
      )
      .groupBy(orders.status);

    let newCount = 0;
    let preparingCount = 0;
    let readyCount = 0;
    let servedCount = 0;

    for (const row of active) {
      const c = Number(row.count);
      if (row.status === "NEW") newCount = c;
      if (row.status === "PREPARING") preparingCount = c;
      if (row.status === "READY") readyCount = c;
      if (row.status === "SERVED") servedCount = c;
    }

    // Completed today count & revenue
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [completedToday] = await db
      .select({
        count: sql<number>`count(*)`,
        revenue: sql<number>`COALESCE(sum(${orders.total}), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.cafeId, cafeId),
          eq(orders.status, "COMPLETED"),
          gte(orders.completedAt, todayStart)
        )
      );

    // Pending service requests
    const [pendingRequests] = await db
      .select({ count: sql<number>`count(*)` })
      .from(serviceRequests)
      .where(
        and(
          eq(serviceRequests.cafeId, cafeId),
          eq(serviceRequests.status, "PENDING")
        )
      );

    return {
      activeCount: newCount + preparingCount + readyCount + servedCount,
      newCount,
      preparingCount,
      readyCount,
      servedCount,
      completedTodayCount: Number(completedToday?.count || 0),
      estimatedRevenueToday: Number(completedToday?.revenue || 0),
      pendingServiceRequestsCount: Number(pendingRequests?.count || 0),
    };
  }
}
