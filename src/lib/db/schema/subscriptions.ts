import { pgTable, text, timestamp, uuid, integer, index } from "drizzle-orm/pg-core";
import { cafes } from "./cafes";
import { plans } from "./plans";

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cafeId: uuid("cafe_id")
      .notNull()
      .references(() => cafes.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id),
    status: text("status").default("ACTIVE").notNull(), // 'ACTIVE' | 'GRACE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED'
    billingCycle: text("billing_cycle").default("MONTHLY").notNull(), // 'MONTHLY' | 'YEARLY' | 'LIFETIME' | 'CUSTOM'
    startsAt: timestamp("starts_at").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    gracePeriodDays: integer("grace_period_days").default(7).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("subscriptions_cafe_id_idx").on(table.cafeId),
    index("subscriptions_status_idx").on(table.status),
    index("subscriptions_expires_at_idx").on(table.expiresAt),
  ]
);

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
