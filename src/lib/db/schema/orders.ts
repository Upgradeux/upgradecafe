import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { cafes } from "./cafes";
import { tables } from "./tables";
import { menuItems } from "./menu-items";
import { guestSessions } from "./guest-sessions";
import { users } from "./users";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cafeId: uuid("cafe_id")
      .notNull()
      .references(() => cafes.id, { onDelete: "cascade" }),
    guestSessionId: uuid("guest_session_id").references(() => guestSessions.id, {
      onDelete: "set null",
    }),
    customerId: text("customer_id").references(() => users.id, {
      onDelete: "set null",
    }),
    orderNumber: text("order_number").notNull(), // e.g. "#1048"
    orderType: text("order_type").default("DINE_IN").notNull(), // 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'
    tableId: uuid("table_id").references(() => tables.id, {
      onDelete: "set null",
    }),
    tableNameSnapshot: text("table_name_snapshot"), // e.g. "Table 12" or null for takeaway
    customerName: text("customer_name"),
    customerPhone: text("customer_phone"),
    status: text("status").default("NEW").notNull(), // 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED'
    paymentStatus: text("payment_status").default("UNPAID").notNull(), // 'UNPAID' | 'PENDING_VERIFICATION' | 'PAID' | 'PAYMENT_REJECTED' | 'REFUNDED'
    paymentMethod: text("payment_method"), // 'CASH' | 'UPI' | 'CARD' | null
    subtotal: integer("subtotal").notNull(),
    tax: integer("tax").default(0).notNull(),
    discount: integer("discount").default(0).notNull(),
    total: integer("total").notNull(),
    notes: text("notes"),
    cancellationReason: text("cancellation_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    confirmedAt: timestamp("confirmed_at"),
    preparingAt: timestamp("preparing_at"),
    readyAt: timestamp("ready_at"),
    servedAt: timestamp("served_at"),
    completedAt: timestamp("completed_at"),
    cancelledAt: timestamp("cancelled_at"),
    paymentVerifiedAt: timestamp("payment_verified_at"),
    paymentRejectedAt: timestamp("payment_rejected_at"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("orders_cafe_id_idx").on(table.cafeId),
    index("orders_guest_session_id_idx").on(table.guestSessionId),
    index("orders_customer_id_idx").on(table.customerId),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.createdAt),
    index("orders_table_id_idx").on(table.tableId),
    index("orders_order_number_idx").on(table.orderNumber),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    menuItemId: uuid("menu_item_id").references(() => menuItems.id, {
      onDelete: "set null",
    }),
    itemName: text("item_name").notNull(), // Snapshot
    unitPrice: integer("unit_price").notNull(), // Snapshot
    quantity: integer("quantity").default(1).notNull(),
    itemTotal: integer("item_total").notNull(),
    variantName: text("variant_name"), // Snapshot (e.g. "Large / Oat Milk")
    specialInstructions: text("special_instructions"), // Snapshot (e.g. "Less sugar")
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    index("order_items_menu_item_id_idx").on(table.menuItemId),
  ]
);

export const serviceRequests = pgTable(
  "service_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cafeId: uuid("cafe_id")
      .notNull()
      .references(() => cafes.id, { onDelete: "cascade" }),
    tableId: uuid("table_id").references(() => tables.id, {
      onDelete: "set null",
    }),
    tableNameSnapshot: text("table_name_snapshot").notNull(),
    requestType: text("request_type").notNull(), // 'CALL_WAITER' | 'NEED_WATER' | 'REQUEST_BILL' | 'CUSTOM'
    notes: text("notes"),
    status: text("status").default("PENDING").notNull(), // 'PENDING' | 'ACKNOWLEDGED'
    createdAt: timestamp("created_at").defaultNow().notNull(),
    acknowledgedAt: timestamp("acknowledged_at"),
  },
  (table) => [
    index("service_requests_cafe_id_idx").on(table.cafeId),
    index("service_requests_status_idx").on(table.status),
    index("service_requests_created_at_idx").on(table.createdAt),
  ]
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type NewServiceRequest = typeof serviceRequests.$inferInsert;
