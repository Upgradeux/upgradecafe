import { pgTable, text, timestamp, uuid, integer, index } from "drizzle-orm/pg-core";
import { cafes } from "./cafes";
import { subscriptions } from "./subscriptions";
import { users } from "./users";

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cafeId: uuid("cafe_id")
      .notNull()
      .references(() => cafes.id, { onDelete: "cascade" }),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
    amount: integer("amount").notNull(), // amount in currency units (e.g. INR)
    currency: text("currency").default("INR").notNull(),
    paymentMethod: text("payment_method").notNull(), // 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'OTHER'
    paymentDate: timestamp("payment_date").notNull(),
    referenceNumber: text("reference_number"),
    notes: text("notes"),
    recordedByUserId: text("recorded_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("payments_cafe_id_idx").on(table.cafeId),
    index("payments_payment_date_idx").on(table.paymentDate),
  ]
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
