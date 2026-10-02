import { pgTable, text, timestamp, uuid, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";
import { cafes } from "./cafes";

export const cafeMemberships = pgTable(
  "cafe_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cafeId: uuid("cafe_id")
      .notNull()
      .references(() => cafes.id, { onDelete: "cascade" }),
    role: text("role").default("STAFF").notNull(), // 'OWNER' | 'STAFF' | 'MANAGER' | 'CASHIER' | 'KITCHEN' | 'WAITER'
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("memberships_user_id_idx").on(table.userId),
    index("memberships_cafe_id_idx").on(table.cafeId),
    uniqueIndex("memberships_user_cafe_unique_idx").on(table.userId, table.cafeId),
  ]
);

export type CafeMembership = typeof cafeMemberships.$inferSelect;
export type NewCafeMembership = typeof cafeMemberships.$inferInsert;
