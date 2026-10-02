import {
  pgTable,
  text,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { cafes } from "./cafes";
import { tables } from "./tables";
import { users } from "./users";

export const guestSessions = pgTable(
  "guest_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cafeId: uuid("cafe_id")
      .notNull()
      .references(() => cafes.id, { onDelete: "cascade" }),
    tableId: uuid("table_id").references(() => tables.id, {
      onDelete: "set null",
    }),
    customerId: text("customer_id").references(() => users.id, {
      onDelete: "set null",
    }),
    sessionTokenHash: text("session_token_hash").notNull(),
    status: text("status").default("ACTIVE").notNull(), // 'ACTIVE' | 'EXPIRED' | 'COMPLETED'
    expiresAt: timestamp("expires_at").notNull(),
    lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("guest_sessions_cafe_id_idx").on(table.cafeId),
    index("guest_sessions_table_id_idx").on(table.tableId),
    index("guest_sessions_customer_id_idx").on(table.customerId),
    uniqueIndex("guest_sessions_token_hash_idx").on(table.sessionTokenHash),
    index("guest_sessions_status_idx").on(table.status),
    index("guest_sessions_expires_at_idx").on(table.expiresAt),
  ]
);

export type GuestSession = typeof guestSessions.$inferSelect;
export type NewGuestSession = typeof guestSessions.$inferInsert;
