import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

export const plans = pgTable(
  "plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    monthlyPrice: integer("monthly_price").default(0).notNull(), // in currency unit (e.g. INR)
    yearlyPrice: integer("yearly_price").default(0).notNull(),
    lifetimePrice: integer("lifetime_price").default(0).notNull(),
    maxBranches: integer("max_branches").default(1).notNull(),
    maxMenuItems: integer("max_menu_items").default(100).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    features: jsonb("features").$type<string[]>().default([]).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("plans_slug_idx").on(table.slug)]
);

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
