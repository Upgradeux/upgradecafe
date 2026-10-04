import { db } from "@/lib/db";
import { orders, orderItems, tables, cafes, menuItems } from "@/lib/db/schema";
import { eq, and, gte, sql, inArray, ne, asc, desc } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";
import { OrdersService } from "@/features/cafe/orders/services/orders.service";
import type { OrderWithItems, PaymentMethod, PaymentStatus, OrderStatus } from "@/features/cafe/orders/types";
import type { Order } from "@/lib/db/schema/orders";

export interface ShiftSummary {
  todayGrossSales: number;
  paidOrdersCount: number;
  cashTotal: number;
  upiTotal: number;
  cardTotal: number;
  discountsTotal: number;
  taxTotal: number;
  openTabsCount: number;
  openTabsTotal: number;
}

export interface QuickCheckoutInput {
  orderType: "TAKEAWAY" | "DINE_IN";
  tableId?: string | null;
  tableNameSnapshot?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  guestCount?: number | null;
  items: Array<{
    menuItemId?: string | null;
    itemName: string;
    unitPrice: number;
    quantity: number;
    variantName?: string | null;
    specialInstructions?: string | null;
  }>;
  notes?: string | null;
  discount?: number;
  discountReason?: string | null;
  paymentMethod: PaymentMethod;
  amountTendered?: number | null;
  changeDue?: number | null;
}

export interface SettleOrderInput {
  orderId: string;
  paymentMethod: PaymentMethod;
  discount?: number;
  discountReason?: string | null;
  amountTendered?: number | null;
  changeDue?: number | null;
  shouldCompleteOrder?: boolean;
}

export interface SplitPaymentRecord {
  guestNumber: number;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string | null;
}

export interface SplitBillSettleInput {
  orderId: string;
  splitRecords: SplitPaymentRecord[];
  discount?: number;
  discountReason?: string | null;
  shouldCompleteOrder?: boolean;
}

export class BillingService {
  /**
   * Shift Register & Daily Close aggregation.
   */
  static async getShiftSummary(cafeId: string): Promise<ShiftSummary> {
    // Start of current day (midnight local/UTC)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [summary] = await db
      .select({
        todayGrossSales: sql<number>`cast(coalesce(sum(case when ${orders.status} != 'CANCELLED' and ${orders.paymentStatus} = 'PAID' then ${orders.total} else 0 end), 0) as integer)`,
        paidOrdersCount: sql<number>`cast(coalesce(count(case when ${orders.status} != 'CANCELLED' and ${orders.paymentStatus} = 'PAID' then 1 end), 0) as integer)`,
        cashTotal: sql<number>`cast(coalesce(sum(case when ${orders.status} != 'CANCELLED' and ${orders.paymentStatus} = 'PAID' and ${orders.paymentMethod} = 'CASH' then ${orders.total} else 0 end), 0) as integer)`,
        upiTotal: sql<number>`cast(coalesce(sum(case when ${orders.status} != 'CANCELLED' and ${orders.paymentStatus} = 'PAID' and ${orders.paymentMethod} = 'UPI' then ${orders.total} else 0 end), 0) as integer)`,
        cardTotal: sql<number>`cast(coalesce(sum(case when ${orders.status} != 'CANCELLED' and ${orders.paymentStatus} = 'PAID' and ${orders.paymentMethod} = 'CARD' then ${orders.total} else 0 end), 0) as integer)`,
        discountsTotal: sql<number>`cast(coalesce(sum(case when ${orders.status} != 'CANCELLED' and ${orders.paymentStatus} = 'PAID' then ${orders.discount} else 0 end), 0) as integer)`,
        taxTotal: sql<number>`cast(coalesce(sum(case when ${orders.status} != 'CANCELLED' and ${orders.paymentStatus} = 'PAID' then ${orders.tax} else 0 end), 0) as integer)`,
        openTabsCount: sql<number>`cast(coalesce(count(case when ${orders.status} != 'CANCELLED' and ${orders.paymentStatus} = 'UNPAID' then 1 end), 0) as integer)`,
        openTabsTotal: sql<number>`cast(coalesce(sum(case when ${orders.status} != 'CANCELLED' and ${orders.paymentStatus} = 'UNPAID' then ${orders.total} else 0 end), 0) as integer)`,
      })
      .from(orders)
      .where(and(eq(orders.cafeId, cafeId), gte(orders.createdAt, todayStart)));

    return {
      todayGrossSales: Number(summary?.todayGrossSales || 0),
      paidOrdersCount: Number(summary?.paidOrdersCount || 0),
      cashTotal: Number(summary?.cashTotal || 0),
      upiTotal: Number(summary?.upiTotal || 0),
      cardTotal: Number(summary?.cardTotal || 0),
      discountsTotal: Number(summary?.discountsTotal || 0),
      taxTotal: Number(summary?.taxTotal || 0),
      openTabsCount: Number(summary?.openTabsCount || 0),
      openTabsTotal: Number(summary?.openTabsTotal || 0),
    };
  }

  /**
   * Fast-Lane Counter / Table Quick Checkout (order created and marked PAID in 1 step).
   */
  static async quickCheckout(
    cafeId: string,
    input: QuickCheckoutInput
  ): Promise<OrderWithItems> {
    if (!input.items || input.items.length === 0) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "At least one item is required for checkout",
        statusCode: 400,
      });
    }

    // Verify all referenced menu items belong to this cafe tenant
    const itemIds = input.items
      .map((i) => i.menuItemId)
      .filter(Boolean) as string[];

    if (itemIds.length > 0) {
      const validItems = await db
        .select({ id: menuItems.id })
        .from(menuItems)
        .where(
          and(
            inArray(menuItems.id, itemIds),
            eq(menuItems.cafeId, cafeId)
          )
        );

      if (validItems.length !== new Set(itemIds).size) {
        throw new AppError({
          code: "VALIDATION_ERROR",
          message: "One or more items do not belong to this café.",
          statusCode: 400,
        });
      }
    }

    // Subtotal calculation
    const subtotal = input.items.reduce(
      (sum, it) => sum + it.unitPrice * it.quantity,
      0
    );
    const discount = Math.max(0, input.discount || 0);
    const taxableSubtotal = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableSubtotal * 0.05); // 5% GST
    const total = taxableSubtotal + tax;

    // Append discount reason and tender info to notes if provided
    let combinedNotes = input.notes || "";
    if (discount > 0 && input.discountReason) {
      combinedNotes = combinedNotes
        ? `${combinedNotes} | Discount: ₹${discount} (${input.discountReason})`
        : `Discount: ₹${discount} (${input.discountReason})`;
    }
    if (input.paymentMethod === "CASH" && input.amountTendered) {
      const change = input.changeDue || Math.max(0, input.amountTendered - total);
      combinedNotes = combinedNotes
        ? `${combinedNotes} | Tendered: ₹${input.amountTendered}, Change: ₹${change}`
        : `Tendered: ₹${input.amountTendered}, Change: ₹${change}`;
    }

    // Generate Order Number
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.cafeId, cafeId));
    const totalOrdersCount = Number(countResult?.count || 0);
    const orderNumber = `#${1001 + totalOrdersCount}`;

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

    // Insert Order header
    const [createdOrder] = await db
      .insert(orders)
      .values({
        cafeId,
        orderNumber,
        orderType: input.orderType,
        tableId: input.tableId || null,
        tableNameSnapshot: tableSnapshot,
        customerName: input.customerName || (input.orderType === "TAKEAWAY" ? "Counter Guest" : null),
        customerPhone: input.customerPhone || null,
        status: "NEW",
        paymentStatus: "PAID",
        paymentMethod: input.paymentMethod,
        subtotal,
        tax,
        discount,
        total,
        notes: combinedNotes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Insert line items
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

    // If Dine-in, mark table as OCCUPIED with guest count and bill
    if (input.tableId) {
      await db
        .update(tables)
        .set({
          status: "OCCUPIED",
          currentGuests: input.guestCount || 2,
          currentBillAmount: total,
          occupiedSinceMinutes: 1,
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
   * Settle an existing open order (Dine-in tab or unpaid counter ticket).
   */
  static async settleOrder(
    cafeId: string,
    input: SettleOrderInput
  ): Promise<OrderWithItems> {
    const [existing] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, input.orderId), eq(orders.cafeId, cafeId)))
      .limit(1);

    if (!existing) {
      throw new AppError({
        code: "ORDER_NOT_FOUND",
        message: "Order not found",
        statusCode: 404,
      });
    }

    const discount = Math.max(0, input.discount ?? existing.discount);
    const taxableSubtotal = Math.max(0, existing.subtotal - discount);
    const tax = Math.round(taxableSubtotal * 0.05);
    const total = taxableSubtotal + tax;

    let combinedNotes = existing.notes || "";
    if (discount > 0 && input.discountReason) {
      combinedNotes = combinedNotes
        ? `${combinedNotes} | Discount: ₹${discount} (${input.discountReason})`
        : `Discount: ₹${discount} (${input.discountReason})`;
    }
    if (input.paymentMethod === "CASH" && input.amountTendered) {
      const change = input.changeDue || Math.max(0, input.amountTendered - total);
      combinedNotes = combinedNotes
        ? `${combinedNotes} | Cash Tendered: ₹${input.amountTendered}, Change: ₹${change}`
        : `Cash Tendered: ₹${input.amountTendered}, Change: ₹${change}`;
    }

    const nextStatus = input.shouldCompleteOrder ? "COMPLETED" : existing.status;

    const [updatedOrder] = await db
      .update(orders)
      .set({
        paymentStatus: "PAID",
        paymentMethod: input.paymentMethod,
        discount,
        tax,
        total,
        notes: combinedNotes || null,
        status: nextStatus,
        completedAt: nextStatus === "COMPLETED" ? new Date() : existing.completedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, existing.id), eq(orders.cafeId, cafeId)))
      .returning();

    // Check if table can be released
    if (existing.tableId && nextStatus === "COMPLETED") {
      const remainingActive = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.cafeId, cafeId),
            eq(orders.tableId, existing.tableId),
            ne(orders.id, existing.id),
            inArray(orders.status, ["NEW", "PREPARING", "READY", "SERVED"])
          )
        );

      if (remainingActive.length === 0) {
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

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, existing.id));

    return {
      ...updatedOrder,
      items,
    };
  }

  /**
   * Settle an order with split multi-tender payments (e.g. ₹300 Cash, ₹300 UPI, ₹300 Card).
   */
  static async splitBillSettle(
    cafeId: string,
    input: SplitBillSettleInput
  ): Promise<OrderWithItems> {
    const [existing] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, input.orderId), eq(orders.cafeId, cafeId)))
      .limit(1);

    if (!existing) {
      throw new AppError({
        code: "ORDER_NOT_FOUND",
        message: "Order not found",
        statusCode: 404,
      });
    }

    const splitSummaryText = input.splitRecords
      .map((r) => `Guest ${r.guestNumber}: ₹${r.amount} (${r.paymentMethod})`)
      .join(" + ");

    let combinedNotes = existing.notes || "";
    combinedNotes = combinedNotes
      ? `${combinedNotes} | Split Bill: [${splitSummaryText}]`
      : `Split Bill: [${splitSummaryText}]`;

    if (input.discount && input.discount > 0 && input.discountReason) {
      combinedNotes += ` | Discount: ₹${input.discount} (${input.discountReason})`;
    }

    const discount = Math.max(0, input.discount ?? existing.discount);
    const taxableSubtotal = Math.max(0, existing.subtotal - discount);
    const tax = Math.round(taxableSubtotal * 0.05);
    const total = taxableSubtotal + tax;

    const nextStatus = input.shouldCompleteOrder ? "COMPLETED" : existing.status;

    // Use primary tender or mark as SPLIT / MULTI (paymentMethod string or first method)
    const primaryMethod = input.splitRecords[0]?.paymentMethod || "UPI";

    const [updatedOrder] = await db
      .update(orders)
      .set({
        paymentStatus: "PAID",
        paymentMethod: primaryMethod,
        discount,
        tax,
        total,
        notes: combinedNotes,
        status: nextStatus,
        completedAt: nextStatus === "COMPLETED" ? new Date() : existing.completedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, existing.id), eq(orders.cafeId, cafeId)))
      .returning();

    // Release table if order completed and no remaining active orders
    if (existing.tableId && nextStatus === "COMPLETED") {
      const remainingActive = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.cafeId, cafeId),
            eq(orders.tableId, existing.tableId),
            ne(orders.id, existing.id),
            inArray(orders.status, ["NEW", "PREPARING", "READY", "SERVED"])
          )
        );

      if (remainingActive.length === 0) {
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

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, existing.id));

    return {
      ...updatedOrder,
      items,
    };
  }

  /**
   * List all recent billing transactions with line items for the Billing Dashboard.
   */
  static async listBillingTransactions(cafeId: string): Promise<OrderWithItems[]> {
    const allOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.cafeId, cafeId))
      .orderBy(desc(orders.createdAt))
      .limit(100);

    if (allOrders.length === 0) return [];

    const orderIds = allOrders.map((o) => o.id);
    const items = await db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds))
      .orderBy(asc(orderItems.createdAt));

    const itemsByOrderId = new Map<string, any[]>();
    for (const item of items) {
      if (!itemsByOrderId.has(item.orderId)) {
        itemsByOrderId.set(item.orderId, []);
      }
      itemsByOrderId.get(item.orderId)!.push(item);
    }

    return allOrders.map((o) => ({
      ...o,
      items: itemsByOrderId.get(o.id) || [],
    }));
  }
}
